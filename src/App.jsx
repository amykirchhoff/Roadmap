import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, CartesianGrid } from "recharts";
import DATA from "./data.json";

/* ── design tokens ───────────────────────────────────────── */
const C = {
  bg:"#0d1117",card:"#161b22",cardHover:"#1c2333",border:"#30363d",
  text:"#e6edf3",muted:"#8b949e",accent:"#58a6ff",accentDim:"#1f6feb",
  red:"#f85149",orange:"#d29922",green:"#3fb950",purple:"#bc8cff",
  pink:"#f778ba",cyan:"#39d5ff",
  mono:"'JetBrains Mono',monospace",sans:"'DM Sans',system-ui,sans-serif",
};
const fmt = n => typeof n==="number" ? n.toLocaleString() : n;
const pct = (n,d) => d>0 ? `${(n/d*100).toFixed(1)}%` : "0%";
const taskFmt = t => (t||"").replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());

/* ── shared components ───────────────────────────────────── */
const Stat = ({label,value,sub,color,small}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:small?"10px 14px":"14px 18px",flex:1,minWidth:small?100:140}}>
    <div style={{fontSize:small?18:26,fontWeight:800,color:color||C.accent,fontFamily:C.mono}}>{value}</div>
    <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:C.sans}}>{label}</div>
    {sub && <div style={{fontSize:10,color:C.muted,marginTop:2,opacity:.7}}>{typeof sub==="string"?sub.split("\n").map((line,i)=><span key={i}>{i>0&&<br/>}{line}</span>):sub}</div>}
  </div>
);
const Alert = ({children,color}) => (
  <div style={{background:`${color}11`,border:`1px solid ${color}33`,borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:12,color,fontFamily:C.sans,lineHeight:1.6}}>{children}</div>
);
const Tag = ({children,color,onClick}) => (
  <span onClick={onClick} style={{background:`${color}18`,color,padding:"3px 8px",borderRadius:4,fontSize:10,border:`1px solid ${color}33`,cursor:onClick?"pointer":"default",fontFamily:C.sans,display:"inline-block",margin:1}}>{children}</span>
);
const Sec = ({title,sub,children}) => (
  <div style={{marginBottom:24}}>
    <h3 style={{color:C.text,fontSize:15,fontWeight:700,marginBottom:2,fontFamily:C.sans}}>{title}</h3>
    {sub && <p style={{color:C.muted,fontSize:11,margin:"0 0 10px",fontFamily:C.sans,lineHeight:1.5}}>{sub}</p>}
    {children}
  </div>
);
const Insight = ({children}) => (
  <div style={{background:`${C.purple}09`,borderLeft:`3px solid ${C.purple}66`,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.text,fontFamily:C.sans,lineHeight:1.6}}>{children}</div>
);
const SrcLegend = ({items}) => <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12,fontSize:9,color:C.muted,fontFamily:C.sans,padding:"6px 10px",background:`${C.muted}08`,borderRadius:6,border:`1px solid ${C.border}`}}>
  <span style={{fontWeight:600}}>Data sources:</span>
  {items.map((it,i)=><span key={i}><span style={{background:`${C.muted}15`,color:C.muted,padding:"1px 4px",borderRadius:3,fontSize:7,fontFamily:C.mono,marginRight:4,letterSpacing:0.3}}>{it[0]}</span>{it[1]}</span>)}
</div>;

