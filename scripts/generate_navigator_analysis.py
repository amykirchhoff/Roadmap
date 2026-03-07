#!/usr/bin/env python3
"""
Generate navigator_analysis.json from the navigator.business.nj.gov codebase.

Usage:
    python scripts/generate_navigator_analysis.py /path/to/navigator.business.nj.gov

Outputs data/navigator_analysis.json.
Only needed when the navigator codebase changes (new industries, sector changes, etc.)
"""
import json, os, re, sys

if len(sys.argv) < 2:
    print("Usage: python scripts/generate_navigator_analysis.py /path/to/navigator.business.nj.gov")
    sys.exit(1)

NAV_ROOT = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "navigator_analysis.json")

def parse_md(filepath):
    with open(filepath) as fh:
        content = fh.read()
    if not content.startswith("---"): return {}
    parts = content.split("---", 2)
    if len(parts) < 3: return {}
    fm = parts[1]
    result = {}
    for field in ["id","name","applyToAllUsers","moveToRecommendedForYouSection","fundingType","status","homeBased","publishStageArchive"]:
        m = re.search(rf'^{field}:\s*(.+)$', fm, re.MULTILINE)
        if m:
            val = m.group(1).strip().strip('"').strip("'")
            if val == "true": val = True
            elif val == "false": val = False
            result[field] = val
    for field in ["industryIds","sectorIds","sector","category","applicableOwnershipTypes","county","agency"]:
        m = re.search(rf'^{field}:\s*\n((?:\s+-\s+.+\n)*)', fm, re.MULTILINE)
        if m:
            result[field] = [s.strip().strip('"').strip("'") for s in re.findall(r'^\s+-\s+(.+)$', m.group(1), re.MULTILINE)]
        else:
            m2 = re.search(rf'^{field}:\s*\[\]', fm, re.MULTILINE)
            if m2: result[field] = []
    return result

# Industries
industries = {}
ind_dir = os.path.join(NAV_ROOT, "content/src/roadmaps/industries")
for f in os.listdir(ind_dir):
    if f.endswith(".json"):
        d = json.load(open(os.path.join(ind_dir, f)))
        industries[d["id"]] = {
            "name": d.get("name",""),
            "defaultSectorId": d.get("defaultSectorId",""),
            "isEnabled": d.get("isEnabled", False),
            "canHavePermanentLocation": d.get("canHavePermanentLocation", False),
            "naicsCodes": d.get("naicsCodes",""),
            "nonEssentialQuestionsIds": d.get("nonEssentialQuestionsIds",[]),
            "industryOnboardingQuestions": d.get("industryOnboardingQuestions",{}),
            "roadmapStepCount": len([s for s in d.get("roadmapSteps",[]) if s.get("task") or s.get("licenseTask")]),
            "roadmapTaskNames": [s.get("task") or s.get("licenseTask") for s in d.get("roadmapSteps",[]) if s.get("task") or s.get("licenseTask")],
        }

# Sectors
sector_data = json.load(open(os.path.join(NAV_ROOT, "content/src/mappings/sectors.json")))
sectors = {s["id"]: {"name": s["name"], "nonEssentialQuestionsIds": s.get("nonEssentialQuestionsIds",[])} for s in sector_data["arrayOfSectors"]}

# Add-ons
addons = {}
addon_dir = os.path.join(NAV_ROOT, "content/src/roadmaps/add-ons")
for f in os.listdir(addon_dir):
    if f.endswith(".json"):
        d = json.load(open(os.path.join(addon_dir, f)))
        addons[d["id"]] = {"taskCount": len(d.get("roadmapSteps",[])), "modifications": d.get("modifications",[])}

# Anytime actions
anytime_actions = []
aa_dir = os.path.join(NAV_ROOT, "content/src/anytime-action-tasks")
for f in sorted(os.listdir(aa_dir)):
    if f.endswith(".md"):
        fm = parse_md(os.path.join(aa_dir, f))
        cats = fm.get("category",[])
        if cats and len(cats)==1 and cats[0]=="only-show-in-subtask": continue
        anytime_actions.append({
            "id": fm.get("id",""), "name": fm.get("name",""), "filename": f.replace(".md",""),
            "applyToAllUsers": fm.get("applyToAllUsers", False),
            "industryIds": fm.get("industryIds",[]), "sectorIds": fm.get("sectorIds",[]),
            "categories": fm.get("category",[]),
        })

# Fundings
fundings = []
fund_dir = os.path.join(NAV_ROOT, "content/src/fundings")
for f in sorted(os.listdir(fund_dir)):
    if f.endswith(".md"):
        fm = parse_md(os.path.join(fund_dir, f))
        if fm.get("publishStageArchive") == "Do Not Publish": continue
        fundings.append({
            "id": fm.get("id",""), "name": fm.get("name",""), "filename": f.replace(".md",""),
            "sector": fm.get("sector",[]), "fundingType": fm.get("fundingType",""), "status": fm.get("status",""),
        })

# Certifications
certifications = []
cert_dir = os.path.join(NAV_ROOT, "content/src/certifications")
for f in sorted(os.listdir(cert_dir)):
    if f.endswith(".md"):
        fm = parse_md(os.path.join(cert_dir, f))
        certifications.append({
            "id": fm.get("id",""), "name": fm.get("name",""),
            "applicableOwnershipTypes": fm.get("applicableOwnershipTypes",[]),
        })

