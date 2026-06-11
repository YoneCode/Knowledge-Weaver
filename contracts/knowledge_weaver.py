# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json
import re
from dataclasses import dataclass

# ───────────────────────── Error classification ──────────────────────────
# Tags let validators decide how to compare failure paths during consensus.
ERROR_EXPECTED = "[EXPECTED]"   # Business logic (deterministic) — exact match
ERROR_EXTERNAL = "[EXTERNAL]"   # External 4xx (deterministic) — exact match
ERROR_TRANSIENT = "[TRANSIENT]"  # Transient/5xx — agree if both transient
ERROR_LLM = "[LLM_ERROR]"       # LLM misbehavior — disagree to force rotation

# ───────────────────────────── Tunables ──────────────────────────────────
MAX_CONTENT_CHARS = 2000
MAX_CATEGORY_CHARS = 48
MAX_LABEL_CHARS = 120
MAX_CONTEXT_LABELS = 40          # how many existing labels we show the model
QUALITY_TOLERANCE = 30           # max |leader-validator| quality gap to agree (0-100)


# ───────────────────────── Module-level helpers ──────────────────────────
# These are deliberately module-level (not methods) so they can be referenced
# from leader/validator closures without dragging `self`/storage into the
# cloudpickle payload used by gl.vm.run_nondet_unsafe.

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_INJECTION_MARKERS = re.compile(
    r"(?i)(ignore (all|previous|the above)|system prompt|you are now|"
    r"disregard (all|previous)|assistant:|<\|.*?\|>)"
)
_SLUG_STRIP = re.compile(r"[^a-z0-9]+")


def _sanitize(text: str, max_len: int) -> str:
    """Strip control chars, neutralize injection markers, and bound length.

    All external/user text is treated as untrusted before it ever reaches an
    LLM prompt or on-chain storage.
    """
    if not isinstance(text, str):
        raise gl.vm.UserError(f"{ERROR_EXPECTED} text must be a string")
    cleaned = _CONTROL_CHARS.sub(" ", text)
    cleaned = _INJECTION_MARKERS.sub("[redacted]", cleaned)
    cleaned = cleaned.strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len]
    return cleaned


def _slugify(label: str) -> str:
    slug = _SLUG_STRIP.sub("-", label.lower()).strip("-")
    return slug[:64] if slug else "node"


def _parse_verdict(raw: dict) -> dict:
    """Defensively parse an LLM verdict into a canonical structure."""
    if not isinstance(raw, dict):
        raise gl.vm.UserError(f"{ERROR_LLM} verdict is not a dict: {type(raw)}")

    decision = raw.get("decision")
    if decision is None:
        for alt in ("verdict", "result", "action"):
            if alt in raw:
                decision = raw[alt]
                break
    decision = str(decision).strip().lower() if decision is not None else ""
    if decision in ("accept", "accepted", "approve", "approved", "yes"):
        decision = "accept"
    elif decision in ("reject", "rejected", "deny", "denied", "no"):
        decision = "reject"
    else:
        raise gl.vm.UserError(f"{ERROR_LLM} unrecognized decision: {decision!r}")

    raw_quality = raw.get("quality")
    if raw_quality is None:
        for alt in ("score", "rating", "confidence"):
            if alt in raw:
                raw_quality = raw[alt]
                break
    try:
        quality = int(round(float(str(raw_quality).strip()))) if raw_quality is not None else 0
    except (ValueError, TypeError):
        raise gl.vm.UserError(f"{ERROR_LLM} non-numeric quality: {raw_quality!r}")
    quality = max(0, min(100, quality))

    reason = raw.get("reason") or raw.get("explanation") or ""
    label = raw.get("label") or raw.get("normalized_label") or ""

    return {
        "decision": decision,
        "quality": quality,
        "reason": str(reason)[:280],
        "label": str(label)[:MAX_LABEL_CHARS],
    }


def _build_prompt(content: str, category: str, existing_labels: list) -> str:
    catalog = "\n".join(f"- {lab}" for lab in existing_labels) or "(the graph is empty)"
    return (
        "You are a curator for a collaborative, on-chain knowledge graph. "
        "Judge whether the following proposed knowledge entry should be ACCEPTED "
        "into the graph. Reject it if it is spam, incoherent, unverifiable, "
        "an exact duplicate of an existing entry, or internally inconsistent with "
        "the existing entries. Accept it if it is a coherent, useful, and "
        "sufficiently distinct contribution.\n\n"
        f"PROPOSED CATEGORY:\n{category}\n\n"
        f"PROPOSED CONTENT:\n{content}\n\n"
        f"EXISTING ENTRY LABELS (for dedup/consistency):\n{catalog}\n\n"
        "Respond ONLY with strict JSON of the form:\n"
        '{"decision": "accept" | "reject", '
        '"quality": <integer 0-100>, '
        '"label": "<short canonical label for this entry>", '
        '"reason": "<one concise sentence>"}'
    )


