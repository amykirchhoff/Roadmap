#!/usr/bin/env python3
"""
Generate data.json for the BizX Content Explorer dashboard.

Usage:
    python scripts/generate_data.py [path/to/analytics.xlsx]

If no path given, looks for data/analytics.xlsx.
Reads navigator_analysis.json from data/ and outputs src/data.json.
"""
import json, os, re, sys

try:
    import openpyxl
except ImportError:
    print("Installing openpyxl..."); os.system(f"{sys.executable} -m pip install openpyxl -q"); import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "data", "analytics.xlsx")
NAV = os.path.join(ROOT, "data", "navigator_analysis.json")
OUT = os.path.join(ROOT, "src", "data.json")

def read_sheet(wb, name):
    if name not in wb.sheetnames: return []
    ws = wb[name]
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        rows.append(dict(zip(headers, row)))
    return rows

print(f"Reading XLSX: {XLSX}")
wb = openpyxl.load_workbook(XLSX, data_only=True)

print(f"Reading navigator analysis: {NAV}")
nav = json.load(open(NAV))

# ============================================================
# Parse XLSX sheets
# ============================================================
xlsx_industries = read_sheet(wb, "Industries")
xlsx_sectors = read_sheet(wb, "Sectors")
xlsx_phases = read_sheet(wb, "Operating Phases")
xlsx_tasks = read_sheet(wb, "Task Progress Metrics")
xlsx_neq = read_sheet(wb, "Non Essential Questions")
xlsx_legal = read_sheet(wb, "Legal Structures")

# Build user counts by industry name -> count
# XLSX names are multi-line: "Industry Name\nDescription". Take first line only.
industry_users = {}
unknown_industry = 0
unmatched_industries = []
for row in xlsx_industries:
    raw = (row.get("Industry") or "").strip()
    if not raw: continue
    name = raw.split("\n")[0].strip()
    cnt = int(row.get("Count") or 0)
    if name == "Unknown":
        unknown_industry = cnt
        continue
    industry_users[name] = cnt

# Build sector user counts
sector_users = {}
unknown_sector = 0
for row in xlsx_sectors:
    raw = (row.get("Sector") or "").strip()
    if not raw: continue
    name = raw.split("\n")[0].strip()
    cnt = int(row.get("Count") or 0)
    if name == "Unknown":
        unknown_sector = cnt
        continue
    sector_users[name] = cnt

# Operating phases
phases = {}
total_businesses = 0
unknown_phase = 0
for row in xlsx_phases:
    phase = (row.get("Phase") or "").strip()
    if not phase: continue
    cnt = int(row.get("Count") or 0)
    if phase == "Unknown":
        unknown_phase = cnt
        continue
    phases[phase] = cnt
    total_businesses += cnt

# Task progress
task_progress = []
for row in xlsx_tasks:
    task = row.get("Task") or ""
    task_progress.append({
        "task": task.strip(),
        "completed": int(row.get("COMPLETED") or 0),
        "todo": int(row.get("TO_DO") or 0),
        "last45": int(row.get("Completed Last 45 Days") or 0),
        "avgTime": (row.get("Avg Time to Complete") or ""),
        "total": int(row.get("Total") or 0),
    })
task_progress.sort(key=lambda x: -x["total"])

# Build task name -> slug mapping from navigator analysis
task_name_to_slug = nav.get("taskNameToSlug", {})

# Non-essential questions
neq_data = []
for row in xlsx_neq:
    q = (row.get("Question Name") or "").strip()
    if not q: continue
    neq_data.append({
        "question": q,
        "yes": int(row.get("Yes Count") or 0),
        "no": int(row.get("No Count") or 0),
        "unknown": int(row.get("Unknown Count") or 0),
    })

# Legal structures
legal_data = []
unknown_legal = 0
for row in xlsx_legal:
    cat = (row.get("Category") or "").strip()
    if not cat: continue
    cnt = int(row.get("Count") or 0)
    if cat == "Unknown":
        unknown_legal = cnt
        continue
    legal_data.append({"structure": cat, "count": cnt})

