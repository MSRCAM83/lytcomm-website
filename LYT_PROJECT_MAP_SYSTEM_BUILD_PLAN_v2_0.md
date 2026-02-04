# LYT COMMUNICATIONS - PROJECT MAP SYSTEM BUILD PLAN
## Version 2.0 - February 4, 2026
## UPDATED TECHNICAL SPECIFICATION & STATUS REPORT

---

## 🎯 PROJECT OVERVIEW

### **What We're Building:**
A complete construction project management system for LYT Communications that:
- Auto-imports work orders and construction maps (PDF upload → Claude Vision AI extraction)
- Creates interactive map-based project interface (Leaflet/OpenStreetMap)
- Tracks boring → fiber pulling → splicing workflows with photo validation
- Manages contractor assignments and QC approvals with database persistence
- Provides AI-powered efficiency recommendations (backfeed detection, optimal sequencing)
- Integrates incognito Claude assistant ("LYT Field Assist")
- Generates invoices from QC-approved completed work
- Real-time GPS crew tracking with management visibility
- Automated compliance digest emails

### **Primary Customer:**
Metronet/Vexus fiber optic construction projects (initially Sulphur LA SLPH.01.006)

### **Critical Deadline:**
4 weeks to complete all Metronet maps

### **Live URL:** https://lytcomm.com (auto-deploys from GitHub main branch via Vercel)

---

## 📊 CURRENT STATUS SUMMARY (Feb 4, 2026)

### Live Version: v4.0.0 / package.json v3.18.1

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1: Data Import & Project Creation | ✅ COMPLETE | JobImportPage v4.1.0 with high-res tiled PDF extraction via Claude Vision |
| Phase 2: Interactive Map Interface | ✅ COMPLETE | ProjectMapPage v3.0.0 (Leaflet/OpenStreetMap, replaced dead Google Maps key) |
| Phase 3: Workflow Management | ✅ COMPLETE | All 5 workflow components built, wired, and persisting to DB |
| Phase 4: AI Efficiency Director | ⚠️ PARTIAL | backfeedDetector + segmentParser built; live recommendations not wired |
| Phase 5: LYT Field Assist (Incognito Claude) | ✅ COMPLETE | FieldAssist v1.0 + serverless API endpoint live |
| Phase 6: Reporting & Billing | ⚠️ PARTIAL | InvoiceGenerator v1.0 exists; auto-invoice from map system not connected |
| Phase 7: GPS & Notifications | ✅ COMPLETE | gpsService + CrewTracker + NotificationBell + cron-digest all live |
| Phase 8: User Self-Service | ✅ COMPLETE | UserProfile v3.0.0 with persistent prefs |
| Database: 8-Table Google Sheets | ✅ COMPLETE | mapService v3.2.0 with Gateway CRUD, live data connection |

---

## 🏗️ SYSTEM ARCHITECTURE

### **Technology Stack:**
```
Frontend:       React 18.2.0 (Create React App)
Deployment:     Vercel (auto-deploy from GitHub main branch)
Repository:     MSRCAM83/lytcomm-website
Backend:        Google Apps Script v5.0 + Claude API (Vercel serverless)
Database:       Google Sheets (8 tables via Gateway CRUD)
Maps:           Leaflet 1.9.4 + OpenStreetMap (free, no API key needed)
AI:             Claude Opus 4 (claude-opus-4-20250514) for Vision PDF extraction
                Claude Sonnet 4 (claude-sonnet-4-20250514) for Field Assist chat
PDF Processing: pdfjs-dist 4.8.69 (text extraction + canvas rendering)
File Storage:   Google Drive
Icons:          Lucide React 0.294.0
Styling:        Inline CSS (no Tailwind or external CSS frameworks)
```

### **Key Integration Points:**
- GitHub API (token: (see Master Instructions))
- Google Drive (folder: 11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC)
- Google Apps Script Gateway URL: `https://script.google.com/macros/s/AKfycbwiq8NzgdUQ6Hu44NHN3ASdAYTd68uK6wGRK_CpJroSoiMuv66aRmPAzDxmtXexl6MK/exec`
- Gateway Secret: `(see Master Instructions)`
- Vercel (team: team_KdY24IuzstUJ0GmIFbiMTPFn, project: prj_WaoGvADsQWGd0kxC14n5qlNJ2T4q)