/* ── main app ────────────────────────────────────────────── */
export default function App() {
  const [view,setView] = useState("contentgap");
  const [selInd,setSelInd] = useState(null);
  const [selTask,setSelTask] = useState(null);
  const [sortBy,setSortBy] = useState("users");
  const [search,setSearch] = useState("");
  const [taskSort,setTaskSort] = useState("total");
  const [pFilter,setPFilter] = useState("all");
  const [pDept,setPDept] = useState("all");
  const [finderSearch,setFinderSearch] = useState("");
  const [selItem,setSelItem] = useState(null);
  const [finderType,setFinderType] = useState("all");
  const [finderOpen,setFinderOpen] = useState(false);
  const [expandedQ,setExpandedQ] = useState(null);

  const inds = DATA.industries;
  const sectors = DATA.sectors;
  const phases = DATA.phases;
  const tp = DATA.taskProgress;
  const tf = DATA.taskFrequency;
  const neq = DATA.nonEssentialQuestions;

  const totalBiz = phases.totalBusinesses;
  const mismatchInds = inds.filter(i=>i.sectorMismatch);
  const mismatchUsers = mismatchInds.reduce((s,i)=>s+i.users,0);
  const otherServicesUsers = inds.filter(i=>i.sector==="other-services").reduce((s,i)=>s+i.users,0);
  const genericUsers = inds.find(i=>i.id==="generic")?.users||0;

  const tasksByFreq = useMemo(()=>Object.entries(tf).map(([n,info])=>({name:n,count:info.count,industries:info.industries})).sort((a,b)=>b.count-a.count),[tf]);
  const uniqueOnly = tasksByFreq.filter(t=>t.count===1);

  const diffStats = useMemo(()=>{
    const zeroDiff=inds.filter(i=>i.totalDiffTasks===0);
    const noUnique=inds.filter(i=>i.totalDiffTasks>0&&i.uniqueTasks===0);
    const hasUnique=inds.filter(i=>i.uniqueTasks>0);
    return {zeroDiff,noUnique,hasUnique,zeroDiffUsers:zeroDiff.reduce((s,i)=>s+i.users,0),noUniqueUsers:noUnique.reduce((s,i)=>s+i.users,0)};
  },[inds]);

  const sorted = useMemo(()=>{
    let f=inds.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()));
    return [...f].sort((a,b)=>{
      if(sortBy==="aa") return b.starting.aaTotal-a.starting.aaTotal;
      if(sortBy==="fundings") return b.starting.fundings-a.starting.fundings;
      const key = {users:"users",roadmapTasks:"roadmapTasks",diff:"totalDiffTasks",unique:"uniqueTasks"}[sortBy]||"users";
      return b[key]-a[key];
    });
  },[sortBy,search,inds]);

  const goDetail = i=>{setSelInd(i);setView("detail");};
  const nav = (id,label)=>(
    <button onClick={()=>{setView(id);if(id!=="detail"){setSelInd(null);setSelTask(null);}}}
      style={{padding:"6px 12px",background:view===id?C.accentDim:"transparent",color:view===id?C.text:C.muted,
        border:`1px solid ${view===id?C.accent:C.border}`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:view===id?700:400,fontFamily:C.sans,whiteSpace:"nowrap"}}>{label}</button>
  );

  /* ═══ TAB: CONTENT GAP ═══ */
  const ContentGap = () => {
    const scatter = inds.filter(i=>i.id!=="generic").map(i=>({...i,logUsers:Math.log10(Math.max(i.users,1)),aaTotal:i.starting.aaTotal}));
    return (<div>
      <Alert color={C.red}><strong>14 industries</strong> serving <strong>{fmt(mismatchUsers)} users</strong> are assigned to the wrong sector. Content tagged to their correct sector — including anytime actions for vehicle registration, CDL, IFTA, and IRP — is invisible to them. Separately, <strong>10 of 25 sectors</strong> are completely unreachable by STARTING users.</Alert>
      <SrcLegend items={[["XLSX","User counts, industry assignments, sector assignments from analytics"],["NAV","Industry definitions, sector mappings, AA/funding reach from codebase"],["PLUR","Permit inventory from Plurmits spreadsheet"]]} />
      <Insight><strong>Why this matters:</strong> The content team has built 64 anytime actions and 64 fundings, but this content only reaches users in the "operate" phases — about <strong>{fmt(phases.seesAAFunding)}</strong> users, or <strong>{pct(phases.seesAAFunding,totalBiz)}</strong> of the total base. Of those who <em>do</em> see it, the sector mismatch means {fmt(mismatchUsers)} are getting results filtered against the wrong sector. They see generic "Other Services" content instead of industry-relevant actions like IFTA registration and CDL requirements.</Insight>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Stat label="Businesses on Platform" value={fmt(totalBiz)} sub="All business accounts in the system" />
        <Stat label="Businesses That See Operate Content" value={fmt(phases.seesAAFunding)} sub={"Only "+pct(phases.seesAAFunding,totalBiz)+" of businesses are in a phase where anytime actions and fundings are displayed"} color={C.green} />
        <Stat label="Businesses in the 'Other Services' Sector" value={fmt(otherServicesUsers)} sub={pct(otherServicesUsers,totalBiz)+" of all businesses are assigned to this catch-all sector, including "+fmt(genericUsers)+" who picked 'All Other Businesses' as their industry"} color={C.orange} />
        <Stat label="Industries With Wrong Sector" value={mismatchInds.length} sub={fmt(mismatchUsers)+" businesses in these industries are matched against the wrong sector for content filtering"} color={C.red} />
        <Stat label="Orphaned Sectors" value={DATA.orphanedSectors.length+" / 25"} sub="These sectors exist in the taxonomy but no industry's defaultSectorId points to them — only OWNING users can reach them" color={C.red} />
        {DATA.permitCoverage&&<Stat label="State Permits Covered" value={fmt(DATA.permitCoverage.coverage.bizApplicable - DATA.permitCoverage.coverage.bizNone)+" / "+fmt(DATA.permitCoverage.coverage.bizApplicable)} sub={fmt(DATA.permitCoverage.coverage.bizNone)+" business permits have no presence in the Navigator. "+DATA.permitCoverage.plurmits.filter(p=>p.api).length+" have live API connections."} color={C.purple} />}
      </div>
      <Sec title="Industries by Anytime Actions Visible (Starting Path)" sub="Each dot is an industry. Horizontal = number of anytime actions a STARTING user in that industry would see. Vertical = user count. Red = sector mismatch. Orange = Other Services. Green = correct sector. Click any dot.">
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{top:10,right:20,bottom:40,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="aaTotal" type="number" stroke={C.muted} tick={{fontSize:10,fontFamily:C.mono}} label={{value:"Anytime Actions Visible",position:"bottom",offset:20,fill:C.muted,fontSize:11}} />
              <YAxis dataKey="logUsers" stroke={C.muted} tick={{fontSize:10,fontFamily:C.mono}} label={{value:"Users (log₁₀)",angle:-90,position:"insideLeft",fill:C.muted,fontSize:11}} tickFormatter={v=>Math.round(Math.pow(10,v)).toLocaleString()} />
              <Tooltip content={({payload})=>{if(!payload?.[0])return null;const d=payload[0].payload;return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:10,fontSize:11,color:C.text,fontFamily:C.sans,maxWidth:280}}><div style={{fontWeight:700,marginBottom:4}}>{d.name}</div><div>{fmt(d.users)} users · {d.aaTotal} AAs · {d.starting?.fundings} fundings</div><div style={{color:C.muted,marginTop:4}}>Sector: {d.sectorName}</div>{d.sectorMismatch&&<div style={{color:C.red,marginTop:2}}>Should be: {d.sectorMismatchName}</div>}</div>;}} />
              <Scatter data={scatter} cursor="pointer" onClick={d=>goDetail(d)}>{scatter.map((e,i)=><Cell key={i} fill={e.sectorMismatch?C.red:e.sector==="other-services"?C.orange:C.green} fillOpacity={.8} r={Math.max(4,Math.min(16,Math.sqrt(e.users)/8))} />)}</Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:6,fontSize:10,color:C.muted,fontFamily:C.sans}}>
            <span><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:C.red,marginRight:3}}/>Sector mismatch</span>
            <span><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:C.orange,marginRight:3}}/>Other Services</span>
            <span><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:C.green,marginRight:3}}/>Correct sector</span>
          </div>
        </div>
      </Sec>
      <Sec title="Mismatched Industries" sub="Sorted by user count. The tag shows how many anytime actions are currently invisible to these users due to the mismatch.">
        <div style={{display:"grid",gap:4}}>{mismatchInds.sort((a,b)=>b.users-a.users).map(ind=>(
          <div key={ind.id} onClick={()=>goDetail(ind)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:12,fontFamily:C.sans}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
            <span style={{flex:1,color:C.text,fontWeight:600}}>{ind.name}</span>
            <span style={{color:C.accent,fontFamily:C.mono,fontSize:13}}>{fmt(ind.users)}</span>
            <span style={{color:C.red,fontSize:10}}>{ind.sectorName}</span><span style={{color:C.muted}}>→</span><span style={{color:C.green,fontSize:10}}>{ind.sectorMismatchName}</span>
            {ind.ifFixed.missedAA>0&&<Tag color={C.red}>{ind.ifFixed.missedAA} AA missing</Tag>}
          </div>
        ))}</div>
      </Sec>

      {DATA.unknowns && <Sec title="Unknown Populations" sub="These users exist in the analytics data but are excluded from the analysis above because they have missing or unresolvable profile attributes.">
        <Insight>
          <strong>{fmt(DATA.unknowns.industry)} businesses</strong> ({pct(DATA.unknowns.industry, totalBiz + DATA.unknowns.phase)}) have no industry set — they likely abandoned onboarding before selecting one. <strong>{fmt(DATA.unknowns.legalStructure)}</strong> ({pct(DATA.unknowns.legalStructure, totalBiz + DATA.unknowns.phase)}) have no legal structure — primarily guest mode users who never completed that step. <strong>{fmt(DATA.unknowns.sector)}</strong> have no sector assignment, which largely overlaps the unknown-industry population.
          {DATA.unknowns.unmatchedIndustries.length > 0 && <span> Additionally, <strong>{DATA.unknowns.unmatchedIndustries.reduce((s,i)=>s+i.users,0)} users</strong> selected industries that exist in the analytics but not in the current navigator codebase ({DATA.unknowns.unmatchedIndustries.map(i => i.name + " (" + i.users + ")").join(", ")}) — these are likely disabled or renamed industries whose users remain in the system.</span>}
        </Insight>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Stat label="Unknown Industry" value={fmt(DATA.unknowns.industry)} sub="No industry selected — not included in any industry-level analysis" color={C.orange} small />
          <Stat label="Unknown Legal Structure" value={fmt(DATA.unknowns.legalStructure)} sub="No business structure chosen — mostly guest mode users" color={C.orange} small />
          <Stat label="Unknown Sector" value={fmt(DATA.unknowns.sector)} sub="No sector assigned — largely overlaps the unknown-industry population" color={C.orange} small />
          <Stat label="Unmatched Industries" value={DATA.unknowns.unmatchedIndustries.reduce((s,i)=>s+i.users,0)} sub={"Users in "+DATA.unknowns.unmatchedIndustries.length+" disabled/renamed industries not in current codebase"} color={C.muted} small />
        </div>
      </Sec>}
    </div>);
  };

  /* ═══ TAB: ROADMAP ANALYSIS (from original) ═══ */
  const RoadmapAnalysis = () => {
    const scatter = inds.filter(i=>i.name!=="All Other Businesses").map(i=>({...i,logUsers:Math.log10(Math.max(i.users,1))}));
    const oneTasks = inds.filter(i=>i.totalDiffTasks===1).sort((a,b)=>b.users-a.users);
    return (<div>
      <Alert color={C.orange}>7 universal tasks excluded (business plan, structure, NAICS, EIN, taxes, bank account, vehicles). Showing only the tasks that differentiate one industry's roadmap from another.</Alert>
      <SrcLegend items={[["NAV","Task definitions and industry roadmaps from codebase"],["XLSX","Status changes and user counts from analytics"]]} />
      <Insight>
        <strong>Key findings:</strong><br/>
        <strong>No middle layer.</strong> Of {DATA.totalDiffTasks} differentiating tasks, {uniqueOnly.length} appear in only one roadmap. Tasks are either universal (shared by all) or bespoke (built for a single industry). Only {DATA.totalDiffTasks - uniqueOnly.length} tasks sit in between.<br/>
        <strong>23 industries have zero unique content.</strong> Their roadmaps are assembled entirely from tasks shared with other industries — there is nothing a user sees that they wouldn't also see in a different industry.<br/>
        <strong>The top 10 tasks account for {pct(tp.slice(0,10).reduce((s,t)=>s+t.total,0), tp.reduce((s,t)=>s+t.total,0))} of all status changes (XLSX).</strong> Across all {tp.length} tracked tasks (7 universal + {DATA.totalDiffTasks} differentiating + ~{tp.length - 7 - DATA.totalDiffTasks} add-ons and legacy), the bottom half ({Math.floor(tp.length/2)}) account for {pct(tp.slice(Math.floor(tp.length/2)).reduce((s,t)=>s+t.total,0), tp.reduce((s,t)=>s+t.total,0))}. {tp.filter(t=>t.total<10).length} tasks have fewer than 10 status changes ever, and {tp.filter(t=>t.total<100).length} have fewer than 100.<br/>
        <strong>97% drop-off by task #10.</strong> "Select Your Business Structure" has {fmt(tp[0]?.total)} status changes (XLSX); by the 10th-ranked task, that drops to {fmt(tp[9]?.total)} — before most users ever reach the differentiating content.<br/>
        <strong>{fmt(DATA.totalDistinctPaths||0)} distinct roadmaps.</strong> Factoring in industry × legal structure × non-essential questions × home-based status, the system can produce {fmt(DATA.totalDistinctPaths||0)} unique task-set combinations. Healthcare alone accounts for 512 variants. The simplest industries still produce 4-8 variants each.
      </Insight>
      <Insight><strong>The differentiation problem:</strong> {diffStats.zeroDiff.length} industries have <strong>zero differentiating tasks</strong> (Courier Service and Remediation &amp; Waste) — their {fmt(diffStats.zeroDiffUsers)} users get an identical-to-generic roadmap. Another {diffStats.noUnique.length} industries have tasks but <strong>none unique to them</strong> — including some of the largest: Online Business (21K users), Real Estate Investing (13K), Management Consulting (7K), and Cleaning &amp; Janitorial (6K). Only {diffStats.hasUnique.length} industries have truly unique content, led by Retail, Home Improvement Contractor, Healthcare, and Trucking. Meanwhile, {uniqueOnly.length} of {DATA.totalDiffTasks} differentiating tasks appear in just one industry — purpose-built content like the Food Truck License, Cosmetology Shop License, and Trucking USDOT registration that serves a single audience.</Insight>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Stat label="Industry Roadmaps" value={inds.length} sub="Total enabled industries with a roadmap definition" />
        <Stat label="Differentiating Tasks" value={DATA.totalDiffTasks} sub="Industry-specific tasks remaining after removing 7 universal tasks every industry shares" />
        <Stat label="Single-Industry Tasks" value={uniqueOnly.length} sub={pct(uniqueOnly.length,DATA.totalDiffTasks)+" of differentiating tasks appear in only one industry's roadmap"} color={C.red} />
        <Stat label="Distinct Roadmaps" value={fmt(DATA.totalDistinctPaths||0)} sub="Unique task-set combinations the system can produce across all industries, legal structures, and profile questions" color={C.purple} />
      </div>

      <Sec title="Distinct Roadmap Paths by Industry" sub="Each industry produces multiple roadmap variants depending on legal structure, non-essential questions, and home-based status. The number shown is how many unique task sets that industry can produce.">
        {(()=>{const byPaths=[...inds].filter(i=>i.distinctPaths>0).sort((a,b)=>b.distinctPaths-a.distinctPaths);const maxPaths=byPaths[0]?.distinctPaths||1;return(
          <div style={{display:"grid",gap:3}}>
            {byPaths.slice(0,20).map((ind,i)=>(
              <div key={ind.id} onClick={()=>goDetail(ind)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:12}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
                <span style={{width:22,fontSize:10,color:C.muted,fontFamily:C.mono,textAlign:"right"}}>{i+1}</span>
                <span style={{flex:1,color:C.text,fontWeight:500}}>{ind.name}</span>
                <span style={{color:C.purple,fontFamily:C.mono,fontWeight:700}}>{fmt(ind.distinctPaths)}</span>
                <span style={{fontSize:10,color:C.muted}}>paths</span>
                <div style={{width:100,height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}><div style={{width:`${Math.log2(ind.distinctPaths)/Math.log2(maxPaths)*100}%`,height:"100%",background:C.purple,borderRadius:4,opacity:.6}}/></div>
                <span style={{fontSize:10,color:C.muted}}>{ind.nonEssentialQs} NEQs</span>
              </div>
            ))}
            {byPaths.length>20&&<div style={{fontSize:10,color:C.muted,padding:"4px 14px"}}>+ {byPaths.length-20} more industries (minimum {byPaths[byPaths.length-1]?.distinctPaths} paths each)</div>}
          </div>
        );})()}
      </Sec>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        <Stat label="Industries w/ Zero Diff. Tasks" value={diffStats.zeroDiff.length} sub={fmt(diffStats.zeroDiffUsers)+" businesses see a roadmap identical to the generic baseline"} color={C.red} />
        <Stat label="Industries w/ Shared Tasks Only" value={diffStats.noUnique.length} sub={fmt(diffStats.noUniqueUsers)+" businesses — every task in their roadmap also appears in other industries"} color={C.orange} />
        <Stat label="Industries w/ Unique Tasks" value={diffStats.hasUnique.length} sub="These industries have at least one task no other industry includes" color={C.green} />
      </div>
      <Sec title="Users vs. Differentiating Tasks" sub="Each dot is one industry. Color = degree of uniqueness. Click for details.">
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{top:10,right:20,bottom:40,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="totalDiffTasks" type="number" stroke={C.muted} tick={{fontSize:10,fontFamily:C.mono}} label={{value:"Differentiating Tasks",position:"bottom",offset:20,fill:C.muted,fontSize:11}} />
              <YAxis dataKey="logUsers" stroke={C.muted} tick={{fontSize:10,fontFamily:C.mono}} label={{value:"Users (log₁₀)",angle:-90,position:"insideLeft",fill:C.muted,fontSize:11}} tickFormatter={v=>Math.round(Math.pow(10,v)).toLocaleString()} />
              <Tooltip content={({payload})=>{if(!payload?.[0])return null;const d=payload[0].payload;return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:10,fontSize:11,color:C.text,fontFamily:C.sans}}><div style={{fontWeight:700,marginBottom:4}}>{d.name}</div><div>{fmt(d.users)} users · {d.totalDiffTasks} diff ({d.uniqueTasks} unique, {d.sharedTasks} shared)</div></div>;}} />
              <Scatter data={scatter} cursor="pointer" onClick={d=>goDetail(d)}>{scatter.map((e,i)=><Cell key={i} fill={e.totalDiffTasks===0?C.red:e.uniqueTasks===0?C.orange:e.uniqueTasks>=4?C.purple:C.green} fillOpacity={.8} r={Math.max(4,Math.min(14,e.users/1200))} />)}</Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:6,fontSize:10,color:C.muted}}>
            {[["0 diff.",C.red],["Shared only",C.orange],["1-3 unique",C.green],["4+ unique",C.purple]].map(([l,c])=><span key={l}><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:c,marginRight:3}}/>{l}</span>)}
          </div>
        </div>
      </Sec>
      {oneTasks.length>0&&<Sec title="One-Task Roadmaps" sub="The only differentiator is a single task. Barely different from generic.">
        <div style={{display:"grid",gap:4}}>{oneTasks.map(ind=>(
          <div key={ind.id} onClick={()=>goDetail(ind)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:12}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
            <span style={{flex:1,color:C.text,fontWeight:500}}>{ind.name}</span>
            <span style={{color:C.accent,fontFamily:C.mono}}>{fmt(ind.users)}</span><span style={{color:C.muted}}>→</span><span style={{color:C.orange,fontSize:11}}>{taskFmt(ind.allDiffTasks[0])}</span>
          </div>
        ))}</div>
      </Sec>}
    </div>);
  };

  /* ═══ TAB: SECTOR HEALTH ═══ */
  const SectorHealth = () => (<div>
    <Alert color={C.orange}>{DATA.orphanedSectors.length} sectors (red border) have no industry pointing to them. Content tagged exclusively to these sectors is invisible to anyone who started a business through the Navigator. They are only reachable by OWNING users who self-select during onboarding.</Alert>
    <Insight><strong>The two-taxonomy problem:</strong> The system has 25 sectors and 64 industries operating as independent taxonomies connected only by <code style={{background:`${C.purple}22`,padding:"1px 4px",borderRadius:3}}>defaultSectorId</code>. Content authors tag content to sectors, but users get their sector assigned silently when they pick an industry. There's no build-time validation that the tags align. Content authors think "trucking is transportation" but the code says "trucking is other-services."</Insight>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
      {[...sectors].sort((a,b)=>b.xlsxUsers-a.xlsxUsers).map(sec=>(
        <div key={sec.id} style={{background:C.card,border:`1px solid ${sec.orphaned?C.red+"66":C.border}`,borderRadius:8,padding:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,color:sec.orphaned?C.red:C.text,fontFamily:C.sans,flex:1}}>{sec.name}</div>
            {sec.orphaned&&<Tag color={C.red}>ORPHANED</Tag>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11,fontFamily:C.sans}}>
            <div><span style={{color:C.muted}}>Industries: </span><span style={{color:C.accent,fontFamily:C.mono}}>{sec.industryCount}</span></div>
            <div><span style={{color:C.muted}}>Users: </span><span style={{color:C.accent,fontFamily:C.mono}}>{fmt(sec.xlsxUsers)}</span></div>
            <div><span style={{color:C.muted}}>AAs tagged: </span><span style={{color:C.cyan,fontFamily:C.mono}}>{sec.aaTagged}</span></div>
            <div><span style={{color:C.muted}}>Fundings: </span><span style={{color:C.green,fontFamily:C.mono}}>{sec.fundTagged}</span></div>
          </div>
          {sec.missingIndustriesNames.length>0&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,color:C.orange,marginBottom:4}}>Should also include:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{sec.missingIndustriesNames.map(n=><Tag key={n} color={C.orange}>{n}</Tag>)}</div>
          </div>}
        </div>
      ))}
    </div>
  </div>);

  /* ═══ TAB: USER JOURNEY ═══ */
  const UserJourney = () => {
    const po=[{id:"GUEST_MODE",label:"Guest Mode",g:"s"},{id:"GUEST_MODE_WITH_BUSINESS_STRUCTURE",label:"Guest + Structure",g:"s"},{id:"NEEDS_BUSINESS_STRUCTURE",label:"Needs Structure",g:"s"},{id:"NEEDS_TO_FORM",label:"Needs to Form",g:"s"},{id:"FORMED",label:"Formed",g:"s"},{id:"UP_AND_RUNNING",label:"Up & Running",g:"o"},{id:"GUEST_MODE_OWNING",label:"Guest Owning",g:"w"},{id:"UP_AND_RUNNING_OWNING",label:"Up & Running Owning",g:"w"},{id:"REMOTE_SELLER_WORKER",label:"Remote Seller/Worker",g:"x"},{id:"DOMESTIC_EMPLOYER",label:"Domestic Employer",g:"x"}];
    const pm={};for(const p of phases.phases)pm[p.phase]=p.count;const mx=Math.max(...Object.values(pm));
    const ft={GUEST_MODE:{r:1,a:0,f:0,c:"none"},GUEST_MODE_WITH_BUSINESS_STRUCTURE:{r:1,a:0,f:0,c:"none"},NEEDS_BUSINESS_STRUCTURE:{r:1,a:0,f:0,c:"none"},NEEDS_TO_FORM:{r:1,a:0,f:0,c:"none"},FORMED:{r:1,a:0,f:0,c:"list"},UP_AND_RUNNING:{r:0,a:1,f:1,c:"full"},GUEST_MODE_OWNING:{r:0,a:1,f:1,c:"full"},UP_AND_RUNNING_OWNING:{r:0,a:1,f:1,c:"full"},REMOTE_SELLER_WORKER:{r:1,a:0,f:0,c:"none"},DOMESTIC_EMPLOYER:{r:1,a:0,f:0,c:"none"}};
    const gc={s:C.accent,o:C.green,w:C.purple,x:C.muted};
    const formed=pm["FORMED"]||0,upR=pm["UP_AND_RUNNING"]||0;
    return (<div>
      <Alert color={C.orange}><strong>The graduation cliff:</strong> {fmt(formed)} users are in FORMED but only {fmt(upR)} graduated to UP_AND_RUNNING — a <strong>{pct(upR,formed)}</strong> conversion. The operate content serves just <strong>{pct(phases.seesAAFunding,totalBiz)}</strong> of all users.</Alert>
      <Insight><strong>Two products in one:</strong> The roadmap system (plan/start tasks) serves ~{fmt(phases.seesRoadmap)} users and is clearly working — {fmt((tp.find(t=>t.task==="Select Your Business Structure")||{}).completed||0)} completed business structure, {fmt((tp.find(t=>t.task.includes("Authorize Your Business"))||{}).completed||0)} formed entities. But the operate system (AAs, fundings, calendar) only reaches ~{fmt(phases.seesAAFunding)} users. We've effectively built two content systems: one serves 76% of our base and one serves 16%. The investment in the second — 64 AAs, 64 fundings, 9 certifications — is large relative to its audience.</Insight>
      <Insight><strong>Where users stall:</strong> {fmt(pm["GUEST_MODE"]||0)} in Guest Mode + {fmt(pm["GUEST_MODE_WITH_BUSINESS_STRUCTURE"]||0)} picked a structure but stopped = ~{fmt((pm["GUEST_MODE"]||0)+(pm["GUEST_MODE_WITH_BUSINESS_STRUCTURE"]||0))} stalled early. Another {fmt(pm["NEEDS_TO_FORM"]||0)} know they need to form but haven't. These {fmt((pm["GUEST_MODE"]||0)+(pm["GUEST_MODE_WITH_BUSINESS_STRUCTURE"]||0)+(pm["NEEDS_TO_FORM"]||0))} users have no access to fundings or anytime actions at their current operating phase.</Insight>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Stat label="Total Businesses" value={fmt(totalBiz)} small />
        <Stat label="See Roadmap" value={fmt(phases.seesRoadmap)} sub={pct(phases.seesRoadmap,totalBiz)} color={C.accent} small />
        <Stat label="See AA + Fundings" value={fmt(phases.seesAAFunding)} sub={pct(phases.seesAAFunding,totalBiz)} color={C.green} small />
        <Stat label="FORMED→Up&Running" value={pct(upR,formed)} sub={fmt(formed)+"→"+fmt(upR)} color={C.red} small />
      </div>
      <Sec title="Operating Phase Distribution">
        <div style={{display:"grid",gap:4}}>{po.map(p=>{const c=pm[p.id]||0;const f=ft[p.id]||{};return(
          <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <span style={{width:180,fontSize:12,fontWeight:600,color:gc[p.g],fontFamily:C.sans}}>{p.label}</span>
              <span style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:C.mono,width:70,textAlign:"right"}}>{fmt(c)}</span>
              <div style={{flex:1,height:10,background:C.bg,borderRadius:5,overflow:"hidden"}}><div style={{width:`${c/totalBiz*100}%`,height:"100%",background:gc[p.g],borderRadius:5,opacity:.7}}/></div>
              <span style={{fontSize:10,color:C.muted,width:40,textAlign:"right"}}>{pct(c,totalBiz)}</span>
            </div>
            <div style={{display:"flex",gap:8,marginLeft:190,fontSize:9,color:C.muted,fontFamily:C.sans}}>
              <span style={{color:f.r?C.accent:C.muted,opacity:f.r?1:.3}}>Roadmap {f.r?"✓":"✗"}</span>
              <span style={{color:f.a?C.green:C.muted,opacity:f.a?1:.3}}>AAs {f.a?"✓":"✗"}</span>
              <span style={{color:f.f?C.green:C.muted,opacity:f.f?1:.3}}>Fundings {f.f?"✓":"✗"}</span>
              <span style={{color:f.c!=="none"?C.cyan:C.muted,opacity:f.c!=="none"?1:.3}}>Cal: {f.c}</span>
            </div>
          </div>
        );})}</div>
      </Sec>
      <Sec title="Where Content Actually Lands">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Stat label="Businesses that see roadmap tasks" value={fmt(phases.seesRoadmap)} sub={"~"+pct(phases.seesRoadmap,totalBiz)+" of businesses are in phases where the step-by-step roadmap is displayed"} color={C.accent} />
          <Stat label="Businesses that see operate content" value={fmt(phases.seesAAFunding)} sub={"~"+pct(phases.seesAAFunding,totalBiz)+" are in phases where anytime actions, fundings, and the full calendar appear"} color={C.green} />
          <Stat label="Operate content not displayed" value="64 AAs + 64 fundings" sub={pct(totalBiz-phases.seesAAFunding,totalBiz)+" of businesses are in phases where this content is hidden"} color={C.red} />
        </div>
      </Sec>
      {DATA.unknowns && <div style={{fontSize:11,color:C.muted,fontFamily:C.sans,background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}>
        <strong style={{color:C.orange}}>Note:</strong> The phase distribution above accounts for {fmt(totalBiz)} businesses. An additional {fmt(DATA.unknowns.industry)} businesses have no industry set (abandoned onboarding) and {fmt(DATA.unknowns.legalStructure)} have no legal structure selected. These populations overlap significantly and are detailed on the Content Gap tab.
      </div>}
    </div>);
  };

  /* ═══ TAB: INDUSTRIES LIST ═══ */
  const Industries = () => (<div>
    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
      <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"6px 12px",background:C.card,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,flex:1,minWidth:160,outline:"none",fontFamily:C.sans}} />
      <span style={{fontSize:10,color:C.muted,fontFamily:C.sans}}>Sort by:</span>
      {[["users","Users"],["diff","Diff Tasks"],["unique","Unique"],["aa","AAs"],["fundings","Fundings"]].map(([k,l])=>(
        <button key={k} onClick={()=>setSortBy(k)} style={{padding:"4px 10px",background:sortBy===k?C.accentDim:"transparent",color:sortBy===k?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:C.sans}}>{l}</button>
      ))}
    </div>
    <div style={{display:"flex",gap:16,marginBottom:12,fontSize:10,color:C.muted,fontFamily:C.sans,alignItems:"center",flexWrap:"wrap"}}>
      <span>Task Bar:</span>
      <span><span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:C.cyan,opacity:.4,marginRight:4,verticalAlign:"middle"}}/>Shared tasks (appear in multiple industries)</span>
      <span><span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:C.red,marginRight:4,verticalAlign:"middle"}}/>Unique tasks (only this industry)</span>
      <span><span style={{color:C.red,marginRight:4}}>⚠</span>Sector mismatch — this industry is assigned to the wrong sector, causing content filtering issues</span>
    </div>
    <div style={{display:"grid",gap:3}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 70px 45px 35px 45px 45px 100px",gap:6,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
        <span>Industry</span><span style={{textAlign:"right"}}>Users</span><span style={{textAlign:"right"}}>Diff</span><span style={{textAlign:"right"}}>Uniq</span><span style={{textAlign:"right"}}>AAs</span><span style={{textAlign:"right"}}>Fund</span><span>Task Bar</span>
      </div>
      {sorted.map(ind=>(
        <div key={ind.id} onClick={()=>goDetail(ind)} style={{display:"grid",gridTemplateColumns:"1fr 70px 45px 35px 45px 45px 100px",gap:6,background:C.card,border:`1px solid ${ind.sectorMismatch?C.red+"44":C.border}`,borderRadius:6,padding:"8px 14px",cursor:"pointer",alignItems:"center",fontSize:12,fontFamily:C.sans}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
          <div><span style={{color:C.text,fontWeight:600}}>{ind.name}</span>{ind.sectorMismatch&&<span style={{color:C.red,fontSize:9,marginLeft:4}}>⚠</span>}</div>
          <span style={{textAlign:"right",color:C.accent,fontFamily:C.mono}}>{fmt(ind.users)}</span>
          <span style={{textAlign:"right",color:C.muted,fontFamily:C.mono}}>{ind.totalDiffTasks}</span>
          <span style={{textAlign:"right",color:ind.uniqueTasks>0?C.red:C.muted,fontFamily:C.mono}}>{ind.uniqueTasks}</span>
          <span style={{textAlign:"right",color:C.cyan,fontFamily:C.mono}}>{ind.starting.aaTotal}</span>
          <span style={{textAlign:"right",color:C.green,fontFamily:C.mono}}>{ind.starting.fundings}</span>
          {ind.totalDiffTasks>0?<div style={{width:100,height:10,background:C.bg,borderRadius:5,overflow:"hidden",display:"flex"}}><div style={{width:`${ind.sharedTasks/ind.totalDiffTasks*100}%`,height:"100%",background:C.cyan,opacity:.4}}/><div style={{width:`${ind.uniqueTasks/ind.totalDiffTasks*100}%`,height:"100%",background:C.red}}/></div>:<div style={{width:100,fontSize:9,color:C.muted,textAlign:"center"}}>no diff.</div>}
        </div>
      ))}
    </div>
  </div>);

  /* ═══ TAB: DETAIL ═══ */
  const Detail = () => {
    if(!selInd) return <div style={{color:C.muted,textAlign:"center",padding:40,fontFamily:C.sans}}>Select an industry from another tab.</div>;
    const ind=selInd,s=ind.starting,o=ind.owning,fix=ind.ifFixed;
    const myTasks=new Set(ind.allDiffTasks||[]);
    const similar=inds.filter(i=>i.id!==ind.id).map(i=>{const ot=new Set(i.allDiffTasks||[]);const inter=[...myTasks].filter(t=>ot.has(t)).length;const union=new Set([...myTasks,...ot]).size;return{...i,sim:union>0?(inter/union*100):0,shared:inter};}).sort((a,b)=>b.sim-a.sim).slice(0,8);
    const sOnlyAA=(s.aaNamesByIndustry||[]).filter(n=>!(o.aaNamesBySector||[]).includes(n));
    const oOnlyAA=(o.aaNamesBySector||[]).filter(n=>!(s.aaNamesByIndustry||[]).includes(n)&&!(s.aaNamesBySector||[]).includes(n));
    return (<div>
      <button onClick={()=>setView("industries")} style={{background:"transparent",border:"none",color:C.accent,cursor:"pointer",fontSize:12,padding:0,fontFamily:C.sans,marginBottom:12}}>← Back</button>
      <h2 style={{color:C.text,fontSize:22,fontWeight:700,margin:"0 0 4px",fontFamily:C.sans}}>{ind.name}</h2>
      <div style={{fontSize:12,color:C.muted,marginBottom:16,fontFamily:C.sans}}>Sector: <span style={{color:ind.sectorMismatch?C.red:C.text}}>{ind.sectorName}</span>{ind.sectorMismatch&&<span> → <span style={{color:C.green}}>{ind.sectorMismatchName}</span></span>}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
        <Stat label="Businesses" value={fmt(ind.users)} sub={pct(ind.users,totalBiz)+" of all businesses on the platform"} />
        <Stat label="Roadmap Tasks" value={ind.roadmapTasks} sub={(ind.roadmapTasks-ind.totalDiffTasks)+" universal + "+ind.totalDiffTasks+" differentiating"} color={C.accent} />
        <Stat label="Universal Tasks" value={ind.roadmapTasks - ind.totalDiffTasks} sub="Tasks shared by every industry (business plan, structure, NAICS, EIN, etc.)" color={C.muted} />
        <Stat label="Differentiating Tasks" value={ind.totalDiffTasks} sub={ind.uniqueTasks+" unique + "+ind.sharedTasks+" shared"} color={C.orange} />
        <Stat label="Unique Tasks" value={ind.uniqueTasks} sub="Tasks that only appear in this industry's roadmap" color={C.red} />
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        <Stat label="Shared Tasks" value={ind.sharedTasks} sub="Differentiating tasks also found in other industries" color={C.cyan} />
        <Stat label="Anytime Actions (Starting)" value={s.aaTotal} sub={s.aaByIndustry+" by industryId, "+s.aaBySector+" by sectorId, "+s.aaUniversal+" universal"} color={C.cyan} />
        <Stat label="Fundings Visible (Starting)" value={s.fundings} sub={"Matched via the '"+ind.sectorName+"' sector"} color={C.green} />
        <Stat label="Non-Essential Questions" value={ind.nonEssentialQs} sub="Profile questions asked of this industry that trigger add-on tasks" color={C.muted} />
        {ind.distinctPaths>0&&<Stat label="Distinct Roadmap Paths" value={fmt(ind.distinctPaths)} sub="Unique task-set combinations from legal structure, NEQs, and home-based choices" color={C.purple} />}
      </div>
      {ind.sectorMismatch&&<Alert color={C.red}><strong>Sector mismatch:</strong> Assigned "{ind.sectorName}" but content implies "{ind.sectorMismatchName}."{fix.missedAA>0&&<span> These users are missing <strong>{fix.missedAA} anytime actions</strong> tagged to the correct sector.</span>}{fix.missedFund!==0&&<span> Funding count difference: <strong>{fix.missedFund>0?"+":""}{fix.missedFund}</strong>.</span>}</Alert>}
      {ind.sectorMismatch&&(()=>{
        const currentAll = new Set([...(s.aaNamesByIndustry||[]),...(s.aaNamesBySector||[])]);
        const correctedSectorAAs = (o.aaNamesBySector||[]).filter(n=>!currentAll.has(n));
        const lostSectorAAs = (s.aaNamesBySector||[]).filter(n=>!(o.aaNamesBySector||[]).includes(n));
        return (correctedSectorAAs.length>0||lostSectorAAs.length>0) ? (
          <Sec title={"If Sector Were Corrected to '"+ind.sectorMismatchName+"'"} sub={"Currently assigned to '"+ind.sectorName+"'. Here's what changes for STARTING users in this industry."}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              <Stat label="Current AAs (Starting)" value={s.aaTotal} color={C.muted} small />
              <Stat label="AAs After Correction" value={fix.aaTotal} color={C.green} small />
              <Stat label="Current Fundings" value={s.fundings} color={C.muted} small />
              <Stat label="Fundings After Correction" value={fix.fundings} color={fix.fundings>s.fundings?C.green:fix.fundings<s.fundings?C.orange:C.muted} small />
            </div>
            {correctedSectorAAs.length>0&&<div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:C.green,marginBottom:4,fontFamily:C.sans}}>Anytime actions these users currently cannot see ({correctedSectorAAs.length}):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{correctedSectorAAs.map(n=><Tag key={n} color={C.green}>{n}</Tag>)}</div>
            </div>}
            {lostSectorAAs.length>0&&<div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:C.orange,marginBottom:4,fontFamily:C.sans}}>Anytime actions they currently see via '{ind.sectorName}' that would no longer match ({lostSectorAAs.length}):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{lostSectorAAs.map(n=><Tag key={n} color={C.orange}>{n}</Tag>)}</div>
            </div>}
          </Sec>
        ) : null;
      })()}
      {ind.totalDiffTasks===0&&<Alert color={C.red}><strong>Zero differentiating tasks.</strong> Identical to generic baseline. {fmt(ind.users)} users get no industry-specific guidance.</Alert>}
      {(ind.uniqueTaskNames||[]).length>0&&<Sec title="Unique Tasks" sub="Only this industry."><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{ind.uniqueTaskNames.map(t=><Tag key={t} color={C.red}>{taskFmt(t)}</Tag>)}</div></Sec>}
      {(ind.sharedTaskNames||[]).length>0&&<Sec title="Shared Tasks" sub="Click to see which industries share.">
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{ind.sharedTaskNames.map(t=>{const freq=tf[t];return <Tag key={t} color={C.cyan} onClick={e=>{e.stopPropagation();setSelTask({name:t,...freq});}}>{taskFmt(t)} ({freq?.count})</Tag>;})}</div>
        {selTask&&<div style={{background:C.card,border:`1px solid ${C.accent}44`,borderRadius:8,padding:12,marginTop:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:C.accent,fontWeight:700,fontSize:13}}>{taskFmt(selTask.name)}</span><button onClick={()=>setSelTask(null)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button></div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>In {selTask.count} industries:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{(selTask.industries||[]).map(id=>{const i2=inds.find(x=>x.id===id);return <Tag key={id} color={id===ind.id?C.accent:C.muted} onClick={()=>{if(i2)goDetail(i2);}}>{i2?.name||id}</Tag>;})}</div>
        </div>}
      </Sec>}
      <Sec title="Starting vs. Owning: Content Delivery">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:C.card,border:`1px solid ${C.accent}33`,borderRadius:10,padding:14}}>
            <h4 style={{color:C.accent,fontSize:13,fontWeight:700,marginBottom:6}}>Starting Path</h4>
            <div style={{fontSize:10,color:C.muted,marginBottom:8}}>Industry: <span style={{color:C.text}}>{ind.id}</span> · Sector: <span style={{color:ind.sectorMismatch?C.red:C.text}}>{ind.sectorName}</span></div>
            <div style={{display:"flex",gap:6,marginBottom:8}}><Stat label="AAs" value={s.aaTotal} color={C.cyan} small /><Stat label="Fundings" value={s.fundings} color={C.green} small /></div>
            <div style={{fontSize:9,color:C.muted}}>industryId: <span style={{color:C.green}}>{s.aaByIndustry}</span> · sector: <span style={{color:C.cyan}}>{s.aaBySector}</span> · universal: {s.aaUniversal}</div>
            {(s.aaNamesByIndustry||[]).length>0&&<div style={{marginTop:6}}><div style={{fontSize:9,color:C.green,marginBottom:2}}>By industryId:</div><div style={{display:"flex",flexWrap:"wrap",gap:2}}>{s.aaNamesByIndustry.map(n=><Tag key={n} color={C.green}>{n}</Tag>)}</div></div>}
            {(s.aaNamesBySector||[]).length>0&&<div style={{marginTop:4}}><div style={{fontSize:9,color:C.cyan,marginBottom:2}}>By sectorId:</div><div style={{display:"flex",flexWrap:"wrap",gap:2}}>{s.aaNamesBySector.map(n=><Tag key={n} color={C.cyan}>{n}</Tag>)}</div></div>}
          </div>
          <div style={{background:C.card,border:`1px solid ${C.purple}33`,borderRadius:10,padding:14}}>
            <h4 style={{color:C.purple,fontSize:13,fontWeight:700,marginBottom:6}}>Owning Path</h4>
            <div style={{fontSize:10,color:C.muted,marginBottom:8}}>Industry: <span style={{color:C.muted}}>none</span> · Sector: <span style={{color:C.text}}>{o.sectorName}</span></div>
            <div style={{display:"flex",gap:6,marginBottom:8}}><Stat label="AAs" value={o.aaTotal} color={C.cyan} small /><Stat label="Fundings" value={o.fundings} color={C.green} small /></div>
            <div style={{fontSize:9,color:C.muted}}>sector: <span style={{color:C.cyan}}>{o.aaBySector}</span> · universal: {o.aaUniversal}</div>
            {(o.aaNamesBySector||[]).length>0&&<div style={{marginTop:6}}><div style={{fontSize:9,color:C.cyan,marginBottom:2}}>By sectorId:</div><div style={{display:"flex",flexWrap:"wrap",gap:2}}>{o.aaNamesBySector.map(n=><Tag key={n} color={C.cyan}>{n}</Tag>)}</div></div>}
          </div>
        </div>
        {(sOnlyAA.length>0||oOnlyAA.length>0)&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
          <div><div style={{fontSize:10,color:C.accent,marginBottom:3}}>Only STARTING ({sOnlyAA.length}):</div>{sOnlyAA.length?<div style={{display:"flex",flexWrap:"wrap",gap:2}}>{sOnlyAA.map(n=><Tag key={n} color={C.accent}>{n}</Tag>)}</div>:<span style={{fontSize:10,color:C.muted}}>None</span>}</div>
          <div><div style={{fontSize:10,color:C.purple,marginBottom:3}}>Only OWNING ({oOnlyAA.length}):</div>{oOnlyAA.length?<div style={{display:"flex",flexWrap:"wrap",gap:2}}>{oOnlyAA.map(n=><Tag key={n} color={C.purple}>{n}</Tag>)}</div>:<span style={{fontSize:10,color:C.muted}}>None</span>}</div>
        </div>}
      </Sec>
      {DATA.permitCoverage && (()=>{
        const pc = DATA.permitCoverage;
        const apiSlugs = new Set(pc.apiTaskSlugs||[]);
        const apiAAs = new Set(pc.apiAASlugs||[]);
        const allTasks = [...(ind.allDiffTasks||[]), ...DATA.universalTasks];
        const apiTasks = allTasks.filter(t=>apiSlugs.has(t));
        const infoTasks = allTasks.filter(t=>!apiSlugs.has(t));
        // AAs with API
        const indAAs = DATA.anytimeActions.filter(aa=>aa.reached.some(r=>r.id===ind.id));
        const apiAAList = indAAs.filter(aa=>apiAAs.has(aa.id));
        const indPlurmits = pc.industryPlurmitMap[ind.id];
        const matchedPls = pc.plurmits.filter(p=>p.inds.includes(ind.id));
        return (<Sec title="Permit & API Integration" sub="Which of this industry's tasks have live database connections vs. informational content, and how many state permits map to this industry.">
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            <Stat label="Tasks w/ API Connection" value={apiTasks.length} sub={apiTasks.length>0?apiTasks.map(t=>taskFmt(t)).join(", "):"No tasks in this roadmap have live agency DB connections"} color={apiTasks.length>0?C.green:C.muted} small />
            <Stat label="AAs w/ API Connection" value={apiAAList.length} sub={apiAAList.length>0?apiAAList.map(a=>a.name).join(", "):"No anytime actions for this industry connect to agency DBs"} color={apiAAList.length>0?C.green:C.muted} small />
            <Stat label="State Permits Mapped" value={indPlurmits?indPlurmits.total:0} sub={indPlurmits?indPlurmits.integrated+" integrated, "+(indPlurmits.total-indPlurmits.integrated)+" not yet covered":"No permits from the Plurmits inventory map to this industry"} color={indPlurmits&&indPlurmits.total>0?C.purple:C.muted} small />
          </div>
          {apiTasks.length>0&&<div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.green,marginBottom:4,fontWeight:600}}>Tasks with live DB connections:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{apiTasks.map(t=>{
              const agency = pc.apiIntegrations.find(ai=>ai.tasks.includes(t));
              return <Tag key={t} color={C.green}>{taskFmt(t)}{agency&&<span style={{opacity:.6}}> · {agency.agencyShort}</span>}</Tag>;
            })}</div>
          </div>}
          {apiAAList.length>0&&<div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.green,marginBottom:4,fontWeight:600}}>Anytime Actions with live DB connections:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{apiAAList.map(aa=>{
              const agency = pc.apiIntegrations.find(ai=>ai.aas.includes(aa.id));
              return <Tag key={aa.id} color={C.green}>{aa.name}{agency&&<span style={{opacity:.6}}> · {agency.agencyShort}</span>}</Tag>;
            })}</div>
          </div>}
          {matchedPls.length>0&&<div>
            <div style={{fontSize:10,color:C.purple,marginBottom:4,fontWeight:600}}>Mapped state permits ({matchedPls.length}):</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{matchedPls.map((p,i)=><Tag key={i} color={p.api?C.green:p.tasks.length>0?C.cyan:C.muted}>{p.name}{p.api?" (API)":p.tasks.length>0?" (Info)":""}</Tag>)}</div>
          </div>}
        </Sec>);
      })()}
      {myTasks.size>0&&<Sec title="Most Similar Industries (Jaccard)" sub="Based on overlap of differentiating roadmap tasks.">
        <div style={{display:"grid",gap:3}}>{similar.filter(s2=>s2.sim>0).map(s2=>(
          <div key={s2.id} onClick={()=>goDetail(s2)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:12}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
            <span style={{flex:1,color:C.text,fontWeight:500}}>{s2.name}</span><span style={{color:C.purple,fontFamily:C.mono}}>{s2.sim.toFixed(0)}%</span><span style={{color:C.muted,fontSize:10}}>{s2.shared} shared</span>
          </div>
        ))}</div>
      </Sec>}
    </div>);
  };

  /* ═══ TAB: TASK REUSE (from original Tasks view) ═══ */
  const TaskReuse = () => {
    const sharedTasks=tasksByFreq.filter(t=>t.count>=2);
    return (<div>
      <Alert color={C.muted}>Differentiating tasks ranked by how many industries include them. Only tasks appearing in 2 or more industries are shown here — single-industry tasks are listed separately below.</Alert>
      <Insight><strong>"get-insurance"</strong> appears in {tf["get-insurance"]?.count||0} industries — essentially universal content. The next most-shared ({tasksByFreq.slice(1,4).map(t=>`"${taskFmt(t.name)}" (${t.count})`).join(", ")}) show real reuse clusters: environmental requirements, resale tax, and vehicle tasks spanning the transportation family.</Insight>
      <Sec title="Shared Tasks" sub={"Tasks that appear in 2 or more industry roadmaps ("+sharedTasks.length+" tasks)."}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
          <ResponsiveContainer width="100%" height={Math.max(300,sharedTasks.length*28+40)}>
            <BarChart data={sharedTasks} layout="vertical" margin={{left:200,right:20,top:5,bottom:5}}>
              <XAxis type="number" stroke={C.muted} tick={{fontSize:10,fontFamily:C.mono}} label={{value:"Number of industries",position:"bottom",offset:0,fill:C.muted,fontSize:10}} />
              <YAxis dataKey="name" type="category" width={190} tick={{fontSize:11,fontFamily:C.sans}} tickFormatter={taskFmt} stroke={C.muted} interval={0} />
              <Tooltip content={({payload})=>{if(!payload?.[0])return null;const d=payload[0].payload;return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:10,fontSize:11,color:C.text,fontFamily:C.sans}}><div style={{fontWeight:700}}>{taskFmt(d.name)}</div><div>Appears in {d.count} industry roadmaps</div></div>;}} />
              <Bar dataKey="count" fill={C.cyan} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Sec>
      <Sec title={`Single-Industry Tasks (${uniqueOnly.length})`} sub="Built for one specific audience.">
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{uniqueOnly.map(t=>{const i2=inds.find(i=>i.id===t.industries[0]);return <Tag key={t.name} color={C.red} onClick={()=>{if(i2)goDetail(i2);}}>{taskFmt(t.name)} → {i2?.name||t.industries[0]}</Tag>;})}</div>
      </Sec>
    </div>);
  };

  /* ═══ TAB: TASK ENGAGEMENT ═══ */
  const parseTime = (s) => {
    if(!s) return 0;
    let mins=0;
    const d=s.match(/(\d+)d/); if(d) mins+=parseInt(d[1])*1440;
    const h=s.match(/(\d+)h/); if(h) mins+=parseInt(h[1])*60;
    const m=s.match(/(\d+)m/); if(m) mins+=parseInt(m[1]);
    return mins;
  };
  const TaskEngagement = () => {
    const hasGA4 = tp.some(t=>t.pageViews>0);
    const sorted2 = useMemo(()=>{
      if(taskSort==="time") return [...tp].sort((a,b)=>parseTime(b.avgTime)-parseTime(a.avgTime));
      if(taskSort==="pageviews") return [...tp].sort((a,b)=>(b.pageViews||0)-(a.pageViews||0));
      return tp;
    },[taskSort,tp]);
    const topTotal=tp[0]?.total||1;
    const topPV = hasGA4 ? Math.max(...tp.map(t=>t.pageViews||0)) : 1;
    const apiSlugs = DATA.permitCoverage ? new Set([...(DATA.permitCoverage.apiTaskSlugs||[]),...(DATA.permitCoverage.apiTaskNames||[])]) : new Set();
    const top5Total=tp.slice(0,5).reduce((s,t)=>s+t.total,0);const allTotal=tp.reduce((s,t)=>s+t.total,0);const under10=tp.filter(t=>t.total<10);const under100=tp.filter(t=>t.total<100);
    const totalPV = tp.reduce((s,t)=>s+(t.pageViews||0),0);
    return (<div>
      <Alert color={C.orange}>The top 5 tasks account for <strong>{pct(top5Total,allTotal)}</strong> of all status changes.{hasGA4?" GA4 page views are now overlaid — these show actual readership, which is 2–10x higher than status changes for most tasks.":""}</Alert>
      <SrcLegend items={[["XLSX","Task Progress sheet — status button clicks (mark complete/to-do)"],["GA4","Page views from Google Analytics (Jan 2023–Mar 2026)"],["NAV","Navigator codebase — roadmap definitions, task metadata"]]} />
      {hasGA4&&<Insight><strong>The readership gap:</strong> GA4 recorded <strong>{fmt(totalPV)} page views</strong> vs. <strong>{fmt(allTotal)} status changes</strong> in the XLSX — a <strong>{(totalPV/Math.max(allTotal,1)).toFixed(1)}x</strong> ratio. Some tasks show extreme gaps: Mercantile License has {fmt(tp.find(t=>t.task.includes("Mercantile"))?.pageViews||0)} page views (GA4) but only {fmt(tp.find(t=>t.task.includes("Mercantile"))?.total||0)} status changes (XLSX) — {((tp.find(t=>t.task.includes("Mercantile"))?.pageViews||1)/(Math.max(tp.find(t=>t.task.includes("Mercantile"))?.total||1,1))).toFixed(0)}x. Others like "Select Your Business Structure" show a low ratio ({((tp.find(t=>t.task.includes("Structure"))?.pageViews||1)/(Math.max(tp.find(t=>t.task.includes("Structure"))?.total||1,1))).toFixed(1)}x) because users are forced to interact with it to progress. Page views are a better signal for content actually read.</Insight>}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Stat label="Status Changes (XLSX)" value={fmt(allTotal)} small />
        {hasGA4&&<Stat label="Page Views (GA4)" value={fmt(totalPV)} sub={(totalPV/Math.max(allTotal,1)).toFixed(1)+"x more than status changes"} color={C.cyan} small />}
        <Stat label="Top 5 Tasks =" value={pct(top5Total,allTotal)} sub="of all status changes" color={C.green} small />
        <Stat label="Tasks With <10 Status Changes" value={under10.length} sub={pct(under10.length,tp.length)+" of "+tp.length+" tracked tasks"} color={C.red} small />
      </div>
      <div style={{display:"grid",gap:3}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:C.sans}}>Sort by:</span>
          <button onClick={()=>setTaskSort("total")} style={{padding:"4px 10px",background:taskSort==="total"?C.accentDim:"transparent",color:taskSort==="total"?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:C.sans}}>Most Interactions</button>
          {hasGA4&&<button onClick={()=>setTaskSort("pageviews")} style={{padding:"4px 10px",background:taskSort==="pageviews"?C.accentDim:"transparent",color:taskSort==="pageviews"?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:C.sans}}>Most Page Views</button>}
          <button onClick={()=>setTaskSort("time")} style={{padding:"4px 10px",background:taskSort==="time"?C.accentDim:"transparent",color:taskSort==="time"?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:C.sans}}>Longest Avg Time</button>
        </div>
        <div style={{display:"flex",gap:16,marginBottom:8,fontSize:10,color:C.muted,fontFamily:C.sans,alignItems:"center",flexWrap:"wrap"}}>
          <span>Task color (by roadmap count):</span>
          <span><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:C.accent,marginRight:4,verticalAlign:"middle"}}/>Universal</span>
          <span><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:C.cyan,marginRight:4,verticalAlign:"middle"}}/>Shared (2+)</span>
          <span><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:C.red,marginRight:4,verticalAlign:"middle"}}/>Unique (1)</span>
          <span style={{marginLeft:8,borderLeft:`1px solid ${C.border}`,paddingLeft:8}}><span style={{background:`${C.purple}22`,color:C.purple,padding:"1px 5px",borderRadius:3,border:`1px solid ${C.purple}33`,fontSize:9,marginRight:4}}>ADD-ON</span>Profile/legal triggered</span>
          <span><span style={{background:`${C.green}22`,color:C.green,padding:"1px 5px",borderRadius:3,border:`1px solid ${C.green}33`,fontSize:9,marginRight:4}}>API</span>Live DB connection</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
          <span style={{width:22,textAlign:"right"}}>#</span>
          <span style={{width:10}}></span>
          <span style={{flex:1}}>Task</span>
          {hasGA4&&<span style={{width:70,textAlign:"right"}}>Views (GA4)</span>}
          <span style={{width:120,textAlign:"center"}}>{taskSort==="pageviews"?"PV bar":"Status bar"}</span>
          <span style={{width:65,textAlign:"right"}}>Status (XLSX)</span>
          <span style={{width:55,textAlign:"right"}}>Done</span>
          <span style={{width:40,textAlign:"right"}}>Avg Time</span>
        </div>
        {sorted2.map((t,i)=>{const cc={universal:C.accent,shared:C.cyan,unique:C.red,uncategorized:C.muted}[t.category]||C.muted;const barVal=taskSort==="pageviews"?(t.pageViews||0)/topPV*100:t.total/topTotal*100;return(
        <div key={t.task+i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:22,fontSize:10,color:C.muted,fontFamily:C.mono,textAlign:"right"}}>{i+1}</span>
          <span style={{width:10,height:10,borderRadius:"50%",background:cc,flexShrink:0,opacity:.9}} title={t.category+(t.isAddon?" (add-on)":"")}></span>
          <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:6}}>
            <div style={{fontSize:12,color:cc,fontFamily:C.sans,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.task}</div>
            {t.isAddon&&<span style={{background:`${C.purple}22`,color:C.purple,padding:"1px 5px",borderRadius:3,border:`1px solid ${C.purple}33`,fontSize:8,flexShrink:0}}>ADD-ON{t.reachCount?` · ${t.reachCount}`:""}</span>}
            {(apiSlugs.has(t.task)||apiSlugs.has(t.task.toLowerCase().replace(/ /g,"-")))&&<span style={{background:`${C.green}22`,color:C.green,padding:"1px 5px",borderRadius:3,border:`1px solid ${C.green}33`,fontSize:8,flexShrink:0}}>API</span>}
          </div>
          {hasGA4&&<span style={{width:70,textAlign:"right",fontFamily:C.mono,fontSize:10,color:t.pageViews>0?C.cyan:C.muted}}>{t.pageViews>0?fmt(t.pageViews):"—"}</span>}
          <div style={{width:120,height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}><div style={{width:`${barVal}%`,height:"100%",background:taskSort==="pageviews"?C.cyan:cc,borderRadius:4,opacity:.6}}/></div>
          <span style={{width:65,textAlign:"right",fontFamily:C.mono,fontSize:12,color:C.accent}}>{fmt(t.total)}</span>
          <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.green}}>{fmt(t.completed)}</span>
          <span style={{width:40,textAlign:"right",fontSize:9,color:taskSort==="time"?C.orange:C.muted,fontWeight:taskSort==="time"?700:400}}>{t.avgTime}</span>
        </div>
      );})}</div>
    </div>);
  };

  /* ═══ TAB: PERMIT COVERAGE ═══ */
  const PermitCoverage = () => {
    const pc = DATA.permitCoverage;
    if(!pc) return <div style={{color:C.muted,textAlign:"center",padding:40}}>No plurmit data available. Place plurmits.xlsx in data/ and regenerate.</div>;
    const cov = pc.coverage;
    const depts = pc.departments;
    const apis = pc.apiIntegrations;
    const pls = pc.plurmits;
    const apiSlugs = new Set(pc.apiTaskSlugs||[]);
    const apiAAs = new Set(pc.apiAASlugs||[]);
    const hasApiCount = pls.filter(p=>p.api||p.level==="api").length;
    const hasTaskMatch = pls.filter(p=>p.tasks.length>0&&!p.api&&p.level!=="api").length;
    const infoOnly = hasTaskMatch;
    const bizInteg = cov.bizApi + cov.bizInfo + cov.bizRead + cov.bizMentioned;

    const filteredPls = useMemo(()=>{
      let f = pls;
      if(pFilter==="api") f = f.filter(p=>p.api||p.level==="api");
      else if(pFilter==="read") f = f.filter(p=>p.level==="read"&&!p.tasks.length&&!p.api);
      else if(pFilter==="info") f = f.filter(p=>p.tasks.length>0&&!p.api&&p.level!=="api");
      else if(pFilter==="mentioned") f = f.filter(p=>p.level==="mentioned"&&!p.tasks.length);
      else if(pFilter==="none") f = f.filter(p=>p.level==="none"&&!p.tasks.length&&!p.api);
      else if(pFilter==="high") f = f.filter(p=>p.pri==="high");
      if(pDept!=="all") f = f.filter(p=>p.dept===pDept);
      return f.sort((a,b)=>b.vol-a.vol);
    },[pFilter,pDept,pls]);

    const deptBiz = depts.filter(d=>d.bizApplicable>0).sort((a,b)=>b.bizApplicable-a.bizApplicable);
    const maxBiz = Math.max(...deptBiz.map(d=>d.bizApplicable));

    return (<div>
      <Alert color={C.accent}>Cross-referencing the <strong>Plurmits inventory</strong> ({fmt(cov.total)} permits across {depts.length} NJ agencies) with the Navigator codebase to show which state permits are integrated with live database connections, mentioned as informational content, or completely absent.</Alert>
      <SrcLegend items={[["PLUR","Permit names, departments, volumes from Plurmits spreadsheet"],["NAV","API integrations, task-to-permit mappings from codebase"],["XLSX","User counts and status changes from analytics"]]} />
      <Insight>
        <strong>Theoretical vs. actual:</strong> NJ businesses submit roughly <strong>{fmt(cov.bizVolume)}</strong> permit applications per year. If every one came through Business.NJ.gov, existing coverage could handle <strong>{pct(cov.bizVolume - cov.bizNoneVol,cov.bizVolume)}</strong> of them — the remaining {pct(cov.bizNoneVol,cov.bizVolume)} ({fmt(cov.bizNoneVol)}/yr) are permits with no Navigator presence at all.<br/><br/>
        <strong>A note on measuring usage:</strong> "Status changes" below reflect users who clicked a task's complete/to-do button in the XLSX analytics. This undercounts actual engagement — users who read a task's content and act on it externally without clicking are invisible. Roadmap reach (how many of the 64 industry roadmaps include a given task) is a more reliable measure of who <em>encounters</em> the content.
      </Insight>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
        <Stat label="State Permits Inventoried" value={fmt(cov.total)} sub={fmt(cov.totalVolume)+" submissions/yr across "+depts.length+" NJ departments"} />
        <Stat label="Business-Applicable" value={fmt(cov.bizApplicable)} sub={fmt(cov.bizVolume)+" submissions/yr — "+pct(cov.bizApplicable,cov.total)+" of all permits"} color={C.accent} />
      </div>
      <div style={{fontSize:10,color:C.muted,fontFamily:C.sans,marginBottom:6,paddingLeft:2}}>If every NJ business used Business.NJ.gov, each tier below would handle this share of the {fmt(cov.bizVolume)} annual business submissions:</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        <Stat label="Live API Integration" value={hasApiCount+" permits"} color={C.green}
          sub={apis.length+" agency integrations → "+(pc.apiTaskSlugs.length+(pc.apiAASlugs||[]).length)+" connected tasks/AAs → "+hasApiCount+" state permits\n"+fmt(cov.bizApiVol)+"/yr statewide ("+pct(cov.bizApiVol,cov.bizVolume)+" of biz volume)\n"+fmt(cov.bizApiUsers)+" users on roadmap (XLSX) · "+fmt(cov.bizApiEng)+" status changes (XLSX)*"} />
        <Stat label="Data Read (no task match)" value={cov.bizRead} color={C.cyan}
          sub={fmt(cov.bizReadVol)+"/yr statewide ("+pct(cov.bizReadVol,cov.bizVolume)+" of biz volume)\nNot linked to specific tasks — reach not measurable"} />
        <Stat label="Informational in Navigator" value={infoOnly} color={C.cyan}
          sub={fmt(cov.bizInfoVol)+"/yr statewide ("+pct(cov.bizInfoVol,cov.bizVolume)+" of biz volume)\n"+fmt(cov.bizInfoUsers)+" users on roadmap (XLSX) · "+fmt(cov.bizInfoEng)+" status changes (XLSX)*"} />
        <Stat label="Mentioned Only" value={bizInteg - hasApiCount - infoOnly - cov.bizRead} color={C.orange}
          sub={fmt(cov.bizMentionedVol)+"/yr statewide ("+pct(cov.bizMentionedVol,cov.bizVolume)+" of biz volume)\nReferenced in content, not linked to specific tasks"} />
        <Stat label="Not in Navigator" value={fmt(cov.bizNone)} color={C.red}
          sub={fmt(cov.bizNoneVol)+"/yr statewide ("+pct(cov.bizNoneVol,cov.bizVolume)+" of biz volume)\nZero coverage — these permits have nowhere to go"} />
      </div>
      <div style={{fontSize:9,color:C.muted,fontFamily:C.sans,marginTop:-14,marginBottom:18,paddingLeft:2,opacity:.7}}>* Status changes (XLSX) = users who clicked a task's complete/to-do button. Users who read the content and act without clicking are not captured. "Users with these on their roadmap" (XLSX) is a more reliable reach measure.</div>

      <Sec title="Agency Database Integrations" sub="Live connections between the Navigator and NJ agency systems. These are the permits where users can query status, submit applications, or receive real-time data — not just read about them.">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          <Stat label="Agency Integrations" value={apis.length} sub="Distinct DB connections identified in the codebase (api/src/client/)" color={C.green} small />
          <Stat label="Connected Tasks & AAs" value={pc.apiTaskSlugs.length + (pc.apiAASlugs||[]).length} sub="Navigator task slugs and anytime actions that call these APIs" color={C.cyan} small />
          <Stat label="State Permits Covered" value={hasApiCount} sub="Plurmit inventory rows that map to those tasks (many permits → one task)" color={C.purple} small />
        </div>
        <div style={{display:"grid",gap:4}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 100px 80px 90px",gap:8,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
            <span>Agency / Integration</span><span>Type</span><span style={{textAlign:"right"}}>Tasks</span><span style={{textAlign:"right"}}>Feature</span>
          </div>
          {apis.map((ai,idx)=>{const tc=ai.type.includes("Submit")?C.green:ai.type.includes("Query")?C.cyan:C.orange; return (
            <div key={idx} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr 100px 80px 90px",gap:8,alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,color:C.text,fontWeight:600,fontFamily:C.sans}}>{ai.agency}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{ai.desc}</div>
              </div>
              <Tag color={tc}>{ai.type}</Tag>
              <span style={{textAlign:"right",fontFamily:C.mono,fontSize:12,color:C.accent}}>{ai.tasks.length + ai.aas.length}</span>
              <span style={{textAlign:"right",fontSize:10,color:ai.dashboard?C.purple:C.muted}}>{ai.dashboard||"—"}</span>
            </div>
          );})}
        </div>
      </Sec>

      <Sec title="Coverage by Department" sub="How many of each department's business permits are covered in the Navigator, and at what depth.">
        <div style={{display:"grid",gap:3}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 55px 55px 55px 55px 55px 130px",gap:6,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
            <span>Department</span><span style={{textAlign:"right"}}>Total</span><span style={{textAlign:"right"}}>Biz</span><span style={{textAlign:"right"}}>In BNJ</span><span style={{textAlign:"right"}}>Online</span><span style={{textAlign:"right"}}>Hi-Pri</span><span>Coverage</span>
          </div>
          {deptBiz.map(d=>{const inBnj=d.mentioned+d.read+d.api;const covPct=d.bizApplicable>0?inBnj/d.bizApplicable:0;return(
            <div key={d.name} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",display:"grid",gridTemplateColumns:"1fr 55px 55px 55px 55px 55px 130px",gap:6,alignItems:"center"}}>
              <div style={{fontSize:11,color:C.text,fontFamily:C.sans,fontWeight:500}}>{d.name.replace("Department of ","").replace("Division of ","")}</div>
              <span style={{textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.muted}}>{d.total}</span>
              <span style={{textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.accent}}>{d.bizApplicable}</span>
              <span style={{textAlign:"right",fontFamily:C.mono,fontSize:11,color:inBnj>0?C.green:C.muted}}>{inBnj}</span>
              <span style={{textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.cyan}}>{d.online}</span>
              <span style={{textAlign:"right",fontFamily:C.mono,fontSize:11,color:d.highPri>0?C.red:C.muted}}>{d.highPri||"—"}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:8,background:C.bg,borderRadius:4,overflow:"hidden",display:"flex"}}>
                  <div style={{width:`${d.bizApplicable>0?d.api/d.bizApplicable*100:0}%`,height:"100%",background:C.green}} title="API"/>
                  <div style={{width:`${d.bizApplicable>0?d.read/d.bizApplicable*100:0}%`,height:"100%",background:C.cyan}} title="Read"/>
                  <div style={{width:`${d.bizApplicable>0?d.mentioned/d.bizApplicable*100:0}%`,height:"100%",background:C.orange,opacity:.6}} title="Mentioned"/>
                </div>
                <span style={{fontSize:9,color:C.muted,fontFamily:C.mono,width:30,textAlign:"right"}}>{(covPct*100).toFixed(0)}%</span>
              </div>
            </div>
          );})}
        </div>
        <div style={{display:"flex",gap:16,marginTop:8,fontSize:10,color:C.muted,fontFamily:C.sans}}>
          <span><span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:C.green,marginRight:4,verticalAlign:"middle"}}/>API integration</span>
          <span><span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:C.cyan,marginRight:4,verticalAlign:"middle"}}/>Read (data pull)</span>
          <span><span style={{display:"inline-block",width:12,height:8,borderRadius:2,background:C.orange,opacity:.6,marginRight:4,verticalAlign:"middle"}}/>Mentioned</span>
          <span style={{color:C.muted}}>Empty = not covered</span>
        </div>
      </Sec>

      <Sec title="Business Permits Inventory" sub="All 521 business-applicable permits. Filter by integration depth.">
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:10,color:C.muted}}>Filter:</span>
          {[["all","All ("+cov.bizApplicable+")"],["api","API Connected ("+hasApiCount+")"],["read","Data Read ("+cov.bizRead+")"],["info","Informational ("+infoOnly+")"],["mentioned","Mentioned Only"],["none","Not in Navigator ("+cov.bizNone+")"],["high","High Priority ("+cov.bizHighPri+")"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPFilter(k)} style={{padding:"4px 10px",background:pFilter===k?C.accentDim:"transparent",color:pFilter===k?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:C.sans}}>{l}</button>
          ))}
          <select value={pDept} onChange={e=>setPDept(e.target.value)} style={{padding:"4px 8px",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,color:C.text,fontSize:10,fontFamily:C.sans}}>
            <option value="all">All Departments</option>
            {deptBiz.map(d=><option key={d.name} value={d.name}>{d.name.replace("Department of ","")}</option>)}
          </select>
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:6,fontFamily:C.sans}}>Showing {filteredPls.length} permits{pDept!=="all"?" in "+pDept.replace("Department of ",""):""}</div>
        <div style={{display:"grid",gap:2,maxHeight:500,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 120px 70px 70px",gap:6,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans,position:"sticky",top:0,background:C.bg,zIndex:1}}>
            <span>Permit</span><span>Department</span><span style={{textAlign:"right"}}>Volume</span><span>Status</span>
          </div>
          {filteredPls.map((p,i)=>{
            const sc = (p.api||p.level==="api")?C.green:p.tasks.length>0?C.cyan:p.level==="read"?C.cyan:p.level==="mentioned"?C.orange:C.muted;
            const sl = (p.api||p.level==="api")?"API":p.tasks.length>0?"Info":p.level==="read"?"Read":p.level==="mentioned"?"Mention":"—";
            return(
            <div key={i} style={{background:C.card,border:`1px solid ${p.pri==="high"?C.red+"44":C.border}`,borderRadius:5,padding:"6px 14px",display:"grid",gridTemplateColumns:"1fr 120px 70px 70px",gap:6,alignItems:"center",fontSize:11}}>
              <div style={{color:C.text,fontFamily:C.sans,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={p.name}>{p.pri==="high"&&<span style={{color:C.red,fontSize:9,marginRight:3}}>★</span>}{p.name}</div>
              <div style={{fontSize:9,color:C.muted,fontFamily:C.sans,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.dept.replace("Department of ","")}</div>
              <span style={{textAlign:"right",fontFamily:C.mono,fontSize:10,color:p.vol>0?C.accent:C.muted}}>{p.vol>0?fmt(p.vol):"—"}</span>
              <Tag color={sc}>{sl}</Tag>
            </div>);
          })}
        </div>
      </Sec>
    </div>);
  };

  /* ═══ TAB: CONTENT FINDER ═══ */
  const ContentFinder = () => {
    const pc = DATA.permitCoverage;
    const apiSlugs = pc ? new Set([...(pc.apiTaskSlugs||[]),...(pc.apiTaskNames||[])]) : new Set();
    const apiSlugSet = pc ? new Set(pc.apiTaskSlugs||[]) : new Set();
    const apiAASet = pc ? new Set(pc.apiAASlugs||[]) : new Set();
    const apis = pc ? pc.apiIntegrations : [];

    // Build browsable items
    const items = useMemo(()=>{
      const list = [];
      // Roadmap tasks
      const seenSlugs = new Set();
      const nameToSlug = DATA.taskNameToSlug || {};
      for(const t of tp){
        // Resolve slug: first try the authoritative name-to-slug map, then taskFrequency, then fall back to raw name
        let taskSlug = nameToSlug[t.task];
        if(!taskSlug){
          const slug = Object.entries(DATA.taskFrequency||{}).find(([s,info])=>{
            const n = taskFmt(s);
            return n===t.task || s===t.task;
          });
          taskSlug = slug ? slug[0] : t.task;
        }
        if(seenSlugs.has(taskSlug)) continue;
        seenSlugs.add(taskSlug);
        const isUniversal = DATA.universalTasks.includes(taskSlug);
        const freq = DATA.taskFrequency[taskSlug];
        const isAddon = t.isAddon;
        const hasApi = apiSlugs.has(t.task) || apiSlugSet.has(taskSlug);
        const industries = freq ? freq.industries : (isUniversal ? inds.map(i=>i.id) : []);
        list.push({
          type:"task", id:taskSlug, name:t.task, slug:taskSlug,
          isUniversal, isAddon, hasApi, industries,
          users: industries.reduce((s,iid)=>{const ind=inds.find(i=>i.id===iid);return s+(ind?ind.users:0);},0),
          interactions: t.total, completed: t.completed,
          pageViews: t.pageViews||0, pageUsers: t.pageUsers||0,
        });
      }
      // Anytime actions
      for(const aa of DATA.anytimeActions){
        const hasApi = apiAASet.has(aa.id);
        const reachedIds = aa.reached.map(r=>r.id);
        list.push({
          type:"aa", id:aa.id, name:aa.name, slug:aa.id,
          isUniversal: aa.applyToAllUsers, isAddon:false, hasApi,
          industries: reachedIds,
          users: reachedIds.reduce((s,iid)=>{const ind=inds.find(i=>i.id===iid);return s+(ind?ind.users:0);},0),
          interactions: null, completed: null,
          pageViews: aa.pageViews||0, pageUsers: aa.pageUsers||0,
          industryIds: aa.industryIds, sectorIds: aa.sectorIds,
        });
      }
      // Permits (only those actually on the platform)
      if(pc){
        for(const p of pc.plurmits){
          if(p.level==="none" && !p.tasks.length && !p.api) continue;
          list.push({
            type:"permit", id:"permit-"+p.name.slice(0,30), name:p.name, slug:null,
            isUniversal:false, isAddon:false, hasApi:p.api||p.level==="api",
            matchedTasks: p.tasks, department: p.dept, volume: p.vol,
            level: p.level, priority: p.pri,
            industries: p.inds,
            users: p.inds.reduce((s,iid)=>{const ind=inds.find(i=>i.id===iid);return s+(ind?ind.users:0);},0),
            interactions: null, completed: null,
          });
        }
      }
      return list;
    },[tp,inds,pc]);

    const filtered = useMemo(()=>{
      let f = items;
      if(finderType!=="all") f = f.filter(it=>it.type===finderType);
      if(finderSearch && finderSearch.length>=1){
        const q = finderSearch.toLowerCase();
        f = f.filter(it=>it.name.toLowerCase().includes(q)).sort((a,b)=>{
          const aStart = a.name.toLowerCase().startsWith(q)?0:1;
          const bStart = b.name.toLowerCase().startsWith(q)?0:1;
          if(aStart!==bStart) return aStart-bStart;
          const typeOrder = {task:0,aa:1,permit:2};
          return (typeOrder[a.type]||3)-(typeOrder[b.type]||3);
        });
      } else {
        f = [...f].sort((a,b)=>{
          const typeOrder = {task:0,aa:1,permit:2};
          if(a.type!==b.type) return (typeOrder[a.type]||3)-(typeOrder[b.type]||3);
          return a.name.localeCompare(b.name);
        });
      }
      return f;
    },[finderSearch,finderType,items]);

    const getAgency = (slug) => {
      if(!pc) return null;
      return apis.find(ai=>ai.tasks.includes(slug)||ai.aas.includes(slug));
    };

    const renderSteps = (item) => {
      const steps = [];
      const triggers = DATA.taskTriggers || {};

      // For permits, show what it maps to first
      if(item.type==="permit"){
        steps.push({step:"This is a state permit from "+item.department,detail:item.volume>0?"~"+fmt(item.volume)+" submissions/yr statewide":null});
        if(item.matchedTasks && item.matchedTasks.length>0){
          steps.push({step:"Maps to Navigator task"+(item.matchedTasks.length>1?"s":""),detail:item.matchedTasks.map(t=>taskFmt(t)).join(", "),color:C.accent});
        } else if(item.hasApi){
          steps.push({step:"Has a live API integration but is not matched to a specific task slug",color:C.green});
        } else if(item.level==="mentioned"){
          steps.push({step:"Mentioned in Navigator content but not linked to a specific task",color:C.orange});
        } else if(item.level==="read"){
          steps.push({step:"Navigator reads data related to this permit but it's not linked to a specific task",color:C.cyan});
        } else {
          steps.push({step:"Not currently in the Navigator — no task, mention, or integration exists",color:C.red});
          return steps;
        }
      }

      // Determine the underlying task/AA for navigation
      const underlying = item.type==="permit" && item.matchedTasks?.length>0
        ? items.find(it=>(it.type==="task"||it.type==="aa") && item.matchedTasks.includes(it.slug))
        : item;

      if(!underlying || (item.type==="permit" && !item.matchedTasks?.length)) return steps;

      const u = underlying;
      steps.push({step:"Go to Business.NJ.gov and sign in (or create an account)",color:C.muted});

      if(u.type==="task"){
        const taskSlug = u.slug;
        const taskTrigs = triggers[taskSlug] || [];
        const isAddonTask = taskTrigs.length > 0;

        // Step: Choose persona
        if(taskTrigs.some(t=>t.type==="persona" || t.type==="persona+industry")){
          const pt = taskTrigs.find(t=>t.type==="persona" || t.type==="persona+industry");
          steps.push({step:"During onboarding, select your business persona",detail:pt.detail,color:C.accent});
        } else {
          // Industry selection
          if(u.isUniversal){
            steps.push({step:"Select any industry during onboarding",detail:"This is a universal task — it appears on all 64 industry roadmaps",color:C.accent});
          } else if(u.industries.length>0){
            const indNames = u.industries.map(iid=>{const ind=inds.find(i=>i.id===iid);return ind?ind.name:iid;});
            if(indNames.length<=5){
              steps.push({step:"Select one of these industries during onboarding:",detail:indNames.join(", "),color:C.accent});
            } else {
              steps.push({step:"Select one of "+indNames.length+" industries during onboarding",detail:indNames.slice(0,5).join(", ")+" and "+(indNames.length-5)+" more",color:C.accent});
            }
          } else if(isAddonTask){
            // Add-on task — determine industries from trigger data
            const neqTrigsForInd = taskTrigs.filter(t=>t.type==="neq" && t.industries?.length>0);
            if(neqTrigsForInd.length > 0){
              const neqInds = [...new Set(neqTrigsForInd.flatMap(t=>t.industries))];
              const indNames = neqInds.map(iid=>{const ind=inds.find(i=>i.id===iid);return ind?ind.name:iid;});
              if(indNames.length<=5){
                steps.push({step:"Select one of these industries during onboarding:",detail:indNames.join(", ")+". This question is only shown to these industries.",color:C.accent});
              } else {
                steps.push({step:"Select one of "+indNames.length+" industries during onboarding",detail:indNames.slice(0,5).join(", ")+" and "+(indNames.length-5)+" more. This question is only shown to these industries.",color:C.accent});
              }
            } else {
              const hasLegalTrig = taskTrigs.some(t=>t.type==="legalStructure"||t.type==="legalStructure+profile");
              steps.push({step:"Select any industry during onboarding",detail:hasLegalTrig?"This task is triggered by your business structure choice, not your industry — it can appear on any industry's roadmap.":"This is an add-on task triggered by profile choices.",color:C.accent});
            }
          }
        }

        // Step: Legal structure (if triggered by legal structure)
        const legalTrigs = taskTrigs.filter(t=>t.type==="legalStructure");
        const legalProfileTrigs = taskTrigs.filter(t=>t.type==="legalStructure+profile");
        if(legalTrigs.length > 0){
          steps.push({step:"Select the required business structure",detail:legalTrigs.map(t=>t.detail).join("; "),color:C.purple});
        }
        if(legalProfileTrigs.length > 0){
          // Show the legal structure part
          const legalPart = legalProfileTrigs.map(t=>t.detail.split(", then ")[0]).join("; ");
          steps.push({step:"Select the required business structure",detail:legalPart,color:C.purple});
          // Show the profile question part
          const profilePart = legalProfileTrigs.map(t=>{const parts=t.detail.split(", then ");return parts.length>1?parts.slice(1).join(", then "):null;}).filter(Boolean);
          if(profilePart.length>0){
            steps.push({step:"Answer a follow-up question in your Profile",detail:profilePart.join("; "),color:C.purple});
          }
        }

        // Step: Profile / NEQ questions
        const neqTrigs = taskTrigs.filter(t=>t.type==="neq");
        const profileTrigs = taskTrigs.filter(t=>t.type==="profile");

        if(neqTrigs.length > 0){
          for(const nt of neqTrigs){
            steps.push({step:"Answer a profile question",detail:nt.detail,color:C.purple});
          }
        }
        if(profileTrigs.length > 0){
          for(const pt of profileTrigs){
            steps.push({step:"Answer a profile question during or after onboarding",detail:pt.detail,color:C.purple});
          }
        }

        // Step: Roadmap task trigger
        const rtTrigs = taskTrigs.filter(t=>t.type==="roadmapTask");
        if(rtTrigs.length > 0){
          steps.push({step:"Complete a prerequisite task in your roadmap",detail:rtTrigs[0].detail,color:C.purple});
        }

        // Step: Auto triggers (just note)
        const autoTrigs = taskTrigs.filter(t=>t.type==="auto");
        if(autoTrigs.length > 0){
          steps.push({step:"Automatically included",detail:autoTrigs[0].detail,color:C.muted});
        }

        // Final: find it in roadmap
        const stepInfo = taskTrigs.length>0 && taskTrigs[0].step ? taskTrigs[0] : null;
        const stepLabel = stepInfo ? " under Step "+stepInfo.step+": \""+stepInfo.stepName+"\"" : "";
        steps.push({step:"Find \""+u.name+"\" in your step-by-step roadmap",detail:"It appears"+stepLabel+" as a to-do item in your task checklist that you can expand for details and instructions."+(u.hasApi?" This task has a live data connection — you may be able to check status or submit directly.":""),color:u.hasApi?C.green:C.text});

      } else if(u.type==="aa"){
        if(u.isUniversal){
          steps.push({step:"Select any industry during onboarding",detail:"This is a universal anytime action — visible to all industries",color:C.accent});
        } else if(u.industries.length>0){
          const indNames = u.industries.map(iid=>{const ind=inds.find(i=>i.id===iid);return ind?ind.name:iid;});
          if(indNames.length<=5){
            steps.push({step:"Select one of these industries:",detail:indNames.join(", "),color:C.accent});
          } else {
            steps.push({step:"Select one of "+indNames.length+" eligible industries",detail:indNames.slice(0,5).join(", ")+" and "+(indNames.length-5)+" more",color:C.accent});
          }
        }
        steps.push({step:"Progress your account to an \"operate\" phase",detail:"Anytime actions only appear once you reach Up & Running, Guest Mode Owning, or Up & Running Owning. Currently "+fmt(DATA.phases.seesAAFunding)+" of "+fmt(DATA.phases.totalBusinesses)+" businesses ("+pct(DATA.phases.seesAAFunding,DATA.phases.totalBusinesses)+") are in these phases.",color:C.orange});
        steps.push({step:"Find \""+u.name+"\" in the Anytime Actions section",detail:"It appears in the operate dashboard alongside other actions for your industry and sector."+(u.hasApi?" This action has a live connection to an agency system.":""),color:u.hasApi?C.green:C.text});
      }

      // API info
      if(u.hasApi || item.hasApi){
        const slug = u.slug || (item.matchedTasks||[])[0];
        const agency = slug ? getAgency(slug) : null;
        if(agency){
          steps.push({step:"Live integration: "+agency.agency,detail:agency.desc+" ("+agency.type+")",color:C.green});
        }
      }

      return steps;
    };

    return (<div>
      <Alert color={C.accent}>Search or browse any roadmap task, anytime action, or state permit to see a step-by-step guide for how a Business.NJ.gov user would encounter it.</Alert>
      <SrcLegend items={[["NAV","Task definitions, triggers, and industry roadmaps from codebase"],["XLSX","Status changes and user counts from analytics"],["GA4","Page views from Google Analytics"],["PLUR","Permit inventory from Plurmits spreadsheet"]]} />
      <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:C.muted}}>Show:</span>
        {[["all","All ("+items.length+")"],["task","Tasks ("+items.filter(i=>i.type==="task").length+")"],["aa","Anytime Actions ("+items.filter(i=>i.type==="aa").length+")"],["permit","Permits ("+items.filter(i=>i.type==="permit").length+")"]].map(([k,l])=>(
          <button key={k} onClick={()=>{setFinderType(k);setSelItem(null);setFinderOpen(true);}} style={{padding:"4px 10px",background:finderType===k?C.accentDim:"transparent",color:finderType===k?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:C.sans}}>{l}</button>
        ))}
      </div>
      <div style={{position:"relative",marginBottom:selItem?0:20}}>
        <div style={{position:"relative"}}>
          <input placeholder="Type to filter, or click to browse..." value={finderSearch}
            onChange={e=>{setFinderSearch(e.target.value);setSelItem(null);setFinderOpen(true);}}
            onFocus={()=>setFinderOpen(true)}
            style={{width:"100%",padding:"12px 16px",paddingRight:finderSearch?40:16,background:C.card,border:`1px solid ${finderOpen&&!selItem?C.accent:C.border}`,borderRadius:finderOpen&&!selItem?"8px 8px 0 0":8,color:C.text,fontSize:14,outline:"none",fontFamily:C.sans,boxSizing:"border-box"}} />
          {finderSearch&&<button onClick={()=>{setFinderSearch("");setSelItem(null);setFinderOpen(true);}}
            style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:4,lineHeight:1}}>✕</button>}
        </div>
        {finderOpen && !selItem && <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.card,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 8px 8px",maxHeight:400,overflowY:"auto",zIndex:10}}>
          <div style={{padding:"6px 16px",fontSize:9,color:C.muted,fontFamily:C.sans,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.card,display:"flex",justifyContent:"space-between"}}>
            <span>{filtered.length} results{finderSearch?` for "${finderSearch}"`:""}</span>
            <span onClick={()=>setFinderOpen(false)} style={{cursor:"pointer",color:C.accent}}>close ✕</span>
          </div>
          {filtered.map((it,i)=>{
            const tc = it.type==="task"?C.accent:it.type==="aa"?C.cyan:C.purple;
            const tl = it.type==="task"?"TASK":it.type==="aa"?"AA":"PERMIT";
            return (<div key={it.id+i} onClick={()=>{setSelItem(it);setFinderSearch(it.name);setFinderOpen(false);}}
              style={{padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${C.border}`}}
              onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Tag color={tc}>{tl}</Tag>
              <span style={{flex:1,fontSize:12,color:C.text,fontFamily:C.sans,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.name}</span>
              {it.hasApi&&<Tag color={C.green}>API</Tag>}
              {it.users>0&&<span style={{fontSize:10,color:C.muted,fontFamily:C.mono,flexShrink:0}}>{fmt(it.users)} users</span>}
            </div>);
          })}
          {filtered.length===0&&<div style={{padding:"20px 16px",textAlign:"center",fontSize:12,color:C.muted}}>No results found</div>}
        </div>}
      </div>

      {selItem && (()=>{
        const it = selItem;
        const steps = renderSteps(it);
        const tc = it.type==="task"?C.accent:it.type==="aa"?C.cyan:C.purple;
        const tl = it.type==="task"?"Roadmap Task":it.type==="aa"?"Anytime Action":"State Permit";
        return (<div style={{marginTop:16}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:20,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <Tag color={tc}>{tl}</Tag>
              {it.hasApi&&<Tag color={C.green}>Live API</Tag>}
              {it.isUniversal&&<Tag color={C.accent}>Universal</Tag>}
              {it.isAddon&&<Tag color={C.purple}>Add-on</Tag>}
              {it.type==="permit"&&it.priority==="high"&&<Tag color={C.red}>High Priority</Tag>}
            </div>
            <h3 style={{fontSize:18,fontWeight:700,color:C.text,margin:"0 0 8px",fontFamily:C.sans}}>{it.name}</h3>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:11,color:C.muted,fontFamily:C.sans}}>
              {it.users>0&&<span><strong style={{color:C.accent}}>{fmt(it.users)}</strong> users on roadmap (XLSX)</span>}
              {it.interactions!=null&&<span><strong style={{color:C.green}}>{fmt(it.interactions)}</strong> status changes (XLSX) ({fmt(it.completed)} completed)</span>}
              {it.interactions!=null&&it.pageViews>0&&<span><strong style={{color:C.cyan}}>{fmt(it.pageViews)}</strong> page views (GA4)</span>}
              {it.type==="aa"&&it.pageViews>0&&<span><strong style={{color:C.cyan}}>{fmt(it.pageViews)}</strong> page views (GA4)</span>}
              {it.type==="permit"&&it.volume>0&&<span><strong style={{color:C.purple}}>{fmt(it.volume)}</strong> statewide submissions/yr (PLUR)</span>}
              {it.industries&&it.industries.length>0&&<span>Visible to <strong style={{color:C.cyan}}>{it.industries.length}</strong> of 64 industries</span>}
            </div>
          </div>

          <Sec title="How to find this in Business.NJ.gov" sub="Step-by-step path from account creation to this content.">
            <div style={{display:"grid",gap:4}}>
              {steps.map((s,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px",display:"flex",gap:14,alignItems:"flex-start"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`${s.color||C.accent}18`,border:`2px solid ${s.color||C.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:s.color||C.accent,fontFamily:C.mono,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:C.text,fontWeight:600,fontFamily:C.sans}}>{s.step}</div>
                    {s.detail&&<div style={{fontSize:11,color:C.muted,marginTop:4,fontFamily:C.sans,lineHeight:1.5}}>{s.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Sec>

          {it.industries && it.industries.length>0 && it.industries.length<=20 && <Sec title={"Industries ("+it.industries.length+")"} sub="Click to view industry detail.">
            <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
              {it.industries.map(iid=>{const ind=inds.find(i=>i.id===iid);return ind?<Tag key={iid} color={C.accent} onClick={()=>{setSelInd(ind);setView("detail");}}>{ind.name} ({fmt(ind.users)})</Tag>:null;})}
            </div>
          </Sec>}

          <div style={{fontSize:9,color:C.muted,fontFamily:C.sans,marginTop:12,opacity:.7}}>Status changes (XLSX) = users who clicked a task's complete/to-do button. Page views (GA4) = actual page loads in Google Analytics.</div>
        </div>);
      })()}
    </div>);
  };

  /* ═══ TAB: SITE ANALYTICS ═══ */
  const SiteAnalytics = () => {
    const ga4 = DATA.ga4;
    if(!ga4) return <div><Alert color={C.muted}>No GA4 data found. Place ga4_page_views.csv, ga4_events.csv, ga4_traffic_sources.csv, and ga4_landing_pages.csv in the data/ folder and regenerate.</Alert></div>;
    const f = ga4.funnel;
    const funnelSteps = [
      {label:"First Visits",count:f.firstVisit,users:f.firstVisitUsers,color:C.accent},
      {label:"Click to Navigator",count:f.clickToNavigator,users:f.clickToNavigatorUsers,color:C.cyan},
      {label:"Onboarding Started",count:f.onboardingStep,users:f.onboardingStepUsers,color:C.green},
      {label:"Guest Signups",count:f.guestSignup,users:f.guestSignupUsers,color:C.green},
      {label:"Full Registrations",count:f.fullRegistration,users:f.fullRegistrationUsers,color:C.purple},
      {label:"Task Status Changes",count:f.taskStatusChange,users:f.taskStatusChangeUsers,color:C.orange},
    ];
    const funnelMax = funnelSteps[0]?.users||1;
    const convRate = f.fullRegistrationUsers>0&&f.firstVisitUsers>0 ? (f.fullRegistrationUsers/f.firstVisitUsers*100).toFixed(2) : "?";
    const guestRate = f.guestSignupUsers>0&&f.firstVisitUsers>0 ? (f.guestSignupUsers/f.firstVisitUsers*100).toFixed(1) : "?";
    return (<div>
      <Alert color={C.cyan}>GA4 data from {ga4.dateRange.start||"?"} to {ga4.dateRange.end||"?"}. This covers all traffic to Business.NJ.gov — the public Webflow site, the Navigator app, and everything in between.</Alert>
      <SrcLegend items={[["GA4","All data on this tab is from Google Analytics 4"]]} />

      <Sec title="Acquisition Funnel" sub="From first visit to registered user. Each bar shows unique users at that stage.">
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
          <Stat label="First Visit → Guest Signup" value={guestRate+"%"} sub={fmt(f.guestSignupUsers)+" of "+fmt(f.firstVisitUsers)+" first-time visitors"} color={C.green} small />
          <Stat label="First Visit → Registration" value={convRate+"%"} sub={fmt(f.fullRegistrationUsers)+" of "+fmt(f.firstVisitUsers)+" first-time visitors"} color={C.purple} small />
          <Stat label="Outbound Link Clicks" value={fmt(f.outboundClicks)} sub={fmt(f.outboundClicksUsers)+" users clicked through to external agency sites"} color={C.orange} small />
          <Stat label="Form Submissions" value={fmt(f.formSubmits)} sub={fmt(f.formSubmitsUsers)+" users submitted forms through the Navigator"} color={C.cyan} small />
        </div>
        <div style={{display:"grid",gap:4}}>
          {funnelSteps.map((step,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:180,fontSize:12,color:step.color,fontFamily:C.sans,fontWeight:600}}>{step.label}</div>
              <div style={{flex:1,height:10,background:C.bg,borderRadius:5,overflow:"hidden"}}><div style={{width:`${step.users/funnelMax*100}%`,height:"100%",background:step.color,borderRadius:5,opacity:.6}}/></div>
              <div style={{width:90,textAlign:"right",fontFamily:C.mono,fontSize:12,color:step.color}}>{fmt(step.users)}</div>
              <div style={{width:60,textAlign:"right",fontSize:9,color:C.muted}}>{i>0?pct(step.users,funnelSteps[0].users):""}</div>
            </div>
          ))}
        </div>
      </Sec>

      <Sec title="Traffic Sources" sub="How users find Business.NJ.gov, by session channel.">
        <div style={{display:"grid",gap:3}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
            <span style={{flex:1}}>Channel</span>
            <span style={{width:80,textAlign:"right"}}>Sessions</span>
            <span style={{width:80,textAlign:"right"}}>Users</span>
            <span style={{width:60,textAlign:"right"}}>Eng. Rate</span>
            <span style={{width:60,textAlign:"right"}}>Avg Time</span>
            <span style={{width:70,textAlign:"right"}}>Key Events</span>
          </div>
          {ga4.traffic.map((t,i)=>{const maxSess=ga4.traffic[0]?.sessions||1;return(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,fontSize:12,color:C.text,fontFamily:C.sans}}>{t.channel}</div>
              <span style={{width:80,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.accent}}>{fmt(t.sessions)}</span>
              <span style={{width:80,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.cyan}}>{fmt(t.users)}</span>
              <span style={{width:60,textAlign:"right",fontFamily:C.mono,fontSize:10,color:t.engagementRate>50?C.green:t.engagementRate>25?C.orange:C.red}}>{t.engagementRate}%</span>
              <span style={{width:60,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.muted}}>{t.avgEngTime>60?Math.round(t.avgEngTime/60)+"m":t.avgEngTime+"s"}</span>
              <span style={{width:70,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.green}}>{fmt(t.keyEvents)}</span>
            </div>
          );})}
        </div>
      </Sec>

      <Sec title="Top Pages" sub="Most-viewed pages across the entire site.">
        <div style={{display:"grid",gap:3}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
            <span style={{flex:1}}>Page Path</span>
            <span style={{width:90,textAlign:"right"}}>Views</span>
            <span style={{width:80,textAlign:"right"}}>Users</span>
            <span style={{width:60,textAlign:"right"}}>Avg Time</span>
          </div>
          {ga4.topPages.slice(0,30).map((p,i)=>{const maxV=ga4.topPages[0]?.views||1;return(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,fontSize:11,color:p.path.startsWith("/tasks/")?C.accent:p.path.startsWith("/actions/")?C.cyan:C.text,fontFamily:C.mono,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.path}</div>
              <span style={{width:90,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.accent}}>{fmt(p.views)}</span>
              <span style={{width:80,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.cyan}}>{fmt(p.users)}</span>
              <span style={{width:60,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.muted}}>{p.avgEngTime>60?Math.round(p.avgEngTime/60)+"m":Math.round(p.avgEngTime)+"s"}</span>
            </div>
          );})}
        </div>
      </Sec>

      <Sec title="Site Sections" sub="Page views grouped by URL path prefix.">
        <div style={{display:"grid",gap:3}}>
          {ga4.pageCategories.map((cat,i)=>{const maxV=ga4.pageCategories[0]?.views||1;return(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:140,fontSize:12,color:C.text,fontFamily:C.mono}}>{cat.prefix}</div>
              <div style={{flex:1,height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}><div style={{width:`${cat.views/maxV*100}%`,height:"100%",background:C.accent,borderRadius:4,opacity:.5}}/></div>
              <span style={{width:50,textAlign:"right",fontSize:9,color:C.muted}}>{cat.pages} pg</span>
              <span style={{width:90,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.accent}}>{fmt(cat.views)}</span>
              <span style={{width:80,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.cyan}}>{fmt(cat.users)}</span>
            </div>
          );})}
        </div>
      </Sec>

      <Sec title="All Events" sub="GA4 events ordered by count. Navigator-specific events reveal user behavior beyond page views.">
        <div style={{display:"grid",gap:3}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
            <span style={{flex:1}}>Event Name</span>
            <span style={{width:100,textAlign:"right"}}>Count</span>
            <span style={{width:80,textAlign:"right"}}>Users</span>
          </div>
          {ga4.events.map((e,i)=>{const isNav=["onboarding_step","analytics_event","user_update","navigation_clicks","form_submits","click_to_navigator","task_tab_continue_button_clicks","task_tab_clicked","license_certification_guide_clicks","task_manual_status_change","navigator_phase_change","SignUp_Success_Guest","SignUp_Success_Registration","graduation_phase_interactions","outbound_link_clicks","call_to_action_clicks"].includes(e.event);return(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,fontSize:11,color:isNav?C.accent:C.text,fontFamily:C.mono,fontWeight:isNav?600:400}}>{e.event}</div>
              <span style={{width:100,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.accent}}>{fmt(e.count)}</span>
              <span style={{width:80,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.cyan}}>{fmt(e.users)}</span>
            </div>
          );})}
        </div>
      </Sec>
    </div>);
  };

  /* ═══ TAB: PROFILE QUESTIONS ═══ */
  const ProfileQuestions = () => {
    const sorted3 = useMemo(()=>[...neq].sort((a,b)=>{const ta=a.yes+a.no+a.unknown;const tb=b.yes+b.no+b.unknown;const ra=ta>0?(a.yes+a.no)/ta:0;const rb=tb>0?(b.yes+b.no)/tb:0;return rb-ra;}),[neq]);
    const totalQEng = sorted3.reduce((s,q)=>s+(q.downstream?.engagement||0),0);
    const activeQs = sorted3.filter(q=>q.downstream?.taskCount>0);
    const inertQs = sorted3.filter(q=>!q.downstream?.taskCount);
    return (<div>
    <Alert color={C.muted}>Profile questions drive roadmap personalization. Each question gates specific add-on tasks — click any row to see the downstream content pipeline it controls.</Alert>
    <SrcLegend items={[["XLSX","Response counts (yes/no/unknown) and status changes from analytics"],["NAV","Question-to-addon-to-task mapping from codebase"]]} />
    <Insight>
      <strong>The pipeline:</strong> Of {sorted3.length} profile questions, <strong>{activeQs.length} trigger roadmap add-ons</strong> that produce a combined {activeQs.reduce((s,q)=>s+q.downstream.taskCount,0)} tasks with {fmt(totalQEng)} total status changes (XLSX). The remaining {inertQs.length} either trigger anytime actions only, change the entire roadmap (like Provides Staffing Service overriding the industry), or appear unused.<br/><br/>
      <strong>Home-Based Business</strong> dominates: it's the only question answered by most users ({fmt(neq.find(q=>q.question==="Home-Based Business")?.yes||0)} yes, {fmt(neq.find(q=>q.question==="Home-Based Business")?.no||0)} no) and its "No" path gates {neq.find(q=>q.question==="Home-Based Business")?.downstream?.taskCount||0} tasks with {fmt(neq.find(q=>q.question==="Home-Based Business")?.downstream?.engagement||0)} status changes — more than all other questions combined. Most other questions have &lt;1% response rates by design (they're only asked of specific industries), and their downstream tasks get minimal engagement.
    </Insight>
    <div style={{display:"flex",gap:16,marginBottom:8,fontSize:10,color:C.muted,fontFamily:C.sans,alignItems:"center",flexWrap:"wrap"}}>
      <span>Row color = response rate:</span>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:C.green,marginRight:4,verticalAlign:"middle"}}/>{'>'} 10%</span>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:C.cyan,marginRight:4,verticalAlign:"middle"}}/>1–10%</span>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:C.orange,marginRight:4,verticalAlign:"middle"}}/>{'<'} 1%</span>
      <span><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:C.muted,marginRight:4,verticalAlign:"middle"}}/>0%</span>
      <span style={{marginLeft:8,borderLeft:`1px solid ${C.border}`,paddingLeft:8}}>Click a row to see the downstream tasks it gates</span>
    </div>
    <div style={{display:"grid",gap:3}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 14px",fontSize:9,color:C.muted,fontFamily:C.sans}}>
        <span style={{width:22,textAlign:"right"}}>#</span>
        <span style={{flex:1}}>Question</span>
        <span style={{width:40,textAlign:"right"}}>Tasks</span>
        <span style={{width:55,textAlign:"right"}}>Status (XLSX)</span>
        <span style={{width:55,textAlign:"right"}}>Rate</span>
        <span style={{width:100,textAlign:"center"}}>Yes / No</span>
        <span style={{width:55,textAlign:"right"}}>Yes</span>
        <span style={{width:55,textAlign:"right"}}>No</span>
      </div>
      {sorted3.map((q,i)=>{const total=q.yes+q.no+q.unknown;const yp=total>0?q.yes/total*100:0;const np=total>0?q.no/total*100:0;const rate=total>0?(q.yes+q.no)/total*100:0;const rc=rate>10?C.green:rate>=1?C.cyan:rate>0?C.orange:C.muted;const ds=q.downstream;const isExpanded=expandedQ===q.question;return(
      <div key={i}>
        <div onClick={()=>setExpandedQ(isExpanded?null:q.question)} style={{background:C.card,border:`1px solid ${isExpanded?C.accent+"66":C.border}`,borderRadius:isExpanded?"6px 6px 0 0":6,padding:"8px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onMouseEnter={e=>{if(!isExpanded)e.currentTarget.style.background=C.cardHover;}} onMouseLeave={e=>{if(!isExpanded)e.currentTarget.style.background=C.card;}}>
          <span style={{width:22,fontSize:10,color:C.muted,fontFamily:C.mono,textAlign:"right"}}>{i+1}</span>
          <span style={{flex:1,fontSize:12,color:rc,fontFamily:C.sans}}>{q.question}</span>
          <span style={{width:40,textAlign:"right",fontFamily:C.mono,fontSize:10,color:ds?.taskCount?C.purple:C.muted}}>{ds?.taskCount||"—"}</span>
          <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:10,color:ds?.engagement?C.accent:C.muted}}>{ds?.engagement?fmt(ds.engagement):"—"}</span>
          <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:10,color:rc}}>{rate.toFixed(1)}%</span>
          <div style={{width:100,height:8,background:C.bg,borderRadius:4,overflow:"hidden",display:"flex"}}><div style={{width:`${yp}%`,height:"100%",background:C.green}}/><div style={{width:`${np}%`,height:"100%",background:C.red,opacity:.5}}/></div>
          <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.green}}>{fmt(q.yes)}</span>
          <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.red}}>{fmt(q.no)}</span>
        </div>
        {isExpanded&&<div style={{background:C.card,border:`1px solid ${C.accent}66`,borderTop:"none",borderRadius:"0 0 6px 6px",padding:"12px 14px 14px 48px"}}>
          {ds?<div>
            <div style={{fontSize:11,color:C.text,fontFamily:C.sans,marginBottom:8,lineHeight:1.6}}>{ds.note}</div>
            {ds.taskCount>0?<div>
              <div style={{fontSize:10,color:C.purple,fontWeight:600,marginBottom:4}}>Downstream tasks ({ds.taskCount}):</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>{ds.tasks.map(t=><Tag key={t} color={C.purple} onClick={()=>{setFinderSearch(taskFmt(t));setSelItem(null);setFinderOpen(true);setView("finder");}}>{taskFmt(t)}</Tag>)}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:6}}>Combined status changes (XLSX): <strong style={{color:C.accent}}>{fmt(ds.engagement)}</strong></div>
            </div>:<div style={{fontSize:10,color:C.muted}}>No roadmap tasks gated. {ds.note.includes("anytime action")?"Triggers anytime actions instead.":ds.note.includes("overrides")?"Changes the entire roadmap path.":"No downstream content impact found."}</div>}
          </div>:<div style={{fontSize:10,color:C.muted}}>No downstream mapping available for this question.</div>}
        </div>}
      </div>
    );})}</div>
  </div>);
  };

  /* ═══ RENDER ═══ */
  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:C.sans}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"16px 20px 60px"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:4}}>
          <h1 style={{fontSize:20,fontWeight:800,margin:0}}>BizX Content Explorer</h1>
          <span style={{fontSize:11,color:C.muted}}>Business.NJ.gov Analysis</span>
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:14}}>
          Source: {DATA.meta.xlsxFile} · {fmt(DATA.meta.totalBusinesses)} businesses · {inds.length} industries · {DATA.totalDiffTasks} diff. tasks · {DATA.anytimeActions.length} AAs · {sectors.length} sectors{DATA.permitCoverage&&` · ${fmt(DATA.permitCoverage.coverage.total)} state permits`}
        </div>
        <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}}>
          {nav("contentgap","Content Gap")}{nav("roadmap","Roadmap Analysis")}{nav("sectorhealth","Sector Health")}{nav("journey","User Journey")}{nav("industries","Industries")}{nav("detail","Industry Detail")}{nav("tasks","Task Reuse")}{nav("engagement","Task Engagement")}{nav("permits","Permit Coverage")}{nav("finder","Content Finder")}{DATA.ga4&&nav("siteanalytics","Site Analytics")}{nav("profile","Profile Questions")}
        </div>
        {view==="contentgap"&&<ContentGap/>}{view==="roadmap"&&<RoadmapAnalysis/>}{view==="sectorhealth"&&<SectorHealth/>}{view==="journey"&&<UserJourney/>}{view==="industries"&&<Industries/>}{view==="detail"&&<Detail/>}{view==="tasks"&&<TaskReuse/>}{view==="engagement"&&<TaskEngagement/>}{view==="permits"&&<PermitCoverage/>}{view==="finder"&&<ContentFinder/>}{view==="siteanalytics"&&<SiteAnalytics/>}{view==="profile"&&<ProfileQuestions/>}
      </div>
    </div>
  );
}