# Sector mismatches — update this list if you identify new mismatches
sector_mismatches = {
    "trucking": "transportation-and-warehousing",
    "freight-forwarding": "transportation-and-warehousing",
    "moving-company": "transportation-and-warehousing",
    "courier": "transportation-and-warehousing",
    "logistics": "transportation-and-warehousing",
    "car-service": "transportation-and-warehousing",
    "car-rental": "transportation-and-warehousing",
    "school-bus": "transportation-and-warehousing",
    "electrical-contractor": "construction",
    "acupuncture": "health-care-and-social-assistance",
    "healthcare": "health-care-and-social-assistance",
    "funeral": "health-care-and-social-assistance",
    "petcare": "health-care-and-social-assistance",
    "residential-landlord": "real-estate",
}

# Task name -> slug mapping (from task markdown files)
task_name_to_slug = {}
for task_subdir in ["content/src/roadmaps/tasks", "content/src/roadmaps/license-tasks"]:
    task_path = os.path.join(NAV_ROOT, task_subdir)
    if not os.path.isdir(task_path): continue
    for f in os.listdir(task_path):
        if not f.endswith(".md"): continue
        slug = f.replace(".md", "")
        with open(os.path.join(task_path, f)) as fh:
            content = fh.read()
        m = re.search(r'^name:\s*"?(.+?)"?\s*$', content, re.MULTILINE)
        if m:
            name = m.group(1).strip().strip('"').strip("'")
            task_name_to_slug[name] = slug

# Add-on task slugs and reach (how many industries could trigger each)
addon_dir_path = os.path.join(NAV_ROOT, "content/src/roadmaps/add-ons")
addon_task_slugs = set()
all_enabled_ids = set(k for k, v in industries.items() if v.get("isEnabled"))
perm_loc_ids = set(k for k, v in industries.items() if v.get("isEnabled") and v.get("canHavePermanentLocation"))

# Build NEQ -> industries mapping (including sector-level)
neq_to_inds = {}
for iid, ind in industries.items():
    if not ind.get("isEnabled"): continue
    for q in ind.get("nonEssentialQuestionsIds", []):
        neq_to_inds.setdefault(q, set()).add(iid)
sector_json = json.load(open(os.path.join(NAV_ROOT, "content/src/mappings/sectors.json")))
for s in sector_json["arrayOfSectors"]:
    for q in s.get("nonEssentialQuestionsIds", []):
        for iid, ind in industries.items():
            if ind.get("isEnabled") and ind.get("defaultSectorId") == s["id"]:
                neq_to_inds.setdefault(q, set()).add(iid)

legal_addons = {"llc","scorp","nonprofit","nonprofit-and-corp-foreign","public-record-filing","public-record-filing-foreign"}
broad_addons = {"trade-name","foreign-nexus","foreign-remote-seller","foreign-remote-worker","resale-certificate","nj-seller-streamlined-sales-tax"}
perm_addons = {"permanent-location-business","permanent-location-business-landlord"}

addon_task_reach = {}
for f in sorted(os.listdir(addon_dir_path)):
    if not f.endswith(".json"): continue
    d = json.load(open(os.path.join(addon_dir_path, f)))
    aid = d["id"]
    tasks = [s.get("task") or s.get("licenseTask") for s in d.get("roadmapSteps",[]) if s.get("task") or s.get("licenseTask")]
    for t in tasks: addon_task_slugs.add(t)
    if aid in legal_addons or aid in broad_addons:
        reach = all_enabled_ids
    elif aid in perm_addons or "home-based" in aid or "produce-insurance" in aid:
        reach = perm_loc_ids
    else:
        reach = set()
        for neq_id, inds_set in neq_to_inds.items():
            if neq_id in aid or aid in neq_id or aid.replace("-add","") in neq_id or aid.split("-")[0] in neq_id:
                reach |= inds_set
        if not reach:
            for iid, ind in industries.items():
                if not ind.get("isEnabled"): continue
                ioq = ind.get("industryOnboardingQuestions", {})
                if isinstance(ioq, dict) and aid in str(ioq):
                    reach.add(iid)
        if not reach:
            reach = {list(all_enabled_ids)[0]}
    for t in tasks:
        addon_task_reach.setdefault(t, set())
        addon_task_reach[t] |= reach

output = {
    "industries": industries, "sectors": sectors, "addons": addons,
    "anytimeActions": anytime_actions, "fundings": fundings,
    "certifications": certifications, "sectorMismatches": sector_mismatches,
    "universalTasks": ["bank-account","business-plan","business-structure","determine-naics-code",
                       "manage-business-vehicles","register-for-ein","register-for-taxes"],
    "taskNameToSlug": task_name_to_slug,
    "addonTaskSlugs": sorted(addon_task_slugs),
    "addonTaskReach": {slug: len(ids) for slug, ids in addon_task_reach.items()},
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as fh:
    json.dump(output, fh, indent=2)

print(f"Written to {OUT}")
print(f"  Industries: {len(industries)}, Sectors: {len(sectors)}")
print(f"  Anytime Actions: {len(anytime_actions)}, Fundings: {len(fundings)}")
print(f"  Mismatches: {len(sector_mismatches)}")