# ============================================================
# Compute content reachability from navigator analysis
# ============================================================
nav_industries = nav["industries"]
nav_sectors = nav["sectors"]
nav_aa = nav["anytimeActions"]
nav_fundings = nav["fundings"]
nav_mismatches = nav["sectorMismatches"]

reachable_sectors = set(i["defaultSectorId"] for i in nav_industries.values() if i.get("isEnabled"))
orphaned_sectors = set(nav_sectors.keys()) - reachable_sectors

def count_aa(industry_id, sector_id):
    total, by_ind, by_sec, by_uni = 0, 0, 0, 0
    names_ind, names_sec, names_uni = [], [], []
    for aa in nav_aa:
        if aa.get("applyToAllUsers"):
            total += 1; by_uni += 1; names_uni.append(aa["name"]); continue
        iids = aa.get("industryIds", [])
        sids = aa.get("sectorIds", [])
        if industry_id and iids and industry_id in iids:
            total += 1; by_ind += 1; names_ind.append(aa["name"])
        elif sector_id and sids and sector_id in sids:
            total += 1; by_sec += 1; names_sec.append(aa["name"])
    return total, by_ind, by_sec, by_uni, names_ind, names_sec, names_uni

def count_fundings(sector_id):
    names = []
    for f in nav_fundings:
        secs = f.get("sector", [])
        if not secs:
            names.append(f["name"])
        elif sector_id and any(re.match(s, sector_id, re.I) for s in secs):
            names.append(f["name"])
    return len(names), names

# ============================================================
# Compute roadmap task differentiation
# ============================================================
universal_tasks = nav.get("universalTasks", [])

# Build task -> industry mapping (excluding universal tasks)
task_to_industries = {}
enabled_industries = {k: v for k, v in nav_industries.items() if v.get("isEnabled")}
for ind_id, ind in enabled_industries.items():
    for task in ind.get("roadmapTaskNames", []):
        if task in universal_tasks: continue
        if task not in task_to_industries:
            task_to_industries[task] = []
        task_to_industries[task].append(ind_id)

# For each industry, classify tasks as unique (only this industry) or shared
industry_task_analysis = {}
for ind_id, ind in enabled_industries.items():
    diff_tasks = [t for t in ind.get("roadmapTaskNames", []) if t not in universal_tasks]
    unique = [t for t in diff_tasks if len(task_to_industries.get(t, [])) == 1]
    shared = [t for t in diff_tasks if len(task_to_industries.get(t, [])) > 1]
    industry_task_analysis[ind_id] = {
        "allTasks": diff_tasks,
        "uniqueTaskNames": unique,
        "sharedTaskNames": shared,
        "totalTasks": len(diff_tasks),
        "uniqueTasks": len(unique),
        "sharedTasks": len(shared),
    }

# Build task frequency for output
task_frequency = {}
for task, inds_list in sorted(task_to_industries.items()):
    task_frequency[task] = {"count": len(inds_list), "industries": inds_list}

# Categorize each task in task_progress: universal, shared, unique, addon, or uncategorized
# Add-on tasks get colored by their potential reach (how many industries could trigger them)
addon_slugs = set(nav.get("addonTaskSlugs", []))
addon_reach = nav.get("addonTaskReach", {})
total_enabled = len([i for i in nav_industries.values() if i.get("isEnabled")])
for tp_entry in task_progress:
    name = tp_entry["task"]
    slug = task_name_to_slug.get(name, name)
    is_addon = slug in addon_slugs
    reach = addon_reach.get(slug, 0) if is_addon else 0
    if slug in universal_tasks or name in universal_tasks:
        tp_entry["category"] = "universal"
        tp_entry["isAddon"] = False
        tp_entry["reachCount"] = total_enabled
    elif slug in task_frequency:
        tp_entry["category"] = "shared" if task_frequency[slug]["count"] > 1 else "unique"
        tp_entry["isAddon"] = False
        tp_entry["reachCount"] = task_frequency[slug]["count"]
    elif name in task_frequency:
        tp_entry["category"] = "shared" if task_frequency[name]["count"] > 1 else "unique"
        tp_entry["isAddon"] = False
        tp_entry["reachCount"] = task_frequency[name]["count"]
    elif is_addon:
        if reach >= total_enabled:
            tp_entry["category"] = "universal"
        elif reach > 1:
            tp_entry["category"] = "shared"
        else:
            tp_entry["category"] = "unique"
        tp_entry["isAddon"] = True
        tp_entry["reachCount"] = reach
    else:
        tp_entry["category"] = "uncategorized"
        tp_entry["isAddon"] = False
        tp_entry["reachCount"] = 0

