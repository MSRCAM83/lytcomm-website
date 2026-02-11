# LYT Communications Website

## Primary Directive
Your primary purpose is to BUILD, UPGRADE, and MAINTAIN the LYT Communications website (lytcomm.com).
This is a production business application — treat every change with care. You are the dedicated developer for this project.

When Matt opens this project, assume he wants to work on the website unless he says otherwise.
Be proactive: suggest improvements, flag issues you notice, and keep the codebase clean.

## Scope
This Claude instance is ONLY for website work. Do NOT:
- Load Claudia's identity, agent system, or any unrelated project context
- Make changes outside this repo without explicit permission
- Break production — always verify builds pass before committing

## What This Is
- **Company:** LYT Communications — fiber optic construction across Gulf Coast (TX, LA, MS, FL, AL)
- **Live site:** https://lytcomm.com (auto-deployed via Vercel from main branch)
- **Repo:** github.com/MSRCAM83/lytcomm-website
- **Stack:** React 18.2 (CRA) + Vercel serverless functions + Google Sheets backend + Google Apps Script APIs
- **Version:** v4.0.0 / package.json v3.18.1
- **Total codebase:** ~28,000 lines across ~60 files

## Asset Locations (DO NOT MOVE — reference only)
```
C:\Users\matth\lytcomm-website\                        # THIS REPO — main website source
C:\Users\matth\Documents\LYT Communications\           # Extraction data, PDFs, design docs
C:\Users\matth\Files\Work\LYT Metronet Data Extraction\ # Metronet extraction project
C:\Users\matth\Files\Work\lytcomm-website\             # Older backup
C:\Users\matth\Files\Work\lytcomm-website-main\        # Older backup
C:\Users\matth\Files\Work\lytcomm.com\                 # Older backup
```

---