### **Vercel Configuration (vercel.json):**
```json
{
  "buildCommand": "CI=false npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "fluid": true,
  "functions": {
    "api/pdf-import.js": { "maxDuration": 800, "memory": 1024 }
  },
  "crons": [
    { "path": "/api/cron-digest", "schedule": "0 13 * * *" }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### **Environment Variables (Vercel):**
- `ANTHROPIC_API_KEY` — ✅ Set (Claude API for Field Assist + PDF import)
- `REACT_APP_GOOGLE_MAPS_API_KEY` — ✅ Set (also hardcoded in mapConfig as fallback)

---

## 🗂️ COMPLETE FILE STRUCTURE (Current Repo)

```
lytcomm-website/
├── .claude/                              (AI brain files for Claude Code sessions)
│   ├── MASTER-BRAIN.md                   (16KB - master context)
│   ├── MAP-READING-BRAIN.md              (4.6KB - construction map parsing)
│   ├── 3stage_pipeline.json              (5.4KB - PDF processing pipeline)
│   └── [other recovery/setup scripts]
│
├── api/                                  (Vercel serverless functions)
│   ├── claude-chat.js          v1.0.0    ✅ Field Assist chat proxy (Claude Sonnet 4)
│   ├── pdf-import.js           v3.1.0    ✅ PDF extraction via Claude Vision (Opus 4)
│   └── cron-digest.js          v1.0.0    ✅ Daily compliance digest (7AM CST)
│
├── public/
│   ├── index.html
│   ├── lyt_logo_dark.png                 (pink/purple/orange - dark mode)
│   ├── lyt_logo_light.png                (blue/teal/green - light mode)
│   ├── Form W-4 sign.pdf
│   ├── Form W-9 sign.pdf
│   └── LYT_MSA_2026_AdobeSign_Full_v3_5.pdf
│
├── src/
│   ├── App.js                            (main router - all routes configured)
│   ├── index.js                          (entry point)
│   ├── index.css                         (global styles)
│   │
│   ├── config/
│   │   ├── constants.js                  (brand colors, company info)
│   │   └── mapConfig.js          v1.1.0  ✅ Status colors, rate cards, photo reqs, permissions
│   │
│   ├── components/
│   │   ├── SignaturePad.js               ✅ Digital signature capture
│   │   ├── SSNInput.js                   ✅ One-digit-per-box SSN entry
│   │   ├── EINInput.js                   ✅ EIN input component
│   │   ├── Toast.js                      ✅ Toast notification component
│   │   ├── NotificationBell.js           ✅ Notification bell for dashboards
│   │   │
│   │   ├── Map/
│   │   │   └── CrewTracker.js    v1.1.0  ✅ GPS tracking, reports to Google Sheets
│   │   │
│   │   ├── Workflow/
│   │   │   ├── BoringTracker.js  v1.0.0  ✅ Pothole approval → bore → QC
│   │   │   ├── PullingTracker.js v1.0.0  ✅ Cable type, direction, splicer QC
│   │   │   ├── SplicingTracker.js v1.0.0 ✅ Type-specific photos, PM tests, OTDR
│   │   │   ├── PhotoUploader.js  v1.1.0  ✅ Camera/file upload, GPS metadata
│   │   │   └── QCApproval.js     v1.0.0  ✅ Admin QC review with gallery
│   │   │
│   │   └── Chat/
│   │       ├── FieldAssist.js    v1.0.0  ✅ Incognito Claude chat (floating bubble)
│   │       └── ChatBubble.js     v1.0.0  ✅ Message display with timestamps
│   │
│   ├── pages/
│   │   ├── HomePage.js                   ✅ Logo-centered, no stock photos
│   │   ├── AboutPage.js                  ✅ Company info
│   │   ├── ServicesPage.js               ✅ Service descriptions
│   │   ├── ContactPage.js                ✅ Contact form
│   │   ├── PortalSelect.js               ✅ Portal entry cards
│   │   ├── InviteCodePage.js             ✅ Onboarding gate (welcome2lyt)
│   │   ├── NDASignPage.js                ✅ NDA signing (lytnda2026)
│   │   ├── AdminLogin.js                 ✅ Admin auth
│   │   ├── EmployeeLogin.js              ✅ Employee auth
│   │   ├── ContractorLogin.js            ✅ Contractor auth
│   │   ├── PortalLogin.js                ✅ Unified login
│   │   ├── ApiTestPage.js                ✅ API testing utility
│   │   ├── DailyProductionReport.js      ✅ Production reporting
│   │   ├── JobImportPage.js      v4.1.0  ✅ PDF upload + tiled Vision extraction
│   │   ├── ProjectMapPage.js     v3.0.0  ✅ Leaflet map + workflow persistence
│   │   └── AdminProjectDashboard.js v3.0.0 ✅ Multi-project mgmt + bulk assign
│   │
│   ├── portals/
│   │   ├── AdminDashboard.js     v3.1    ✅ Real data + approve/reject
│   │   ├── AdminUserManagement.js v2.0   ✅ Full CRUD
│   │   ├── EmployeeDashboard.js  v2.4    ✅ Dynamic projects + NotificationBell
│   │   ├── ContractorDashboard.js v2.4   ✅ Dynamic projects + NotificationBell
│   │   ├── EmployeeOnboarding.js         ✅ 5-step onboarding
│   │   ├── ContractorOnboarding.js       ✅ 8-step onboarding
│   │   ├── SetPassword.js                ✅ Password setup
│   │   ├── ForgotPassword.js             ✅ Email-based reset
│   │   ├── UserProfile.js        v3.0.0  ✅ Self-service profile mgmt
│   │   ├── ActivityLog.js        v2.0    ✅ Audit trail
│   │   ├── MetricsDashboard.js   v2.0    ✅ Real stats
│   │   ├── RecruitingTracker.js  v2.0    ✅ Pipeline tracking
│   │   ├── WorkMap.js            v2.0    ✅ GPS + work sessions
│   │   ├── PotholeVerification.js v2.1   ✅ Photo + approval workflow
│   │   ├── DailyWorkSheet.js     v2.1    ✅ Dynamic projects
│   │   └── InvoiceGenerator.js   v1.0.0  ✅ Auto-invoice from rate cards
│   │
│   ├── services/
│   │   ├── apiService.js         v1.0.0  ✅ Claude API integration
│   │   ├── mapService.js         v3.2.0  ✅ 8-sheet CRUD, Gateway redirect handling
│   │   ├── workflowService.js    v1.0.0  ✅ Phase transitions, QC gates
│   │   ├── pdfService.js                 ✅ PDF generation (930 lines)
│   │   ├── gpsService.js         v1.0.0  ✅ Crew location tracking
│   │   ├── notificationService.js v1.0.0 ✅ In-app notifications
│   │   └── photoUploadService.js         ✅ Photo upload to Google Drive
│   │
│   └── utils/
│       ├── idGenerator.js        v1.0.0  ✅ Two-tier ID system (internal + contractor)
│       ├── rateCardMatcher.js    v1.0.0  ✅ Billing calculation engine
│       ├── segmentParser.js      v1.0.0  ✅ Map text → segments, handholes, splice points
│       └── backfeedDetector.js   v1.0.0  ✅ Backfeed routes, optimal sequence, drill setups
│
├── BLUEPRINT.md                          (session continuity doc - 1062 lines)
├── LYT_Onboarding_Handler_v2.gs         (Apps Script onboarding handler)
├── package.json              v3.18.1     (React 18.2.0, Leaflet, pdfjs-dist, etc.)
├── vercel.json                           (serverless config, cron, rewrites)
└── README.md
```

### **App.js Routes (all configured):**
```
PUBLIC:
  #home              → HomePage
  #about             → AboutPage
  #services          → ServicesPage
  #contact           → ContactPage
  #onboarding        → InviteCodePage (code: welcome2lyt)
  #nda-sign          → NDASignPage (code: lytnda2026)