def _handle_leader_error(leaders_res, leader_fn) -> bool:
    """Canonical validator error handler — see write-contract skill."""
    leader_msg = getattr(leaders_res, "message", "") or ""
    try:
        leader_fn()
        return False  # leader errored but validator succeeded -> disagree
    except gl.vm.UserError as e:
        validator_msg = getattr(e, "message", "") or str(e)
        if validator_msg.startswith(ERROR_EXPECTED) or validator_msg.startswith(ERROR_EXTERNAL):
            return validator_msg == leader_msg
        if validator_msg.startswith(ERROR_TRANSIENT) and leader_msg.startswith(ERROR_TRANSIENT):
            return True
        return False
    except Exception:
        return False


# ───────────────────────────── Storage types ─────────────────────────────
@allow_storage
@dataclass
class KnowledgeNode:
    node_id: str
    label: str
    summary: str
    category: str
    proposer: Address
    quality: u256
    endorsements: u256
    created_at: str
    provenance: str   # JSON-encoded list[str]: natural-language consensus history


@allow_storage
@dataclass
class Proposal:
    pid: u256
    proposer: Address
    content: str
    category: str
    stake: u256
    status: str            # "accepted" | "rejected"
    quality: u256
    reason: str
    node_id: str
    created_at: str


# ─────────────────────────────── Contract ────────────────────────────────
class KnowledgeWeaver(gl.Contract):
    # Governance
    admin: Address
    created_at: str
    min_stake: u256          # internal credits required to submit a proposal
    starting_credits: u256   # credits granted to a participant on first contact

    # Counters / pools (internal credit bookkeeping — not native tokens)
    node_count: u256
    proposal_count: u256
    accepted_count: u256
    rejected_count: u256
    reward_pool: u256

    # Knowledge graph
    nodes: TreeMap[str, KnowledgeNode]
    node_ids: DynArray[str]
    slug_counts: TreeMap[str, u256]

    # Proposals (decided)
    proposals: TreeMap[u256, Proposal]
    proposal_ids: DynArray[u256]

    # Participants
    credits: TreeMap[Address, u256]
    reputation: TreeMap[Address, u256]
    joined: TreeMap[Address, bool]
    participants: DynArray[Address]

    def __init__(self, min_stake: int = 10, starting_credits: int = 100):
        self.admin = gl.message.sender_address
        self.created_at = gl.message.datetime if hasattr(gl.message, "datetime") else ""
        self.min_stake = u256(max(0, int(min_stake)))
        self.starting_credits = u256(max(1, int(starting_credits)))
        self.node_count = u256(0)
        self.proposal_count = u256(0)
        self.accepted_count = u256(0)
        self.rejected_count = u256(0)
        self.reward_pool = u256(0)

    # ───────────────────────── internal (non-public) ─────────────────────
    def _ensure_joined(self, who: Address) -> None:
        if not self.joined.get(who, False):
            self.joined[who] = True
            self.credits[who] = u256(int(self.starting_credits))
            self.reputation[who] = u256(0)
            self.participants.append(who)

    def _existing_labels(self) -> list:
        labels = []
        count = len(self.node_ids)
        start = count - MAX_CONTEXT_LABELS
        if start < 0:
            start = 0
        for i in range(start, count):
            nid = self.node_ids[i]
            node = self.nodes.get(nid)
            if node is not None:
                labels.append(node.label)
        return labels

    # ──────────────────────────── write methods ──────────────────────────
    @gl.public.write
    def register(self) -> dict:
        """Opt in as a participant and receive the starting credit allotment."""
        who = gl.message.sender_address
        self._ensure_joined(who)
        return {
            "address": who.as_hex,
            "credits": int(self.credits.get(who, u256(0))),
            "reputation": int(self.reputation.get(who, u256(0))),
        }

    @gl.public.write
    def propose(self, content: str, category: str) -> dict:
        """Propose a knowledge entry. GenLayer validators judge it via LLM
        consensus; on acceptance the semantic graph is mutated and stake is
        returned with a reward, otherwise the stake is forfeited to the pool.
        """
        who = gl.message.sender_address
        self._ensure_joined(who)

        clean_content = _sanitize(content, MAX_CONTENT_CHARS)
        clean_category = _sanitize(category, MAX_CATEGORY_CHARS) or "general"
        if len(clean_content) < 8:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} content too short")

        stake = int(self.min_stake)
        balance = int(self.credits.get(who, u256(0)))
        if balance < stake:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} insufficient credits")

        # Snapshot everything the consensus block needs into locals BEFORE the
        # nondet call. Storage must not be touched inside leader/validator fns.
        existing_labels = self._existing_labels()

        # Deduct stake up front (escrow).
        self.credits[who] = u256(balance - stake)

        verdict = _evaluate(clean_content, clean_category, existing_labels)

        decision = verdict["decision"]
        quality = verdict["quality"]
        reason = verdict["reason"]
        when = gl.message.datetime if hasattr(gl.message, "datetime") else ""

        pid = u256(int(self.proposal_count) + 1)
        self.proposal_count = pid

        node_id = ""
        if decision == "accept":
            node_id = self._commit_node(who, clean_content, clean_category, verdict, when)
            # Refund stake + bonus from the reward pool, and grant reputation.
            pool = int(self.reward_pool)
            bonus = min(pool, stake // 2)
            self.reward_pool = u256(pool - bonus)
            self.credits[who] = u256(int(self.credits.get(who, u256(0))) + stake + bonus)
            self.reputation[who] = u256(int(self.reputation.get(who, u256(0))) + 5 + quality // 20)
            self.accepted_count = u256(int(self.accepted_count) + 1)
            status = "accepted"
        else:
            # Stake is forfeited into the shared reward pool.
            self.reward_pool = u256(int(self.reward_pool) + stake)
            self.rejected_count = u256(int(self.rejected_count) + 1)
            status = "rejected"

        self.proposals[pid] = Proposal(
            pid=pid,
            proposer=who,
            content=clean_content,
            category=clean_category,
            stake=u256(stake),
            status=status,
            quality=u256(quality),
            reason=reason,
            node_id=node_id,
            created_at=when,
        )
        self.proposal_ids.append(pid)

        return {
            "proposal_id": int(pid),
            "status": status,
            "quality": quality,
            "reason": reason,
            "node_id": node_id,
            "credits": int(self.credits.get(who, u256(0))),
            "reputation": int(self.reputation.get(who, u256(0))),
        }

    def _commit_node(self, who: Address, content: str, category: str,
                     verdict: dict, when: str) -> str:
        label = verdict["label"] or content[:MAX_LABEL_CHARS]
        slug = _slugify(label)
        seen = int(self.slug_counts.get(slug, u256(0)))
        node_id = slug if seen == 0 else f"{slug}-{seen}"
        self.slug_counts[slug] = u256(seen + 1)

        node = KnowledgeNode(
            node_id=node_id,
            label=label,
            summary=content,
            category=category,
            proposer=who,
            quality=u256(verdict["quality"]),
            endorsements=u256(0),
            created_at=when,
            provenance=json.dumps([f"created: {verdict['reason']}"]),
        )
        self.nodes[node_id] = node
        self.node_ids.append(node_id)
        self.node_count = u256(int(self.node_count) + 1)
        return node_id

    @gl.public.write
    def endorse(self, node_id: str) -> dict:
        """Endorse an existing node (lightweight signal, costs 1 credit)."""
        who = gl.message.sender_address
        self._ensure_joined(who)
        if node_id not in self.nodes:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} unknown node")
        balance = int(self.credits.get(who, u256(0)))
        if balance < 1:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} insufficient credits")
        self.credits[who] = u256(balance - 1)
        node = self.nodes[node_id]
        node.endorsements = u256(int(node.endorsements) + 1)
        proposer = node.proposer
        self.reputation[proposer] = u256(int(self.reputation.get(proposer, u256(0))) + 1)
        return {"node_id": node_id, "endorsements": int(node.endorsements)}

    # ──────────────────────────── admin methods ──────────────────────────
    @gl.public.write
    def set_min_stake(self, new_min: int) -> None:
        self._only_admin()
        self.min_stake = u256(max(0, int(new_min)))

    @gl.public.write
    def grant_credits(self, address: str, amount: int) -> None:
        """Admin-only credit faucet for demos/tests."""
        self._only_admin()
        target = Address(address)
        self._ensure_joined(target)
        self.credits[target] = u256(int(self.credits.get(target, u256(0))) + max(0, int(amount)))

    def _only_admin(self) -> None:
        if gl.message.sender_address != self.admin:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} admin only")

    # ──────────────────────────── view methods ───────────────────────────
    @gl.public.view
    def get_stats(self) -> dict:
        return {
            "admin": self.admin.as_hex,
            "created_at": self.created_at,
            "min_stake": int(self.min_stake),
            "starting_credits": int(self.starting_credits),
            "node_count": int(self.node_count),
            "proposal_count": int(self.proposal_count),
            "accepted_count": int(self.accepted_count),
            "rejected_count": int(self.rejected_count),
            "reward_pool": int(self.reward_pool),
            "participant_count": len(self.participants),
        }

    @gl.public.view
    def get_node(self, node_id: str) -> dict:
        node = self.nodes.get(node_id)
        if node is None:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} unknown node")
        return _node_to_dict(node)

    @gl.public.view
    def list_nodes(self, offset: int, limit: int) -> list:
        offset = max(0, int(offset))
        limit = max(1, min(100, int(limit)))
        out = []
        total = len(self.node_ids)
        # newest first
        idx = total - 1 - offset
        taken = 0
        while idx >= 0 and taken < limit:
            node = self.nodes.get(self.node_ids[idx])
            if node is not None:
                out.append(_node_to_dict(node))
                taken += 1
            idx -= 1
        return out

    @gl.public.view
    def get_proposal(self, pid: int) -> dict:
        prop = self.proposals.get(u256(int(pid)))
        if prop is None:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} unknown proposal")
        return _proposal_to_dict(prop)

    @gl.public.view
    def list_proposals(self, offset: int, limit: int) -> list:
        offset = max(0, int(offset))
        limit = max(1, min(100, int(limit)))
        out = []
        total = len(self.proposal_ids)
        idx = total - 1 - offset
        taken = 0
        while idx >= 0 and taken < limit:
            prop = self.proposals.get(self.proposal_ids[idx])
            if prop is not None:
                out.append(_proposal_to_dict(prop))
                taken += 1
            idx -= 1
        return out

    @gl.public.view
    def get_profile(self, address: str) -> dict:
        who = Address(address)
        return {
            "address": who.as_hex,
            "joined": bool(self.joined.get(who, False)),
            "credits": int(self.credits.get(who, u256(0))),
            "reputation": int(self.reputation.get(who, u256(0))),
        }


