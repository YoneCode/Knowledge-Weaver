import json

CONTRACT = "contracts/knowledge_weaver.py"

ACCEPT_RESPONSE = json.dumps(
    {
        "decision": "accept",
        "quality": 82,
        "label": "Photosynthesis basics",
        "reason": "Coherent, accurate, and distinct contribution.",
    }
)

REJECT_RESPONSE = json.dumps(
    {
        "decision": "reject",
        "quality": 10,
        "label": "spam",
        "reason": "Incoherent spam content.",
    }
)

# The leader prompt always contains this phrase (see _build_prompt).
PROMPT_RX = r".*collaborative, on-chain knowledge graph.*"


def _addr(a) -> str:
    """Return a 0x-hex string for an Address (direct-mode address object)."""
    try:
        return a.as_hex
    except AttributeError:
        return "0x" + bytes(a).hex()


def _deploy(direct_deploy):
    return direct_deploy(CONTRACT)


def test_register_grants_starting_credits(direct_vm, direct_deploy, direct_alice):
    contract = _deploy(direct_deploy)
    direct_vm.sender = direct_alice

    result = contract.register()
    assert result["credits"] == 100
    assert result["reputation"] == 0

    profile = contract.get_profile(_addr(direct_alice))
    assert profile["joined"] is True
    assert profile["credits"] == 100


def test_propose_accepted_creates_node(direct_vm, direct_deploy, direct_alice):
    contract = _deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(PROMPT_RX, ACCEPT_RESPONSE)

    res = contract.propose(
        "Photosynthesis converts light energy into chemical energy in plants.",
        "biology",
    )

    assert res["status"] == "accepted"
    assert res["quality"] == 82
    assert res["node_id"] != ""
    # stake (10) refunded on accept -> back to 100 credits
    assert res["credits"] == 100
    assert res["reputation"] >= 5

    stats = contract.get_stats()
    assert stats["node_count"] == 1
    assert stats["accepted_count"] == 1

    node = contract.get_node(res["node_id"])
    assert node["category"] == "biology"
    assert node["quality"] == 82
    assert len(node["provenance"]) == 1


def test_propose_rejected_forfeits_stake(direct_vm, direct_deploy, direct_alice):
    contract = _deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(PROMPT_RX, REJECT_RESPONSE)

    res = contract.propose("buy now cheap pills click here click here", "spam")

    assert res["status"] == "rejected"
    assert res["node_id"] == ""
    # stake (10) forfeited -> 90 credits, pool gains 10
    assert res["credits"] == 90

    stats = contract.get_stats()
    assert stats["node_count"] == 0
    assert stats["rejected_count"] == 1
    assert stats["reward_pool"] == 10


def test_content_too_short_reverts(direct_vm, direct_deploy, direct_alice):
    contract = _deploy(direct_deploy)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("content too short"):
        contract.propose("short", "general")


def test_insufficient_credits_reverts(direct_vm, direct_deploy, direct_alice, direct_owner):
    contract = direct_deploy(CONTRACT, 10, 5)  # min_stake 10, starting_credits 5
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(PROMPT_RX, ACCEPT_RESPONSE)
    with direct_vm.expect_revert("insufficient credits"):
        contract.propose("A reasonably long and coherent statement.", "general")


def test_endorse_increases_count_and_reputation(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = _deploy(direct_deploy)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(PROMPT_RX, ACCEPT_RESPONSE)
    res = contract.propose("Water boils at 100 degrees Celsius at sea level.", "physics")
    node_id = res["node_id"]

    direct_vm.sender = direct_bob
    contract.register()
    out = contract.endorse(node_id)
    assert out["endorsements"] == 1

    node = contract.get_node(node_id)
    assert node["endorsements"] == 1


def test_only_admin_can_set_min_stake(direct_vm, direct_deploy, direct_owner, direct_alice):
    # direct_owner is the deployer/admin by default
    direct_vm.sender = direct_owner
    contract = _deploy(direct_deploy)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("admin only"):
        contract.set_min_stake(50)