PORTAL:
  #portal-login      → PortalLogin (unified login)
  #portal-select     → PortalSelect
  #set-password      → SetPassword
  #forgot-password   → ForgotPassword

DASHBOARDS:
  #admin-dashboard   → AdminDashboard
  #employee-dashboard → EmployeeDashboard
  #contractor-dashboard → ContractorDashboard

PROJECT MAP SYSTEM:
  #job-import        → JobImportPage
  #project-map       → ProjectMapPage
  #admin-projects    → AdminProjectDashboard
```

---

## ✅ COMPLETED PHASES (Detailed)

### Phase 1: Data Import & Project Creation — COMPLETE

**JobImportPage v4.1.0** (Updated Feb 4, 2026)
- Drag-drop PDF upload interface for work orders + construction maps
- PDF pages rendered to canvas at 4.0x scale (4896×3168px) via pdfjs-dist
- Map images tiled into legend + key map + 6 section tiles (3×2 grid)
- Each tile ~1175×1584px — under Claude Vision's 1568px native threshold
- 7× more pixel detail per map section than previous single-page approach
- JPEG quality 85% for sharp footage number text
- Work order pages extracted as text (pdfjs-dist) + images (canvas)
- Sends to `/api/pdf-import` for Claude Vision AI extraction
- Import preview with editable results before database commit
- Writes extracted data to Google Sheets via Gateway

**pdf-import v3.1.0** (Vercel serverless)
- Claude Opus 4 (claude-opus-4-20250514) for superior vision accuracy
- Tile-aware system prompt: processes legend tile first, key map second, then section tiles R1C1→R2C3
- Accepts `map_tile_labels[]` array for tile identification
- Max 16 map images (5 WO pages + 8 map pages + 3 overflow)
- Separate `buildSystemPrompt()` and `buildExtractionPrompt()` functions
- 800s timeout, 1GB memory allocation
- Returns structured JSON matching database schema

**Data extracted automatically:**
- Project number, name, customer, PO, total value, dates
- Handhole locations and IDs (A, A01, A02, B, B01, etc.)
- Segment footage (numbers along fiber routes)
- Splice point locations (TYCO-D markers, 1×4/1×8 symbols)
- Street names, utility crossings, section boundaries
- Unit codes matched to rate card for pricing

---

### Phase 2: Interactive Map Interface — COMPLETE

**ProjectMapPage v3.0.0** (Updated Feb 3, 2026)
- **Leaflet/OpenStreetMap** — Free, no API key needed (replaced dead Google Maps key that was returning 403)
- Street + Satellite layer toggle
- Color-coded polylines for segment status (red/yellow/green/gray/orange/blue)
- Handhole circle markers with tooltips (type + status)
- Auto-fitBounds to project boundaries
- Status legend overlay
- Section/status/phase filters
- Map/List view toggle
- Tabbed detail panel: Overview | Boring | Pulling | Splicing
- Phase status cards clickable → opens workflow tab
- Status dots on tabs showing current phase state
- Contractor-filtered view (v2.5.0 — contractors only see assigned work)
- Role-aware navigation (hides PO/pricing from non-admins)
- **Workflow persistence (v2.4.0):** Status changes write directly to Google Sheets DB via mapService, automatic timestamps for start/complete, QC approval fields, action logging to Work Log

---

### Phase 3: Workflow Management — COMPLETE

**BoringTracker v1.0.0**
- Step 1: Pothole submission (3 photos required) → admin approval
- Step 2: Start boring → track actual footage + utility crossings
- Step 3: Mark complete (3 photos required) → QC approval
- Admin approve/reject buttons when isAdmin=true

**PullingTracker v1.0.0**
- Prerequisite gate: boring must be QC approved
- Cable type selector (12F–432F)
- Pull direction selector (Forward/Backward/Both) with backfeed warning
- Completion with 4 required photos → splicer QC

**SplicingTracker v1.0.0**
- Type-specific photo requirements (1×4: 7, 1×8: 8, F1: 7+trays)
- Power meter test entry (8 or 16 fields with dBm values)
- OTDR upload for F1/TYCO-D
- Completion checklist (photos + PM + OTDR)
- Admin-only billing summary with rate card calculations
- Mid-span vs end-of-line billing differences

**PhotoUploader v1.1.0**
- Camera capture (mobile) + file upload (desktop)
- GPS metadata extraction via navigator.geolocation
- Required photo type validation per splice/work type
- Drag-drop support, thumbnail previews
- Progress tracker (X/Y photos uploaded)

**QCApproval v1.0.0**
- Approve/Reject/Flag Issue actions with confirmation
- Photo gallery for review
- QC notes field
- Reject reason (required) and issue description forms

---

### Phase 4: AI Efficiency Director — PARTIAL

**Built and in repo:**
- `backfeedDetector.js` v1.0.0 — Detects backfeed routes, calculates optimal drill setup locations, identifies critical paths, generates work sequence recommendations
- `segmentParser.js` v1.0.0 — Parses map text into structured segments, handholes, splice points

**Not yet wired:**
- [ ] Live AI optimization recommendations displayed in admin dashboard
- [ ] Real-time schedule adjustment based on crew progress
- [ ] Bottleneck alerts when phases fall behind
- [ ] Weather impact predictions
- [ ] Cost-benefit analysis for route alternatives
- [ ] Learning from completed projects to improve future estimates

---

### Phase 5: LYT Field Assist (Incognito Claude) — COMPLETE

**FieldAssist v1.0.0**
- Floating chat bubble on dashboard pages
- Incognito identity (never reveals it's Claude/AI)
- Quick action buttons for common questions
- Context injection (user name, company, project, assignment, work type)
- Offline fallback responses for key procedures (photo counts, safety, etc.)
- Message history sent to API for conversation continuity
- Minimizable widget

**claude-chat.js v1.0.0** (Vercel serverless)
- Claude Sonnet 4 integration
- Industry-specific system prompt with fiber optic terminology
- Environment variable: ANTHROPIC_API_KEY ✅ Set

---

### Phase 6: Reporting & Billing — PARTIAL

**Built:**
- `InvoiceGenerator.js` v1.0.0 — Auto-invoice from rate cards + QC approved segments, expandable line items, print view
- `DailyWorkSheet.js` v2.1 — Dynamic projects, saves to Work Sheets tab
- `DailyProductionReport.js` — Production reporting page

**Not yet connected:**
- [ ] Auto-generate invoices from QC-approved map segments (bridge InvoiceGenerator → ProjectMapPage)
- [ ] Daily production reports pulled from map system data
- [ ] Profitability analysis dashboard
- [ ] Time-to-completion estimates based on current progress
- [ ] Auto-email invoices to customers

---

### Phase 7: GPS & Notifications — COMPLETE

**gpsService v1.0.0** — Crew location tracking service
**CrewTracker v1.1.0** — Real-time GPS markers, movement trails, reports positions to Google Sheets
**NotificationBell** — In Admin v3.7, Employee v2.4, Contractor v2.4 dashboards
**notificationService v1.0.0** — In-app notification management
**cron-digest v1.0.0** — Vercel cron job, daily 7AM CST compliance email digest

---

### Phase 8: User Self-Service — COMPLETE

**UserProfile v3.0.0** — Persistent notification preferences, emergency contact editing, session/logout management, password validation

---

## 💾 DATABASE SCHEMA (8-Table Google Sheets)

### Current State: ✅ Created & Populated via LYT_DB_Initializer_v1.0.gs

**Connection:** mapService v3.2.0 connects through Gateway with `sheetsRead`/`sheetsWrite`/`sheetsAppend` actions. Auto-detects DB online/offline and falls back to demo data if Gateway unreachable.

### Sheet 1: Projects
| Column | Example | Notes |
|--------|---------|-------|
| project_id | VXS-SLPH01-006 | Internal ID |
| customer | Vexus Fiber | |
| project_name | Sulphur LA City Build | |
| po_number | 3160880 | |
| total_value | 421712.30 | Calculated from segments |
| start_date | 2026-02-05 | |
| completion_date | 2029-01-09 | |
| status | Active/Complete/On Hold | |
| map_pdf_url | Google Drive link | |
| work_order_pdf_url | Google Drive link | |
| rate_card_id | vexus-la-tx-2026 | |
| created_at | timestamp | |
| created_by | user email | |

### Sheet 2: Segments
| Column | Example | Notes |
|--------|---------|-------|
| segment_id | VXS-SLPH01-006-A-A01 | Internal ID |
| project_id | VXS-SLPH01-006 | FK to Projects |
| contractor_id | A→A01 | Short ID for field use |
| section | A | Section letter |
| from_handhole | A (17x30x18) | With type |
| to_handhole | A01 (15x20x12) | With type |
| footage | 148 | Design footage |
| street | W Parish Rd | |
| gps_start_lat/lng | 30.1234 / -93.5678 | |
| gps_end_lat/lng | 30.1235 / -93.5679 | |
| boring_status | Not Started/In Progress/Complete/QC Approved/Issue | |
| boring_assigned_to | Gulf Coast Boring LLC | |
| boring_started/completed | timestamps | Auto-set on status change |
| boring_qc_approved_by/date | Matt Roy / timestamp | |
| boring_actual_footage | 150 | Can differ from design |
| boring_photos | JSON array of URLs | |
| pulling_status | (same pattern) | |
| pulling_direction | Forward/Backward/Both | |
| pulling_cable_type | 24F/48F/432F | |
| work_items | JSON array of billing items | |
| total_value | calculated from work_items | |

### Sheet 3: Splice Points
| Column | Example | Notes |
|--------|---------|-------|
| splice_id | VXS-SLPH01-006-SPL-A01 | |
| splice_type | 1x4 / 1x8 / F1 / TYCO-D | |
| position_type | mid-span / end-of-line | Affects billing |
| handhole_type | 15x20x12 TB / 17x30x18 B / 30x48x24 LHH | |
| required_photos | JSON array of photo types | |
| power_meter_tests | JSON array of test results | 8 tests per 1x4 |
| otdr_results | URL to PDF | Required for F1/TYCO-D |

### Sheet 4: Assignments
- assignment_id, project_id, contractor_company, work_type, segments (JSON array), status

### Sheet 5: Rate Cards
- 18 Vexus LA/TX 2026 rates pre-populated (UG1–UG28, FS1–FS4)

### Sheet 6: Users (PM Users)
- Existing users sheet, already working with portal login system

### Sheet 7: Work Log
- Automatic action logging: status changes, photo uploads, QC approvals, GPS check-ins

### Sheet 8: Issues
- Issue tracking: type, description, resolution, status, linked to segment/project

---

## 📸 PHOTO REQUIREMENTS BY SPLICE TYPE (Unchanged)

### 1×4 Terminal (7 photos):
1. Basket
2. Splice tray (1 tray)
3. Attached strength members
4. Grommets from inside
5. Completed enclosure closed
6. Cables entering enclosure
7. Enclosure in ground

### 1×8 Terminal (8 photos):
1. Basket
2. **Splitter tray** ← Additional
3. Splice tray (1 tray)
4. Attached strength members
5. Grommets from inside
6. Completed enclosure closed
7. Cables entering enclosure
8. Enclosure in ground

### F1 / TYCO-D Splice (7 + tray_count photos):
1. Basket
2–N. Splice tray #1, #2, #3... (one per tray, up to 8)
N+1. Strength members and grounds attached
N+2. Completed enclosure exterior (closed)
N+3. Cable entry with plugs/grommets
N+4. Enclosure in handhole

**Photo validation enforced before "Mark Complete"**

---

## 💰 BILLING RATES (Vexus LA/TX 2026 — Pre-loaded in Rate Cards Sheet)

### Underground Boring:
- UG1: Directional bore 1–4 ducts (1.25" ID) = $8.00/LF
- UG23: Directional bore 5 ducts (1.25" ID) = $9.50/LF
- UG24: Directional bore 6 ducts (1.25" ID) = $10.50/LF

### Cable Pulling:
- UG4: Pull up to 144ct armored/micro cable = $0.55/LF
- UG28: Place 288–432ct armored fiber in duct = $1.00/LF

### Splicing:
- FS1: Fusion splice 1 fiber = $16.50/EA
- FS2: Ring cut (mid-span terminals) = $275.00/EA
- FS3: Test Fiber (OTDR/power meter) = $6.60/EA
- FS4: ReEnter/Install Enclosure (end-of-line) = $137.50/EA

### Handholes:
- UG10: 30x48x30 = $310.00/EA
- UG11: 24x36x24 = $110.00/EA
- UG12: Utility Box = $20.00/EA
- UG13: Ground rod 5/8"×8' = $40.00/EA
- UG17: 17x30x18 HDPE = $60.00/EA
- UG18: 24x36x18 HDPE = $125.00/EA
- UG19: 30x48x18 HDPE = $250.00/EA
- UG20: Terminal Box = $40.00/EA
- UG27: 30x48x24 HDPE = $210.00/EA

### Splice Billing Examples:

**432CT F1 Butt Splice:**
```
FS1: 432 fibers × $16.50 = $7,128.00
FS4: Case setup = $137.50
TOTAL: $7,265.50 per butt splice
```

**1×4 Mid-Span Terminal:**
```
FS2: Ring cut = $275.00
FS1: 2 fibers × $16.50 = $33.00
FS3: 8 power meter tests × $6.60 = $52.80
TOTAL: $360.80
```

**1×4 End-of-Line Terminal:**
```
FS4: Case setup = $137.50
FS1: 2 fibers × $16.50 = $33.00
FS3: 8 power meter tests × $6.60 = $52.80
TOTAL: $223.30
```

---

## 🔑 TWO-TIER ID SYSTEM (Unchanged)

### Internal IDs (Database):
```
Format: {CUSTOMER}-{MARKET}-{BUILD}-{TYPE}-{SECTION}-{LOCATION}
Examples:
  VXS-SLPH01-006-BOR-A-A01      (Boring segment)
  VXS-SLPH01-006-SPL-A01        (Splice point)
  MET-HTLA02-015-BOR-C-C03      (Metronet Houston project)