## Full Project Structure
```
lytcomm-website/
├── api/                              # Vercel serverless functions
│   ├── pdf-import.js                 # v4.1.0 — Claude Vision PDF extraction (900s timeout, 3GB RAM)
│   ├── claude-chat.js                # v1.0.0 — Field Assist chat (Claude Sonnet 4)
│   └── cron-digest.js                # v1.0.0 — Daily compliance digest (7 AM CST)
│
├── src/
│   ├── App.js                        # v5.4 — Main router, hash-based routing, theme toggle, layout
│   ├── index.js                      # React entry point
│   ├── index.css                     # Global styles
│   │
│   ├── config/
│   │   ├── constants.js              # ALL external URLs, colors, company info, GATEWAY_CONFIG, invite codes
│   │   └── mapConfig.js              # v1.2.0 — Status colors, billing codes, photo requirements, PM thresholds, DB sheet IDs
│   │
│   ├── pages/                        # Marketing + project pages
│   │   ├── HomePage.js               # Landing page (hero, services, stats)
│   │   ├── AboutPage.js              # Company story
│   │   ├── ServicesPage.js           # Service offerings
│   │   ├── ContactPage.js            # Contact form
│   │   ├── PortalSelect.js           # Role selector (employee/contractor/admin)
│   │   ├── InviteCodePage.js         # Invite code entry for onboarding
│   │   ├── NDASignPage.js            # NDA signing page
│   │   ├── ApiTestPage.js            # API connectivity testing tool
│   │   ├── JobImportPage.js          # v4.1.0 — PDF upload, canvas tiling, extraction UI
│   │   ├── ProjectMapPage.js         # v4.0.0 — Interactive Leaflet/Google Maps with workflow tabs
│   │   ├── AdminProjectDashboard.js  # v3.0.0 — Multi-project management overview
│   │   └── DailyProductionReport.js  # v1.0.0 — Production reporting
│   │
│   ├── portals/                      # Auth + role-based dashboards
│   │   ├── PortalLogin.js            # v3.8 — Unified login (handles GAS CORS redirect)
│   │   ├── EmployeeLogin.js          # Legacy login (redirects to PortalLogin)
│   │   ├── ContractorLogin.js        # Legacy login
│   │   ├── AdminLogin.js             # Legacy login
│   │   ├── SetPassword.js            # First-time password setup
│   │   ├── ForgotPassword.js         # Password reset via email
│   │   ├── UserProfile.js            # User settings & preferences
│   │   ├── EmployeeDashboard.js      # v2.1 — Timeclock, projects, production logs
│   │   ├── ContractorDashboard.js    # v2.1 — Work assignments, billing, compliance
│   │   ├── AdminDashboard.js         # v3.7 — User overview, onboarding queue, stats
│   │   ├── AdminUserManagement.js    # User CRUD, role assignment, deactivation
│   │   ├── EmployeeOnboarding.js     # ~1000 lines — W-4, W-9, MSA, personal info forms
│   │   ├── ContractorOnboarding.js   # EIN, insurance, rates forms
│   │   ├── ActivityLog.js            # Audit trail
│   │   ├── MetricsDashboard.js       # KPIs & analytics
│   │   ├── RecruitingTracker.js      # Hiring pipeline
│   │   ├── WorkMap.js                # GPS crew tracking
│   │   ├── PotholeVerification.js    # Pothole documentation
│   │   ├── DailyWorkSheet.js         # Shift reporting
│   │   └── InvoiceGenerator.js       # Invoice generation from rate cards
│   │
│   ├── components/
│   │   ├── ErrorBoundary.js          # React error boundary (prevents white screens)
│   │   ├── Toast.js                  # Toast notifications
│   │   ├── SignaturePad.js           # E-signature capture (canvas)
│   │   ├── SSNInput.js               # SSN auto-formatting
│   │   ├── EINInput.js               # EIN auto-formatting
│   │   ├── NotificationBell.js       # Alert badge
│   │   ├── Chat/
│   │   │   ├── FieldAssist.js        # v1.0.0 — Floating AI chat (calls /api/claude-chat)
│   │   │   └── ChatBubble.js         # Message display
│   │   ├── Workflow/
│   │   │   ├── BoringTracker.js      # Boring phase: pothole → approval → in progress → QC
│   │   │   ├── PullingTracker.js     # Pulling phase: cable type, direction, backfeed warning
│   │   │   ├── SplicingTracker.js    # Splicing phase: type-specific photos, PM tests, OTDR
│   │   │   ├── PhotoUploader.js      # v1.1.0 — Camera/file upload with GPS extraction
│   │   │   └── QCApproval.js         # Admin review: approve/reject/flag
│   │   └── Map/
│   │       └── CrewTracker.js        # v1.1.0 — GPS tracking, updates every 30s
│   │
│   ├── services/
│   │   ├── apiService.js             # v1.0 — Base64 conversion, IP lookup, fetchWithTimeout
│   │   ├── mapService.js             # v3.0 — 741 lines — Google Sheets CRUD via Gateway (the DB bridge)
│   │   ├── pdfService.js             # v1.1.0 — 1100 lines — PDF generation (invoices, reports)
│   │   ├── workflowService.js        # v1.0 — Phase transitions, prerequisite checks
│   │   ├── gpsService.js             # v1.0 — Geolocation, distance calc, coordinate validation
│   │   ├── notificationService.js    # v1.0 — Compliance expiration alerts
│   │   ├── photoUploadService.js     # v1.0 — Photo upload to Google Drive
│   │   └── testSubmissions.js        # v1.0 — Demo data for testing
│   │
│   └── utils/
│       ├── idGenerator.js            # Two-tier ID system (internal + contractor)
│       ├── rateCardMatcher.js        # Billing calculations
│       ├── segmentParser.js          # Map text parsing
│       └── backfeedDetector.js       # Backfeed route detection
│
├── gas-deploy/                       # Google Apps Script source
│   ├── Code.js                       # Onboarding handler (doPost)
│   ├── appsscript.json               # GAS manifest
│   └── .clasp.json                   # clasp CLI config
│
├── public/                           # Static assets
│   ├── index.html                    # Root HTML (Google Maps API key loaded here)
│   ├── lyt_logo_dark.png / .jpg      # Dark mode logo
│   ├── lyt_logo_light.png / .jpg     # Light mode logo
│   ├── favicon.svg
│   ├── Form W-4 sign.pdf             # Tax form
│   ├── Form W-9 sign.pdf             # Contractor form
│   ├── LYT_MSA_2026_*.pdf            # Master Service Agreement
│   ├── LYT_HSE_Manual_v2.3.pdf       # Health & Safety manual
│   ├── SLPH.01.006_*.pdf             # Design map
│   └── MCA2190_*.pdf                 # Master contract
│
├── CLAUDE.md                         # THIS FILE — project instructions
├── BLUEPRINT.md                      # Project map system design doc
├── README.md                         # Deployment guide
├── package.json                      # v3.18.1 — React 18, pdfjs, leaflet, lucide, date-fns
├── vercel.json                       # Deployment config, cron, function settings
└── LYT_Onboarding_Handler_v2.gs      # Standalone onboarding script
```

---

## Routing (App.js — hash-based)

