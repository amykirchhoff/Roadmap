import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, CartesianGrid, PieChart, Pie, Treemap } from "recharts";
import DATA from "./data.json";

const C = {
  bg: "#0d1117", card: "#161b22", cardHover: "#1c2333", border: "#30363d",
  text: "#e6edf3", muted: "#8b949e", accent: "#58a6ff", accentDim: "#1f6feb",
  red: "#f85149", orange: "#d29922", green: "#3fb950", purple: "#bc8cff",
  pink: "#f778ba", cyan: "#39d5ff", mono: "'JetBrains Mono', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
};

const fmt = n => typeof n === "number" ? n.toLocaleString() : n;
const pct = (n, d) => d > 0 ? `${(n / d * 100).toFixed(1)}%` : "0%";

const Stat = ({ label, value, sub, color, small }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: small ? "10px 14px" : "14px 18px", flex: 1, minWidth: small ? 100 : 140 }}>
    <div style={{ fontSize: small ? 18 : 26, fontWeight: 800, color: color || C.accent, fontFamily: C.mono }}>{value}</div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontFamily: C.sans }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2, opacity: 0.7 }}>{sub}</div>}
  </div>
);

const Alert = ({ children, color }) => (
  <div style={{ background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 12, color, fontFamily: C.sans, lineHeight: 1.5 }}>{children}</div>
);

const Tag = ({ children, color, onClick }) => (
  <span onClick={onClick} style={{ background: `${color}18`, color, padding: "3px 8px", borderRadius: 4, fontSize: 10, border: `1px solid ${color}33`, cursor: onClick ? "pointer" : "default", fontFamily: C.sans, display: "inline-block", margin: 1 }}>{children}</span>
);

const Section = ({ title, sub, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700, marginBottom: 2, fontFamily: C.sans }}>{title}</h3>
    {sub && <p style={{ color: C.muted, fontSize: 11, margin: "0 0 10px", fontFamily: C.sans }}>{sub}</p>}
    {children}
  </div>
);

const TT = ({ payload, render }) => {
  if (!payload?.[0]) return null;
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, fontSize: 11, color: C.text, fontFamily: C.sans, maxWidth: 280 }}>{render(payload[0].payload)}</div>;
};

