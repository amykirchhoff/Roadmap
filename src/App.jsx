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
    {sub && <div style={{fontSize:10,color:C.muted,marginTop:2,opacity:.7}}>{sub}</div>}
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

/* ── main app ────────────────────────────────────────────── */
export default function App() {
  const [view,setView] = useState("contentgap");
  const [selInd,setSelInd] = useState(null);
  const [selTask,setSelTask] = useState(null);
  const [sortBy,setSortBy] = useState("users");
  const [search,setSearch] = useState("");

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
      <Insight><strong>Why this matters:</strong> The content team has built 64 anytime actions and 64 fundings, but this content only reaches users in the "operate" phases — about <strong>{fmt(phases.seesAAFunding)}</strong> users, or <strong>{pct(phases.seesAAFunding,totalBiz)}</strong> of the total base. Of those who <em>do</em> see it, the sector mismatch means {fmt(mismatchUsers)} are getting results filtered against the wrong sector. They see generic "Other Services" content instead of industry-relevant actions like IFTA registration and CDL requirements.</Insight>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Stat label="Businesses on Platform" value={fmt(totalBiz)} />
        <Stat label="See AA + Fundings" value={fmt(phases.seesAAFunding)} sub={pct(phases.seesAAFunding,totalBiz)+" of total"} color={C.green} />
        <Stat label="In Other Services" value={fmt(otherServicesUsers)} sub={pct(otherServicesUsers,totalBiz)+" — incl. "+fmt(genericUsers)+" generic"} color={C.orange} />
        <Stat label="Mismatched Industries" value={mismatchInds.length} sub={fmt(mismatchUsers)+" users affected"} color={C.red} />
        <Stat label="Orphaned Sectors" value={DATA.orphanedSectors.length+" / 25"} sub="No STARTING industry maps here" color={C.red} />
      </div>
      <Sec title="Industries by Anytime Actions Visible (Starting Path)" sub="Each dot is an industry. Size = user count. Red = sector mismatch. Orange = Other Services. Green = correct sector. Click any dot.">
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
      <Sec title="Mismatched Industries" sub="Sorted by user count. Shows additional AAs that would become visible if sector were corrected.">
        <div style={{display:"grid",gap:4}}>{mismatchInds.sort((a,b)=>b.users-a.users).map(ind=>(
          <div key={ind.id} onClick={()=>goDetail(ind)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:12,fontFamily:C.sans}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background=C.card}>
            <span style={{flex:1,color:C.text,fontWeight:600}}>{ind.name}</span>
            <span style={{color:C.accent,fontFamily:C.mono,fontSize:13}}>{fmt(ind.users)}</span>
            <span style={{color:C.red,fontSize:10}}>{ind.sectorName}</span><span style={{color:C.muted}}>→</span><span style={{color:C.green,fontSize:10}}>{ind.sectorMismatchName}</span>
            {ind.ifFixed.missedAA>0&&<Tag color={C.red}>+{ind.ifFixed.missedAA} AA</Tag>}
          </div>
        ))}</div>
      </Sec>
    </div>);
  };

  /* ═══ TAB: ROADMAP ANALYSIS (from original) ═══ */
  const RoadmapAnalysis = () => {
    const scatter = inds.filter(i=>i.name!=="All Other Businesses").map(i=>({...i,logUsers:Math.log10(Math.max(i.users,1))}));
    const oneTasks = inds.filter(i=>i.totalDiffTasks===1).sort((a,b)=>b.users-a.users);
    return (<div>
      <Alert color={C.orange}>7 universal tasks excluded (business plan, structure, NAICS, EIN, taxes, bank account, vehicles). Showing only the tasks that differentiate one industry's roadmap from another.</Alert>
      <Insight><strong>The differentiation problem:</strong> {diffStats.zeroDiff.length} industries have <strong>zero differentiating tasks</strong> — their {fmt(diffStats.zeroDiffUsers)} users get an identical-to-generic roadmap. Another {diffStats.noUnique.length} industries have tasks but <strong>none unique to them</strong>. Only {diffStats.hasUnique.length} industries have truly unique content. Meanwhile, {uniqueOnly.length} of {DATA.totalDiffTasks} differentiating tasks appear in just one industry — built for a single audience.</Insight>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Stat label="Industry Roadmaps" value={inds.length} />
        <Stat label="Differentiating Tasks" value={DATA.totalDiffTasks} sub="After removing 7 universal" />
        <Stat label="Single-Industry Tasks" value={uniqueOnly.length} sub={pct(uniqueOnly.length,DATA.totalDiffTasks)+" of diff. tasks"} color={C.red} />
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        <Stat label="Zero diff. tasks" value={diffStats.zeroDiff.length} sub={fmt(diffStats.zeroDiffUsers)+" users get generic roadmap"} color={C.red} />
        <Stat label="Shared tasks only" value={diffStats.noUnique.length} sub={fmt(diffStats.noUniqueUsers)+" users"} color={C.orange} />
        <Stat label="Has unique tasks" value={diffStats.hasUnique.length} sub="Truly differentiated" color={C.green} />
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
      <Insight><strong>Two products in one:</strong> The roadmap system (plan/start tasks) serves ~{fmt(phases.seesRoadmap)} users and is clearly working — {fmt((tp.find(t=>t.task==="Select Your Business Structure")||{}).completed||0)} completed business structure, {fmt((tp.find(t=>t.task.includes("Authorize Your Business"))||{}).completed||0)} formed entities. But the operate system (AAs, fundings, calendar) only reaches ~{fmt(phases.seesAAFunding)} users. You've built two content systems: one serves 76% of your base and one serves 16%. The investment in the second — 64 AAs, 64 fundings, 9 certifications — is large relative to its audience.</Insight>
      <Insight><strong>Where users stall:</strong> {fmt(pm["GUEST_MODE"]||0)} in Guest Mode + {fmt(pm["GUEST_MODE_WITH_BUSINESS_STRUCTURE"]||0)} picked a structure but stopped = ~{fmt((pm["GUEST_MODE"]||0)+(pm["GUEST_MODE_WITH_BUSINESS_STRUCTURE"]||0))} stalled early. Another {fmt(pm["NEEDS_TO_FORM"]||0)} know they need to form but haven't. The site consolidation is a chance to consider whether showing fundings or AAs earlier could motivate these users forward.</Insight>
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
              <div style={{flex:1,height:10,background:C.bg,borderRadius:5,overflow:"hidden"}}><div style={{width:`${c/mx*100}%`,height:"100%",background:gc[p.g],borderRadius:5,opacity:.7}}/></div>
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
          <Stat label="Roadmap content serves" value={fmt(phases.seesRoadmap)} sub={"~"+pct(phases.seesRoadmap,totalBiz)} color={C.accent} />
          <Stat label="Operate content serves" value={fmt(phases.seesAAFunding)} sub={"~"+pct(phases.seesAAFunding,totalBiz)} color={C.green} />
          <Stat label="Content built but unseen" value="64 AAs + 64 fundings" sub={"Invisible to "+pct(totalBiz-phases.seesAAFunding,totalBiz)} color={C.red} />
        </div>
      </Sec>
    </div>);
  };

  /* ═══ TAB: INDUSTRIES LIST ═══ */
  const Industries = () => (<div>
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
      <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"6px 12px",background:C.card,border:`1px solid ${C.border}`,borderRadius:6,color:C.text,fontSize:12,flex:1,minWidth:160,outline:"none",fontFamily:C.sans}} />
      {[["users","Users"],["diff","Diff Tasks"],["unique","Unique"],["aa","AAs"],["fundings","Fundings"]].map(([k,l])=>(
        <button key={k} onClick={()=>setSortBy(k)} style={{padding:"4px 10px",background:sortBy===k?C.accentDim:"transparent",color:sortBy===k?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:4,cursor:"pointer",fontSize:10,fontFamily:C.sans}}>{l}</button>
      ))}
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
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        <Stat label="Users" value={fmt(ind.users)} /><Stat label="Roadmap Tasks" value={ind.roadmapTasks} color={C.accent} /><Stat label="Diff. Tasks" value={ind.totalDiffTasks} color={C.orange} /><Stat label="Unique" value={ind.uniqueTasks} color={C.red} /><Stat label="Shared" value={ind.sharedTasks} color={C.cyan} />
      </div>
      {ind.sectorMismatch&&<Alert color={C.red}><strong>Sector mismatch:</strong> Assigned "{ind.sectorName}" but content implies "{ind.sectorMismatchName}."{fix.missedAA>0&&<span> Fixing surfaces <strong>{fix.missedAA} more AAs</strong>.</span>}{fix.missedFund!==0&&<span> Fundings: <strong>{fix.missedFund>0?"+":""}{fix.missedFund}</strong>.</span>}</Alert>}
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
    const top20=tasksByFreq.slice(0,20);
    return (<div>
      <Alert color={C.muted}>Differentiating tasks ranked by how many industries include them. Tasks in 1 industry are unique; tasks in many are shared building blocks.</Alert>
      <Insight><strong>"get-insurance"</strong> appears in {tf["get-insurance"]?.count||0} industries — essentially universal content. The next most-shared ({tasksByFreq.slice(1,4).map(t=>`"${taskFmt(t.name)}" (${t.count})`).join(", ")}) show real reuse clusters: environmental requirements, resale tax, and vehicle tasks spanning the transportation family.</Insight>
      <Sec title="Most Shared Tasks">
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={top20} layout="vertical" margin={{left:160,right:20,top:5,bottom:5}}>
              <XAxis type="number" stroke={C.muted} tick={{fontSize:10,fontFamily:C.mono}} />
              <YAxis dataKey="name" type="category" width={150} tick={{fontSize:10,fontFamily:C.sans}} tickFormatter={taskFmt} stroke={C.muted} />
              <Tooltip content={({payload})=>{if(!payload?.[0])return null;const d=payload[0].payload;return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:10,fontSize:11,color:C.text,fontFamily:C.sans}}><div style={{fontWeight:700}}>{taskFmt(d.name)}</div><div>{d.count} industries</div></div>;}} />
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
  const TaskEngagement = () => {
    const top=tp.slice(0,40);const topTotal=tp[0]?.total||1;
    const top5Total=tp.slice(0,5).reduce((s,t)=>s+t.total,0);const allTotal=tp.reduce((s,t)=>s+t.total,0);const under10=tp.filter(t=>t.total<10);
    return (<div>
      <Alert color={C.orange}>The top 5 tasks account for <strong>{pct(top5Total,allTotal)}</strong> of all engagement. {under10.length} tasks have fewer than 10 interactions ever.</Alert>
      <Insight><strong>The long tail:</strong> Engagement concentrates on formation: structure → NAICS → entity auth → EIN → taxes. After that it falls off a cliff. "Business Plan" ({fmt((tp.find(t=>t.task.includes("Business Plan")&&!t.task.includes("Cannabis"))||{}).total||0)}) is the last above 10K. Industry-specific tasks that took significant research effort get single-digit to low-hundred traffic — not a bug (users haven't reached those steps yet), but a sign the operate content is underserved.</Insight>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        <Stat label="Total Interactions" value={fmt(allTotal)} small /><Stat label="Top 5 = " value={pct(top5Total,allTotal)} sub="of all" color={C.green} small /><Stat label="Tasks <10 interactions" value={under10.length} sub={"of "+tp.length} color={C.red} small />
      </div>
      <div style={{display:"grid",gap:3}}>{top.map((t,i)=>(
        <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:22,fontSize:10,color:C.muted,fontFamily:C.mono,textAlign:"right"}}>{i+1}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,color:C.text,fontFamily:C.sans,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.task}</div></div>
          <div style={{width:120,height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}><div style={{width:`${t.total/topTotal*100}%`,height:"100%",background:C.accent,borderRadius:4,opacity:.6}}/></div>
          <span style={{width:65,textAlign:"right",fontFamily:C.mono,fontSize:12,color:C.accent}}>{fmt(t.total)}</span>
          <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:10,color:C.green}}>{fmt(t.completed)}</span>
          <span style={{width:40,textAlign:"right",fontSize:9,color:C.muted}}>{t.avgTime}</span>
        </div>
      ))}</div>
    </div>);
  };

  /* ═══ TAB: PROFILE QUESTIONS ═══ */
  const ProfileQuestions = () => (<div>
    <Alert color={C.muted}>Non-essential questions drive add-ons and anytime action personalization. Most go unanswered because they're industry-specific.</Alert>
    <Insight><strong>Home-Based Business</strong> is the only question with real engagement ({fmt(neq.find(q=>q.question==="Home-Based Business")?.yes||0)} yes, {fmt(neq.find(q=>q.question==="Home-Based Business")?.no||0)} no) because it's asked of nearly every industry. All others are highly targeted — Liquor License only for restaurants/food trucks, Cannabis Microbusiness only for cannabis. The 99%+ unknown rates are by design. The low absolutes (489 liquor, 233 cannabis micro) reflect industry sizes, not disengagement.</Insight>
    <div style={{display:"grid",gap:3}}>{neq.map((q,i)=>{const total=q.yes+q.no+q.unknown;const yp=total>0?q.yes/total*100:0;const np=total>0?q.no/total*100:0;return(
      <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{flex:1,fontSize:12,color:C.text,fontFamily:C.sans}}>{q.question}</span>
        <div style={{width:120,height:8,background:C.bg,borderRadius:4,overflow:"hidden",display:"flex"}}><div style={{width:`${yp}%`,height:"100%",background:C.green}}/><div style={{width:`${np}%`,height:"100%",background:C.red,opacity:.5}}/></div>
        <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.green}}>{fmt(q.yes)}</span>
        <span style={{width:55,textAlign:"right",fontFamily:C.mono,fontSize:11,color:C.red}}>{fmt(q.no)}</span>
        <span style={{width:65,textAlign:"right",fontFamily:C.mono,fontSize:9,color:C.muted}}>{fmt(q.unknown)} unk</span>
      </div>
    );})}</div>
  </div>);

  /* ═══ RENDER ═══ */
  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:C.sans}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"16px 20px 60px"}}>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:4}}>
          <h1 style={{fontSize:20,fontWeight:800,margin:0}}>BizX Content Explorer</h1>
          <span style={{fontSize:11,color:C.muted}}>Business.NJ.gov Analysis</span>
        </div>
        <div style={{fontSize:10,color:C.muted,marginBottom:14}}>
          Source: {DATA.meta.xlsxFile} · {fmt(DATA.meta.totalBusinesses)} businesses · {inds.length} industries · {DATA.totalDiffTasks} diff. tasks · {DATA.anytimeActions.length} AAs · {sectors.length} sectors
        </div>
        <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}}>
          {nav("contentgap","Content Gap")}{nav("roadmap","Roadmap Analysis")}{nav("sectorhealth","Sector Health")}{nav("journey","User Journey")}{nav("industries","Industries")}{nav("detail","Industry Detail")}{nav("tasks","Task Reuse")}{nav("engagement","Task Engagement")}{nav("profile","Profile Questions")}
        </div>
        {view==="contentgap"&&<ContentGap/>}{view==="roadmap"&&<RoadmapAnalysis/>}{view==="sectorhealth"&&<SectorHealth/>}{view==="journey"&&<UserJourney/>}{view==="industries"&&<Industries/>}{view==="detail"&&<Detail/>}{view==="tasks"&&<TaskReuse/>}{view==="engagement"&&<TaskEngagement/>}{view==="profile"&&<ProfileQuestions/>}
      </div>
    </div>
  );
}