### Public pages (with header/footer)
| Hash | Component | Purpose |
|------|-----------|---------|
| `#home` | HomePage | Landing page |
| `#about` | AboutPage | Company story |
| `#services` | ServicesPage | Service offerings |
| `#contact` | ContactPage | Contact form |
| `#portal` | PortalSelect | Role picker |

### Portal pages (no header/footer)
| Hash | Component | Purpose |
|------|-----------|---------|
| `#portal-login` | PortalLogin | Unified login |
| `#set-password` | SetPassword | First-time password |
| `#forgot-password` | ForgotPassword | Password reset |
| `#onboarding` | InviteCodePage | Invite code entry |
| `#nda-sign` | NDASignPage | NDA signing |
| `#employee-dashboard` | EmployeeDashboard | Employee portal |
| `#contractor-dashboard` | ContractorDashboard | Contractor portal |
| `#admin-dashboard` | AdminDashboard | Admin portal |
| `#admin-users` | AdminUserManagement | User CRUD |
| `#employee-onboarding` | EmployeeOnboarding | Employee forms |
| `#contractor-onboarding` | ContractorOnboarding | Contractor forms |
| `#recruiting` | RecruitingTracker | Hiring pipeline |
| `#work-map` | WorkMap | GPS crew tracking |
| `#potholes` | PotholeVerification | Pothole docs |
| `#daily-worksheet` | DailyWorkSheet | Shift reporting |
| `#invoices` | InvoiceGenerator | Invoice generation |
| `#metrics` | MetricsDashboard | KPIs |
| `#activity-log` | ActivityLog | Audit trail |
| `#profile` | UserProfile | User settings |

### Project Map System
| Hash | Component | Purpose |
|------|-----------|---------|
| `#job-import` | JobImportPage | PDF upload & Claude extraction |
| `#project-map` | ProjectMapPage | Interactive map + workflow tabs |
| `#admin-projects` | AdminProjectDashboard | Multi-project management |
| `#daily-report` | DailyProductionReport | Production metrics |

### Field Assist Chat (floating)
Visible on: employee-dashboard, contractor-dashboard, admin-dashboard, work-map, potholes, project-map, admin-projects, job-import, daily-report, daily-worksheet, invoices, metrics

---

## Backend Architecture

### Three Google Apps Script Endpoints

**1. Portal Backend** (Auth/Users)
- URL: `URLS.portalScript` in constants.js
- Actions: `login`, `setPassword`, `forgotPassword`, `createUser`, `updateUser`, `listUsers`, `deactivateUser`, `submitEmployeeOnboarding`, `submitContractorOnboarding`, `submitNDA`

**2. Onboarding Script** (Form submissions)
- URL: `URLS.appsScript` in constants.js
- Handles: Form data → Google Sheets + PDF uploads to Drive + confirmation emails

**3. Claude Gateway** (All Sheets/Drive/Gmail ops)
- URL: `GATEWAY_CONFIG.url` in constants.js
- Secret: `GATEWAY_CONFIG.secret` in constants.js
- Actions: `sheetsRead`, `sheetsWrite`, `sheetsAppend`, `gmailSend`, `driveList`, `driveCreate`
- This is the central proxy — ALL database operations go through it

### CORS Redirect Pattern (CRITICAL)
Google Apps Script returns a 302 redirect to `script.googleusercontent.com`. Browsers can't follow cross-origin redirects in fetch(). The frontend must manually extract the redirect URL from HTML and re-fetch:
```javascript
const text = await response.text();
if (text.includes('HREF="')) {
  const match = text.match(/HREF="([^"]+)"/i);
  const redirectUrl = match[1].replace(/&amp;/g, '&');
  const finalResponse = await fetch(redirectUrl);
  const result = JSON.parse(await finalResponse.text());
}
```
This pattern is used in PortalLogin, mapService, apiService, and any component hitting GAS.

### Vercel Serverless Functions
| Endpoint | Method | Purpose | Config |
|----------|--------|---------|--------|
| `/api/pdf-import` | POST | PDF extraction via Claude Vision (Opus 4.6) | 900s timeout, 3GB RAM |
| `/api/claude-chat` | POST | Field Assist chat (Sonnet 4) | Default |
| `/api/cron-digest` | GET | Daily compliance scan | Cron: 0 13 * * * (7AM CST) |

