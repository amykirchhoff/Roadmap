import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, CartesianGrid, PieChart, Pie } from "recharts";

const DATA = {"industries":[{"name":"Acupuncture","fname":"acupuncture","users":186.0,"pct":0.1,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance","rmw-generator-registration"],"allTasks":["get-insurance","rmw-generator-registration"]},{"name":"Architecture and Urban Planning ","fname":"architecture","users":742.0,"pct":0.3,"totalTasks":5,"uniqueTasks":4,"sharedTasks":1,"uniqueTaskNames":["architect-are-exam","architect-license","authorization-architect-firm","professional-planner-license"],"sharedTaskNames":["get-insurance"],"allTasks":["architect-are-exam","architect-license","authorization-architect-firm","get-insurance","professional-planner-license"]},{"name":"Auto-Body Repair","fname":"auto-body-repair","users":1003.0,"pct":0.4,"totalTasks":5,"uniqueTasks":2,"sharedTasks":3,"uniqueTaskNames":["auto-body-repair-license","spray-paint-booth-permit-auto-body-repair"],"sharedTaskNames":["community-right-to-know-survey","env-requirements","resale-tax-certificate-operating"],"allTasks":["auto-body-repair-license","community-right-to-know-survey","env-requirements","resale-tax-certificate-operating","spray-paint-booth-permit-auto-body-repair"]},{"name":"Cannabis","fname":"cannabis","users":2225.0,"pct":0.9,"totalTasks":10,"uniqueTasks":8,"sharedTasks":2,"uniqueTaskNames":["building-permit","cannabis-bank-account","cannabis-evaluate-location","cannabis-insurance-policy","cannabis-sign-lease","cannabis-site-requirements","priority-status-cannabis","zoning-cannabis"],"sharedTaskNames":["env-requirements","town-mercantile-license"],"allTasks":["building-permit","cannabis-bank-account","cannabis-evaluate-location","cannabis-insurance-policy","cannabis-sign-lease","cannabis-site-requirements","env-requirements","priority-status-cannabis","town-mercantile-license","zoning-cannabis"]},{"name":"Car Rental and Dealerships ","fname":"car-rental","users":553.0,"pct":0.2,"totalTasks":6,"uniqueTasks":1,"sharedTasks":5,"uniqueTaskNames":["vehicle-dealership"],"sharedTaskNames":["community-right-to-know-survey","get-insurance","mvc-registration-task","mvc-title-task","transportation-entity-id"],"allTasks":["community-right-to-know-survey","get-insurance","mvc-registration-task","mvc-title-task","transportation-entity-id","vehicle-dealership"]},{"name":"Transportation and Car Service","fname":"car-service","users":1.0,"pct":0,"totalTasks":8,"uniqueTasks":0,"sharedTasks":8,"uniqueTaskNames":[],"sharedTaskNames":["mvc-registration-task","mvc-title-task","passenger-transport-cdl","transportation-cpcn","transportation-entity-id","transportation-inspection","trucking-ifta","trucking-irp"],"allTasks":["mvc-registration-task","mvc-title-task","passenger-transport-cdl","transportation-cpcn","transportation-entity-id","transportation-inspection","trucking-ifta","trucking-irp"]},{"name":"Cemetery","fname":"cemetery","users":3.0,"pct":0,"totalTasks":4,"uniqueTasks":3,"sharedTasks":1,"uniqueTaskNames":["cemetery-branch","cemetery-certificate","cemetery-sales"],"sharedTaskNames":["get-insurance"],"allTasks":["cemetery-branch","cemetery-certificate","cemetery-sales","get-insurance"]},{"name":"Accounting, Bookkeeping, and Tax Preparation","fname":"certified-public-accountant","users":2417.0,"pct":0.9,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["register-accounting-firm"],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance","register-accounting-firm"]},{"name":"Cleaning and Janitorial Services","fname":"cleaning-janitorial-services","users":6075.0,"pct":2.4,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Construction","fname":"commercial-construction","users":4714.0,"pct":1.8,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["env-requirements"],"allTasks":["env-requirements"]},{"name":"Cosmetology","fname":"cosmetology","users":4257.0,"pct":1.6,"totalTasks":5,"uniqueTasks":2,"sharedTasks":3,"uniqueTaskNames":["apply-for-shop-license","cosmetology-license"],"sharedTaskNames":["env-requirements","get-insurance","resale-tax-certificate-operating"],"allTasks":["apply-for-shop-license","cosmetology-license","env-requirements","get-insurance","resale-tax-certificate-operating"]},{"name":"Courier Service","fname":"courier","users":1363.0,"pct":0.5,"totalTasks":0,"uniqueTasks":0,"sharedTasks":0,"uniqueTaskNames":[],"sharedTaskNames":[],"allTasks":[]},{"name":"Childcare Center","fname":"daycare","users":767.0,"pct":0.3,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["env-requirements","get-insurance"],"allTasks":["env-requirements","get-insurance"]},{"name":"Detective Agency","fname":"detective","users":141.0,"pct":0.1,"totalTasks":3,"uniqueTasks":2,"sharedTasks":1,"uniqueTaskNames":["detective-agency-license","detective-employees"],"sharedTaskNames":["get-insurance"],"allTasks":["detective-agency-license","detective-employees","get-insurance"]},{"name":"Domestic Employer","fname":"domestic-employer","users":137.0,"pct":0.1,"totalTasks":2,"uniqueTasks":2,"sharedTasks":0,"uniqueTaskNames":["domestic-employer-register-for-taxes","register-for-ein-domestic-employer"],"sharedTaskNames":[],"allTasks":["domestic-employer-register-for-taxes","register-for-ein-domestic-employer"]},{"name":"Online Business","fname":"e-commerce","users":21040.0,"pct":8.1,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance","resale-tax-certificate-operating"],"allTasks":["get-insurance","resale-tax-certificate-operating"]},{"name":"Electrical Contractor","fname":"electrical-contractor","users":296.0,"pct":0.1,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["electrical-business-license"],"sharedTaskNames":["community-right-to-know-survey"],"allTasks":["community-right-to-know-survey","electrical-business-license"]},{"name":"Employment Agency","fname":"employment-agency","users":846.0,"pct":0.3,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["understand-license-requirements-employment-agency"],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance","understand-license-requirements-employment-agency"]},{"name":"Engineering and Land Surveying","fname":"engineering","users":878.0,"pct":0.3,"totalTasks":3,"uniqueTasks":3,"sharedTasks":0,"uniqueTaskNames":["firm-engineer","land-surveyor-license","license-engineer"],"sharedTaskNames":[],"allTasks":["firm-engineer","land-surveyor-license","license-engineer"]},{"name":"Event Planning","fname":"event-planning","users":2248.0,"pct":0.9,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Finance and Insurance","fname":"finance-insurance","users":441.0,"pct":0.2,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance","search-licenses"],"allTasks":["get-insurance","search-licenses"]},{"name":"Food Truck","fname":"food-truck","users":2905.0,"pct":1.1,"totalTasks":13,"uniqueTasks":5,"sharedTasks":8,"uniqueTaskNames":["apply-for-food-truck-license","evaluate-your-location","fire-permit-food-truck","sign-lease-food-truck","zoning-food-truck"],"sharedTaskNames":["food-safety-course","get-insurance","mvc-registration-task","mvc-title-task","resale-tax-certificate-operating","town-mercantile-license","transportation-entity-id","trucking-cdl"],"allTasks":["apply-for-food-truck-license","evaluate-your-location","fire-permit-food-truck","food-safety-course","get-insurance","mvc-registration-task","mvc-title-task","resale-tax-certificate-operating","sign-lease-food-truck","town-mercantile-license","transportation-entity-id","trucking-cdl","zoning-food-truck"]},{"name":"Freight Forwarding","fname":"freight-forwarding","users":1229.0,"pct":0.5,"totalTasks":7,"uniqueTasks":0,"sharedTasks":7,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance","mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-cdl","trucking-ifta","trucking-irp"],"allTasks":["get-insurance","mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-cdl","trucking-ifta","trucking-irp"]},{"name":"Funeral Services","fname":"funeral","users":12.0,"pct":0,"totalTasks":4,"uniqueTasks":2,"sharedTasks":2,"uniqueTaskNames":["funeral-registration","mortuary-practitioner"],"sharedTaskNames":["env-requirements","rmw-generator-registration"],"allTasks":["env-requirements","funeral-registration","mortuary-practitioner","rmw-generator-registration"]},{"name":"All Other Businesses","fname":"generic","users":99775.0,"pct":38.6,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance","search-licenses"],"allTasks":["get-insurance","search-licenses"]},{"name":"Graphic Design","fname":"graphic-design","users":1376.0,"pct":0.5,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Health Club","fname":"health-club","users":785.0,"pct":0.3,"totalTasks":3,"uniqueTasks":1,"sharedTasks":2,"uniqueTaskNames":["health-club-registration"],"sharedTaskNames":["env-requirements","get-insurance"],"allTasks":["env-requirements","get-insurance","health-club-registration"]},{"name":"Healthcare","fname":"healthcare","users":6310.0,"pct":2.4,"totalTasks":6,"uniqueTasks":2,"sharedTasks":4,"uniqueTaskNames":["cds-healthcare","healthcare-license"],"sharedTaskNames":["community-right-to-know-survey","env-requirements","get-insurance","rmw-generator-registration"],"allTasks":["cds-healthcare","community-right-to-know-survey","env-requirements","get-insurance","healthcare-license","rmw-generator-registration"]},{"name":"Home Baker","fname":"home-baker","users":1431.0,"pct":0.6,"totalTasks":3,"uniqueTasks":1,"sharedTasks":2,"uniqueTaskNames":["home-baker-license"],"sharedTaskNames":["get-insurance","resale-tax-certificate-operating"],"allTasks":["get-insurance","home-baker-license","resale-tax-certificate-operating"]},{"name":"Home Improvement Contractor","fname":"home-contractor","users":7283.0,"pct":2.8,"totalTasks":2,"uniqueTasks":2,"sharedTasks":0,"uniqueTaskNames":["get-insurance-home-contractor","register-home-contractor"],"sharedTaskNames":[],"allTasks":["get-insurance-home-contractor","register-home-contractor"]},{"name":"Home Health Aide Placement","fname":"home-health-aide","users":339.0,"pct":0.1,"totalTasks":4,"uniqueTasks":2,"sharedTasks":2,"uniqueTaskNames":["home-health-aide-license","individual-staff-licenses-health-aide"],"sharedTaskNames":["get-insurance","rmw-generator-registration"],"allTasks":["get-insurance","home-health-aide-license","individual-staff-licenses-health-aide","rmw-generator-registration"]},{"name":"HVAC Contractor","fname":"hvac-contractor","users":636.0,"pct":0.2,"totalTasks":2,"uniqueTasks":2,"sharedTasks":0,"uniqueTaskNames":["hvac-insurance-surety-bond","hvac-license"],"sharedTaskNames":[],"allTasks":["hvac-insurance-surety-bond","hvac-license"]},{"name":"Entertainment","fname":"independent-artist","users":4633.0,"pct":1.8,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Interior Design","fname":"interior-designer","users":660.0,"pct":0.3,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["certified-interior-designer"],"sharedTaskNames":["get-insurance"],"allTasks":["certified-interior-designer","get-insurance"]},{"name":"IT Consulting","fname":"it-consultant","users":4648.0,"pct":1.8,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance","resale-tax-certificate-operating"],"allTasks":["get-insurance","resale-tax-certificate-operating"]},{"name":"Landscape Architecture","fname":"landscape-architecture","users":136.0,"pct":0.1,"totalTasks":3,"uniqueTasks":2,"sharedTasks":1,"uniqueTaskNames":["authorization-landscape-architect-firm","landscape-architect-license"],"sharedTaskNames":["get-insurance"],"allTasks":["authorization-landscape-architect-firm","get-insurance","landscape-architect-license"]},{"name":"Legal Services","fname":"law-firm","users":922.0,"pct":0.4,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["state-bar-attorney"],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance","state-bar-attorney"]},{"name":"Lawn Care","fname":"lawn-care","users":1456.0,"pct":0.6,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["env-requirements"],"allTasks":["env-requirements"]},{"name":"Lodging","fname":"lodging","users":154.0,"pct":0.1,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["env-requirements","get-insurance"],"allTasks":["env-requirements","get-insurance"]},{"name":"Logistics","fname":"logistics","users":1244.0,"pct":0.5,"totalTasks":5,"uniqueTasks":0,"sharedTasks":5,"uniqueTaskNames":[],"sharedTaskNames":["env-requirements","mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-cdl"],"allTasks":["env-requirements","mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-cdl"]},{"name":"Management Consulting","fname":"management-consulting","users":7364.0,"pct":2.8,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Marketing and PR Consulting","fname":"marketing-pr-consulting","users":2940.0,"pct":1.1,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Massage Therapy","fname":"massage-therapy","users":567.0,"pct":0.2,"totalTasks":3,"uniqueTasks":3,"sharedTasks":0,"uniqueTaskNames":["insurance-massage-therapy","license-massage-therapy","verify-license-massage-therapy"],"sharedTaskNames":[],"allTasks":["insurance-massage-therapy","license-massage-therapy","verify-license-massage-therapy"]},{"name":"Moving Company","fname":"moving-company","users":375.0,"pct":0.1,"totalTasks":6,"uniqueTasks":2,"sharedTasks":4,"uniqueTaskNames":["moving-company-insurance","moving-company-license"],"sharedTaskNames":["mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-cdl"],"allTasks":["moving-company-insurance","moving-company-license","mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-cdl"]},{"name":"Non-Medical Transport","fname":"non-medical-transport","users":616.0,"pct":0.2,"totalTasks":9,"uniqueTasks":2,"sharedTasks":7,"uniqueTaskNames":["logisticare","payment-structure-non-medical-trans"],"sharedTaskNames":["get-insurance","mvc-registration-task","mvc-title-task","passenger-transport-cdl","transportation-cpcn","transportation-entity-id","transportation-inspection"],"allTasks":["get-insurance","logisticare","mvc-registration-task","mvc-title-task","passenger-transport-cdl","payment-structure-non-medical-trans","transportation-cpcn","transportation-entity-id","transportation-inspection"]},{"name":"Notary Public","fname":"notary-public","users":1016.0,"pct":0.4,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["notary-register"],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance","notary-register"]},{"name":"Pest Control","fname":"pest-control","users":60.0,"pct":0,"totalTasks":4,"uniqueTasks":2,"sharedTasks":2,"uniqueTaskNames":["commercial-pest-applicator-license","pest-applicator-business-license"],"sharedTaskNames":["get-insurance","search-licenses"],"allTasks":["commercial-pest-applicator-license","get-insurance","pest-applicator-business-license","search-licenses"]},{"name":"Pet Care","fname":"petcare","users":893.0,"pct":0.3,"totalTasks":3,"uniqueTasks":0,"sharedTasks":3,"uniqueTaskNames":[],"sharedTaskNames":["env-requirements","resale-tax-certificate-operating","rmw-generator-registration"],"allTasks":["env-requirements","resale-tax-certificate-operating","rmw-generator-registration"]},{"name":"Pharmacy","fname":"pharmacy","users":102.0,"pct":0,"totalTasks":8,"uniqueTasks":4,"sharedTasks":4,"uniqueTaskNames":["pharmacy-cds","pharmacy-license","pharmacy-prepare","pharmacy-staff-licenses"],"sharedTaskNames":["community-right-to-know-survey","env-requirements","resale-tax-certificate-operating","rmw-generator-registration"],"allTasks":["community-right-to-know-survey","env-requirements","pharmacy-cds","pharmacy-license","pharmacy-prepare","pharmacy-staff-licenses","resale-tax-certificate-operating","rmw-generator-registration"]},{"name":"Photography","fname":"photography","users":1696.0,"pct":0.7,"totalTasks":2,"uniqueTasks":0,"sharedTasks":2,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance","resale-tax-certificate-operating"],"allTasks":["get-insurance","resale-tax-certificate-operating"]},{"name":"Printing Business","fname":"printing-business","users":450.0,"pct":0.2,"totalTasks":3,"uniqueTasks":0,"sharedTasks":3,"uniqueTaskNames":[],"sharedTaskNames":["community-right-to-know-survey","env-requirements","resale-tax-certificate-operating"],"allTasks":["community-right-to-know-survey","env-requirements","resale-tax-certificate-operating"]},{"name":"Real Estate Appraisals","fname":"real-estate-appraisals","users":107.0,"pct":0,"totalTasks":3,"uniqueTasks":2,"sharedTasks":1,"uniqueTaskNames":["appraiser-license","general-appraiser-certification"],"sharedTaskNames":["get-insurance"],"allTasks":["appraiser-license","general-appraiser-certification","get-insurance"]},{"name":"Real Estate Brokerage","fname":"real-estate-broker","users":650.0,"pct":0.3,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["license-broker"],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance","license-broker"]},{"name":"Real Estate Investing","fname":"real-estate-investor","users":12905.0,"pct":5.0,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Remediation and Waste Services","fname":"remediation-waste","users":89.0,"pct":0,"totalTasks":0,"uniqueTasks":0,"sharedTasks":0,"uniqueTaskNames":[],"sharedTaskNames":[],"allTasks":[]},{"name":"Residential Landlord","fname":"residential-landlord","users":859.0,"pct":0.3,"totalTasks":2,"uniqueTasks":1,"sharedTasks":1,"uniqueTaskNames":["residential-lease-agreement"],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance","residential-lease-agreement"]},{"name":"Restaurant","fname":"restaurant","users":4489.0,"pct":1.7,"totalTasks":5,"uniqueTasks":1,"sharedTasks":4,"uniqueTaskNames":["floor-plan-approval-doh"],"sharedTaskNames":["env-requirements","food-safety-course","get-insurance","resale-tax-certificate-operating"],"allTasks":["env-requirements","floor-plan-approval-doh","food-safety-course","get-insurance","resale-tax-certificate-operating"]},{"name":"Retail","fname":"retail","users":9898.0,"pct":3.8,"totalTasks":4,"uniqueTasks":1,"sharedTasks":3,"uniqueTaskNames":["search-licenses-retail"],"sharedTaskNames":["env-requirements","get-insurance","resale-tax-certificate-operating"],"allTasks":["env-requirements","get-insurance","resale-tax-certificate-operating","search-licenses-retail"]},{"name":"School Bus","fname":"school-bus","users":214.0,"pct":0.1,"totalTasks":7,"uniqueTasks":2,"sharedTasks":5,"uniqueTaskNames":["school-bus-insurance","trucking-parking"],"sharedTaskNames":["mvc-registration-task","mvc-title-task","passenger-transport-cdl","transportation-entity-id","transportation-inspection"],"allTasks":["mvc-registration-task","mvc-title-task","passenger-transport-cdl","school-bus-insurance","transportation-entity-id","transportation-inspection","trucking-parking"]},{"name":"Security","fname":"security","users":77.0,"pct":0,"totalTasks":4,"uniqueTasks":2,"sharedTasks":2,"uniqueTaskNames":["alarm-locksmith-business-license","alarm-locksmith-license"],"sharedTaskNames":["get-insurance","resale-tax-certificate-operating"],"allTasks":["alarm-locksmith-business-license","alarm-locksmith-license","get-insurance","resale-tax-certificate-operating"]},{"name":"Telemarketing","fname":"telemarketing","users":67.0,"pct":0,"totalTasks":3,"uniqueTasks":1,"sharedTasks":2,"uniqueTaskNames":["telemarketing-license"],"sharedTaskNames":["get-insurance","resale-tax-certificate-operating"],"allTasks":["get-insurance","resale-tax-certificate-operating","telemarketing-license"]},{"name":"Travel Agency","fname":"travel-agent","users":859.0,"pct":0.3,"totalTasks":1,"uniqueTasks":0,"sharedTasks":1,"uniqueTaskNames":[],"sharedTaskNames":["get-insurance"],"allTasks":["get-insurance"]},{"name":"Trucking","fname":"trucking","users":4696.0,"pct":1.8,"totalTasks":10,"uniqueTasks":3,"sharedTasks":7,"uniqueTaskNames":["trucking-boc3","trucking-insurance","trucking-usdot"],"sharedTaskNames":["env-requirements","mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-cdl","trucking-ifta","trucking-irp"],"allTasks":["env-requirements","mvc-registration-task","mvc-title-task","transportation-entity-id","trucking-boc3","trucking-cdl","trucking-ifta","trucking-insurance","trucking-irp","trucking-usdot"]},{"name":"Vending Machine","fname":"vending-machine","users":1017.0,"pct":0.4,"totalTasks":3,"uniqueTasks":1,"sharedTasks":2,"uniqueTaskNames":["agreement-vending-machine"],"sharedTaskNames":["get-insurance","resale-tax-certificate-operating"],"allTasks":["agreement-vending-machine","get-insurance","resale-tax-certificate-operating"]}],"taskFrequency":{"rmw-generator-registration":{"count":6,"industries":["acupuncture","funeral","healthcare","home-health-aide","petcare","pharmacy"]},"get-insurance":{"count":43,"industries":["acupuncture","architecture","car-rental","cemetery","certified-public-accountant","cleaning-janitorial-services","cosmetology","daycare","detective","e-commerce","employment-agency","event-planning","finance-insurance","food-truck","freight-forwarding","generic","graphic-design","health-club","healthcare","home-baker","home-health-aide","independent-artist","interior-designer","it-consultant","landscape-architecture","law-firm","lodging","management-consulting","marketing-pr-consulting","non-medical-transport","notary-public","pest-control","photography","real-estate-appraisals","real-estate-broker","real-estate-investor","residential-landlord","restaurant","retail","security","telemarketing","travel-agent","vending-machine"]},"architect-are-exam":{"count":1,"industries":["architecture"]},"architect-license":{"count":1,"industries":["architecture"]},"authorization-architect-firm":{"count":1,"industries":["architecture"]},"professional-planner-license":{"count":1,"industries":["architecture"]},"env-requirements":{"count":17,"industries":["auto-body-repair","cannabis","commercial-construction","cosmetology","daycare","funeral","health-club","healthcare","lawn-care","lodging","logistics","petcare","pharmacy","printing-business","restaurant","retail","trucking"]},"spray-paint-booth-permit-auto-body-repair":{"count":1,"industries":["auto-body-repair"]},"resale-tax-certificate-operating":{"count":15,"industries":["auto-body-repair","cosmetology","e-commerce","food-truck","home-baker","it-consultant","petcare","pharmacy","photography","printing-business","restaurant","retail","security","telemarketing","vending-machine"]},"community-right-to-know-survey":{"count":6,"industries":["auto-body-repair","car-rental","electrical-contractor","healthcare","pharmacy","printing-business"]},"auto-body-repair-license":{"count":1,"industries":["auto-body-repair"]},"cannabis-sign-lease":{"count":1,"industries":["cannabis"]},"building-permit":{"count":1,"industries":["cannabis"]},"cannabis-bank-account":{"count":1,"industries":["cannabis"]},"priority-status-cannabis":{"count":1,"industries":["cannabis"]},"zoning-cannabis":{"count":1,"industries":["cannabis"]},"cannabis-evaluate-location":{"count":1,"industries":["cannabis"]},"cannabis-site-requirements":{"count":1,"industries":["cannabis"]},"cannabis-insurance-policy":{"count":1,"industries":["cannabis"]},"town-mercantile-license":{"count":2,"industries":["cannabis","food-truck"]},"mvc-registration-task":{"count":9,"industries":["car-rental","car-service","food-truck","freight-forwarding","logistics","moving-company","non-medical-transport","school-bus","trucking"]},"mvc-title-task":{"count":9,"industries":["car-rental","car-service","food-truck","freight-forwarding","logistics","moving-company","non-medical-transport","school-bus","trucking"]},"transportation-entity-id":{"count":9,"industries":["car-rental","car-service","food-truck","freight-forwarding","logistics","moving-company","non-medical-transport","school-bus","trucking"]},"vehicle-dealership":{"count":1,"industries":["car-rental"]},"trucking-irp":{"count":3,"industries":["car-service","freight-forwarding","trucking"]},"transportation-cpcn":{"count":2,"industries":["car-service","non-medical-transport"]},"trucking-ifta":{"count":3,"industries":["car-service","freight-forwarding","trucking"]},"passenger-transport-cdl":{"count":3,"industries":["car-service","non-medical-transport","school-bus"]},"transportation-inspection":{"count":3,"industries":["car-service","non-medical-transport","school-bus"]},"cemetery-sales":{"count":1,"industries":["cemetery"]},"cemetery-branch":{"count":1,"industries":["cemetery"]},"cemetery-certificate":{"count":1,"industries":["cemetery"]},"register-accounting-firm":{"count":1,"industries":["certified-public-accountant"]},"cosmetology-license":{"count":1,"industries":["cosmetology"]},"apply-for-shop-license":{"count":1,"industries":["cosmetology"]},"detective-agency-license":{"count":1,"industries":["detective"]},"detective-employees":{"count":1,"industries":["detective"]},"domestic-employer-register-for-taxes":{"count":1,"industries":["domestic-employer"]},"register-for-ein-domestic-employer":{"count":1,"industries":["domestic-employer"]},"electrical-business-license":{"count":1,"industries":["electrical-contractor"]},"understand-license-requirements-employment-agency":{"count":1,"industries":["employment-agency"]},"land-surveyor-license":{"count":1,"industries":["engineering"]},"firm-engineer":{"count":1,"industries":["engineering"]},"license-engineer":{"count":1,"industries":["engineering"]},"search-licenses":{"count":3,"industries":["finance-insurance","generic","pest-control"]},"zoning-food-truck":{"count":1,"industries":["food-truck"]},"sign-lease-food-truck":{"count":1,"industries":["food-truck"]},"apply-for-food-truck-license":{"count":1,"industries":["food-truck"]},"food-safety-course":{"count":2,"industries":["food-truck","restaurant"]},"fire-permit-food-truck":{"count":1,"industries":["food-truck"]},"trucking-cdl":{"count":5,"industries":["food-truck","freight-forwarding","logistics","moving-company","trucking"]},"evaluate-your-location":{"count":1,"industries":["food-truck"]},"funeral-registration":{"count":1,"industries":["funeral"]},"mortuary-practitioner":{"count":1,"industries":["funeral"]},"health-club-registration":{"count":1,"industries":["health-club"]},"cds-healthcare":{"count":1,"industries":["healthcare"]},"healthcare-license":{"count":1,"industries":["healthcare"]},"home-baker-license":{"count":1,"industries":["home-baker"]},"get-insurance-home-contractor":{"count":1,"industries":["home-contractor"]},"register-home-contractor":{"count":1,"industries":["home-contractor"]},"individual-staff-licenses-health-aide":{"count":1,"industries":["home-health-aide"]},"home-health-aide-license":{"count":1,"industries":["home-health-aide"]},"hvac-insurance-surety-bond":{"count":1,"industries":["hvac-contractor"]},"hvac-license":{"count":1,"industries":["hvac-contractor"]},"certified-interior-designer":{"count":1,"industries":["interior-designer"]},"authorization-landscape-architect-firm":{"count":1,"industries":["landscape-architecture"]},"landscape-architect-license":{"count":1,"industries":["landscape-architecture"]},"state-bar-attorney":{"count":1,"industries":["law-firm"]},"insurance-massage-therapy":{"count":1,"industries":["massage-therapy"]},"license-massage-therapy":{"count":1,"industries":["massage-therapy"]},"verify-license-massage-therapy":{"count":1,"industries":["massage-therapy"]},"moving-company-insurance":{"count":1,"industries":["moving-company"]},"moving-company-license":{"count":1,"industries":["moving-company"]},"payment-structure-non-medical-trans":{"count":1,"industries":["non-medical-transport"]},"logisticare":{"count":1,"industries":["non-medical-transport"]},"notary-register":{"count":1,"industries":["notary-public"]},"pest-applicator-business-license":{"count":1,"industries":["pest-control"]},"commercial-pest-applicator-license":{"count":1,"industries":["pest-control"]},"pharmacy-cds":{"count":1,"industries":["pharmacy"]},"pharmacy-prepare":{"count":1,"industries":["pharmacy"]},"pharmacy-staff-licenses":{"count":1,"industries":["pharmacy"]},"pharmacy-license":{"count":1,"industries":["pharmacy"]},"general-appraiser-certification":{"count":1,"industries":["real-estate-appraisals"]},"appraiser-license":{"count":1,"industries":["real-estate-appraisals"]},"license-broker":{"count":1,"industries":["real-estate-broker"]},"residential-lease-agreement":{"count":1,"industries":["residential-landlord"]},"floor-plan-approval-doh":{"count":1,"industries":["restaurant"]},"search-licenses-retail":{"count":1,"industries":["retail"]},"trucking-parking":{"count":1,"industries":["school-bus"]},"school-bus-insurance":{"count":1,"industries":["school-bus"]},"alarm-locksmith-business-license":{"count":1,"industries":["security"]},"alarm-locksmith-license":{"count":1,"industries":["security"]},"telemarketing-license":{"count":1,"industries":["telemarketing"]},"trucking-boc3":{"count":1,"industries":["trucking"]},"trucking-insurance":{"count":1,"industries":["trucking"]},"trucking-usdot":{"count":1,"industries":["trucking"]},"agreement-vending-machine":{"count":1,"industries":["vending-machine"]}},"totalIndustries":64,"totalUniqueTasks":97,"excludedUniversal":["bank-account","business-plan","business-structure","determine-naics-code","manage-business-vehicles","register-for-ein","register-for-taxes"],"taskProgress":[{"task":"Select Your Business Structure","completed":190983.0,"todo":6954.0,"last45":10599.0,"avgTime":"1h 27m","total":197937.0},{"task":"Determine Your NAICS Code","completed":101620.0,"todo":8220.0,"last45":8002.0,"avgTime":"2d 13h","total":109840.0},{"task":"Authorize Your Business Entity","completed":82138.0,"todo":4794.0,"last45":6447.0,"avgTime":"2d 12h","total":86932.0},{"task":"Get Your EIN from the IRS","completed":52032.0,"todo":2941.0,"last45":4687.0,"avgTime":"8d 23h","total":54973.0},{"task":"Register Your Business for State Taxes and Employer Purposes","completed":33485.0,"todo":5491.0,"last45":3456.0,"avgTime":"29d 1h","total":38976.0},{"task":"Write Your Business Plan","completed":15874.0,"todo":8166.0,"last45":1974.0,"avgTime":"9d 11h","total":24040.0},{"task":"reseller","completed":12985.0,"todo":7691.0,"last45":430.0,"avgTime":"18d 9h","total":20676.0},{"task":"Open Your Business Bank Account","completed":7176.0,"todo":3172.0,"last45":1049.0,"avgTime":"110d 8h","total":10348.0},{"task":"Evaluate Your Location","completed":5117.0,"todo":2411.0,"last45":539.0,"avgTime":"20d 15h","total":7528.0},{"task":"Get an Insurance Policy","completed":3560.0,"todo":2000.0,"last45":454.0,"avgTime":"84d 1h","total":5560.0},{"task":"Update Your Insurance Policy","completed":2966.0,"todo":966.0,"last45":337.0,"avgTime":"90d 14h","total":3932.0},{"task":"Manage Your Business Vehicles","completed":2853.0,"todo":702.0,"last45":864.0,"avgTime":"27d 16h","total":3555.0},{"task":"Search Licenses","completed":2028.0,"todo":1138.0,"last45":238.0,"avgTime":"70d 21h","total":3166.0},{"task":"Register Your Trade Name","completed":1438.0,"todo":1464.0,"last45":127.0,"avgTime":"11d 15h","total":2902.0},{"task":"Prepare for Employees in New Jersey","completed":2064.0,"todo":550.0,"last45":251.0,"avgTime":"91d 23h","total":2614.0},{"task":"Obtain a Certificate of Good Standing","completed":1498.0,"todo":979.0,"last45":177.0,"avgTime":"21d 19h","total":2477.0},{"task":"Determine Your Site Requirements","completed":1573.0,"todo":490.0,"last45":162.0,"avgTime":"87d 15h","total":2063.0},{"task":"Sign Your Lease","completed":1371.0,"todo":399.0,"last45":177.0,"avgTime":"136d 4h","total":1770.0},{"task":"Obtain Zoning and Sign Permits, if Required","completed":1254.0,"todo":350.0,"last45":161.0,"avgTime":"136d 9h","total":1604.0},{"task":"Obtain Your Site Safety Permits","completed":944.0,"todo":259.0,"last45":113.0,"avgTime":"129d 19h","total":1203.0},{"task":"Prepare for Site Renovation, if Applicable","completed":789.0,"todo":146.0,"last45":26.0,"avgTime":"55d 21h","total":935.0},{"task":"search-business-name","completed":805.0,"todo":99.0,"last45":7.0,"avgTime":"12d 2h","total":904.0},{"task":"Get Your Home Improvement Contractor Registration","completed":461.0,"todo":300.0,"last45":93.0,"avgTime":"194d 22h","total":761.0},{"task":"Get Your Liquor and Mercantile License","completed":476.0,"todo":253.0,"last45":15.0,"avgTime":"126d 2h","total":729.0},{"task":"Appoint Trustees","completed":408.0,"todo":264.0,"last45":49.0,"avgTime":"24d 14h","total":672.0},{"task":"Write Your Business Plan","completed":391.0,"todo":263.0,"last45":51.0,"avgTime":"23d 23h","total":654.0},{"task":"env-requirements","completed":638.0,"todo":8.0,"last45":249.0,"avgTime":"20d 6h","total":646.0},{"task":"Obtain Your S Corporation Designation with the Federal Government","completed":419.0,"todo":173.0,"last45":42.0,"avgTime":"71d 13h","total":592.0},{"task":"Get a Sales Tax Resale Certificate","completed":522.0,"todo":35.0,"last45":163.0,"avgTime":"90d 9h","total":557.0},{"task":"Get Your Mercantile License if Your Town Requires It","completed":465.0,"todo":23.0,"last45":91.0,"avgTime":"132d 17h","total":488.0},{"task":"waste-permitting","completed":73.0,"todo":383.0,"last45":9.0,"avgTime":"86d 12h","total":456.0},{"task":"Prepare for Your Employment and Personnel Services License","completed":272.0,"todo":172.0,"last45":26.0,"avgTime":"12d 7h","total":444.0},{"task":"Identify the Right Location for Your Cannabis Business","completed":163.0,"todo":258.0,"last45":15.0,"avgTime":"12d 14h","total":421.0},{"task":"land-permitting","completed":361.0,"todo":8.0,"last45":34.0,"avgTime":"111d 12h","total":369.0},{"task":"Determine if You are Eligible for Priority Status","completed":89.0,"todo":279.0,"last45":5.0,"avgTime":"19d 6h","total":368.0},{"task":"Get Your Motor Vehicle Commission EIN","completed":305.0,"todo":31.0,"last45":76.0,"avgTime":"57d 17h","total":336.0},{"task":"air-permitting","completed":313.0,"todo":5.0,"last45":33.0,"avgTime":"102d 9h","total":318.0},{"task":"Search for Your License Requirements for Regulated Goods","completed":216.0,"todo":95.0,"last45":40.0,"avgTime":"124d 21h","total":311.0},{"task":"Ensure Your Staff is Licensed","completed":255.0,"todo":53.0,"last45":35.0,"avgTime":"94d 6h","total":308.0},{"task":"Get an Insurance Policy","completed":233.0,"todo":54.0,"last45":35.0,"avgTime":"200d 13h","total":287.0},{"task":"Register for Streamlined Sales Tax","completed":255.0,"todo":29.0,"last45":111.0,"avgTime":"58d 20h","total":284.0},{"task":"Apply for Your Conditional Cannabis License","completed":23.0,"todo":240.0,"last45":2.0,"avgTime":"16d 6h","total":263.0},{"task":"Get a Title for Your Business Vehicle(s)","completed":237.0,"todo":15.0,"last45":56.0,"avgTime":"50d 17h","total":252.0},{"task":"Complete Your Food Safety Course","completed":180.0,"todo":71.0,"last45":31.0,"avgTime":"180d 5h","total":251.0},{"task":"Register Your Business-Owned Vehicle(s) with the NJ MVC","completed":232.0,"todo":9.0,"last45":60.0,"avgTime":"45d 20h","total":241.0},{"task":"Make Sure You or Your Drivers Have a Commercial Driver's License (CDL)","completed":181.0,"todo":56.0,"last45":25.0,"avgTime":"79d 3h","total":237.0},{"task":"license-accounting","completed":56.0,"todo":175.0,"last45":4.0,"avgTime":"278d","total":231.0},{"task":"Apply for Admission to Your State Bar Association","completed":166.0,"todo":60.0,"last45":18.0,"avgTime":"4d 19h","total":226.0},{"task":"Apply for Tax-Exempt Status with the IRS","completed":122.0,"todo":96.0,"last45":16.0,"avgTime":"71d 13h","total":218.0},{"task":"Write Your Bylaws","completed":191.0,"todo":20.0,"last45":44.0,"avgTime":"31d 19h","total":211.0},{"task":"Check if Your Business Needs to Report Chemicals in New Jersey","completed":182.0,"todo":11.0,"last45":47.0,"avgTime":"51d 7h","total":193.0},{"task":"search-business-name-nexus","completed":91.0,"todo":77.0,"last45":1.0,"avgTime":"28d 17h","total":168.0},{"task":"Evaluate Your Location","completed":96.0,"todo":56.0,"last45":11.0,"avgTime":"6d 12h","total":152.0},{"task":"Apply for Your Controlled Dangerous Substances Registration, if Applicable","completed":139.0,"todo":12.0,"last45":36.0,"avgTime":"79d 15h","total":151.0},{"task":"Register as a Notary Public","completed":111.0,"todo":36.0,"last45":11.0,"avgTime":"35d 13h","total":147.0},{"task":"Get a Commercial Insurance Policy","completed":92.0,"todo":51.0,"last45":16.0,"avgTime":"79d 18h","total":143.0},{"task":"Get Your Floor Plan Approved","completed":96.0,"todo":44.0,"last45":17.0,"avgTime":"226d 10h","total":140.0},{"task":"Apply for Your A-901 License to Transport Waste","completed":81.0,"todo":59.0,"last45":3.0,"avgTime":"124d 6h","total":140.0},{"task":"Select Your Location","completed":118.0,"todo":19.0,"last45":14.0,"avgTime":"6d 8h","total":137.0},{"task":"File Your Blanket of Coverage (BOC-3)","completed":90.0,"todo":34.0,"last45":17.0,"avgTime":"82d 22h","total":124.0},{"task":"Register Your Vehicle with the U.S. Department of Transportation","completed":83.0,"todo":35.0,"last45":15.0,"avgTime":"73d 16h","total":118.0},{"task":"Apply for Your Cosmetology Shop License","completed":64.0,"todo":51.0,"last45":11.0,"avgTime":"17d 22h","total":115.0},{"task":"Apply for Your Food Truck License","completed":48.0,"todo":64.0,"last45":7.0,"avgTime":"143d 8h","total":112.0},{"task":"Get Your Real Estate Broker License","completed":66.0,"todo":35.0,"last45":5.0,"avgTime":"11d 9h","total":101.0},{"task":"Complete Your Regulated Medical Waste Generator Registration","completed":86.0,"todo":5.0,"last45":33.0,"avgTime":"64d 10h","total":91.0},{"task":"Determine Your Payment Structure","completed":53.0,"todo":37.0,"last45":6.0,"avgTime":"15d 19h","total":90.0},{"task":"Register Your Vehicle(s) Under the International Registration Plan (IRP)","completed":56.0,"todo":29.0,"last45":9.0,"avgTime":"52d 7h","total":85.0},{"task":"Get Your Boiler Registered and Inspected","completed":70.0,"todo":4.0,"last45":6.0,"avgTime":"91d 23h","total":74.0},{"task":"Get Your Individual Cosmetology License and Ensure Your Staff is Licensed","completed":65.0,"todo":5.0,"last45":11.0,"avgTime":"42d 20h","total":70.0},{"task":"Evaluate Location for Your Daycare","completed":50.0,"todo":19.0,"last45":5.0,"avgTime":"34d 1h","total":69.0},{"task":"Obtain Zoning and Overnight Parking Approval, if Required","completed":41.0,"todo":24.0,"last45":2.0,"avgTime":"80d 10h","total":65.0},{"task":"Apply for a Cottage Food Operator (Home Baker) Permit","completed":42.0,"todo":20.0,"last45":9.0,"avgTime":"242d 15h","total":62.0},{"task":"Open Your Bank Account for Your Cannabis Business","completed":32.0,"todo":29.0,"last45":5.0,"avgTime":"267d 8h","total":61.0},{"task":"Register Your Accounting Firm","completed":34.0,"todo":26.0,"last45":8.0,"avgTime":"36d 7h","total":60.0},{"task":"Register Your Charity, if Applicable","completed":35.0,"todo":24.0,"last45":4.0,"avgTime":"36d 15h","total":59.0},{"task":"Register Your Business as a New Home Builder","completed":41.0,"todo":11.0,"last45":3.0,"avgTime":"11d 10h","total":52.0},{"task":"Get Authorization from Your Local Government","completed":29.0,"todo":23.0,"last45":2.0,"avgTime":"34d 19h","total":52.0},{"task":"Apply for Your Annual Cannabis License","completed":4.0,"todo":47.0,"last45":0,"avgTime":"15d 17h","total":51.0},{"task":"Get Your Insurance Policy","completed":29.0,"todo":22.0,"last45":1.0,"avgTime":"23d 16h","total":51.0},{"task":"Get Your Massage Therapy Business License","completed":27.0,"todo":23.0,"last45":2.0,"avgTime":"141d 20h","total":50.0},{"task":"Apply to Certify Your Passenger Vehicle Drivers","completed":28.0,"todo":22.0,"last45":2.0,"avgTime":"30d 19h","total":50.0},{"task":"Sign Your Location Contract","completed":34.0,"todo":15.0,"last45":7.0,"avgTime":"228d 8h","total":49.0},{"task":"Register a Scale, Meter, or Other Weighing and Measuring Device for Your Business","completed":34.0,"todo":13.0,"last45":8.0,"avgTime":"234d 12h","total":47.0},{"task":"Apply for an Engineer License, if Applicable","completed":39.0,"todo":7.0,"last45":6.0,"avgTime":"164d 17h","total":46.0},{"task":"Confirm Liquor License Availability","completed":29.0,"todo":17.0,"last45":4.0,"avgTime":"48d 8h","total":46.0},{"task":"crtk","completed":0,"todo":45.0,"last45":0,"avgTime":"","total":45.0},{"task":"Get a Certificate of Authorization for Your Engineering Firm","completed":22.0,"todo":23.0,"last45":4.0,"avgTime":"189d 3h","total":45.0},{"task":"Obtain an Insurance Policy","completed":37.0,"todo":7.0,"last45":1.0,"avgTime":"160d 8h","total":44.0},{"task":"Get Your EIN from the IRS","completed":37.0,"todo":6.0,"last45":9.0,"avgTime":"21h 56m","total":43.0},{"task":"Sign a Location Agreement","completed":22.0,"todo":18.0,"last45":4.0,"avgTime":"62d 11h","total":40.0},{"task":"Apply for Your Architect License","completed":22.0,"todo":16.0,"last45":1.0,"avgTime":"200d 20h","total":38.0},{"task":"Get an HVACR License","completed":21.0,"todo":17.0,"last45":2.0,"avgTime":"124d 22h","total":38.0},{"task":"Research Your Insurance Needs","completed":23.0,"todo":15.0,"last45":0,"avgTime":"<1m","total":38.0},{"task":"Get an Insurance Policy and Surety Bond","completed":27.0,"todo":10.0,"last45":2.0,"avgTime":"116d 18h","total":37.0},{"task":"Apply for Your Massage Therapy License and Ensure Your Staff is Licensed","completed":30.0,"todo":6.0,"last45":2.0,"avgTime":"209d 23h","total":36.0},{"task":"register-consumer-affairs","completed":5.0,"todo":30.0,"last45":0,"avgTime":"156d 15h","total":35.0},{"task":"Get Your Electrical Contracting Business Permit","completed":30.0,"todo":4.0,"last45":8.0,"avgTime":"4d 12h","total":34.0},{"task":"Get a Resolution Adopting Your DBA Name","completed":13.0,"todo":19.0,"last45":0,"avgTime":"<1m","total":32.0},{"task":"Apply for an S Corporation Status with the State","completed":18.0,"todo":12.0,"last45":0,"avgTime":"<1m","total":30.0},{"task":"Register for State Taxes and Employer Purposes","completed":26.0,"todo":3.0,"last45":7.0,"avgTime":"26d 2h","total":29.0},{"task":"Register Your Business as a Health Club, Spa, Fitness Club, or Gym","completed":15.0,"todo":14.0,"last45":1.0,"avgTime":"186d 23h","total":29.0},{"task":"register-for-taxes-foreign","completed":9.0,"todo":19.0,"last45":1.0,"avgTime":"<1m","total":28.0},{"task":"Register Your Health Care Service Firm, if Applicable","completed":18.0,"todo":9.0,"last45":3.0,"avgTime":"117d 1h","total":27.0},{"task":"individual-staff-licenses-cosmetology","completed":21.0,"todo":6.0,"last45":0,"avgTime":"1d 8h","total":27.0},{"task":"Apply for Your Public Movers License and/or Warehousemen License","completed":10.0,"todo":16.0,"last45":2.0,"avgTime":"112d 1h","total":26.0},{"task":"Get a Fire Permit for Your Food Truck","completed":21.0,"todo":4.0,"last45":5.0,"avgTime":"329d 2h","total":25.0},{"task":"Ensure Your Staff is Licensed","completed":16.0,"todo":9.0,"last45":5.0,"avgTime":"119d 2h","total":25.0},{"task":"Determine Site Requirements for Your Rental Property","completed":23.0,"todo":2.0,"last45":3.0,"avgTime":"63d 17h","total":25.0},{"task":"Obtain Your Zoning Approval and Proof of Local Support","completed":12.0,"todo":13.0,"last45":1.0,"avgTime":"222d 19h","total":25.0},{"task":"Take Your Architect\u2019s Registration Exam","completed":18.0,"todo":6.0,"last45":1.0,"avgTime":"189d 6h","total":24.0},{"task":"Get a Certificate of Authorization for Your Architecture Firm","completed":11.0,"todo":12.0,"last45":0,"avgTime":"199d 15h","total":23.0},{"task":"Check Your Passenger Transport CDL Requirements","completed":22.0,"todo":0,"last45":4.0,"avgTime":"26d 2h","total":22.0},{"task":"Get Your International Fuel Tax Agreement (IFTA) License and Decals","completed":22.0,"todo":0,"last45":7.0,"avgTime":"9d 4h","total":22.0},{"task":"Write Your Residential Lease Agreement","completed":19.0,"todo":2.0,"last45":3.0,"avgTime":"75d","total":21.0},{"task":"Get Your Auto-Body Repair License","completed":15.0,"todo":5.0,"last45":2.0,"avgTime":"1d 19h","total":20.0},{"task":"Get Your Child Care Center License","completed":12.0,"todo":8.0,"last45":1.0,"avgTime":"216d 10h","total":20.0},{"task":"Prepare for State and Local Site Requirements","completed":11.0,"todo":9.0,"last45":1.0,"avgTime":"206d 11h","total":20.0},{"task":"Apply for Your Certified Public Accountant License","completed":17.0,"todo":2.0,"last45":1.0,"avgTime":"87d 17h","total":19.0},{"task":"Obtain Your Spray Paint Booth Permits, if Needed","completed":17.0,"todo":2.0,"last45":3.0,"avgTime":"1d 17h","total":19.0},{"task":"Get Your Insurance Policy","completed":16.0,"todo":2.0,"last45":2.0,"avgTime":"43d 5h","total":18.0},{"task":"Register for Streamlined Sales and Use Tax","completed":14.0,"todo":4.0,"last45":7.0,"avgTime":"43d","total":18.0},{"task":"Schedule Your Initial Bus Inspection","completed":16.0,"todo":2.0,"last45":1.0,"avgTime":"25d 15h","total":18.0},{"task":"Get a Commercial Insurance Policy","completed":11.0,"todo":6.0,"last45":1.0,"avgTime":"203d 15h","total":17.0},{"task":"Get Your Certificate of Public Convenience and Necessity (CPCN)","completed":16.0,"todo":1.0,"last45":1.0,"avgTime":"37d 20h","total":17.0},{"task":"Obtain Your Site Safety Permits","completed":17.0,"todo":0,"last45":3.0,"avgTime":"79d 4h","total":17.0},{"task":"Register Your Family Child Care Business","completed":7.0,"todo":9.0,"last45":2.0,"avgTime":"20d 6h","total":16.0},{"task":"Register as a Landlord","completed":15.0,"todo":1.0,"last45":5.0,"avgTime":"66d 21h","total":16.0},{"task":"Sign a Lease for Your Cannabis Business","completed":12.0,"todo":3.0,"last45":1.0,"avgTime":"53d 14h","total":15.0},{"task":"Determine Cannabis Site Requirements","completed":9.0,"todo":6.0,"last45":1.0,"avgTime":"39d","total":15.0},{"task":"Get an Animal Facilities License, if Required","completed":9.0,"todo":6.0,"last45":1.0,"avgTime":"213d 23h","total":15.0},{"task":"Register Your Elevators, Lifts, and Related Devices","completed":11.0,"todo":2.0,"last45":1.0,"avgTime":"256d 9h","total":13.0},{"task":"Apply for Logisticare, if Applicable","completed":7.0,"todo":6.0,"last45":1.0,"avgTime":"39d 9h","total":13.0},{"task":"Ensure You or Your Drivers Have the Right Credentials","completed":6.0,"todo":7.0,"last45":1.0,"avgTime":"316d 10h","total":13.0},{"task":"Apply for Your Landscape Architect License","completed":8.0,"todo":4.0,"last45":0,"avgTime":"86d 10h","total":12.0},{"task":"Apply for Your Pharmacy Permit","completed":3.0,"todo":9.0,"last45":0,"avgTime":"254d 16h","total":12.0},{"task":"register-firm-accounting","completed":7.0,"todo":5.0,"last45":1.0,"avgTime":"<1m","total":12.0},{"task":"Apply for a Social Affair Permit to Serve Alcohol","completed":11.0,"todo":1.0,"last45":3.0,"avgTime":"60d 11h","total":12.0},{"task":"Register Your Temporary Help Consulting Firm","completed":6.0,"todo":6.0,"last45":1.0,"avgTime":"89d 2h","total":12.0},{"task":"Get Your Commercial Insurance Policy","completed":4.0,"todo":8.0,"last45":2.0,"avgTime":"<1m","total":12.0},{"task":"Get Your Detective Agency License","completed":4.0,"todo":7.0,"last45":1.0,"avgTime":"255d 4h","total":11.0},{"task":"Register Your Temporary Help Service Firm","completed":9.0,"todo":2.0,"last45":1.0,"avgTime":"5d 6h","total":11.0},{"task":"Apply for Your Residential Real Property Appraiser License","completed":5.0,"todo":5.0,"last45":0,"avgTime":"<1m","total":10.0},{"task":"undefined","completed":4.0,"todo":6.0,"last45":0,"avgTime":"356d 6h","total":10.0},{"task":"Register Your Multiple Dwelling, Such as an Apartment or Condominium Complex","completed":7.0,"todo":2.0,"last45":0,"avgTime":"165d 17h","total":9.0},{"task":"Get Your USDoT Number, if Applicable","completed":6.0,"todo":3.0,"last45":3.0,"avgTime":"9h","total":9.0},{"task":"Get Your Smoke Detector, Carbon Monoxide Detector, and Fire Extinguisher Certificate, if Applicable","completed":9.0,"todo":0,"last45":3.0,"avgTime":"64d 4h","total":9.0},{"task":"Register Your Short-Term Rental, if Your Town Requires It","completed":9.0,"todo":0,"last45":1.0,"avgTime":"94d 15h","total":9.0},{"task":"car-rental-vehicle-registration","completed":3.0,"todo":5.0,"last45":0,"avgTime":"298d 12h","total":8.0},{"task":"Register Your Consulting Firm (Headhunter)","completed":6.0,"todo":2.0,"last45":0,"avgTime":"35d 18h","total":8.0},{"task":"Get a Commercial Insurance Policy","completed":3.0,"todo":5.0,"last45":0,"avgTime":"315d 19h","total":8.0},{"task":"Apply for Your Commercial Pesticide Applicator License","completed":6.0,"todo":1.0,"last45":2.0,"avgTime":"149d 5h","total":7.0},{"task":"Apply for Your Conversion Cannabis License","completed":3.0,"todo":4.0,"last45":0,"avgTime":"<1m","total":7.0},{"task":"Register Your Entertainment Agency","completed":5.0,"todo":2.0,"last45":0,"avgTime":"40d 4h","total":7.0},{"task":"Prepare for Pharmacy Requirements","completed":6.0,"todo":1.0,"last45":0,"avgTime":"42m","total":7.0},{"task":"Apply for Your Land Surveyor License, if Applicable","completed":4.0,"todo":2.0,"last45":3.0,"avgTime":"17d 7h","total":6.0},{"task":"register-vehicle","completed":2.0,"todo":4.0,"last45":0,"avgTime":"152d 4h","total":6.0},{"task":"Get Your Certificate of Authorization to Offer Landscape Architectural Services","completed":6.0,"todo":0,"last45":0,"avgTime":"114d 14h","total":6.0},{"task":"Apply for Your Dental Waste Exemption","completed":6.0,"todo":0,"last45":2.0,"avgTime":"35d 14h","total":6.0},{"task":"Apply for Your Pesticide Applicator Business License","completed":6.0,"todo":0,"last45":2.0,"avgTime":"149d 5h","total":6.0},{"task":"Schedule Your Initial Bus Inspection","completed":2.0,"todo":3.0,"last45":0,"avgTime":"473d 17h","total":5.0},{"task":"Become a Government Contractor","completed":3.0,"todo":2.0,"last45":2.0,"avgTime":"50d 4h","total":5.0},{"task":"Apply for Your Cigarette License","completed":5.0,"todo":0,"last45":1.0,"avgTime":"124d 10h","total":5.0},{"task":"Register Your X-Ray Machine","completed":5.0,"todo":0,"last45":2.0,"avgTime":"204d 9h","total":5.0},{"task":"Get Your Insurance Policy","completed":3.0,"todo":1.0,"last45":1.0,"avgTime":"158d 17h","total":4.0},{"task":"Become a Certified Interior Designer","completed":2.0,"todo":2.0,"last45":0,"avgTime":"5d 1h","total":4.0},{"task":"Register Your Employees with New Jersey State Police","completed":0,"todo":4.0,"last45":0,"avgTime":"","total":4.0},{"task":"Apply for Your Professional Planner License","completed":4.0,"todo":0,"last45":0,"avgTime":"20d 4h","total":4.0},{"task":"Apply for Your Telemarketing License","completed":0,"todo":3.0,"last45":0,"avgTime":"","total":3.0},{"task":"Register Your Business as a Ticket Broker (Ticket Reseller)","completed":0,"todo":3.0,"last45":0,"avgTime":"","total":3.0},{"task":"Register Your Career Consultant Agency","completed":3.0,"todo":0,"last45":0,"avgTime":"5d 14h","total":3.0},{"task":"Register Your Career Counseling Firm","completed":3.0,"todo":0,"last45":0,"avgTime":"53d 13h","total":3.0},{"task":"Register Your Job Listing Service","completed":3.0,"todo":0,"last45":0,"avgTime":"5d 14h","total":3.0},{"task":"Apply for Your Store Milk License","completed":3.0,"todo":0,"last45":1.0,"avgTime":"116d 4h","total":3.0},{"task":"Get Your Motor Vehicle or Boat Dealership License","completed":3.0,"todo":0,"last45":2.0,"avgTime":"8h 57m","total":3.0},{"task":"Apply for Your Fire Alarm, Burglar Alarm and Locksmith Business License","completed":2.0,"todo":0,"last45":1.0,"avgTime":"28d 13h","total":2.0},{"task":"Apply for Your Fire Alarm License, Burglar Alarm or Locksmith License","completed":2.0,"todo":0,"last45":1.0,"avgTime":"28d 13h","total":2.0},{"task":"Apply for a Flashing Amber Light Permit","completed":2.0,"todo":0,"last45":2.0,"avgTime":"224d 6h","total":2.0},{"task":"Register Your Hotel, Motel, or Guesthouse","completed":2.0,"todo":0,"last45":1.0,"avgTime":"149d 11h","total":2.0},{"task":"Get Your Refrigeration System Registered and Inspected","completed":2.0,"todo":0,"last45":0,"avgTime":"77d 4h","total":2.0},{"task":"Apply for Your Manufacturer or Wholesaler/Distributor Controlled Dangerous Substances Registration","completed":2.0,"todo":0,"last45":1.0,"avgTime":"330d 20h","total":2.0},{"task":"Apply for Your Residential Real Property Appraiser Certification","completed":0,"todo":1.0,"last45":0,"avgTime":"","total":1.0},{"task":"Obtain a Carnival or Amusement Ride Permit","completed":0,"todo":1.0,"last45":0,"avgTime":"","total":1.0},{"task":"Apply for Your Certificate of Authority","completed":0,"todo":1.0,"last45":0,"avgTime":"","total":1.0},{"task":"Apply for Your Electrologist Office Premises","completed":0,"todo":1.0,"last45":0,"avgTime":"","total":1.0},{"task":"Apply for Your Analytical Lab or Researcher\u2019s Controlled Dangerous Substances Registration","completed":0,"todo":1.0,"last45":0,"avgTime":"","total":1.0},{"task":"Pass Your Cosmetology Site Inspection","completed":1.0,"todo":0,"last45":0,"avgTime":"<1m","total":1.0},{"task":"Apply for Your Dental Branch Office Registration, if Applicable","completed":1.0,"todo":0,"last45":1.0,"avgTime":"396d 22h","total":1.0},{"task":"Apply for Your Dental License","completed":1.0,"todo":0,"last45":1.0,"avgTime":"396d 22h","total":1.0},{"task":"Apply for an Insurance Individual Producer License","completed":1.0,"todo":0,"last45":1.0,"avgTime":"20d 3h","total":1.0},{"task":"Apply for an Insurance Business Entity Producer License","completed":1.0,"todo":0,"last45":1.0,"avgTime":"20d 3h","total":1.0},{"task":"Apply for Your Pharmacy\u2019s Controlled Dangerous Substances Registration","completed":1.0,"todo":0,"last45":0,"avgTime":"212d 21h","total":1.0},{"task":"Ensure Your Staff is Licensed","completed":1.0,"todo":0,"last45":0,"avgTime":"212d 21h","total":1.0},{"task":"Get Your Pressure Vessel Registered and Inspected","completed":1.0,"todo":0,"last45":0,"avgTime":"153d","total":1.0},{"task":"Apply for a Raffle or Bingo Game License","completed":1.0,"todo":0,"last45":0,"avgTime":"6d 15h","total":1.0},{"task":"Apply for Your Free-Standing Residential Health Care Facility License","completed":1.0,"todo":0,"last45":0,"avgTime":"927d 3h","total":1.0},{"task":"Apply for an Employment Agency License","completed":1.0,"todo":0,"last45":0,"avgTime":"22m","total":1.0},{"task":"social-affair-permit","completed":1.0,"todo":0,"last45":0,"avgTime":"81d 3h","total":1.0},{"task":"Register Your Truck","completed":1.0,"todo":0,"last45":0,"avgTime":"16h 59m","total":1.0}],"nonEssentialQuestions":[{"question":"Home-Based Business","yes":67469,"no":69689,"unknown":121321},{"question":"Provides Staffing Service","yes":1449,"no":257023,"unknown":7},{"question":"Interstate Logistics","yes":905,"no":257574,"unknown":0},{"question":"Childcare for 6+ Children","yes":503,"no":264,"unknown":257712},{"question":"Liquor License","yes":488,"no":257991,"unknown":0},{"question":"Requires CPA","yes":411,"no":258062,"unknown":6},{"question":"Pet Care Housing","yes":365,"no":528,"unknown":257586},{"question":"Public Works Contractor","yes":339,"no":2369,"unknown":255771},{"question":"Sells Pet Care Items","yes":313,"no":580,"unknown":257586},{"question":"Interstate Moving","yes":307,"no":258172,"unknown":0},{"question":"Owns Elevators","yes":302,"no":4796,"unknown":253381},{"question":"Cannabis Microbusiness","yes":233,"no":68,"unknown":258178},{"question":"Has 3+ Rental Units","yes":171,"no":476,"unknown":257832},{"question":"Interstate Transport","yes":109,"no":57953,"unknown":200417},{"question":"Certified Interior Designer","yes":84,"no":258388,"unknown":7},{"question":"Real Estate Appraisal Management","yes":32,"no":258440,"unknown":7},{"question":"Raffle/Bingo Games","yes":26,"no":147,"unknown":258306},{"question":"Car Service","yes":0,"no":1658,"unknown":256821},{"question":"Owns Carnival Rides","yes":0,"no":0,"unknown":258479},{"question":"Traveling Circus/Carnival","yes":0,"no":0,"unknown":258479},{"question":"Vacant Property Owner","yes":0,"no":2,"unknown":258477},{"question":"Open 2+ Years","yes":0,"no":0,"unknown":258479}]};