# ─────────────────── consensus evaluation (module-level) ──────────────────
def _evaluate(content: str, category: str, existing_labels: list) -> dict:
    """Run the LLM accept/reject judgment under leader/validator consensus.

    The leader produces a verdict; each validator independently re-runs the
    judgment and agrees only if the accept/reject decision matches and the
    quality scores fall within a coarse tolerance band. This is genuine
    independent verification, not a JSON-shape check.
    """
    prompt = _build_prompt(content, category, existing_labels)

    def leader_fn() -> dict:
        raw = gl.nondet.exec_prompt(prompt, response_format="json")
        return _parse_verdict(raw)

    def validator_fn(leaders_res: gl.vm.Result) -> bool:
        if not isinstance(leaders_res, gl.vm.Return):
            return _handle_leader_error(leaders_res, leader_fn)
        leader_v = leaders_res.calldata
        my_v = leader_fn()
        # Decisions must agree.
        if str(leader_v["decision"]) != str(my_v["decision"]):
            return False
        # Quality must be within a coarse tolerance band.
        if abs(int(leader_v["quality"]) - int(my_v["quality"])) > QUALITY_TOLERANCE:
            return False
        return True

    return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)


def _node_to_dict(node: KnowledgeNode) -> dict:
    try:
        provenance = json.loads(node.provenance) if node.provenance else []
    except (ValueError, TypeError):
        provenance = []
    return {
        "node_id": node.node_id,
        "label": node.label,
        "summary": node.summary,
        "category": node.category,
        "proposer": node.proposer.as_hex,
        "quality": int(node.quality),
        "endorsements": int(node.endorsements),
        "created_at": node.created_at,
        "provenance": provenance,
    }


def _proposal_to_dict(prop: Proposal) -> dict:
    return {
        "proposal_id": int(prop.pid),
        "proposer": prop.proposer.as_hex,
        "content": prop.content,
        "category": prop.category,
        "stake": int(prop.stake),
        "status": prop.status,
        "quality": int(prop.quality),
        "reason": prop.reason,
        "node_id": prop.node_id,
        "created_at": prop.created_at,
    }