export default function App() {
  const [view, setView] = useState("contentgap");
  const [selInd, setSelInd] = useState(null);
  const [sortBy, setSortBy] = useState("users");
  const [search, setSearch] = useState("");
  const [showOrphaned, setShowOrphaned] = useState(false);

  const inds = DATA.industries;
  const sectors = DATA.sectors;
  const phases = DATA.phases;
  const aa = DATA.anytimeActions;
  const tp = DATA.taskProgress;

  const totalBiz = phases.totalBusinesses;
  const mismatchInds = inds.filter(i => i.sectorMismatch);
  const mismatchUsers = mismatchInds.reduce((s, i) => s + i.users, 0);
  const otherServicesInds = inds.filter(i => i.sector === "other-services");
  const otherServicesUsers = otherServicesInds.reduce((s, i) => s + i.users, 0);
  const genericUsers = inds.find(i => i.id === "generic")?.users || 0;

  const sorted = useMemo(() => {
    let f = inds.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    const key = sortBy === "users" ? "users" : sortBy === "aa" ? (i => i.starting.aaTotal) : sortBy === "fundings" ? (i => i.starting.fundings) : "roadmapTasks";
    return [...f].sort((a, b) => (typeof key === "function" ? key(b) - key(a) : b[key] - a[key]));
  }, [sortBy, search, inds]);

  const goDetail = (ind) => { setSelInd(ind); setView("detail"); };
  const nav = (id, label) => (
    <button onClick={() => { setView(id); if (id !== "detail") setSelInd(null); }}
      style={{ padding: "6px 12px", background: view === id ? C.accentDim : "transparent", color: view === id ? C.text : C.muted,
        border: `1px solid ${view === id ? C.accent : C.border}`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: view === id ? 700 : 400, fontFamily: C.sans, whiteSpace: "nowrap" }}>{label}</button>
  );

  // === CONTENT GAP VIEW ===
  const ContentGap = () => {
    const scatter = inds.filter(i => i.id !== "generic").map(i => ({
      ...i, logUsers: Math.log10(Math.max(i.users, 1)),
      aaTotal: i.starting.aaTotal,
    }));

    return (
      <div>
        <Alert color={C.red}>
          <strong>Key finding:</strong> 14 industries ({fmt(mismatchUsers)} users) are assigned to the wrong sector. Content tagged to their correct sector is invisible to them. 10 of 25 sectors are completely unreachable by STARTING users.
        </Alert>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <Stat label="Businesses on Platform" value={fmt(totalBiz)} />
          <Stat label="See Anytime Actions & Fundings" value={fmt(phases.seesAAFunding)} sub={pct(phases.seesAAFunding, totalBiz) + " of total"} color={C.green} />
          <Stat label="In Other Services" value={fmt(otherServicesUsers)} sub={pct(otherServicesUsers, totalBiz) + " — includes " + fmt(genericUsers) + " generic"} color={C.orange} />
          <Stat label="Mismatched Industries" value={mismatchInds.length} sub={fmt(mismatchUsers) + " users affected"} color={C.red} />
          <Stat label="Orphaned Sectors" value={DATA.orphanedSectors.length + " / 25"} sub="Unreachable by STARTING" color={C.red} />
        </div>

        <Section title="Industries by Anytime Actions Visible (Starting Path)" sub="Each dot is an industry. Size = user count. Red = sector mismatch. Click for detail.">
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
            <ResponsiveContainer width="100%" height={340}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="aaTotal" type="number" stroke={C.muted} tick={{ fontSize: 10, fontFamily: C.mono }}
                  label={{ value: "Anytime Actions Visible", position: "bottom", offset: 20, fill: C.muted, fontSize: 11 }} />
                <YAxis dataKey="logUsers" stroke={C.muted} tick={{ fontSize: 10, fontFamily: C.mono }}
                  label={{ value: "Users (log₁₀)", angle: -90, position: "insideLeft", fill: C.muted, fontSize: 11 }}
                  tickFormatter={v => Math.round(Math.pow(10, v)).toLocaleString()} />
                <Tooltip content={({ payload }) => <TT payload={payload} render={d => (
                  <div><div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                    <div>{fmt(d.users)} users · {d.aaTotal} anytime actions · {d.starting?.fundings} fundings</div>
                    <div style={{ marginTop: 4, color: C.muted }}>Sector: {d.sectorName}</div>
                    {d.sectorMismatch && <div style={{ color: C.red, marginTop: 2 }}>Mismatch! Should be: {d.sectorMismatchName}</div>}
                  </div>
                )} />} />
                <Scatter data={scatter} cursor="pointer" onClick={d => goDetail(d)}>
                  {scatter.map((e, i) => (
                    <Cell key={i} fill={e.sectorMismatch ? C.red : e.sector === "other-services" ? C.orange : C.green}
                      fillOpacity={0.8} r={Math.max(4, Math.min(16, Math.sqrt(e.users) / 8))} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6, fontSize: 10, color: C.muted, fontFamily: C.sans }}>
              <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: C.red, marginRight: 3 }} />Sector mismatch</span>
              <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: C.orange, marginRight: 3 }} />Other Services (no mismatch)</span>
              <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: C.green, marginRight: 3 }} />Correctly categorized</span>
            </div>
          </div>
        </Section>

        <Section title="Mismatched Industries" sub="These industries are assigned to the wrong sector. Users miss relevant anytime actions and fundings.">
          <div style={{ display: "grid", gap: 4 }}>
            {mismatchInds.sort((a,b) => b.users - a.users).map(ind => (
              <div key={ind.id} onClick={() => goDetail(ind)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontFamily: C.sans }}
                onMouseEnter={e => e.currentTarget.style.background = C.cardHover} onMouseLeave={e => e.currentTarget.style.background = C.card}>
                <span style={{ flex: 1, color: C.text, fontWeight: 600 }}>{ind.name}</span>
                <span style={{ color: C.accent, fontFamily: C.mono, fontSize: 13 }}>{fmt(ind.users)}</span>
                <span style={{ color: C.muted, fontSize: 10 }}>users</span>
                <span style={{ color: C.red, fontSize: 10 }}>{ind.sectorName}</span>
                <span style={{ color: C.muted }}>→</span>
                <span style={{ color: C.green, fontSize: 10 }}>{ind.sectorMismatchName}</span>
                {ind.ifFixed.missedAA > 0 && <Tag color={C.red}>+{ind.ifFixed.missedAA} AA if fixed</Tag>}
              </div>
            ))}
          </div>
        </Section>
      </div>
    );
  };

  // === SECTOR HEALTH ===
  const SectorHealth = () => {
    const sortedSectors = [...sectors].sort((a,b) => b.xlsxUsers - a.xlsxUsers);
    return (
      <div>
        <Alert color={C.orange}>
          {DATA.orphanedSectors.length} sectors (shown in red) have no industry pointing to them via <code>defaultSectorId</code>. Content tagged exclusively to these sectors is invisible to anyone who started a business through the Navigator.
        </Alert>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
          {sortedSectors.map(s => (
            <div key={s.id} style={{ background: C.card, border: `1px solid ${s.orphaned ? C.red + "66" : C.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.orphaned ? C.red : C.text, fontFamily: C.sans, flex: 1 }}>{s.name}</div>
                {s.orphaned && <Tag color={C.red}>ORPHANED</Tag>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, fontFamily: C.sans }}>
                <div><span style={{ color: C.muted }}>Industries: </span><span style={{ color: C.accent, fontFamily: C.mono }}>{s.industryCount}</span></div>
                <div><span style={{ color: C.muted }}>Users: </span><span style={{ color: C.accent, fontFamily: C.mono }}>{fmt(s.xlsxUsers)}</span></div>
                <div><span style={{ color: C.muted }}>AAs tagged: </span><span style={{ color: C.cyan, fontFamily: C.mono }}>{s.aaTagged}</span></div>
                <div><span style={{ color: C.muted }}>Fundings tagged: </span><span style={{ color: C.green, fontFamily: C.mono }}>{s.fundTagged}</span></div>
              </div>
              {s.missingIndustriesNames.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.orange, marginBottom: 4 }}>Should also include:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {s.missingIndustriesNames.map(n => <Tag key={n} color={C.orange}>{n}</Tag>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === USER JOURNEY ===
  const UserJourney = () => {
    const phaseOrder = [
      { id: "GUEST_MODE", label: "Guest Mode", group: "starting" },
      { id: "GUEST_MODE_WITH_BUSINESS_STRUCTURE", label: "Guest + Structure", group: "starting" },
      { id: "NEEDS_BUSINESS_STRUCTURE", label: "Needs Structure", group: "starting" },
      { id: "NEEDS_TO_FORM", label: "Needs to Form", group: "starting" },
      { id: "FORMED", label: "Formed", group: "starting" },
      { id: "UP_AND_RUNNING", label: "Up & Running", group: "operate" },
      { id: "GUEST_MODE_OWNING", label: "Guest Owning", group: "owning" },
      { id: "UP_AND_RUNNING_OWNING", label: "Up & Running Owning", group: "owning" },
      { id: "REMOTE_SELLER_WORKER", label: "Remote Seller/Worker", group: "other" },
      { id: "DOMESTIC_EMPLOYER", label: "Domestic Employer", group: "other" },
    ];
    const phaseMap = {};
    for (const p of phases.phases) phaseMap[p.phase] = p.count;
    const maxPhase = Math.max(...Object.values(phaseMap));

    const features = {
      GUEST_MODE: { roadmap: true, aa: false, fund: false, cal: "none" },
      GUEST_MODE_WITH_BUSINESS_STRUCTURE: { roadmap: true, aa: false, fund: false, cal: "none" },
      NEEDS_BUSINESS_STRUCTURE: { roadmap: true, aa: false, fund: false, cal: "none" },
      NEEDS_TO_FORM: { roadmap: true, aa: false, fund: false, cal: "none" },
      FORMED: { roadmap: true, aa: false, fund: false, cal: "list" },
      UP_AND_RUNNING: { roadmap: false, aa: true, fund: true, cal: "full" },
      GUEST_MODE_OWNING: { roadmap: false, aa: true, fund: true, cal: "full" },
      UP_AND_RUNNING_OWNING: { roadmap: false, aa: true, fund: true, cal: "full" },
      REMOTE_SELLER_WORKER: { roadmap: true, aa: false, fund: false, cal: "none" },
      DOMESTIC_EMPLOYER: { roadmap: true, aa: false, fund: false, cal: "none" },
    };

    const groupColors = { starting: C.accent, operate: C.green, owning: C.purple, other: C.muted };

    const formedCount = phaseMap["FORMED"] || 0;
    const upRunningCount = phaseMap["UP_AND_RUNNING"] || 0;

    return (
      <div>
        <Alert color={C.orange}>
          <strong>Graduation cliff:</strong> {fmt(formedCount)} users are in FORMED but only {fmt(upRunningCount)} have graduated to UP_AND_RUNNING. That's a {pct(upRunningCount, formedCount)} conversion rate. The operate-side content (anytime actions, fundings, calendar) serves just {pct(phases.seesAAFunding, totalBiz)} of all users.
        </Alert>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <Stat label="Total Businesses" value={fmt(totalBiz)} small />
          <Stat label="See Roadmap Tasks" value={fmt(phases.seesRoadmap)} sub={pct(phases.seesRoadmap, totalBiz)} color={C.accent} small />
          <Stat label="See AA + Fundings" value={fmt(phases.seesAAFunding)} sub={pct(phases.seesAAFunding, totalBiz)} color={C.green} small />
          <Stat label="FORMED → Up&Running" value={pct(upRunningCount, formedCount)} sub={`${fmt(formedCount)} → ${fmt(upRunningCount)}`} color={C.red} small />
        </div>

        <Section title="Operating Phase Distribution" sub="Bar width shows user count. Color indicates which group: Starting path (blue), Operate (green), Owning path (purple), Other (gray).">
          <div style={{ display: "grid", gap: 4 }}>
            {phaseOrder.map(p => {
              const count = phaseMap[p.id] || 0;
              const feat = features[p.id] || {};
              const gc = groupColors[p.group];
              return (
                <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ width: 180, fontSize: 12, fontWeight: 600, color: gc, fontFamily: C.sans }}>{p.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: C.mono, width: 70, textAlign: "right" }}>{fmt(count)}</span>
                    <div style={{ flex: 1, height: 10, background: C.bg, borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ width: `${(count / maxPhase * 100)}%`, height: "100%", background: gc, borderRadius: 5, opacity: 0.7 }} />
                    </div>
                    <span style={{ fontSize: 10, color: C.muted, width: 40, textAlign: "right" }}>{pct(count, totalBiz)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginLeft: 190, fontSize: 9, color: C.muted, fontFamily: C.sans }}>
                    <span style={{ color: feat.roadmap ? C.accent : C.muted, opacity: feat.roadmap ? 1 : 0.3 }}>Roadmap {feat.roadmap ? "✓" : "✗"}</span>
                    <span style={{ color: feat.aa ? C.green : C.muted, opacity: feat.aa ? 1 : 0.3 }}>Anytime Actions {feat.aa ? "✓" : "✗"}</span>
                    <span style={{ color: feat.fund ? C.green : C.muted, opacity: feat.fund ? 1 : 0.3 }}>Fundings {feat.fund ? "✓" : "✗"}</span>
                    <span style={{ color: feat.cal !== "none" ? C.cyan : C.muted, opacity: feat.cal !== "none" ? 1 : 0.3 }}>Calendar: {feat.cal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Where Content Actually Lands">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Stat label="Roadmap content serves" value={fmt(phases.seesRoadmap)} sub="~76% of users" color={C.accent} />
            <Stat label="Operate content serves" value={fmt(phases.seesAAFunding)} sub="~16% of users" color={C.green} />
            <Stat label="Content built but unseen" value="64 AAs + 64 fundings" sub={"Invisible to " + pct(totalBiz - phases.seesAAFunding, totalBiz) + " of users"} color={C.red} />
          </div>
        </Section>
      </div>
    );
  };

  // === INDUSTRIES LIST ===
  const Industries = () => (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search industries..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "6px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, flex: 1, minWidth: 180, outline: "none", fontFamily: C.sans }} />
        {[["users","Users"],["aa","Anytime Actions"],["fundings","Fundings"],["roadmapTasks","Roadmap Tasks"]].map(([k,l]) => (
          <button key={k} onClick={() => setSortBy(k)} style={{ padding: "4px 10px", background: sortBy===k ? C.accentDim : "transparent",
            color: sortBy===k ? C.text : C.muted, border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", fontSize: 10, fontFamily: C.sans }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 3 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 60px 60px 90px", gap: 8, padding: "4px 14px", fontSize: 9, color: C.muted, fontFamily: C.sans }}>
          <span>Industry</span><span style={{textAlign:"right"}}>Users</span><span style={{textAlign:"right"}}>Tasks</span><span style={{textAlign:"right"}}>AAs</span><span style={{textAlign:"right"}}>Funds</span><span>Sector</span>
        </div>
        {sorted.map(ind => (
          <div key={ind.id} onClick={() => goDetail(ind)}
            style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 60px 60px 90px", gap: 8, background: C.card, border: `1px solid ${ind.sectorMismatch ? C.red + "44" : C.border}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer", alignItems: "center", fontSize: 12, fontFamily: C.sans }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover} onMouseLeave={e => e.currentTarget.style.background = C.card}>
            <div>
              <span style={{ color: C.text, fontWeight: 600 }}>{ind.name}</span>
              {ind.sectorMismatch && <span style={{ color: C.red, fontSize: 9, marginLeft: 6 }}>⚠ mismatch</span>}
            </div>
            <span style={{ textAlign: "right", color: C.accent, fontFamily: C.mono }}>{fmt(ind.users)}</span>
            <span style={{ textAlign: "right", color: C.muted, fontFamily: C.mono }}>{ind.roadmapTasks}</span>
            <span style={{ textAlign: "right", color: C.cyan, fontFamily: C.mono }}>{ind.starting.aaTotal}</span>
            <span style={{ textAlign: "right", color: C.green, fontFamily: C.mono }}>{ind.starting.fundings}</span>
            <span style={{ fontSize: 9, color: ind.sectorMismatch ? C.red : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ind.sectorName}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // === DETAIL VIEW ===
  const Detail = () => {
    if (!selInd) return <div style={{ color: C.muted, textAlign: "center", padding: 40, fontFamily: C.sans }}>Select an industry from another tab to see its full content breakdown.</div>;
    const ind = selInd;
    const s = ind.starting;
    const o = ind.owning;
    const fix = ind.ifFixed;

    const startingOnlyAA = s.aaNamesByIndustry.filter(n => !o.aaNamesBySector.includes(n));
    const owningOnlyAA = o.aaNamesBySector.filter(n => !s.aaNamesByIndustry.includes(n) && !s.aaNamesBySector.includes(n));

    return (
      <div>
        <button onClick={() => setView("industries")} style={{ background: "transparent", border: "none", color: C.accent, cursor: "pointer", fontSize: 12, padding: 0, fontFamily: C.sans, marginBottom: 12 }}>← Back to Industries</button>
        <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: C.sans }}>{ind.name}</h2>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, fontFamily: C.sans }}>
          Sector: <span style={{ color: ind.sectorMismatch ? C.red : C.text }}>{ind.sectorName}</span>
          {ind.sectorMismatch && <span> → Suggested: <span style={{ color: C.green }}>{ind.sectorMismatchName}</span></span>}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <Stat label="Users" value={fmt(ind.users)} />
          <Stat label="Roadmap Tasks" value={ind.roadmapTasks} color={C.accent} />
          <Stat label="Non-Essential Qs" value={ind.nonEssentialQs} color={C.muted} />
        </div>

        {ind.sectorMismatch && (
          <Alert color={C.red}>
            <strong>Sector mismatch:</strong> This industry is assigned to "{ind.sectorName}" but content authors tag related content to "{ind.sectorMismatchName}."
            {fix.missedAA > 0 && <span> Fixing the sector would surface <strong>{fix.missedAA} additional anytime actions</strong>.</span>}
            {fix.missedFund !== 0 && <span> Funding count would change by <strong>{fix.missedFund > 0 ? "+" : ""}{fix.missedFund}</strong>.</span>}
          </Alert>
        )}

        <Section title="Starting vs. Owning: Side-by-Side">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: C.card, border: `1px solid ${C.accent}33`, borderRadius: 10, padding: 16 }}>
              <h4 style={{ color: C.accent, fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: C.sans }}>Starting Path</h4>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontFamily: C.sans }}>Industry: <span style={{ color: C.text }}>{ind.id}</span> · Sector: <span style={{ color: ind.sectorMismatch ? C.red : C.text }}>{ind.sectorName}</span></div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Stat label="Anytime Actions" value={s.aaTotal} color={C.cyan} small />
                <Stat label="Fundings" value={s.fundings} color={C.green} small />
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: C.sans }}>
                <div>By industryId: <span style={{ color: C.green }}>{s.aaByIndustry}</span> · By sectorId: <span style={{ color: C.cyan }}>{s.aaBySector}</span> · Universal: <span style={{ color: C.muted }}>{s.aaUniversal}</span></div>
              </div>
              {s.aaNamesByIndustry.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: C.green, marginBottom: 3 }}>Matched by industryId:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{s.aaNamesByIndustry.map(n => <Tag key={n} color={C.green}>{n}</Tag>)}</div>
                </div>
              )}
              {s.aaNamesBySector.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 10, color: C.cyan, marginBottom: 3 }}>Matched by sectorId:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{s.aaNamesBySector.map(n => <Tag key={n} color={C.cyan}>{n}</Tag>)}</div>
                </div>
              )}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.purple}33`, borderRadius: 10, padding: 16 }}>
              <h4 style={{ color: C.purple, fontSize: 13, fontWeight: 700, marginBottom: 8, fontFamily: C.sans }}>Owning Path</h4>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontFamily: C.sans }}>Industry: <span style={{ color: C.muted }}>none</span> · Sector: <span style={{ color: C.text }}>{o.sectorName}</span></div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Stat label="Anytime Actions" value={o.aaTotal} color={C.cyan} small />
                <Stat label="Fundings" value={o.fundings} color={C.green} small />
              </div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: C.sans }}>
                <div>By sectorId: <span style={{ color: C.cyan }}>{o.aaBySector}</span> · Universal: <span style={{ color: C.muted }}>{o.aaUniversal}</span></div>
              </div>
              {o.aaNamesBySector.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, color: C.cyan, marginBottom: 3 }}>Matched by sectorId:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{o.aaNamesBySector.map(n => <Tag key={n} color={C.cyan}>{n}</Tag>)}</div>
                </div>
              )}
            </div>
          </div>
        </Section>

        {(startingOnlyAA.length > 0 || owningOnlyAA.length > 0) && (
          <Section title="Content Gaps Between Paths" sub="Actions that only one path sees.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.accent, marginBottom: 4, fontFamily: C.sans }}>Only STARTING sees ({startingOnlyAA.length}):</div>
                {startingOnlyAA.length > 0
                  ? <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{startingOnlyAA.map(n => <Tag key={n} color={C.accent}>{n}</Tag>)}</div>
                  : <div style={{ fontSize: 10, color: C.muted }}>None</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.purple, marginBottom: 4, fontFamily: C.sans }}>Only OWNING sees ({owningOnlyAA.length}):</div>
                {owningOnlyAA.length > 0
                  ? <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>{owningOnlyAA.map(n => <Tag key={n} color={C.purple}>{n}</Tag>)}</div>
                  : <div style={{ fontSize: 10, color: C.muted }}>None</div>}
              </div>
            </div>
          </Section>
        )}
      </div>
    );
  };

  // === TASK ENGAGEMENT ===
  const TaskEngagement = () => {
    const top30 = tp.slice(0, 30);
    const topTotal = tp[0]?.total || 1;
    return (
      <div>
        <Alert color={C.orange}>
          The top 5 tasks account for the vast majority of all engagement. After "Register for State Taxes," there is a steep drop-off. Industry-specific tasks are in the single digits to low hundreds.
        </Alert>
        <div style={{ display: "grid", gap: 3 }}>
          {top30.map((t, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 24, fontSize: 10, color: C.muted, fontFamily: C.mono, textAlign: "right" }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: C.text, fontFamily: C.sans, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.task}</div>
              </div>
              <div style={{ width: 140, height: 8, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(t.total / topTotal * 100)}%`, height: "100%", background: C.accent, borderRadius: 4, opacity: 0.6 }} />
              </div>
              <span style={{ width: 70, textAlign: "right", fontFamily: C.mono, fontSize: 12, color: C.accent }}>{fmt(t.total)}</span>
              <span style={{ width: 60, textAlign: "right", fontFamily: C.mono, fontSize: 10, color: C.green }}>{fmt(t.completed)}</span>
              <span style={{ width: 40, textAlign: "right", fontSize: 9, color: C.muted }}>{t.avgTime}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === PROFILE QUESTIONS ===
  const ProfileQuestions = () => {
    const neq = DATA.nonEssentialQuestions;
    return (
      <div>
        <Alert color={C.muted}>
          Most non-essential questions go unanswered (97%+ unknown). Only Home-Based Business gets meaningful engagement. These questions drive add-ons and anytime action personalization but affect a tiny fraction of users.
        </Alert>
        <div style={{ display: "grid", gap: 3 }}>
          {neq.map((q, i) => {
            const total = q.yes + q.no + q.unknown;
            const yesPct = total > 0 ? (q.yes / total * 100) : 0;
            const noPct = total > 0 ? (q.no / total * 100) : 0;
            return (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 12, color: C.text, fontFamily: C.sans }}>{q.question}</span>
                <div style={{ width: 120, height: 8, background: C.bg, borderRadius: 4, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${yesPct}%`, height: "100%", background: C.green }} />
                  <div style={{ width: `${noPct}%`, height: "100%", background: C.red, opacity: 0.5 }} />
                </div>
                <span style={{ width: 60, textAlign: "right", fontFamily: C.mono, fontSize: 11, color: C.green }}>{fmt(q.yes)}</span>
                <span style={{ width: 60, textAlign: "right", fontFamily: C.mono, fontSize: 11, color: C.red }}>{fmt(q.no)}</span>
                <span style={{ width: 60, textAlign: "right", fontFamily: C.mono, fontSize: 9, color: C.muted }}>{fmt(q.unknown)} unk</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // === MAIN RENDER ===
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: C.sans }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.text }}>BizX Content Explorer</h1>
          <span style={{ fontSize: 11, color: C.muted }}>Business.NJ.gov Content & User Analysis</span>
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 14 }}>
          Source: {DATA.meta.xlsxFile} · {fmt(DATA.meta.totalBusinesses)} businesses · {DATA.industries.length} industries · {DATA.anytimeActions.length} anytime actions · {DATA.sectors.length} sectors
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {nav("contentgap", "Content Gap")}
          {nav("sectorhealth", "Sector Health")}
          {nav("journey", "User Journey")}
          {nav("industries", "Industries")}
          {nav("detail", "Detail")}
          {nav("tasks", "Task Engagement")}
          {nav("profile", "Profile Questions")}
        </div>

        {view === "contentgap" && <ContentGap />}
        {view === "sectorhealth" && <SectorHealth />}
        {view === "journey" && <UserJourney />}
        {view === "industries" && <Industries />}
        {view === "detail" && <Detail />}
        {view === "tasks" && <TaskEngagement />}
        {view === "profile" && <ProfileQuestions />}
      </div>
    </div>
  );
}
