import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  CONTRACT_ADDRESS,
  EXPLORER_URL,
  FAUCET_URL,
  LANDING_URL,
  isContractConfigured,
} from "./config";
import {
  addBradburyNetwork,
  getWriter,
  isRpcIdError,
  latestProposalFor,
  readNodes,
  readProfile,
  readProposals,
  readStats,
  sendEndorse,
  sendPropose,
  sendRegister,
  trackTransaction,
  type KnowledgeNode,
  type Profile,
  type Proposal,
  type Stats,
} from "./genlayer";
import {
  IconAlert,
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconDashboard,
  IconExternal,
  IconGraph,
  IconInfo,
  IconLogo,
  IconLogout,
  IconMenu,
  IconPlus,
  IconProposals,
  IconRefresh,
  IconSettings,
  IconSparkles,
  IconWallet,
  IconX,
} from "./icons";

// ─────────────────────────── helpers ─────────────────────────────────────
const short = (a: string) => (a && a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
const fmt = (n: number | string | undefined): string => {
  if (n === undefined || n === null || n === "—") return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return String(n);
  return new Intl.NumberFormat("en-US").format(v);
};

type View = "dashboard" | "graph" | "proposals" | "settings";

type TxKind = "Propose" | "Endorse" | "Register";
type TxStage = "signing" | "consensus" | "done" | "error";
type TxState = {
  kind: TxKind;
  stage: TxStage;
  startedAt: number;
  txId?: string;
  statusName?: string;
  result?: Proposal | null;
  error?: string;
} | null;

const NAV: { key: View; label: string; Icon: typeof IconDashboard }[] = [
  { key: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { key: "graph", label: "Knowledge graph", Icon: IconGraph },
  { key: "proposals", label: "Proposals", Icon: IconProposals },
  { key: "settings", label: "Settings", Icon: IconSettings },
];

const PAGE_META: Record<View, { title: string; sub: string }> = {
  dashboard: {
    title: "Dashboard",
    sub: "An at-a-glance view of consensus activity and the evolving graph.",
  },
  graph: {
    title: "Knowledge graph",
    sub: "Entries accepted by validator consensus. Endorse what holds up.",
  },
  proposals: {
    title: "Proposals",
    sub: "Every submission and the verdict the network reached on it.",
  },
  settings: {
    title: "Settings",
    sub: "Contract configuration and your participant profile.",
  },
};

// ─────────────────────────── App ─────────────────────────────────────────
export default function App() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const wallet = wallets?.[0];
  const address = (wallet?.address as `0x${string}`) || undefined;

  const [view, setView] = useState<View>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<TxState>(null);
  const [toast, setToast] = useState<string>("");
  const [netHelp, setNetHelp] = useState(false);

  const configured = isContractConfigured();
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (!configured || refreshing.current) return;
    refreshing.current = true;
    setLoading(true);
    try {
      const s = await readStats();
      const ns = await readNodes(0, 100);
      const ps = await readProposals(0, 100);
      setStats(s);
      setNodes(ns);
      setProposals(ps);
      if (address) setProfile(await readProfile(address));
    } catch (e) {
      setToast(`Read failed: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      refreshing.current = false;
    }
  }, [configured, address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runTx = useCallback(
    async (
      kind: TxKind,
      sender: (c: Awaited<ReturnType<typeof getWriter>>) => Promise<string>,
    ) => {
      if (!address || !wallet) {
        setToast("Connect a wallet first.");
        return;
      }
      setNetHelp(false);
      setTx({ kind, stage: "signing", startedAt: Date.now() });
      try {
        const provider = await wallet.getEthereumProvider();
        const client = await getWriter(address, provider);
        const txId = await sender(client);
        setTx((t) => (t ? { ...t, stage: "consensus", txId, statusName: "PENDING" } : t));

        const res = await trackTransaction(txId, (statusName) => {
          setTx((t) => (t ? { ...t, statusName } : t));
        });

        let result: Proposal | null = null;
        if (res.succeeded && kind === "Propose") {
          try {
            result = await latestProposalFor(address);
          } catch {
            result = null;
          }
        }
        setTx((t) =>
          t
            ? {
                ...t,
                stage: res.succeeded ? "done" : "error",
                statusName: res.statusName,
                result,
                error: res.succeeded ? undefined : `Consensus ended in ${res.statusName}.`,
              }
            : t,
        );
        await refresh();
      } catch (e) {
        if (isRpcIdError(e)) {
          setTx(null);
          setNetHelp(true);
          setToast("Your wallet's Bradbury network uses an incompatible RPC.");
        } else {
          const msg = (e as Error).message ?? "Transaction failed";
          const rejected = /user rejected|denied|rejected the request/i.test(msg);
          setTx((t) =>
            t
              ? { ...t, stage: "error", error: rejected ? "You rejected the request in your wallet." : msg }
              : t,
          );
        }
      }
    },
    [address, wallet, refresh],
  );

  const fixNetwork = useCallback(async () => {
    if (!wallet) return;
    try {
      const provider = await wallet.getEthereumProvider();
      await addBradburyNetwork(provider);
      setToast("Network RPC updated. Try your transaction again.");
      setNetHelp(false);
    } catch (e) {
      setToast(`Could not update network · ${(e as Error).message}`);
    }
  }, [wallet]);

  const onEndorse = (id: string) => runTx("Endorse", (c) => sendEndorse(c, id));
  const onPropose = (content: string, category: string) =>
    runTx("Propose", (c) => sendPropose(c, content, category));
  const onRegister = () => runTx("Register", (c) => sendRegister(c));

  // A write is in flight until it reaches a terminal stage.
  const busyKind: TxKind | "" = tx && tx.stage !== "done" && tx.stage !== "error" ? tx.kind : "";

  const navigate = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  const meta = PAGE_META[view];

  return (
    <div
      className={[
        "app",
        collapsed ? "collapsed" : "",
        menuOpen ? "menu-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Sidebar
        view={view}
        navigate={navigate}
        collapsed={collapsed}
        onCollapse={() => setCollapsed((c) => !c)}
        onCloseMobile={() => setMenuOpen(false)}
      />

      <button
        type="button"
        className="scrim"
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />

      <div className="main">
        <Header
          title={meta.title}
          sub={meta.sub}
          onMenu={() => setMenuOpen(true)}
          loading={loading}
          onRefresh={refresh}
          onLogin={login}
          onLogout={logout}
          ready={ready}
          authenticated={authenticated}
          address={address}
          userId={user?.id}
        />

        <main className="content" id="content">
          <header className="page-head">
            <p className="eyebrow">Bradbury · chain 4221</p>
            <h1 className="page-title">{meta.title}</h1>
            <p className="page-sub">{meta.sub}</p>
          </header>

          {!configured ? (
            <Banner kind="warn">
              <IconAlert />
              <span>
                No contract address configured. Set{" "}
                <code>VITE_CONTRACT_ADDRESS</code> in <code>frontend/.env</code>.
              </span>
            </Banner>
          ) : (
            <Banner kind="info">
              <IconInfo />
              <span>
                Deployed at{" "}
                <a
                  className="mono-link"
                  href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {short(CONTRACT_ADDRESS)} <IconExternal size={11} />
                </a>{" "}
                · Need test GEN?{" "}
                <a href={FAUCET_URL} target="_blank" rel="noreferrer">
                  Open faucet
                </a>
              </span>
            </Banner>
          )}

          {netHelp && (
            <Banner kind="warn">
              <IconAlert />
              <span>
                Your wallet&apos;s Bradbury network is using an RPC that rejects this
                wallet&apos;s requests. Two easy fixes:{" "}
                <button type="button" className="link-btn" onClick={fixNetwork}>
                  add the compatible RPC
                </button>{" "}
                (then retry), or in MetaMask remove the Bradbury network and reconnect.
                Or just log in with email for a built-in wallet that always works.
              </span>
            </Banner>
          )}

          {view === "dashboard" && (
            <DashboardView stats={stats} proposals={proposals} loading={loading} />
          )}
          {view === "graph" && (
            <GraphView
              nodes={nodes}
              loading={loading}
              canAct={!!address && configured}
              busy={busyKind}
              onEndorse={onEndorse}
              proposeDisabled={!address || !configured}
              proposeBusy={busyKind === "Propose"}
              onPropose={onPropose}
            />
          )}
          {view === "proposals" && (
            <ProposalsTable
              proposals={proposals}
              loading={loading}
              pageSize={10}
              title="All proposals"
            />
          )}
          {view === "settings" && (
            <SettingsView
              stats={stats}
              profile={profile}
              connected={!!address}
              busy={busyKind === "Register"}
              onRegister={onRegister}
            />
          )}
        </main>

        <footer className="footer">
          <span>KnowledgeWeaver · Collective Semantic Consensus on GenLayer Bradbury.</span>
          <span className="dim">v0.1 · chain 4221</span>
        </footer>
      </div>

      {tx && (
        <TxProgress
          tx={tx}
          onClose={() => setTx(null)}
          onViewGraph={() => {
            setView("graph");
            setTx(null);
          }}
        />
      )}

      {toast && (
        <div className="toast" role="status" onClick={() => setToast("")}>
          <IconCheck size={16} />
          <span style={{ flex: 1 }}>{toast}</span>
          <IconClose size={14} className="close" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Sidebar ─────────────────────────────────────
function Sidebar({
  view,
  navigate,
  collapsed,
  onCollapse,
  onCloseMobile,
}: {
  view: View;
  navigate: (v: View) => void;
  collapsed: boolean;
  onCollapse: () => void;
  onCloseMobile: () => void;
}) {
  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar-head">
        <a className="brand" href={LANDING_URL} aria-label="KnowledgeWeaver — back to home">
          <span className="brand-mark" aria-hidden>
            <IconLogo size={16} />
          </span>
          <span className="brand-name">KnowledgeWeaver</span>
        </a>
        <button
          type="button"
          className="btn icon close-mobile"
          aria-label="Close menu"
          onClick={onCloseMobile}
        >
          <IconClose size={14} />
        </button>
      </div>

      <nav className="nav" aria-label="Sections">
        <div className="nav-section">Workspace</div>
        {NAV.map(({ key, label, Icon }) => (
          <button
            type="button"
            key={key}
            className={`nav-item ${view === key ? "active" : ""}`}
            onClick={() => navigate(key)}
            title={collapsed ? label : undefined}
            aria-current={view === key ? "page" : undefined}
          >
            <Icon className="nav-icon" />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="dot" aria-hidden />
        <span className="sidebar-foot-text">Bradbury · 4221</span>
        <button
          type="button"
          className="btn icon"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onCollapse}
          style={{ marginLeft: "auto" }}
        >
          {collapsed ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────── Header ──────────────────────────────────────
function Header({
  title,
  sub,
  onMenu,
  loading,
  onRefresh,
  onLogin,
  onLogout,
  ready,
  authenticated,
  address,
  userId,
}: {
  title: string;
  sub: string;
  onMenu: () => void;
  loading: boolean;
  onRefresh: () => void;
  onLogin: () => void;
  onLogout: () => void;
  ready: boolean;
  authenticated: boolean;
  address?: string;
  userId?: string;
}) {
  return (
    <header className="header">
      <div className="header-left">
        <button
          type="button"
          className="menu-toggle"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <IconMenu size={16} />
        </button>
        <div>
          <h2 className="header-title">{title}</h2>
          <p className="header-sub">{sub}</p>
        </div>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="btn icon bordered"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh"
          title="Refresh"
        >
          <IconRefresh
            size={14}
            style={
              loading ? { animation: "spin 0.8s linear infinite" } : undefined
            }
          />
        </button>
        <span className="network-pill">
          <span className="dot" aria-hidden />
          Bradbury · 4221
        </span>
        {ready && authenticated ? (
          <>
            <span className="addr-chip" title={address ?? userId ?? ""}>
              <IconWallet size={12} />
              {short(address ?? userId ?? "")}
            </span>
            <button type="button" className="btn ghost" onClick={onLogout} aria-label="Disconnect">
              <IconLogout size={14} />
              <span className="sr-only">Disconnect</span>
            </button>
          </>
        ) : (
          <button type="button" className="btn" disabled={!ready} onClick={onLogin}>
            <IconWallet size={14} />
            Connect wallet
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </header>
  );
}

// ─────────────────────────── Dashboard ───────────────────────────────────
function DashboardView({
  stats,
  proposals,
  loading,
}: {
  stats: Stats | null;
  proposals: Proposal[];
  loading: boolean;
}) {
  const accept_rate =
    stats && stats.proposal_count > 0
      ? Math.round((stats.accepted_count / stats.proposal_count) * 100)
      : null;

  const cards = [
    {
      label: "Knowledge nodes",
      value: stats?.node_count,
      sub: stats ? "Accepted into graph" : undefined,
    },
    {
      label: "Accepted proposals",
      value: stats?.accepted_count,
      sub: accept_rate !== null ? `${accept_rate}% acceptance rate` : "Awaiting consensus",
    },
    {
      label: "Participants",
      value: stats?.participant_count,
      sub: "Registered addresses",
    },
    {
      label: "Reward pool",
      value: stats?.reward_pool,
      sub: "Forfeited stake credits",
    },
  ];

  return (
    <>
      <section className="metrics" aria-label="Key metrics">
        {cards.map((c) => (
          <Metric key={c.label} label={c.label} value={c.value} sub={c.sub} loading={!stats} />
        ))}
      </section>

      <ChartPanel proposals={proposals} />

      <ProposalsTable
        proposals={proposals}
        loading={loading}
        pageSize={6}
        title="Recent activity"
      />
    </>
  );
}

function Metric({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: number | undefined;
  sub?: string;
  loading: boolean;
}) {
  return (
    <article className="metric">
      <div className="metric-label">{label}</div>
      {loading || value === undefined ? (
        <div className="metric-skeleton" aria-busy="true" />
      ) : (
        <div className="metric-value">{fmt(value)}</div>
      )}
      {sub && <div className="metric-foot">{sub}</div>}
    </article>
  );
}

// ─────────────────────────── Chart panel ─────────────────────────────────
function ChartPanel({ proposals }: { proposals: Proposal[] }) {
  const series = useMemo(() => buildDailySeries(proposals, 30), [proposals]);
  const total = series.reduce((s, d) => s + d.total, 0);
  const accepted = series.reduce((s, d) => s + d.accepted, 0);

  return (
    <section className="panel flush" aria-label="Consensus activity">
      <div className="panel-head">
        <div>
          <h2>Consensus activity</h2>
          <div className="meta">
            Last 30 days · {fmt(total)} proposals · {fmt(accepted)} accepted
          </div>
        </div>
        <div className="chart-legend">
          <span><span className="swatch total" />Proposals</span>
          <span><span className="swatch accepted" />Accepted</span>
        </div>
      </div>
      <div className="panel-body">
        <Chart series={series} />
      </div>
    </section>
  );
}

type DayPoint = { key: string; label: string; total: number; accepted: number };

function buildDailySeries(proposals: Proposal[], days: number): DayPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: DayPoint[] = [];
  const index: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    index[key] = buckets.length;
    buckets.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, total: 0, accepted: 0 });
  }
  for (const p of proposals) {
    if (!p.created_at) continue;
    const t = new Date(p.created_at);
    if (isNaN(t.getTime())) continue;
    const key = t.toISOString().slice(0, 10);
    const i = index[key];
    if (i === undefined) continue;
    buckets[i].total += 1;
    if (p.status === "accepted") buckets[i].accepted += 1;
  }
  return buckets;
}

function Chart({ series }: { series: DayPoint[] }) {
  const W = 1000;
  const H = 240;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;

  const maxY = Math.max(1, ...series.map((d) => d.total));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i: number) =>
    padL + (series.length <= 1 ? 0 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / maxY) * innerH;
  const path = (k: "total" | "accepted") =>
    series
      .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`)
      .join(" ");
  const area =
    `M${x(0).toFixed(1)},${y(0).toFixed(1)} ` +
    series.map((d, i) => `L${x(i).toFixed(1)},${y(d.total).toFixed(1)}`).join(" ") +
    ` L${x(series.length - 1).toFixed(1)},${y(0).toFixed(1)} Z`;

  const hasData = series.some((d) => d.total > 0);
  if (!hasData) {
    return (
      <div className="empty">
        <div className="empty-icon"><IconSparkles size={16} /></div>
        <div className="empty-title">No activity yet</div>
        <div>Submit a proposal to begin populating the consensus chart.</div>
      </div>
    );
  }

  // Y-axis: 0 and max only — keep it ultra clean
  const yLines = [maxY, 0];

  return (
    <div className="chart-wrap">
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Consensus activity over the last 30 days"
      >
        <defs>
          <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(16,185,129,0.18)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </linearGradient>
        </defs>

        {yLines.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} className="grid-line" />
            <text x={padL - 8} y={y(v) + 3} className="axis" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {series.map((d, i) =>
          i === 0 || i === series.length - 1 || i === Math.floor(series.length / 2) ? (
            <text key={i} x={x(i)} y={H - 8} className="axis" textAnchor="middle">
              {d.label}
            </text>
          ) : null,
        )}

        <path d={area} className="area-fill" />
        <path d={path("total")} className="line total" />
        <path d={path("accepted")} className="line accepted" />
      </svg>
    </div>
  );
}

// ───────────────── Proposals table (sortable + paginated) ────────────────
type SortKey = "proposal_id" | "category" | "status" | "quality";

function ProposalsTable({
  proposals,
  loading,
  pageSize,
  title,
}: {
  proposals: Proposal[];
  loading: boolean;
  pageSize: number;
  title: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("proposal_id");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const arr = [...proposals];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "category" || sortKey === "status") {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [proposals, sortKey, asc]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clamped = Math.min(page, pages - 1);
  const slice = sorted.slice(clamped * pageSize, clamped * pageSize + pageSize);

  const head = (key: SortKey, label: string) => (
    <th
      className="sortable"
      onClick={() => {
        if (sortKey === key) setAsc((v) => !v);
        else { setSortKey(key); setAsc(false); }
        setPage(0);
      }}
      aria-sort={sortKey === key ? (asc ? "ascending" : "descending") : "none"}
    >
      {label}
      {sortKey === key && (
        <span className="sort-ind">
          {asc ? <IconArrowUp size={11} /> : <IconArrowDown size={11} />}
        </span>
      )}
    </th>
  );

  return (
    <section className="panel flush" aria-label={title}>
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="meta">{fmt(sorted.length)} total</span>
      </div>

      {loading && proposals.length === 0 ? (
        <SkeletonRows rows={Math.min(pageSize, 5)} />
      ) : sorted.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><IconProposals size={16} /></div>
          <div className="empty-title">No proposals yet</div>
          <div>Once a submission is judged by validators, it will appear here.</div>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {head("proposal_id", "ID")}
                  <th>Content</th>
                  {head("category", "Category")}
                  {head("status", "Status")}
                  {head("quality", "Quality")}
                </tr>
              </thead>
              <tbody>
                {slice.map((p) => (
                  <tr key={p.proposal_id}>
                    <td className="num dim">{p.proposal_id}</td>
                    <td>
                      <div className="cell-title clamp-2">{p.content}</div>
                      {p.reason && <div className="cell-sub clamp-2">{p.reason}</div>}
                    </td>
                    <td><span className="tag">{p.category}</span></td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="num">{p.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={clamped} pages={pages} onPage={setPage} total={sorted.length} pageSize={pageSize} />
        </>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted") return <span className="badge accepted"><IconCheck size={11} /> Accepted</span>;
  if (status === "rejected") return <span className="badge rejected"><IconX size={11} /> Rejected</span>;
  return <span className="badge neutral">{status}</span>;
}

function Pagination({
  page,
  pages,
  onPage,
  total,
  pageSize,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
  total: number;
  pageSize: number;
}) {
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, page * pageSize + pageSize);
  return (
    <div className="pagination">
      <span>
        {from}–{to} of {fmt(total)}
      </span>
      <div className="controls">
        <button
          type="button"
          className="btn icon bordered"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          <IconChevronLeft size={14} />
        </button>
        <span style={{ minWidth: 64, textAlign: "center" }}>
          Page {page + 1} of {pages}
        </span>
        <button
          type="button"
          className="btn icon bordered"
          aria-label="Next page"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          <IconChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div style={{ padding: "var(--s-5)" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-row"
          style={{ width: `${60 + ((i * 17) % 30)}%`, marginBottom: 16 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────── Knowledge graph ─────────────────────────────
type NodeSortKey = "label" | "category" | "quality" | "endorsements";

function GraphView({
  nodes,
  loading,
  canAct,
  busy,
  onEndorse,
  proposeDisabled,
  proposeBusy,
  onPropose,
}: {
  nodes: KnowledgeNode[];
  loading: boolean;
  canAct: boolean;
  busy: string;
  onEndorse: (id: string) => void;
  proposeDisabled: boolean;
  proposeBusy: boolean;
  onPropose: (content: string, category: string) => void;
}) {
  const [sortKey, setSortKey] = useState<NodeSortKey>("quality");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  const sorted = useMemo(() => {
    const arr = [...nodes];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "label" || sortKey === "category") {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [nodes, sortKey, asc]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clamped = Math.min(page, pages - 1);
  const slice = sorted.slice(clamped * pageSize, clamped * pageSize + pageSize);

  const head = (key: NodeSortKey, label: string) => (
    <th
      className="sortable"
      onClick={() => {
        if (sortKey === key) setAsc((v) => !v);
        else { setSortKey(key); setAsc(false); }
        setPage(0);
      }}
      aria-sort={sortKey === key ? (asc ? "ascending" : "descending") : "none"}
    >
      {label}
      {sortKey === key && (
        <span className="sort-ind">
          {asc ? <IconArrowUp size={11} /> : <IconArrowDown size={11} />}
        </span>
      )}
    </th>
  );

  return (
    <div className="grid-2">
      <section className="panel flush" aria-label="Knowledge graph">
        <div className="panel-head">
          <h2>Accepted nodes</h2>
          <span className="meta">{fmt(sorted.length)} entries</span>
        </div>

        {loading && nodes.length === 0 ? (
          <SkeletonRows rows={4} />
        ) : sorted.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><IconGraph size={16} /></div>
            <div className="empty-title">The graph is empty</div>
            <div>Be the first to contribute a coherent, useful entry.</div>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {head("label", "Label")}
                    {head("category", "Category")}
                    {head("quality", "Quality")}
                    {head("endorsements", "Endorse")}
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {slice.map((nd) => (
                    <tr key={nd.node_id}>
                      <td>
                        <div className="cell-title">{nd.label}</div>
                        <div className="cell-sub clamp-2">{nd.summary}</div>
                      </td>
                      <td><span className="tag">{nd.category}</span></td>
                      <td className="num">{nd.quality}</td>
                      <td className="num">{nd.endorsements}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn secondary sm"
                          disabled={!canAct || busy === "Endorse"}
                          onClick={() => onEndorse(nd.node_id)}
                        >
                          Endorse
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={clamped} pages={pages} onPage={setPage} total={sorted.length} pageSize={pageSize} />
          </>
        )}
      </section>

      <ProposePanel
        disabled={proposeDisabled}
        busy={proposeBusy}
        onPropose={onPropose}
      />
    </div>
  );
}

function ProposePanel({
  disabled,
  busy,
  onPropose,
}: {
  disabled: boolean;
  busy: boolean;
  onPropose: (content: string, category: string) => void;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const canSubmit = useMemo(
    () => content.trim().length >= 8 && !busy && !disabled,
    [content, busy, disabled],
  );
  return (
    <section className="panel" aria-label="Propose knowledge">
      <div className="section-head">
        <div>
          <h2>Propose</h2>
          <p>Validators independently judge each submission.</p>
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="cat">Category</label>
        <input
          id="cat"
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="biology, physics, history…"
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="stmt">Statement</label>
        <textarea
          id="stmt"
          className="input textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="A coherent, verifiable statement to add to the graph…"
          rows={5}
        />
      </div>

      <button
        type="button"
        className="btn full"
        disabled={!canSubmit}
        onClick={() => {
          onPropose(content.trim(), category.trim() || "general");
          setContent("");
        }}
      >
        <IconPlus size={14} />
        {busy ? "Submitting to consensus…" : "Submit proposal"}
      </button>

      {disabled && <p className="dim" style={{ fontSize: "var(--t-xs)", marginTop: "var(--s-3)" }}>
        Connect a wallet to contribute.
      </p>}
    </section>
  );
}

// ─────────────────────────── Settings ────────────────────────────────────
function SettingsView({
  stats,
  profile,
  connected,
  busy,
  onRegister,
}: {
  stats: Stats | null;
  profile: Profile | null;
  connected: boolean;
  busy: boolean;
  onRegister: () => void;
}) {
  return (
    <div className="grid-2">
      <section className="panel" aria-label="Contract">
        <div className="section-head">
          <div>
            <h2>Contract</h2>
            <p>Live configuration of the deployed Intelligent Contract.</p>
          </div>
        </div>
        <div className="kv">
          <KV k="Network">Bradbury · 4221</KV>
          <KV k="Address">
            <a
              className="mono-link"
              href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
            >
              {short(CONTRACT_ADDRESS)} <IconExternal size={11} />
            </a>
          </KV>
          <KV k="Admin"><span className="mono">{short(stats?.admin ?? "—")}</span></KV>
          <KV k="Min stake">{fmt(stats?.min_stake)}</KV>
          <KV k="Starting credits">{fmt(stats?.starting_credits)}</KV>
        </div>
      </section>

      <section className="panel" aria-label="Profile">
        <div className="section-head">
          <div>
            <h2>Profile</h2>
            <p>Your participation status in the network.</p>
          </div>
        </div>
        {!connected ? (
          <div className="empty" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div className="empty-icon"><IconWallet size={16} /></div>
            <div className="empty-title">Wallet not connected</div>
            <div>Connect to view credits, reputation, and to register.</div>
          </div>
        ) : (
          <>
            <div className="kv">
              <KV k="Credits"><span className="num">{fmt(profile?.credits ?? 0)}</span></KV>
              <KV k="Reputation"><span className="num">{fmt(profile?.reputation ?? 0)}</span></KV>
              <KV k="Status">{profile?.joined ? "Registered" : "Not registered"}</KV>
            </div>
            {!profile?.joined && (
              <button
                type="button"
                className="btn full"
                style={{ marginTop: "var(--s-4)" }}
                disabled={busy}
                onClick={onRegister}
              >
                {busy ? "Registering…" : "Register & claim credits"}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="kv-row">
      <span className="k">{k}</span>
      <span className="v">{children}</span>
    </div>
  );
}

// ─────────────────────────── Transaction progress ───────────────────────
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Queued for consensus",
  ACTIVATED: "Queued for consensus",
  PROPOSING: "Leader proposing a verdict",
  COMMITTING: "Validators committing votes",
  REVEALING: "Validators revealing votes",
  APPEAL_COMMITTING: "Appeal — committing",
  APPEAL_REVEALING: "Appeal — revealing",
  READY_TO_FINALIZE: "Finalizing",
  ACCEPTED: "Accepted by consensus",
  FINALIZED: "Finalized on-chain",
  UNDETERMINED: "Consensus undetermined",
  LEADER_TIMEOUT: "Leader timed out",
  VALIDATORS_TIMEOUT: "Validators timed out",
  CANCELED: "Canceled",
};

const KIND_COPY: Record<TxKind, { title: string; doing: string }> = {
  Propose: { title: "New proposal", doing: "Five validators are independently judging your entry." },
  Endorse: { title: "Endorse node", doing: "Recording your endorsement on-chain." },
  Register: { title: "Register", doing: "Creating your participant profile on-chain." },
};

const TX_STEPS = ["Sign", "Submit", "Consensus", "Result"];

function TxProgress({
  tx,
  onClose,
  onViewGraph,
}: {
  tx: NonNullable<TxState>;
  onClose: () => void;
  onViewGraph: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tx.stage === "done" || tx.stage === "error") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tx.stage]);

  const elapsed = Math.max(0, Math.floor((now - tx.startedAt) / 1000));
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  const copy = () => {
    if (!tx.txId) return;
    navigator.clipboard?.writeText(tx.txId).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
      () => undefined,
    );
  };

  const stepState = (i: number): "done" | "active" | "error" | "todo" => {
    if (tx.stage === "error") {
      if (!tx.txId) return i === 0 ? "error" : "todo";
      if (i <= 1) return "done";
      if (i === 2) return "error";
      return "todo";
    }
    if (tx.stage === "signing") return i === 0 ? "active" : "todo";
    if (tx.stage === "consensus") {
      if (i <= 1) return "done";
      if (i === 2) return "active";
      return "todo";
    }
    return "done"; // stage === done
  };

  const copyMeta = KIND_COPY[tx.kind];
  const statusLabel =
    tx.stage === "signing"
      ? "Waiting for wallet signature"
      : tx.statusName
        ? STATUS_LABEL[tx.statusName] ?? tx.statusName
        : "Preparing";
  const running = tx.stage === "signing" || tx.stage === "consensus";
  const closable = tx.stage === "done" || tx.stage === "error";
  const accepted = tx.result?.status === "accepted";

  return (
    <div className="tx-overlay" role="dialog" aria-modal="true" aria-label={`${tx.kind} transaction`}>
      <div className="tx-card">
        <div className="tx-head">
          <div>
            <div className="tx-kicker">{copyMeta.title}</div>
            <h3 className="tx-title">
              {tx.stage === "done" ? "Confirmed on-chain" : tx.stage === "error" ? "Couldn’t complete" : copyMeta.doing}
            </h3>
          </div>
          <button
            type="button"
            className="btn icon"
            aria-label="Close"
            onClick={onClose}
            disabled={!closable}
            title={closable ? "Close" : "In progress…"}
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div className="tx-steps" aria-hidden>
          {TX_STEPS.map((label, i) => {
            const st = stepState(i);
            return (
              <div key={label} className={`tx-step ${st}`}>
                <span className="tx-dot">
                  {st === "done" ? (
                    <IconCheck size={12} />
                  ) : st === "error" ? (
                    <IconX size={12} />
                  ) : st === "active" ? (
                    <span className="tx-spinner" />
                  ) : (
                    <span className="tx-dot-idle" />
                  )}
                </span>
                <span className="tx-step-label">{label}</span>
                {i < TX_STEPS.length - 1 && <span className="tx-connector" />}
              </div>
            );
          })}
        </div>

        {/* Live status */}
        {tx.stage !== "done" && tx.stage !== "error" && (
          <div className="tx-status">
            <span className="tx-status-pulse" />
            <span className="tx-status-text">{statusLabel}</span>
            <span className="tx-clock mono">{clock}</span>
          </div>
        )}

        {/* Tx hash */}
        {tx.txId && (
          <div className="tx-hash">
            <span className="dim">Transaction</span>
            <button type="button" className="tx-hash-id mono" onClick={copy} title="Copy id">
              {short(tx.txId)} {copied ? "· copied" : ""}
            </button>
            <a
              className="tx-hash-link"
              href={`${EXPLORER_URL}/tx/${tx.txId}`}
              target="_blank"
              rel="noreferrer"
            >
              Explorer <IconExternal size={12} />
            </a>
          </div>
        )}

        {/* Result */}
        {tx.stage === "done" && tx.kind === "Propose" && tx.result && (
          <div className={`tx-result ${accepted ? "ok" : "no"}`}>
            <div className="tx-result-head">
              <span className={`badge ${accepted ? "accepted" : "rejected"}`}>
                {accepted ? <IconCheck size={11} /> : <IconX size={11} />}
                {accepted ? "Accepted" : "Rejected"}
              </span>
              <span className="tx-result-quality mono">quality {tx.result.quality}</span>
            </div>
            <div className="tx-result-label">{tx.result.content}</div>
            {tx.result.reason && <div className="tx-result-reason">“{tx.result.reason}”</div>}
          </div>
        )}

        {tx.stage === "done" && tx.kind !== "Propose" && (
          <div className="tx-result ok">
            <div className="tx-result-head">
              <span className="badge accepted"><IconCheck size={11} /> Confirmed</span>
            </div>
            <div className="tx-result-reason">
              {tx.kind === "Register" ? "Your participant profile is live." : "Your endorsement was recorded."}
            </div>
          </div>
        )}

        {tx.stage === "error" && (
          <div className="tx-result no">
            <div className="tx-result-head">
              <span className="badge rejected"><IconX size={11} /> Failed</span>
            </div>
            <div className="tx-result-reason">{tx.error ?? "The transaction did not complete."}</div>
          </div>
        )}

        {/* Footer actions */}
        <div className="tx-actions">
          {running ? (
            <span className="dim sm">
              Consensus can take a few minutes. You can keep this open or close it — it won’t cancel.
            </span>
          ) : (
            <>
              {tx.stage === "done" && tx.kind === "Propose" && accepted && (
                <button type="button" className="btn secondary" onClick={onViewGraph}>
                  View in graph
                </button>
              )}
              <button type="button" className="btn" onClick={onClose}>
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Banner ──────────────────────────────────────
function Banner({ kind, children }: { kind: "info" | "warn"; children: ReactNode }) {
  return <div className={`banner ${kind}`}>{children}</div>;
}