cat_counts = {}
for tp_entry in task_progress:
    c = tp_entry["category"]
    cat_counts[c] = cat_counts.get(c, 0) + 1
print(f"  Task categories: {cat_counts}")

# ============================================================
# Build combined industry data
# ============================================================
# Distinct paths per industry (from navigator analysis)
distinct_paths_map = {}
for dp in nav.get("distinctPaths", []):
    distinct_paths_map[dp["id"]] = dp["distinctPaths"]
total_distinct_paths = nav.get("totalDistinctPaths", 0)

combined_industries = []
for ind_id, ind in sorted(nav_industries.items(), key=lambda x: x[1]["name"]):
    if not ind.get("isEnabled"): continue

    assigned_sector = ind["defaultSectorId"]
    assigned_sector_name = nav_sectors.get(assigned_sector, {}).get("name", assigned_sector)
    suggested_sector = nav_mismatches.get(ind_id)
    suggested_sector_name = nav_sectors.get(suggested_sector, {}).get("name", "") if suggested_sector else ""

    # Match user count from XLSX by industry name (strip trailing spaces)
    users = industry_users.get(ind["name"].strip(), 0)

    # AA counts for STARTING path (has industryId + assigned sector)
    s_total, s_ind, s_sec, s_uni, s_ni, s_ns, s_nu = count_aa(ind_id, assigned_sector)
    s_fund, s_fnames = count_fundings(assigned_sector)

    # AA counts for OWNING path (no industryId, uses likely correct sector)
    owning_sector = suggested_sector or assigned_sector
    o_total, o_ind, o_sec, o_uni, o_ni, o_ns, o_nu = count_aa(None, owning_sector)
    o_fund, o_fnames = count_fundings(owning_sector)

    # What would STARTING see if sector were fixed?
    if suggested_sector:
        f_total, f_ind, f_sec, f_uni, f_ni, f_ns, f_nu = count_aa(ind_id, suggested_sector)
        f_fund, f_fnames = count_fundings(suggested_sector)
        missed_aa = f_total - s_total
        missed_fund = f_fund - s_fund
    else:
        f_total, missed_aa, missed_fund = s_total, 0, 0

    ta = industry_task_analysis.get(ind_id, {})

    combined_industries.append({
        "id": ind_id,
        "name": ind["name"],
        "users": users,
        "sector": assigned_sector,
        "sectorName": assigned_sector_name,
        "sectorMismatch": suggested_sector or None,
        "sectorMismatchName": suggested_sector_name or None,
        "roadmapTasks": ind["roadmapStepCount"],
        "nonEssentialQs": len(ind.get("nonEssentialQuestionsIds", [])),
        "distinctPaths": distinct_paths_map.get(ind_id, 0),
        "totalDiffTasks": ta.get("totalTasks", 0),
        "uniqueTasks": ta.get("uniqueTasks", 0),
        "sharedTasks": ta.get("sharedTasks", 0),
        "uniqueTaskNames": ta.get("uniqueTaskNames", []),
        "sharedTaskNames": ta.get("sharedTaskNames", []),
        "allDiffTasks": ta.get("allTasks", []),
        "starting": {
            "aaTotal": s_total, "aaByIndustry": s_ind, "aaBySector": s_sec, "aaUniversal": s_uni,
            "aaNamesByIndustry": s_ni, "aaNamesBySector": s_ns,
            "fundings": s_fund,
        },
        "owning": {
            "sector": owning_sector,
            "sectorName": nav_sectors.get(owning_sector,{}).get("name", owning_sector),
            "aaTotal": o_total, "aaBySector": o_sec, "aaUniversal": o_uni,
            "aaNamesBySector": o_ns,
            "fundings": o_fund,
        },
        "ifFixed": {
            "aaTotal": f_total if suggested_sector else None,
            "fundings": f_fund if suggested_sector else None,
            "missedAA": missed_aa,
            "missedFund": missed_fund,
        },
    })

