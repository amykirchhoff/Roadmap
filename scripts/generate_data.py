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
for row in xlsx_industries:
    raw = (row.get("Industry") or "").strip()
    if not raw or raw == "Unknown": continue
    name = raw.split("\n")[0].strip()
    industry_users[name] = int(row.get("Count") or 0)

# Build sector user counts
sector_users = {}
for row in xlsx_sectors:
    raw = (row.get("Sector") or "").strip()
    if not raw or raw == "Unknown": continue
    name = raw.split("\n")[0].strip()
    sector_users[name] = int(row.get("Count") or 0)

# Operating phases
phases = {}
total_businesses = 0
for row in xlsx_phases:
    phase = (row.get("Phase") or "").strip()
    if not phase or phase == "Unknown": continue
    cnt = int(row.get("Count") or 0)
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
for row in xlsx_legal:
    cat = (row.get("Category") or "").strip()
    if not cat or cat == "Unknown": continue
    legal_data.append({"structure": cat, "count": int(row.get("Count") or 0)})

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
# Build combined industry data
# ============================================================
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
    "taskProgress": task_progress[:80],
    "nonEssentialQuestions": neq_data,
    "legalStructures": legal_data,
    "orphanedSectors": sorted(orphaned_sectors),
    "sectorMismatches": nav_mismatches,
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