### Google Sheets Database (11 spreadsheets via mapConfig.js)
| Sheet | Purpose |
|-------|---------|
| PROJECTS | Project metadata |
| SEGMENTS | Route segments |
| SPLICE_POINTS | Splice point data |
| HANDHOLES | Handhole locations |
| FLOWERPOTS | UG12 utility boxes |
| GROUND_RODS | Ground rod locations |
| ASSIGNMENTS | Crew assignments |
| RATE_CARDS | Billing rates (vexus-la-tx-2026) |
| USERS | User accounts |
| WORK_LOG | GPS/time tracking |
| ISSUES | Reported issues |

Sheet IDs are in `mapConfig.js` → `DB` object.

---

## PDF Extraction System (The Big Feature)

### Upload Flow (JobImportPage.js)
1. User uploads work order PDF + map PDF
2. Frontend renders PDFs to canvas at **2.5x scale**
3. Map pages get tiled: 2 cols x 2 rows = 4 tiles per page + legend crop (right 28%, top 55%)
4. JPEG quality: 70%, max 16 images total
5. Work order: text extracted (up to 10 pages), map: images only (up to 4 pages)

### Extraction (api/pdf-import.js)
- Sends text + tiled images to Claude Opus 4.6
- Returns structured JSON:
  - `segments[]` — segment_id, street, footage, duct_count, GPS coords, cable_type, billing_status
  - `splice_points[]` — splice_id, type (1x4/1x8/F1/TYCO-D), handhole_id, GPS, pm_readings, billing_code
  - `handholes[]` — handhole_id, type (15x20x12/17x30x18/30x48x24), GPS
  - `flowerpots[]`, `ground_rods[]`, `unallocated_items[]`
  - `reconciliation` — expected vs extracted counts + discrepancies
- Imported to Google Sheets via `mapService.importProject()`

### Billing Model (CRITICAL — get this right)
**Three-tier rate structure:**
1. **Vexus Rate** — what Vexus pays LYT (admin-only, never shown to contractors/employees)
2. **Contractor Rate** — what LYT pays the contractor (set per project, modifiable by admin)
3. **Margin** — LYT's profit (admin-only, auto-calculated)

**Contractors NEVER see Vexus rates or margins. They only see their project-specific rate.**

**Rate card source:** `C:\Users\matth\Downloads\Vexus keep LA_TX rate card.xlsx`
- Sheet 1: "Louisiana & Vexus Texas" — all unit codes with 3 price columns
- Sheet 2: "Unit Descriptions" — full descriptions of every code
- Sheet 3: "Hourly Units" — T&M / extra work rates
- Sheet 4: "Pega" — Texas-only rates (different FS1=$15, FS2=$250, FS4=$125)

**Master rate card is per-contract (Vexus LA/TX). Project rate cards are per-project per-contractor.**
When a project is created, admin can adjust contractor rates for that specific project.

### All Billable Unit Codes (~70+)
**Aerial (AE1-AE19, AE31):** Strand, lashing, overlashing, guys, anchors, riser guards, ADSS, extension arms, tree trim, resag, delash, pole transfers, bonding, dampers, squirrel guard, figure-8 dips
**Splicing (FS1-FS05):** Fusion splice ($16.50/fiber), ring cut ($275), test fiber ($6.60), re-enter enclosure ($137.50), ribbon splice
**Underground Boring (UG1-UG3, UG16, UG21-UG24, UG29-UG30):** 1-6 subduct bores ($8-$10.50/LF), 4" HDPE ($8.25/LF), 2" duct bores
**Underground Pulling (UG4, UG22, UG28):** Pull up to 144ct/micro ($0.55/LF), inner duct ($0.60/LF), 288-432ct armored ($1.00/LF)
**Underground Structures (UG9-UG12, UG17-UG20, UG27):** Pedestals, handholes (5 sizes $60-$310), flowerpots/utility boxes ($20), terminal boxes ($40)
**Underground Misc (UG5-UG8, UG13-UG15, UG31-UG32):** Direct bury plow, ground rods ($40), marker posts ($12-$18), cut/bore/saw
**Poles (PP1-PP3):** Place ($360), hand carry ($100), detach/remove ($200)
**Restoration (PA01-PA02A, PC01-PC02A, RA1, RC1):** Asphalt ($3-$30/SF), concrete ($4-$40/SF), removal ($20-$40/CF)
**Other (BCP, HSPH, TC1):** Pole banding, hardscape potholing ($200), traffic control ($40/hr)
**Hourly T&M (L10A-L70A, E10-E82):** Personnel $35-$75/hr, equipment $9-$115/hr (extra work only)

---

## Workflow System