# ============================================================
# Build sector summary
# ============================================================
sector_summary = []
for sid, sdata in sorted(nav_sectors.items(), key=lambda x: x[1]["name"]):
    mapped_industries = [i["id"] for i in combined_industries if i["sector"] == sid]
    mapped_users = sum(i["users"] for i in combined_industries if i["sector"] == sid)
    should_be_here = [ind_id for ind_id, suggested in nav_mismatches.items() if suggested == sid]
    aa_tagged = sum(1 for aa in nav_aa if sid in aa.get("sectorIds",[]))
    fund_tagged = sum(1 for f in nav_fundings if sid in f.get("sector",[]))
    sector_summary.append({
        "id": sid,
        "name": sdata["name"],
        "orphaned": sid in orphaned_sectors,
        "industryCount": len(mapped_industries),
        "users": mapped_users,
        "xlsxUsers": sector_users.get(sdata["name"], 0),
        "aaTagged": aa_tagged,
        "fundTagged": fund_tagged,
        "missingIndustries": should_be_here,
        "missingIndustriesNames": [nav_industries[i]["name"] for i in should_be_here if i in nav_industries],
    })

# ============================================================
# Build anytime action reachability
# ============================================================
aa_reach = []
for aa in nav_aa:
    reached = []
    for ind in combined_industries:
        iids = aa.get("industryIds",[])
        sids = aa.get("sectorIds",[])
        if aa.get("applyToAllUsers"):
            reached.append({"id": ind["id"], "match": "universal"})
        elif ind["id"] in iids:
            reached.append({"id": ind["id"], "match": "industryId"})
        elif ind["sector"] in sids:
            reached.append({"id": ind["id"], "match": "sectorId"})
    aa_reach.append({
        "id": aa["id"],
        "name": aa["name"],
        "categories": aa.get("categories",[]),
        "industryIds": aa.get("industryIds",[]),
        "sectorIds": aa.get("sectorIds",[]),
        "applyToAllUsers": aa.get("applyToAllUsers", False),
        "reachCount": len(reached),
        "reached": reached,
    })

# ============================================================
# Phase analysis
# ============================================================
starting_phases = ["GUEST_MODE","GUEST_MODE_WITH_BUSINESS_STRUCTURE","NEEDS_BUSINESS_STRUCTURE","NEEDS_TO_FORM","FORMED"]
operate_starting = ["UP_AND_RUNNING"]
owning_phases = ["GUEST_MODE_OWNING","UP_AND_RUNNING_OWNING"]
operate_phases = operate_starting + owning_phases

sees_roadmap = sum(phases.get(p,0) for p in starting_phases + ["REMOTE_SELLER_WORKER","DOMESTIC_EMPLOYER"])
sees_operate = sum(phases.get(p,0) for p in operate_phases)
sees_aa_and_funding = sum(phases.get(p,0) for p in ["UP_AND_RUNNING","UP_AND_RUNNING_OWNING","GUEST_MODE_OWNING"])

phase_summary = {
    "totalBusinesses": total_businesses,
    "seesRoadmap": sees_roadmap,
    "seesOperate": sees_operate,
    "seesAAFunding": sees_aa_and_funding,
    "phases": [{"phase": p, "count": c, "group":
        "starting" if p in starting_phases else
        "operate" if p in operate_phases else
        "other"
    } for p, c in sorted(phases.items(), key=lambda x: -x[1])],
}