```

### Contractor IDs (Map/Mobile):
```
Format: Simple segment notation matching construction map
Examples:
  A→A01          (Segment from A to A01)
  A01            (Splice point at A01)
  F1-Entry       (F1 entry butt splice)
```

---

## 🔲 REMAINING WORK — PRIORITY ORDER

### Priority 1: Real Map Data Testing
- [ ] **Upload real Sulphur LA construction map PDF** for end-to-end testing
- [ ] Verify Claude Vision extraction accuracy on real construction prints
- [ ] Validate GPS coordinate mapping from extracted data
- [ ] Confirm billing calculations match work order totals

### Priority 2: AI Optimization (Wire Existing Utils)
- [ ] Display backfeedDetector recommendations in AdminProjectDashboard
- [ ] Show optimal work sequence in ProjectMapPage
- [ ] Drill setup location recommendations on map
- [ ] Critical path highlighting (blue segments)
- [ ] Bottleneck alerts when phases fall behind

### Priority 3: Invoice Bridge
- [ ] Connect InvoiceGenerator to ProjectMapPage QC-approved segments
- [ ] Auto-calculate invoice totals from completed work items
- [ ] Generate invoices by contractor (only their completed segments)
- [ ] PDF invoice export

### Priority 4: Production Reports
- [ ] Auto-generate daily production reports from map system data
- [ ] Metronet Excel format export
- [ ] Progress dashboard with % complete, footage today, crews active
- [ ] Time-to-completion estimates

### Priority 5: API Key Security
- [ ] Restrict Google Maps API key to lytcomm.com domain in Google Cloud Console

### Priority 6: Real-Time Improvements (Future)
- [ ] WebSocket or polling for real-time status sync between field and office
- [ ] Push notifications for QC approvals, assignments, issues
- [ ] Offline-first architecture with sync queue

---

## 🔮 FUTURE ENHANCEMENTS (Post-MVP)

### Phase 9: Advanced Features
- [ ] Automated invoice email to customers
- [ ] Crew time tracking (clock in/out)
- [ ] Equipment tracking (drill rig locations)
- [ ] Weather integration (delay predictions)
- [ ] Material ordering integration
- [ ] Subcontractor payment automation

### Phase 10: Mobile App
- [ ] Native iOS app
- [ ] Native Android app
- [ ] Offline-first architecture
- [ ] Push notifications
- [ ] Biometric authentication

### Phase 11: AI Improvements
- [ ] Voice commands ("Hey LYT, show me today's work")
- [ ] Predictive maintenance alerts
- [ ] Automatic issue detection from photos (Claude Vision on QC photos)
- [ ] Quality scoring from OTDR traces
- [ ] Crew performance analytics
- [ ] Learning from completed projects to improve estimates

### Phase 12: Customer Portal
- [ ] Customer login to view progress
- [ ] Real-time map for stakeholders
- [ ] Automated status reports
- [ ] Payment portal integration
- [ ] Change order management

---

## 🛠 KNOWN ISSUES & SOLUTIONS

### Issue 1: PDF Worker Version Mismatch (FIXED)
**Problem:** pdfjs-dist API version didn't match worker version
**Solution:** Pinned pdfjs-dist to exact 4.8.69 (removed ^ caret). Worker URL dynamically matches installed version.

### Issue 2: Google Maps API Key Expired (FIXED)
**Problem:** Google Maps key returning 403 errors
**Solution:** Replaced with Leaflet/OpenStreetMap (free, no key needed). Street + Satellite toggle retained.

### Issue 3: react-leaflet Peer Dependency (FIXED)
**Problem:** react-leaflet requires React 19, project uses React 18 → ERESOLVE build failure
**Solution:** Removed react-leaflet, use raw Leaflet directly. No React peer dep conflict.

### Issue 4: Scanned PDF Extraction (FIXED)
**Problem:** pdfjs-dist text extraction returns empty/garbage on scanned/image PDFs
**Solution:** Render PDF pages to canvas images → send as JPEG to Claude Vision API for visual reading.

### Issue 5: Low-Res Map Reading (FIXED)
**Problem:** Full construction map at 2x scale = footage numbers were 2–3px tall, unreadable by Vision API
**Solution:** v4.0.0 tiles map into 6 sections at 4x scale. Each tile shows 1/6th of map at 7× more detail.

### Issue 6: ESLint Build Failures (Ongoing)
**Problem:** Vercel treats ESLint warnings as errors (unused imports, unused variables)
**Solution:** vercel.json sets `CI=false` in buildCommand. Always test with `CI=true npm run build` locally before pushing.

### Issue 7: Gateway Redirect Handling (FIXED)
**Problem:** Google Apps Script web apps return 302 redirect; browsers can't follow cross-origin redirects with fetch()
**Solution:** mapService v3.0.0 handles Gateway redirect responses automatically.

### Issue 8: Offline/Rural Coverage
**Problem:** No cell signal in rural construction areas
**Solution:** FieldAssist has offline fallback responses. PhotoUploader caches locally. Future: full offline-first architecture.

---

## 🔐 SECURITY & PERMISSIONS (Unchanged)

```javascript
const PERMISSIONS = {
  ADMIN: {
    canViewAllProjects: true, canCreateProjects: true, canDeleteProjects: true,
    canAssignWork: true, canApproveQC: true, canGenerateInvoices: true,
    canManageUsers: true
  },
  CONTRACTOR: {
    canViewAssignedWork: true, canUpdateStatus: true, canUploadPhotos: true,
    canReportIssues: true, canViewRateCard: false, canViewOtherContractors: false
  },
  EMPLOYEE: {
    canViewAssignedWork: true, canUpdateStatus: true, canUploadPhotos: true,
    canReportIssues: true, canViewAllProjects: true
  },
  QC_INSPECTOR: {
    canViewAllWork: true, canApproveWork: true, canRejectWork: true,
    canViewPhotos: true, canAddQCNotes: true
  }
};
```

---

## 🧪 TESTING CHECKLIST

### PDF Import:
- [ ] Upload real work order PDF → extracts correct project data
- [ ] Upload real construction map PDF → identifies all handholes via tiled Vision
- [ ] System calculates correct footage for all segments
- [ ] Rate card matching works for all unit codes
- [ ] Total project value matches work order
- [ ] Segments created with correct two-tier IDs
- [ ] Splice points identified correctly (type, position)

### Map Interface:
- [ ] Leaflet map loads and centers on project
- [ ] All segments display as color-coded polylines
- [ ] Color coding matches actual status from DB
- [ ] Click segment → shows detail panel with tabs
- [ ] Click handhole → shows tooltip with info
- [ ] Zoom/pan works smoothly on mobile and desktop
- [ ] Satellite/Street layer toggle works
- [ ] Crew GPS markers update in real-time

### Workflow Persistence:
- [ ] Change boring status → writes to Google Sheets
- [ ] QC approve → records approver name + timestamp
- [ ] Photo upload → saves URL to segment record
- [ ] Start/complete timestamps auto-recorded
- [ ] Action logged to Work Log sheet

### Security:
- [ ] Contractors can only see assigned segments (v2.5.0)
- [ ] Contractors cannot see pricing/billing
- [ ] Login required for all portal features
- [ ] Admin functions hidden from non-admins

---

## 📝 NOTES FOR NEXT CLAUDE SESSION

**If this chat gets compacted, the next Claude should:**

1. Read this build plan (v2.0) first
2. Fetch BLUEPRINT.md from GitHub for latest incremental changes:
   ```
   curl -s -H "Authorization: token (see Master Instructions)" \
     -H "Accept: application/vnd.github.v3.raw" \
     "https://api.github.com/repos/MSRCAM83/lytcomm-website/contents/BLUEPRINT.md"
   ```
3. Ask user: "Where did we leave off?"
4. Continue from the REMAINING WORK section above
5. Follow all HARD RULES in the Master Instructions document

**Current Status Variables:**
```javascript
const PROJECT_STATUS = {
  phase_1_import: 'COMPLETE',       // v4.1.0
  phase_2_map: 'COMPLETE',          // v3.0.0 (Leaflet)
  phase_3_workflow: 'COMPLETE',     // All 5 components wired + persisting
  phase_4_ai_optimizer: 'PARTIAL',  // Utils built, not wired to UI
  phase_5_field_assist: 'COMPLETE', // v1.0.0 + serverless
  phase_6_billing: 'PARTIAL',       // InvoiceGenerator exists, not bridged
  phase_7_gps_notify: 'COMPLETE',   // GPS + notifications + cron
  phase_8_self_service: 'COMPLETE', // UserProfile v3.0.0
  database: 'COMPLETE',            // 8 tables, Gateway CRUD
  deployed: true,                   // lytcomm.com live
  next_priority: 'Real map data testing with Sulphur LA PDF'
};
```

---

## 📞 QUICK REFERENCE

| Item | Value |
|------|-------|
| GitHub Repo | MSRCAM83/lytcomm-website |
| GitHub Token | (see Master Instructions) |
| Live URL | https://lytcomm.com |
| Vercel Team | team_KdY24IuzstUJ0GmIFbiMTPFn |
| Vercel Project | prj_WaoGvADsQWGd0kxC14n5qlNJ2T4q |
| Gateway URL | https://script.google.com/macros/s/AKfycbwiq8NzgdUQ6Hu44NHN3ASdAYTd68uK6wGRK_CpJroSoiMuv66aRmPAzDxmtXexl6MK/exec |
| Gateway Secret | (see Master Instructions) |
| Google Drive Folder | 11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC |
| Rate Card Sheet | 10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4 |
| Onboarding Sheet | 1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc |
| Work Log Doc | 110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo |
| Invite Code | welcome2lyt |
| NDA Code | lytnda2026 |
| Admin Logins | matt/mason/donnie @lytcomm.com (demo123) |
| Apps Script ID | 1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub |
| Package Version | 3.18.1 |

---

## 🚦 CHANGE LOG

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Feb 2, 2026 | Initial build plan created — all phases "Ready to Build" |
| v2.0 | Feb 4, 2026 | Updated to reflect actual state: Phases 1–3, 5, 7–8 COMPLETE. Phase 4, 6 PARTIAL. Database live. Leaflet replaced Google Maps. Vision AI tiling implemented. Workflow persistence wired. GPS + notifications + cron deployed. |

---

**END OF BUILD PLAN v2.0**