### Phase Order (sequential, each requires prior QC approval)
1. **Boring** — Potholing → Approved → In Progress → Complete → QC Approved
2. **Pulling** — Cable type/direction → Photos (4 required) → Complete → QC Approved
3. **Splicing** — Type-specific photos + PM tests → Complete → QC Approved

### Photo Requirements by Splice Type
| Type | Photos | Details |
|------|--------|---------|
| 1x4 | 9 | 7 enclosure + 2 PM readings |
| 1x8 | 8 | Enclosure photos (no PM test) |
| F1/TYCO-D | 5 + tray count | Base photos + per-tray shots |

### Power Meter Thresholds (1x4 terminals)
- PASS: -25 to -8 dBm
- WARNING: -25 to -28 dBm (marginal)
- FAIL_WEAK: < -28 dBm (too much loss)
- FAIL_STRONG: > -8 dBm (overload risk)

### Status Colors
```
NOT_STARTED: #FF4444 (red)
IN_PROGRESS: #FFB800 (yellow)
COMPLETE:    #4CAF50 (green)
QC_APPROVED: #2196F3 (blue)
BLOCKED:     #9E9E9E (grey)
ISSUE:       #FF9800 (orange)
```

---

## Authentication Flow
1. User enters credentials at `#portal-login` → PortalLogin.js
2. POST to Portal Backend with `action: 'login'`
3. Handle GAS CORS redirect (extract URL from HTML, re-fetch)
4. On success: `setLoggedInUser({ email, role, name, company })`
5. Route to role-based dashboard (admin/employee/contractor)

### Invite Codes (constants.js)
- Onboarding: `welcome2lyt`
- NDA: `lytnda2026`

### User Roles
- **Admin** — Full access, user management, QC approval, all tools
- **Employee** — Timeclock, assigned projects, production logs, compliance docs
- **Contractor** — Work assignments, billing, compliance tracking

---

## Theme System
### Dark Mode (default)
- Background: `#0d1b2a`
- Primary: `#c850c0` (purple)
- Secondary: `#ff6b35` (orange)

### Light Mode
- Background: `#ffffff`
- Primary: `#0077B6` (blue)
- Secondary: `#00b4d8` (teal)

Toggle in top-right of App.js.

---

## Company Info (constants.js)
```
LYT Communications
12130 State Highway 3, Webster, TX 77598
(832) 850-3887 | info@lytcomm.com
Admin emails: matt@lytcomm.com, mason@lytcomm.com, donnie@lytcomm.com
```

### Services
1. HDD Drilling
2. Fiber Splicing
3. Aerial Construction
4. Underground Construction
5. Network Testing
6. Project Management

---

## Environment Variables
- `ANTHROPIC_API_KEY` — Vercel env var, used by pdf-import.js and claude-chat.js (server-side only)
- `REACT_APP_GOOGLE_MAPS_API_KEY` — Falls back to hardcoded key in mapConfig.js (restricted by HTTP referrer)
- `CI=false` — In .env, suppresses build warnings

---

## Critical Patterns

### Google Maps — Always guard with `map &&`
```jsx
{map && segments.map(seg => <Polyline ... />)}
{map && showHandholes && handholesData.map(...)}
```

### No Demo Data
All mock arrays are empty. ALL data comes from PDF extraction or Google Sheets. Never add demo/mock data.

### GAS CORS Redirect
Every call to a Google Apps Script endpoint must handle the 302 redirect pattern. See "CORS Redirect Pattern" section above.

### mapService is the DB Layer
All reads/writes to Google Sheets go through `src/services/mapService.js` via the Gateway. Key methods:
- `readSheet(spreadsheetId, range)`, `writeSheet()`, `appendRow()`
- `loadFullProject(projectId)` — fetches all 8 project sheets
- `importProject(projectData)` — creates new project from extraction JSON
- `updateSegmentField()`, `updateSpliceField()` — field-level updates

---

## Deploy
```bash
git add -A && git commit -m "message" && git push
```
Vercel auto-deploys from main. Build command: `CI=false npm run build`. Output: `build/`.

## Common Issues
| Issue | Fix |
|-------|-----|
| PDF extraction failed | Check ANTHROPIC_API_KEY in Vercel env vars |
| Portal won't connect | GAS deployment may have lost OAuth — create NEW deployment in Apps Script |
| Chat not responding | API key missing or rate limited |
| User creation fails | Users sheet headers mismatch — check Gateway script |
| Map blank/errors | Check map && guards, verify Google Maps API key |

## Adding a New Portal Page
1. Create component in `/src/portals/`
2. Add route case in `App.js`
3. Add navigation link in relevant dashboard