# ============================================================
# Plurmit inventory analysis
# ============================================================
PLURMIT_FILE = os.path.join(ROOT, "data", "plurmits.xlsx")
plurmit_data = None

if os.path.exists(PLURMIT_FILE):
    print(f"Reading plurmits: {PLURMIT_FILE}")
    pwb = openpyxl.load_workbook(PLURMIT_FILE, data_only=True)
    pws = pwb["Plurmits-All Plurmits"]
    pheaders = [c.value for c in next(pws.iter_rows(min_row=1, max_row=1))]
    prows = []
    for prow in pws.iter_rows(min_row=2, values_only=True):
        if prow[0]: prows.append(dict(zip(pheaders, prow)))

    # Agency DB integrations (from codebase analysis)
    api_integrations = [
        {"agency":"NJ Treasury (NJFAST)","agencyShort":"Treasury","type":"Submit+Pay","tasks":["form-business-entity"],"aas":[],"desc":"Business entity formation filing and payment"},
        {"agency":"NICUSA / NJ Treasury","agencyShort":"NICUSA","type":"Query","tasks":["search-business-name","search-business-name-nexus"],"aas":[],"desc":"Business name availability search"},
        {"agency":"DCA — License Status (Dynamics 365)","agencyShort":"DCA","type":"Query","tasks":["apply-for-shop-license","appraiser-company-register","authorization-architect-firm","authorization-landscape-architect-firm","cemetery-certificate","consulting-firm-headhunter-reg","electrologist-office-license","entertainment-agency-reg","funeral-registration","health-club-registration","home-health-aide-license","license-massage-therapy","moving-company-license","oos-pharmacy-registration","pharmacy-license","register-accounting-firm","register-home-contractor","search-licenses-employment-agency","telemarketing-license","ticket-broker-reseller-registration","temp-help-consulting-firm-combined-reg","temporary-help-service-firm-reg"],"aas":[],"desc":"22 DCA license status lookups via Dynamics 365"},
        {"agency":"DCA — Elevator Safety (Dynamics 365)","agencyShort":"DCA","type":"Query+Register","tasks":["elevator-registration"],"aas":[],"desc":"Elevator registration, inspection, violations"},
        {"agency":"DCA — Housing (Dynamics 365)","agencyShort":"DCA","type":"Query","tasks":["hotel-motel-registration","multiple-dwelling-registration"],"aas":[],"desc":"Hotel/motel and multiple dwelling registration status"},
        {"agency":"DEP — CRTK","agencyShort":"DEP","type":"Query","tasks":["community-right-to-know-survey"],"aas":[],"desc":"Community Right to Know facility lookup"},
        {"agency":"DEP — X-ray Registration","agencyShort":"DEP","type":"Query","tasks":["xray-reg"],"aas":[],"desc":"X-ray equipment registration status"},
        {"agency":"NJ Treasury — Cigarette License","agencyShort":"Treasury","type":"Submit+Pay","tasks":["cigarette-license"],"aas":[],"desc":"Cigarette license application and payment"},
        {"agency":"ABC (Alcoholic Beverage Control)","agencyShort":"ABC","type":"Submit","tasks":[],"aas":["emergency-trip-permit"],"desc":"Emergency trip permit application"},
        {"agency":"NJ Treasury — Tax Clearance","agencyShort":"Treasury","type":"Submit","tasks":[],"aas":["tax-clearance-certificate"],"desc":"Tax clearance certificate request"},
        {"agency":"NJ Treasury — Tax Filing","agencyShort":"Treasury","type":"Query","tasks":[],"aas":[],"desc":"Tax filing calendar and deadlines","dashboard":"Filings Calendar"},
        {"agency":"DOL (Dept. of Labor)","agencyShort":"DOL","type":"Query","tasks":[],"aas":[],"desc":"Employer contribution rates","dashboard":"Employer Rates"},
        {"agency":"MyNJ","agencyShort":"MyNJ","type":"Submit","tasks":[],"aas":[],"desc":"MyNJ account self-registration","dashboard":"Account Creation"},
        {"agency":"Power Automate (Email Relay)","agencyShort":"MSFT","type":"Send","tasks":["env-requirements","community-right-to-know-survey"],"aas":[],"desc":"Sends personalized email for env/CRTK results"},
    ]

    api_task_slugs = set()
    api_aa_slugs = set()
    for ai in api_integrations:
        api_task_slugs.update(ai["tasks"])
        api_aa_slugs.update(ai["aas"])

    def ps(val): return str(val or "").strip()

    biz_keywords = ["yes this is","yes businesses often","yes the shop owner","yes businesses use","yes, but primarily"]
    all_ind_ids = set(k for k,v in nav_industries.items() if v.get("isEnabled"))

    plurmits_out = []
    for pr in prows:
        pname = ps(pr.get("Plurmit"))
        dept = ps(pr.get("Department"))
        biz_app = any(kw in ps(pr.get("Does this plurmit apply to businesses?")).lower() for kw in biz_keywords)
        online = ps(pr.get("Online Status [Normalized]"))
        if online == "None": online = ""
        worth = ps(pr.get("Worth Integrating or Mentioning?"))
        integ = ps(pr.get("Is it Integrated or mentioned yet?"))
        cms = ps(pr.get("Consumer Affairs Licenses in CMS"))
        if cms == "None": cms = ""
        bnj_ind = ps(pr.get("Relates to B.NJ Industry"))
        if bnj_ind == "None": bnj_ind = ""
        ind_muni = ps(pr.get("Industry [MUNI]"))
        if ind_muni == "None": ind_muni = ""
        mlo = ps(pr.get("MLO Profession (using Boomi)"))
        if mlo == "None": mlo = ""
        notes = ps(pr.get("Notes on integration/mention analysis"))
        if notes == "None": notes = ""
        vol_raw = ps(pr.get("Annual volume of submissions"))
        vol = 0
        try: vol = int(float(str(vol_raw).replace(",","")))
        except: pass

        # Integration level
        if integ in ["Read and/or Write","Yes"]:
            int_level = "api"
        elif integ == "Read":
            int_level = "read"
        elif integ == "Mentioned":
            int_level = "mentioned"
        else:
            int_level = "none"

        # Match to navigator tasks
        matched_tasks = []
        if cms:
            for tn, sl in task_name_to_slug.items():
                if sl in cms.lower() or tn.lower() in cms.lower():
                    if sl not in matched_tasks: matched_tasks.append(sl)
            for sl in set(task_name_to_slug.values()):
                if sl in cms.lower() and sl not in matched_tasks:
                    matched_tasks.append(sl)

        # Match to industries
        matched_inds = []
        for fv in [bnj_ind, ind_muni]:
            if not fv: continue
            for iid in all_ind_ids:
                if iid in fv.lower() or iid.replace("-"," ") in fv.lower():
                    if iid not in matched_inds: matched_inds.append(iid)

        # Check API integration
        has_api = any(t in api_task_slugs for t in matched_tasks)

        # Priority
        if "High Priority" in worth: pri = "high"
        elif "Low Priority" in worth: pri = "low"
        elif "Mention" in worth: pri = "mention"
        elif worth == "No": pri = "no"
        else: pri = "unassessed"

        plurmits_out.append({
            "name": pname, "department": dept, "bizApplicable": biz_app,
            "onlineStatus": online, "integrationLevel": int_level, "priority": pri,
            "volume": vol, "matchedTasks": matched_tasks, "matchedIndustries": matched_inds,
            "hasApi": has_api, "cmsLink": cms[:120], "notes": notes[:200],
        })

    # Department summary
    dept_sum = {}
    for p in plurmits_out:
        d = p["department"]
        if d not in dept_sum:
            dept_sum[d] = {"name":d,"total":0,"bizApplicable":0,"mentioned":0,"read":0,"api":0,"none":0,"highPri":0,"lowPri":0,"online":0,"volume":0}
        ds = dept_sum[d]
        ds["total"] += 1; ds["volume"] += p["volume"]
        if p["bizApplicable"]: ds["bizApplicable"] += 1
        if p["onlineStatus"] in ["Available","Submitted"]: ds["online"] += 1
        ds[p["integrationLevel"]] += 1
        if p["priority"] == "high": ds["highPri"] += 1
        if p["priority"] == "low": ds["lowPri"] += 1

    # Industry -> plurmit count
    ind_plurmit_map = {}
    for p in plurmits_out:
        for iid in p["matchedIndustries"]:
            if iid not in ind_plurmit_map:
                ind_plurmit_map[iid] = {"total":0,"integrated":0,"api":0,"names":[]}
            ind_plurmit_map[iid]["total"] += 1
            if p["integrationLevel"] in ["mentioned","read","api"]: ind_plurmit_map[iid]["integrated"] += 1
            if p["hasApi"]: ind_plurmit_map[iid]["api"] += 1
            ind_plurmit_map[iid]["names"].append(p["name"])

    biz_only = [p for p in plurmits_out if p["bizApplicable"]]
    total_vol = sum(p["volume"] for p in plurmits_out)
    biz_vol = sum(p["volume"] for p in biz_only)
    api_pls = [p for p in biz_only if p["hasApi"] or p["integrationLevel"]=="api"]
    info_pls = [p for p in biz_only if p["matchedTasks"] and not p["hasApi"] and p["integrationLevel"]!="api"]
    read_pls = [p for p in biz_only if p["integrationLevel"]=="read" and not p["matchedTasks"] and not p["hasApi"]]
    ment_pls = [p for p in biz_only if p["integrationLevel"]=="mentioned" and not p["matchedTasks"]]
    none_pls = [p for p in biz_only if p["integrationLevel"]=="none" and not p["matchedTasks"] and not p["hasApi"]]

    # Compute actual BNJ engagement per category
    slug_eng = {}
    slug_comp = {}
    for tp_row in task_progress:
        tn = tp_row["task"]
        sl = task_name_to_slug.get(tn, tn)
        slug_eng[sl] = slug_eng.get(sl, 0) + tp_row["total"]
        slug_comp[sl] = slug_comp.get(sl, 0) + tp_row["completed"]

    def cat_engagement(permits, include_unmatched_api=False):
        seen = set()
        total_eng, total_comp = 0, 0
        for p in permits:
            for t in p["matchedTasks"]:
                if t not in seen:
                    seen.add(t)
                    total_eng += slug_eng.get(t, 0)
                    total_comp += slug_comp.get(t, 0)
        # For api-level permits without matched tasks, include engagement from
        # all API integration task slugs (e.g. formation, business name search)
        if include_unmatched_api:
            for ai in api_integrations:
                for t in ai["tasks"] + ai["aas"]:
                    if t not in seen:
                        seen.add(t)
                        total_eng += slug_eng.get(t, 0)
                        total_comp += slug_comp.get(t, 0)
        return total_eng, total_comp

    api_eng, api_comp = cat_engagement(api_pls, include_unmatched_api=True)
    info_eng, info_comp = cat_engagement(info_pls)
    read_eng, read_comp = cat_engagement(read_pls)
    ment_eng, ment_comp = cat_engagement(ment_pls)
    all_eng = api_eng + info_eng + read_eng + ment_eng
    all_comp = api_comp + info_comp + read_comp + ment_comp

    hi_gaps = [{"name":p["name"],"department":p["department"],"volume":p["volume"],"notes":p["notes"]}
               for p in sorted(biz_only, key=lambda x:-x["volume"]) if p["priority"]=="high" and p["integrationLevel"]=="none"]

    plurmit_data = {
        "coverage": {
            "total": len(plurmits_out),
            "totalVolume": total_vol,
            "bizApplicable": len(biz_only),
            "bizVolume": biz_vol,
            "bizApi": len(api_pls),
            "bizApiVol": sum(p["volume"] for p in api_pls),
            "bizApiEng": api_eng, "bizApiComp": api_comp,
            "bizInfo": len(info_pls),
            "bizInfoVol": sum(p["volume"] for p in info_pls),
            "bizInfoEng": info_eng, "bizInfoComp": info_comp,
            "bizRead": len(read_pls),
            "bizReadVol": sum(p["volume"] for p in read_pls),
            "bizReadEng": read_eng, "bizReadComp": read_comp,
            "bizMentioned": len(ment_pls),
            "bizMentionedVol": sum(p["volume"] for p in ment_pls),
            "bizMentionedEng": ment_eng, "bizMentionedComp": ment_comp,
            "bizNone": len(none_pls),
            "bizNoneVol": sum(p["volume"] for p in none_pls),
            "bizAllEng": all_eng, "bizAllComp": all_comp,
            "bizHighPri": sum(1 for p in biz_only if p["priority"]=="high"),
            "bizLowPri": sum(1 for p in biz_only if p["priority"]=="low"),
            "highPriGaps": hi_gaps,
        },
        "departments": sorted(dept_sum.values(), key=lambda x:-x["total"]),
        "apiIntegrations": api_integrations,
        "apiTaskSlugs": sorted(api_task_slugs),
        "apiTaskNames": sorted(set(tn for tn, sl in task_name_to_slug.items() if sl in api_task_slugs)),
        "apiAASlugs": sorted(api_aa_slugs),
        "industryPlurmitMap": ind_plurmit_map,
        "plurmits": [{"name":p["name"],"dept":p["department"],"biz":p["bizApplicable"],
                      "online":p["onlineStatus"],"level":p["integrationLevel"],"pri":p["priority"],
                      "vol":p["volume"],"tasks":p["matchedTasks"],"inds":p["matchedIndustries"],
                      "api":p["hasApi"]} for p in biz_only],
    }
    print(f"  Plurmits: {len(plurmits_out)} total, {len(biz_only)} business-applicable")
    print(f"  API-connected tasks: {len(api_task_slugs)}, API-connected AAs: {len(api_aa_slugs)}")