const fmt = (t) => t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const C = {
  bg: "#0f1419", card: "#1a2028", cardHover: "#222d38", border: "#2d3a47",
  text: "#e1e8ef", muted: "#8899aa", accent: "#4fc3f7", accentDim: "#2a7da8",
  unique: "#ff6b6b", shared: "#4fc3f7", warn: "#ffd93d", ok: "#6bcb77", purple: "#e040fb",
};

const Stat = ({ label, value, sub, color }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 24, fontWeight: 800, color: color || C.accent, fontFamily: "'Space Mono', monospace" }}>{value}</div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 2, opacity: 0.7 }}>{sub}</div>}
  </div>
);

export default function App() {
  const [view, setView] = useState("overview");
  const [selInd, setSelInd] = useState(null);
  const [selTask, setSelTask] = useState(null);
  const [sortBy, setSortBy] = useState("users");
  const [search, setSearch] = useState("");

  const inds = DATA.industries;
  const tf = DATA.taskFrequency;
  const tp = DATA.taskProgress;
  const neq = DATA.nonEssentialQuestions;

  const sorted = useMemo(() => {
    let f = inds.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return [...f].sort((a, b) => sortBy === "users" ? b.users - a.users : sortBy === "uniqueTasks" ? b.uniqueTasks - a.uniqueTasks : b.totalTasks - a.totalTasks);
  }, [sortBy, search]);

  const scatter = useMemo(() => inds.filter(i => i.name !== "All Other Businesses").map(i => ({ ...i, logUsers: Math.log10(Math.max(i.users, 1)) })), []);

  const tasksByFreq = useMemo(() => Object.entries(tf).map(([n, info]) => ({ name: n, count: info.count, industries: info.industries })).sort((a, b) => b.count - a.count), []);
  const uniqueOnly = tasksByFreq.filter(t => t.count === 1);

  const stats = useMemo(() => {
    const zeroDiff = inds.filter(i => i.totalTasks === 0);
    const noUnique = inds.filter(i => i.totalTasks > 0 && i.uniqueTasks === 0);
    const hasUnique = inds.filter(i => i.uniqueTasks > 0);
    return { zeroDiff, noUnique, hasUnique, zeroDiffUsers: zeroDiff.reduce((s,i)=>s+i.users,0), noUniqueUsers: noUnique.reduce((s,i)=>s+i.users,0) };
  }, []);

  const nav = (id, label) => (
    <button onClick={() => { setView(id); if (id !== "detail") setSelInd(null); setSelTask(null); }}
      style={{ padding: "7px 14px", background: view === id ? C.accent : "transparent", color: view === id ? C.bg : C.muted,
        border: `1px solid ${view === id ? C.accent : C.border}`, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: view === id ? 700 : 400 }}>{label}</button>
  );

  const goDetail = (ind) => { setSelInd(ind); setView("detail"); };

  // === FUNNEL VIEW ===
  const Funnel = () => {
    const funnelTasks = tp.slice(0, 30);
    const topTotal = tp[0]?.total || 1;

    return (
      <div>
        <div style={{ background: `${C.unique}11`, border: `1px solid ${C.unique}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 12, color: C.unique }}>
          The top 10 tasks account for <strong>92.8%</strong> of all task engagement. The bottom 100 tasks account for <strong>0.2%</strong>. 55 tasks have fewer than 10 total interactions ever.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <Stat label="Total task interactions" value={tp.reduce((s,t) => s + t.total, 0).toLocaleString()} />
          <Stat label="Tasks with < 10 interactions" value={tp.filter(t => t.total < 10).length} sub={`out of ${tp.length} total tasks`} color={C.unique} />
          <Stat label="Drop-off: Step 1 → Bank Account" value="95%" sub="197,937 → 10,348" color={C.warn} />
        </div>

        <h3 style={{ color: C.text, fontSize: 14, marginBottom: 4 }}>Universal Task Funnel</h3>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>Each bar shows total interactions (completed + to-do). The drop-off from first to last universal task is massive.</p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 24 }}>
          {["Select Your Business Structure", "Determine Your NAICS Code", "Authorize Your Business Entity", "Get Your EIN from the IRS", "Register Your Business for State Taxes", "Write Your Business Plan", "Open Your Business Bank Account", "Manage Your Business Vehicles"].map(name => {
            const match = tp.find(t => t.task.includes(name.slice(0, 30)));
            if (!match) return null;
            const pct = match.total / topTotal * 100;
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 200, fontSize: 11, color: C.muted, textAlign: "right", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.task.slice(0, 35)}</div>
                <div style={{ flex: 1, height: 20, background: C.bg, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: C.accent, opacity: 0.7, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
                <div style={{ width: 70, fontSize: 11, color: C.text, fontFamily: "'Space Mono', monospace", textAlign: "right" }}>{match.total.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        <h3 style={{ color: C.text, fontSize: 14, marginBottom: 4 }}>All Task Engagement (Top 40)</h3>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>After the universal tasks, engagement drops to hundreds — then to single digits for bespoke licensing tasks.</p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={funnelTasks.slice(7, 40)} margin={{ top: 5, right: 8, bottom: 55, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="task" stroke={C.muted} tick={{ fontSize: 7, angle: -45, textAnchor: "end" }} tickFormatter={t => t.slice(0, 25)} interval={0} />
              <YAxis stroke={C.muted} tick={{ fontSize: 10 }} />
              <Tooltip content={({ payload }) => {
                if (!payload?.[0]) return null;
                const d = payload[0].payload;
                const compPct = d.total > 0 ? (d.completed / d.total * 100).toFixed(0) : 0;
                return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, fontSize: 11, color: C.text, maxWidth: 280 }}>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>{d.task}</div>
                  <div>Total: {d.total.toLocaleString()} · Completed: {d.completed.toLocaleString()} ({compPct}%)</div>
                  <div>Last 45 days: {d.last45.toLocaleString()} · Avg time: {d.avgTime}</div>
                </div>;
              }} />
              <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                {funnelTasks.slice(7, 40).map((t, i) => (
                  <Cell key={i} fill={t.total > 1000 ? C.accent : t.total > 100 ? C.ok : t.total > 10 ? C.warn : C.unique} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h3 style={{ color: C.text, fontSize: 14, marginTop: 24, marginBottom: 4 }}>The Long Tail: Tasks with &lt; 10 Total Interactions</h3>
        <p style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>{tp.filter(t => t.total < 10).length} tasks have been interacted with fewer than 10 times total, ever. Combined they account for {tp.filter(t => t.total < 10).reduce((s,t) => s + t.total, 0)} interactions.</p>
        <div style={{ display: "grid", gap: 3, maxHeight: 300, overflow: "auto" }}>
          {tp.filter(t => t.total < 10).sort((a,b) => a.total - b.total).map((t, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 5, padding: "6px 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, color: C.muted }}>{t.task}</span>
              <span style={{ color: C.unique, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{t.total.toFixed(0)}</span>
              <span style={{ color: C.muted, fontSize: 10 }}>total</span>
              <span style={{ color: t.completed > 0 ? C.ok : C.muted, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{t.completed.toFixed(0)}</span>
              <span style={{ color: C.muted, fontSize: 10 }}>done</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === NON-ESSENTIAL QUESTIONS VIEW ===
  const Profile = () => {
    const totalUsers = 258479; // approximate from the data
    return (
      <div>
        <div style={{ background: `${C.warn}11`, border: `1px solid ${C.warn}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 12, color: C.warn }}>
          These personalization questions are buried in the profile screen. Most have 98-100% "Unknown" responses — meaning users never find or answer them. Only "Home-Based Business" has meaningful engagement.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
          <Stat label="Non-essential questions" value={neq.length} />
          <Stat label="Questions with 0 'Yes' responses" value={neq.filter(q => q.yes === 0).length} color={C.unique} />
          <Stat label="Only question with real engagement" value="Home-Based" sub="67K yes, 70K no, 121K unknown" color={C.ok} />
        </div>

        <h3 style={{ color: C.text, fontSize: 14, marginBottom: 12 }}>Response Distribution by Question</h3>
        <div style={{ display: "grid", gap: 4 }}>
          {neq.map((q, i) => {
            const total = q.yes + q.no + q.unknown;
            const yesPct = total > 0 ? q.yes / total * 100 : 0;
            const noPct = total > 0 ? q.no / total * 100 : 0;
            const unkPct = total > 0 ? q.unknown / total * 100 : 0;
            return (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: C.text }}>{q.question}</span>
                  <span style={{ fontSize: 11, color: C.ok, fontFamily: "'Space Mono', monospace" }}>{q.yes.toLocaleString()} yes</span>
                  <span style={{ fontSize: 11, color: C.muted }}>({yesPct.toFixed(1)}%)</span>
                </div>
                <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", background: C.bg }}>
                  <div style={{ width: `${yesPct}%`, background: C.ok, transition: "width 0.3s" }} title={`Yes: ${yesPct.toFixed(1)}%`} />
                  <div style={{ width: `${noPct}%`, background: C.accent, opacity: 0.5, transition: "width 0.3s" }} title={`No: ${noPct.toFixed(1)}%`} />
                  <div style={{ width: `${unkPct}%`, background: C.border, transition: "width 0.3s" }} title={`Unknown: ${unkPct.toFixed(1)}%`} />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 10, color: C.muted }}>
                  <span><span style={{ color: C.ok }}>●</span> Yes: {yesPct.toFixed(1)}%</span>
                  <span><span style={{ color: C.accent, opacity: 0.5 }}>●</span> No: {noPct.toFixed(1)}%</span>
                  <span><span style={{ color: C.border }}>●</span> Unknown: {unkPct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // === OVERVIEW ===
  const Overview = () => (
    <div>
      <div style={{ background: `${C.warn}11`, border: `1px solid ${C.warn}33`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 12, color: C.warn }}>
        7 universal tasks excluded. Showing only differentiating content.
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <Stat label="Industry Roadmaps" value={inds.length} />
        <Stat label="Differentiating Tasks" value={DATA.totalUniqueTasks} sub="After removing 7 universal" />
        <Stat label="Single-Industry Tasks" value={uniqueOnly.length} sub={`${(uniqueOnly.length / DATA.totalUniqueTasks * 100).toFixed(0)}% of differentiating tasks`} color={C.unique} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <Stat label="Zero differentiating tasks" value={stats.zeroDiff.length} sub={`${stats.zeroDiffUsers.toLocaleString()} users get identical-to-generic roadmap`} color={C.unique} />
        <Stat label="Only shared tasks (no unique)" value={stats.noUnique.length} sub={`${stats.noUniqueUsers.toLocaleString()} users`} color={C.warn} />
        <Stat label="Has unique tasks" value={stats.hasUnique.length} sub="Truly differentiated" color={C.ok} />
      </div>

      <h3 style={{ color: C.text, fontSize: 14, marginBottom: 4 }}>Users vs. Differentiating Tasks (excl. "All Other")</h3>
      <p style={{ color: C.muted, fontSize: 11, margin: "0 0 10px" }}>Each dot is one industry. Vertical position = user count. Color = degree of uniqueness (see legend below). Click any dot for details.</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="totalTasks" type="number" stroke={C.muted} tick={{ fontSize: 11 }}
              label={{ value: "Differentiating Tasks", position: "bottom", offset: 20, fill: C.muted, fontSize: 12 }} />
            <YAxis dataKey="logUsers" stroke={C.muted} tick={{ fontSize: 11 }}
              label={{ value: "Users (log₁₀)", angle: -90, position: "insideLeft", fill: C.muted, fontSize: 12 }}
              tickFormatter={v => Math.round(Math.pow(10, v)).toLocaleString()} />
            <Tooltip content={({ payload }) => {
              if (!payload?.[0]) return null;
              const d = payload[0].payload;
              return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 12, color: C.text }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                <div>{d.users.toLocaleString()} users · {d.totalTasks} diff. tasks ({d.uniqueTasks} unique, {d.sharedTasks} shared)</div>
              </div>;
            }} />
            <Scatter data={scatter} cursor="pointer" onClick={(d) => goDetail(d)}>
              {scatter.map((e, i) => (
                <Cell key={i} fill={e.totalTasks === 0 ? C.unique : e.uniqueTasks === 0 ? C.warn : e.uniqueTasks >= 4 ? C.purple : C.ok}
                  fillOpacity={0.8} r={Math.max(4, Math.min(14, e.users / 1200))} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6, fontSize: 10, color: C.muted }}>
          <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: C.unique, marginRight: 3 }}></span>0 diff. tasks</span>
          <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: C.warn, marginRight: 3 }}></span>Shared only</span>
          <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: C.ok, marginRight: 3 }}></span>1-3 unique</span>
          <span><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: C.purple, marginRight: 3 }}></span>4+ unique</span>
        </div>
      </div>

      <h3 style={{ color: C.text, fontSize: 14, marginTop: 24, marginBottom: 10 }}>One-Task Roadmaps</h3>
      <div style={{ display: "grid", gap: 4 }}>
        {inds.filter(i => i.totalTasks === 1).sort((a,b) => b.users - a.users).map(ind => (
          <div key={ind.fname} onClick={() => goDetail(ind)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover} onMouseLeave={e => e.currentTarget.style.background = C.card}>
            <span style={{ flex: 1, color: C.text, fontWeight: 500 }}>{ind.name}</span>
            <span style={{ color: C.accent, fontFamily: "'Space Mono', monospace" }}>{ind.users.toLocaleString()}</span>
            <span style={{ color: C.muted }}>→</span>
            <span style={{ color: C.warn, fontSize: 11 }}>{fmt(ind.allTasks[0])}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // === INDUSTRIES ===
  const Industries = () => (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "7px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12, flex: 1, minWidth: 180, outline: "none" }} />
        {[["users","Users"],["uniqueTasks","Unique"],["totalTasks","Total Diff."]].map(([k,l]) => (
          <button key={k} onClick={() => setSortBy(k)} style={{ padding: "5px 10px", background: sortBy===k ? C.accentDim : "transparent",
            color: sortBy===k ? C.text : C.muted, border: `1px solid ${C.border}`, borderRadius: 4, cursor: "pointer", fontSize: 11 }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {sorted.map(ind => (
          <div key={ind.fname} onClick={() => goDetail(ind)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = C.cardHover} onMouseLeave={e => e.currentTarget.style.background = C.card}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ind.name}</div>
            </div>
            <div style={{ textAlign: "right", minWidth: 70 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, fontFamily: "'Space Mono', monospace" }}>{ind.users.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: C.muted }}>users</div>
            </div>
            {ind.totalTasks > 0 ? (
              <div style={{ width: 100, height: 12, background: C.bg, borderRadius: 6, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${(ind.sharedTasks / ind.totalTasks * 100)}%`, height: "100%", background: C.shared, opacity: 0.5 }} />
                <div style={{ width: `${(ind.uniqueTasks / ind.totalTasks * 100)}%`, height: "100%", background: C.unique }} />
              </div>
            ) : (
              <div style={{ width: 100, fontSize: 9, color: C.muted, textAlign: "center" }}>no diff. tasks</div>
            )}
            <div style={{ minWidth: 60, textAlign: "right" }}>
              <span style={{ fontSize: 11, color: ind.uniqueTasks > 0 ? C.unique : C.muted, fontFamily: "'Space Mono', monospace" }}>{ind.uniqueTasks}</span>
              <span style={{ fontSize: 10, color: C.muted }}> / {ind.totalTasks}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // === DETAIL ===
  const Detail = () => {
    if (!selInd) return <div style={{ color: C.muted, textAlign: "center", padding: 40 }}>Select an industry from another tab</div>;
    const ind = selInd;
    const myTasks = new Set(ind.allTasks);
    const similar = inds.filter(i => i.fname !== ind.fname).map(i => {
      const ot = new Set(i.allTasks);
      const inter = [...myTasks].filter(t => ot.has(t)).length;
      const union = new Set([...myTasks, ...ot]).size;
      return { ...i, sim: union > 0 ? (inter / union * 100) : 0, shared: inter };
    }).sort((a, b) => b.sim - a.sim).slice(0, 8);

    return (
      <div>
        <button onClick={() => setView("industries")} style={{ background: "transparent", border: "none", color: C.accent, cursor: "pointer", fontSize: 12, marginBottom: 14, padding: 0 }}>← Back</button>
        <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>{ind.name}</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <Stat label="Users" value={ind.users.toLocaleString()} />
          <Stat label="% of All" value={`${ind.pct}%`} />
          <Stat label="Diff. Tasks" value={ind.totalTasks} />
          <Stat label="Unique" value={ind.uniqueTasks} color={C.unique} />
          <Stat label="Shared" value={ind.sharedTasks} color={C.shared} />
        </div>
        {ind.totalTasks === 0 && (
          <div style={{ background: `${C.unique}15`, border: `1px solid ${C.unique}33`, borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12, color: C.unique }}>
            Zero differentiating tasks. Identical to generic baseline.
          </div>
        )}
        {ind.uniqueTaskNames.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ color: C.unique, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Unique Tasks</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ind.uniqueTaskNames.map(t => <span key={t} style={{ background: `${C.unique}22`, color: C.unique, padding: "4px 9px", borderRadius: 5, fontSize: 11, border: `1px solid ${C.unique}44` }}>{fmt(t)}</span>)}
            </div>
          </div>
        )}
        {ind.sharedTaskNames.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ color: C.shared, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Shared Tasks</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ind.sharedTaskNames.map(t => {
                const freq = tf[t];
                return <span key={t} onClick={(e) => { e.stopPropagation(); setSelTask({ name: t, ...freq }); }}
                  style={{ background: `${C.shared}15`, color: C.shared, padding: "4px 9px", borderRadius: 5, fontSize: 11, border: `1px solid ${C.shared}33`, cursor: "pointer" }}>
                  {fmt(t)} <span style={{ opacity: 0.5 }}>({freq?.count})</span>
                </span>;
              })}
            </div>
          </div>
        )}
        {selTask && (
          <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <h4 style={{ color: C.accent, fontSize: 14, fontWeight: 700, margin: 0 }}>{fmt(selTask.name)}</h4>
              <button onClick={() => setSelTask(null)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {(selTask.industries || []).map(id => {
                const d = inds.find(i => i.fname === id);
                return <span key={id} onClick={() => goDetail(d)} style={{ background: `${C.accent}15`, color: C.accent, padding: "3px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", border: `1px solid ${C.accent}33` }}>
                  {d?.name || id} ({d?.users.toLocaleString()})
                </span>;
              })}
            </div>
          </div>
        )}
        <h3 style={{ color: C.text, fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 16 }}>Most Similar Roadmaps</h3>
        <div style={{ display: "grid", gap: 3 }}>
          {similar.map(s => (
            <div key={s.fname} onClick={() => goDetail(s)}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 5, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}
              onMouseEnter={e => e.currentTarget.style.background = C.cardHover} onMouseLeave={e => e.currentTarget.style.background = C.card}>
              <span style={{ color: C.text, flex: 1 }}>{s.name}</span>
              <span style={{ color: C.accent, fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{s.sim.toFixed(0)}%</span>
              <span style={{ color: C.muted, fontSize: 10 }}>{s.users.toLocaleString()} users</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === TASKS ===
  const Tasks = () => (
    <div>
      <h3 style={{ color: C.text, fontSize: 14, marginBottom: 4 }}>Differentiating Task Frequency</h3>
      <p style={{ color: C.muted, fontSize: 11, marginBottom: 14 }}>{DATA.totalUniqueTasks} tasks after excluding 7 universal. Click any to see which industries use it.</p>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={tasksByFreq.slice(0, 25)} margin={{ top: 5, right: 8, bottom: 55, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="name" stroke={C.muted} tick={{ fontSize: 8, angle: -45, textAnchor: "end" }} tickFormatter={t => fmt(t).slice(0, 20)} interval={0} />
            <YAxis stroke={C.muted} tick={{ fontSize: 10 }} />
            <Tooltip content={({ payload }) => {
              if (!payload?.[0]) return null;
              const d = payload[0].payload;
              return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, fontSize: 11, color: C.text }}>
                <div style={{ fontWeight: 700, marginBottom: 3 }}>{fmt(d.name)}</div>
                <div>In {d.count} of {DATA.totalIndustries} roadmaps</div>
              </div>;
            }} />
            <Bar dataKey="count" cursor="pointer" onClick={(d) => setSelTask(d)} radius={[3, 3, 0, 0]}>
              {tasksByFreq.slice(0, 25).map((t, i) => <Cell key={i} fill={t.count >= 30 ? C.shared : t.count >= 5 ? C.ok : t.count > 1 ? C.warn : C.unique} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {selTask && (
        <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h4 style={{ color: C.accent, fontSize: 14, fontWeight: 700, margin: 0 }}>{fmt(selTask.name)}</h4>
            <button onClick={() => setSelTask(null)} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(selTask.industries || []).map(id => {
              const d = inds.find(i => i.fname === id);
              return <span key={id} onClick={() => goDetail(d)} style={{ background: `${C.accent}15`, color: C.accent, padding: "3px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", border: `1px solid ${C.accent}33` }}>
                {d?.name || id} ({d?.users.toLocaleString()})
              </span>;
            })}
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <h4 style={{ color: C.unique, fontSize: 12, marginBottom: 6 }}>Single-Industry Tasks ({uniqueOnly.length})</h4>
          <div style={{ maxHeight: 320, overflow: "auto", display: "grid", gap: 2 }}>
            {uniqueOnly.map(t => (
              <div key={t.name} onClick={() => setSelTask(t)}
                style={{ background: C.card, padding: "5px 9px", borderRadius: 4, fontSize: 10, color: C.muted, cursor: "pointer", border: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.unique} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                {fmt(t.name)} <span style={{ color: C.unique, opacity: 0.7 }}>→ {inds.find(i => i.fname === t.industries[0])?.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ color: C.ok, fontSize: 12, marginBottom: 6 }}>Shared 2+ Industries ({tasksByFreq.filter(t=>t.count>1).length})</h4>
          <div style={{ maxHeight: 320, overflow: "auto", display: "grid", gap: 2 }}>
            {tasksByFreq.filter(t=>t.count>1).map(t => (
              <div key={t.name} onClick={() => setSelTask(t)}
                style={{ background: C.card, padding: "5px 9px", borderRadius: 4, fontSize: 10, color: C.muted, cursor: "pointer", border: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.ok} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                {fmt(t.name)} <span style={{ color: C.ok, opacity: 0.7 }}>({t.count} industries)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 18px", color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 3px", letterSpacing: "-0.02em" }}>BizX Roadmap Differentiation Analysis</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{DATA.totalUniqueTasks} differentiating tasks across {inds.length} industries · Universal tasks excluded</p>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {nav("overview", "Overview")}
          {nav("funnel", "Task Engagement")}
          {nav("profile", "Profile Questions")}
          {nav("industries", "Industries")}
          {nav("tasks", "Tasks")}
          {nav("detail", "Detail")}
        </div>
        {view === "overview" && <Overview />}
        {view === "funnel" && <Funnel />}
        {view === "profile" && <Profile />}
        {view === "industries" && <Industries />}
        {view === "tasks" && <Tasks />}
        {view === "detail" && <Detail />}
      </div>
    </div>
  );
}