# Track XLSX industries that didn't match any navigator industry
matched_names = set(ind["name"].strip() for ind in nav_industries.values() if ind.get("isEnabled"))
unmatched_xlsx = []
for name, cnt in industry_users.items():
    if name not in matched_names:
        unmatched_xlsx.append({"name": name, "users": cnt})

# ============================================================
# Output
# ============================================================
output = {
    "meta": {
        "xlsxFile": os.path.basename(XLSX),
        "totalBusinesses": total_businesses,
        "totalUsers": sum(phases.values()),
    },
    "industries": combined_industries,
    "sectors": sector_summary,
    "anytimeActions": aa_reach,
    "phases": phase_summary,
    "taskProgress": task_progress,
    "nonEssentialQuestions": neq_data,
    "legalStructures": legal_data,
    "orphanedSectors": sorted(orphaned_sectors),
    "sectorMismatches": nav_mismatches,
    "taskFrequency": task_frequency,
    "universalTasks": universal_tasks,
    "totalDiffTasks": len(task_to_industries),
    "totalDistinctPaths": total_distinct_paths,
    "permitCoverage": plurmit_data,
    "unknowns": {
        "industry": unknown_industry,
        "sector": unknown_sector,
        "phase": unknown_phase,
        "legalStructure": unknown_legal,
        "unmatchedIndustries": unmatched_xlsx,
        "totalAccountedFor": total_businesses,
        "totalWithUnknowns": total_businesses + unknown_phase,
    },
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as fh:
    json.dump(output, fh)

# Pretty version for debugging
with open(OUT.replace(".json",".pretty.json"), "w") as fh:
    json.dump(output, fh, indent=2)

print(f"\nWritten to {OUT}")
print(f"  Industries: {len(combined_industries)}")
print(f"  Sectors: {len(sector_summary)} ({len(orphaned_sectors)} orphaned)")
print(f"  Anytime Actions: {len(aa_reach)}")
print(f"  Fundings in nav: {len(nav_fundings)}")
print(f"  Phases: {len(phases)}")
print(f"  Mismatches: {len(nav_mismatches)}")
