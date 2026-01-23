# LYT COMMUNICATIONS - PROJECT BLUEPRINT
## For Claude Session Continuity
### Last Updated: January 23, 2026

---

## 🎯 PROJECT OVERVIEW

**What is this?** A React website + employee/contractor portal system for LYT Communications, a fiber optic construction company operating in Texas and Louisiana.

**Live URL:** https://lytcomm.com (auto-deploys from main branch via Vercel)

**Core Functions:**
1. Public marketing website (Home, About, Services, Contact)
2. Employee portal (onboarding, dashboard, field operations)
3. Contractor portal (onboarding, dashboard, compliance)
4. Admin dashboard (manage employees/contractors)
5. NDA signing system (standalone invite code flow)
6. Recruiting tracker (Donnie's pipeline management)
7. Work map system (GPS-validated section tracking)
8. Pothole verification (photo documentation + approval workflow)

---

## 🚀 CURRENT STATUS (Jan 23, 2026)

### ✅ Live Version: v2.66
All core features deployed and working.

### 🟡 READY TO INTEGRATE (Built, Not Deployed)
Four new components in `lyt-phase1-components-v1_0.zip`:
1. **RecruitingTracker.js** (1,206 lines) - Donnie's pipeline management
2. **WorkMap.js** (650 lines) - GPS work validation, section tracking
3. **PotholeVerification.js** (873 lines) - Photo documentation + approval
4. **PortalLogin.js v3.0** (475 lines) - Production ready, unified theme

### 🟡 PENDING STYLING
Portal/onboarding pages need full theme update to match main site.

---

## 📋 COMPLETE PHASE BREAKDOWN

### ✅ PHASE 1 - CORE PORTAL (COMPLETED)
| Feature | Status |
|---------|--------|
| Unified login with invite code | ✅ |
| InviteCodePage (welcome2lyt) | ✅ |
| PortalLogin | ✅ |
| SetPassword | ✅ |
| ForgotPassword | ✅ |
| Admin: matt@lytcomm.com | ✅ |

### ✅ PHASE 2 - ADMIN & PDFS (COMPLETED)
| Feature | Status |
|---------|--------|
| Admin dashboard | ✅ |
| Pending onboarding approvals | ✅ |
| User management | ✅ |
| Secondary admin assignment | ✅ |
| Embedded PDFs inline (W-4, W-9, MSA) | ✅ |

### ✅ PHASE 3 - FIELD OPERATIONS (COMPLETED)
| Feature | Status |
|---------|--------|
| Daily production logs (footage, splices, poles, HDD, conduit) | ✅ |
| Equipment pre-use inspections (8-item checklist) | ✅ |
| Toolbox talk sign-in (13 preset topics) | ✅ |
| Photo documentation | ✅ |
| OTDR test result uploads (.sor/.trc files) | ✅ |
| 811 ticket tracking with expiry alerts (≤3 days) | ✅ |

### ✅ PHASE 4 - COMPLIANCE & TRACKING (COMPLETED)
| Feature | Status |
|---------|--------|
| Employee certifications (OSHA, CPR, FOI, Confined Space, Flagger) | ✅ |
| 30-day expiry alerts for certifications | ✅ |
| COI/compliance tracking (carrier, policy#, liability amounts) | ✅ |
| Vehicle insurance tracking | ✅ |
| Business license tracking | ✅ |
| Incident reports (injuries, actions, photos) | ✅ |

### ✅ PDF GENERATION (COMPLETED)
| Feature | Status |
|---------|--------|
| W-4 with all fields filled | ✅ |
| W-9 with SSN/EIN digit boxes (y=355 for EIN) | ✅ |
| Rate Card PDF with signature | ✅ |
| Direct Deposit authorization PDF | ✅ |
| Safety acknowledgment PDF | ✅ |
| ESIGN compliance (timestamp, IP, intent) | ✅ |

### ✅ NDA SIGNING (COMPLETED)
| Feature | Status |
|---------|--------|
| Invite code: lytnda2026 | ✅ |
| Route: #nda-sign | ✅ |
| 3-step wizard | ✅ |

---

## 🟡 PHASE 5 - SUPERVISOR/ADMIN TOOLS (BUILT - NEEDS INTEGRATION)

### RecruitingTracker.js (Donnie's Tool)
| Feature | Description |
|---------|-------------|
| Dashboard | Drill capacity bar (X/25 approved), follow-ups due, quick stats |
| Contractor Pipeline | New Lead → Contacted → Meeting → Docs Sent → Under Review → Approved → Blacklisted |
| Employee Pipeline | New Lead → Phone Screen → Interview → Offer → Accepted → Hired |
| Lead Management | Contact info, drill count, crew size, skills, service area |
| Commitment Tracking | Committed date, assigned project, showed up (yes/no) |
| No-Show Tracking | One no-show = blacklisted (zero tolerance for new recruits) |
| Reliability Scores | 0-100% based on show-up history |
| Follow-up System | Follow-up dates with alerts when due |
| Search & Filter | By name, company, phone, email, notes, status, type |

### WorkMap.js (GPS Work Validation)
| Feature | Description |
|---------|-------------|
| Project Overview | List projects with sections, assignments, footage |
| Section Tracking | ID, status (not_started/in_progress/completed), contractor, footage |
| GPS Validation | Gets current location, validates crew is on-site |
| Pre-Work Validation | Checks: GPS available, 811 ticket not expired, permit not expired, all potholes approved |
| Work Timer | Start/stop with elapsed time (HH:MM:SS) |
| Active Crews View | Which crews working, which drill, section, start time, footage today |
| Locate/Permit Expiry | Tracks expiration per section |
| Pothole Blocking | Blocks drilling if potholes pending approval |

### PotholeVerification.js (Photo Documentation)
| Feature | Description |
|---------|-------------|
| Contractor View | "My Potholes" tab - submit new, view history |
| Supervisor View | "Pending" tab - review queue |
| Photo Upload | Multiple angles (Overview, Utilities Close-up, Depth Measurement) |
| Pothole Details | Section, GPS, address, depth, width, locate ticket#, utilities exposed |
| Approval Flow | Pending → Approved OR Rejected (with reason) |
| Drilling Blocker | Crews cannot drill on sections with pending potholes |
| History | Who submitted, when, who reviewed, when, rejection reasons |

### PortalLogin.js v3.0 (Production Ready)
| Feature | Description |
|---------|-------------|
| No Demo Accounts | Removed mock users, uses real Apps Script auth |
| Apps Script URL | https://script.google.com/macros/s/AKfycbwNfM2kARMK2goiRyKLyxJnfOKnOYHZWpMsuqyOBDmXnZgmMHZeL1VkJb7R_gHqMXyA/exec |
| Unified Theme | Matches main site header/footer |
| Sun/Moon Toggle | Dark/light mode in top bar |
| Logo Styling | Correct colors per mode (dark: #e6c4d9, light: #0a3a7d/#2ec7c0) |

---

## 🔴 PHASE 6 - AUTO-GENERATED DOCUMENTS (NOT BUILT)

### Auto Daily Work Sheet (Metronet Excel Format)
| Source | Auto-Fills |
|--------|------------|
| Project assignment | PROJECT, LCP codes |
| GPS/address | Location, Cross Streets |
| System date | DATE |
| Contractor profile | Company + Contact + Phone |
| Section type | AE/UG |
| GPS work start time | Time |
| Traffic control checkbox | YES/NO |
| Production log notes | Purpose/Reason |

**Output:** Excel file matching exact Metronet template, one per day per project, multiple rows for multiple drills.

### Invoice Generator
| Feature | Description |
|---------|-------------|
| LYT Template | Custom design (not Metronet format) |
| Auto-populate | Completed sections, rate card pricing, quantities |
| Approved work only | Only bills what's been inspected |
| Separate per map | Each map/project gets own invoice |

### Reconciliation Report
| Feature | Description |
|---------|-------------|
| Compare | Your logs vs. Metronet payments |
| Discrepancy alerts | Flag mismatches |

---

## 🔴 PHASE 7 - ADVANCED ADMIN FEATURES (NOT BUILT)

| Feature | Description |
|---------|-------------|
| Production Metrics Dashboard | Daily/weekly/monthly footage, splices, poles, HDD |
| Safety Metrics | Days without incident, open issues |
| Compliance Overview | Expiring certs, COIs, permits at a glance |
| Project Profitability | Cost vs. billed by project |
| Activity Log | Full audit trail - who did what, when |
| Bulk Import (CSV) | Add multiple users at once |
| Export Data | Download reports, user lists |

---

## 🔴 PHASE 8 - USER SELF-SERVICE & NOTIFICATIONS (NOT BUILT)

| Feature | Description |
|---------|-------------|
| Edit Profile | Update phone, address, emergency contact |
| Upload New COI | Contractors renew insurance annually |
| View Documents | Access their signed forms |
| In-App Notification Center | See approvals, messages, alerts |
| Email Digests | Daily summary of pending items for admin |
| Session Timeout | Auto-logout after inactivity |

---

## 🔴 PHASE 9 - ADVANCED WORK TRACKING (NOT BUILT)

| Feature | Description |
|---------|-------------|
| Multi-Drill GPS Tracking | Real-time location per drill on management view |
| Breadcrumb Trail Playback | Review where crews were throughout the day |
| One-Call Locate Photo Confirmation | Photo proof of marks before drilling |
| Open Hole Status | End-of-day tracking |
| Client Inspection Workflow | Sign-off from Metronet supervisors |
| Restoration Tracking | Concrete, asphalt, landscape restoration status |
| Material Tracking | What was used per section |

---

## 🔴 PHASE 10 - CONTRACTOR PORTAL ENHANCEMENTS (NOT BUILT)

| Feature | Description |
|---------|-------------|
| Bore Log | Depth, soil type, utilities encountered |
| Damage Reports | Document any damages for liability protection |
| Permit Tracker | Avoid work stoppages |
| Invoices Submission | Submit invoices, track payment status |
| Client Portal View | Limited view for Metronet to see progress |

---

## 🔴 PHASE 11 - MOBILE/NATIVE CONSIDERATIONS (NOT BUILT)

| Feature | Description |
|---------|-------------|
| iPhone Contact Sync | Auto-save recruiting leads to Donnie's phone (needs native app) |
| Push Notifications | Real-time alerts for approvals, follow-ups |
| Offline Mode | Work tracking when no signal, syncs when back online |

---

## 🟡 PENDING STYLING OVERHAUL

Portal/onboarding pages need full theme update:

| File | Needed Changes |
|------|----------------|
| App.js | Pass setDarkMode to all pages |
| PortalLogin.js | ✅ Done in v3.0 |
| SetPassword.js | Match main site header/footer, Sun/Moon toggle |
| ForgotPassword.js | Match main site header/footer, Sun/Moon toggle |
| InviteCodePage.js | Match main site header/footer, Sun/Moon toggle |
| EmployeeOnboarding.js | Match main site header/footer, Sun/Moon toggle |
| ContractorOnboarding.js | Match main site header/footer, Sun/Moon toggle |

**Color Scheme by Section:**
| Mode | Portal Pages | Onboarding Pages |
|------|--------------|------------------|
| Dark | #667eea (Purple) | #ff6b35 (Orange) |
| Light | #00b4d8 (Teal) | #28a745 (Green) |

---

## 🟡 PENDING PDF FIXES

- MSA v4.0 coordinate-based text filling (pages 1 & 15)
- SSN/EIN individual digit boxes (one number per box)
- W-4 worksheet fields (pages 3-4)

---

## 🟡 PENDING BACKEND

- Apps Script `submitNDA` handler
- Emergency Contact PDF generation
- Drug Test PDF generation
- (Requires Apps Script v4.1 deployment)

---

## 🎨 DESIGN SYSTEM

### Brand Colors
```javascript
// Primary Palette
const colors = {
  oceanBlue: '#0077B6',   // Primary
  teal: '#00B4D8',        // Secondary
  green: '#28a745',       // Success/Tertiary
  coral: '#e85a4f',       // CTA
  orange: '#ff6b35',      // Accent (dark mode)
  purple: '#667eea',      // Portal accent (dark mode)
};

// Dark Mode (matches pink/purple/orange logo)
const darkMode = {
  background: '#0d1b2a',
  topBar: '#112240',
  cardBg: 'rgba(255,255,255,0.03)',
  text: '#ffffff',
  textMuted: '#94a3b8',
  border: 'rgba(255,255,255,0.1)',
  accentPortal: '#667eea',    // Purple
  accentOnboarding: '#ff6b35', // Orange
};

// Light Mode (matches blue/teal/green logo)
const lightMode = {
  background: '#ffffff',
  topBar: '#f1f5f9',
  cardBg: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  border: 'rgba(0,0,0,0.1)',
  accentPortal: '#00b4d8',    // Teal
  accentOnboarding: '#28a745', // Green
};
```

### Logo Text Colors
The "lyt Communications" text in the logo:
- **Dark mode "ly":** #e6c4d9 (pink)
- **Dark mode "t":** #e6c4d9 (pink)
- **Light mode "ly":** #0a3a7d (deep blue)
- **Light mode "t":** #2ec7c0 (teal)

### Typography
- Font: System default (-apple-system, BlinkMacSystemFont, 'Segoe UI')
- Company name: **Always "lyt" lowercase** (matches logo)

### Icons
- Library: `lucide-react`
- NO STOCK PHOTOS - Use icons, CSS gradients, logo as focal point

---

## 📁 FILE STRUCTURE

```
lytcomm-website/
├── public/
│   ├── index.html
│   ├── lyt_logo_dark.png        # Dark mode logo (pink/purple/orange)
│   ├── lyt_logo_light.png       # Light mode logo (blue/teal/green)
│   ├── Form W-4 sign.pdf
│   ├── Form W-9 sign.pdf
│   └── LYT_MSA_2026_v4.0.pdf    # Latest MSA (no fillable fields)
├── src/
│   ├── App.js                   # Main router, dark mode state
│   ├── index.js
│   ├── index.css
│   ├── config/
│   │   └── constants.js         # INVITE_CODE, NDA_INVITE_CODE, URLS
│   ├── components/
│   │   ├── SignaturePad.js
│   │   ├── SSNInput.js
│   │   └── EINInput.js
│   ├── services/
│   │   └── pdfService.js        # PDF generation (W-4, W-9, etc.)
│   ├── pages/
│   │   ├── HomePage.js
│   │   ├── AboutPage.js
│   │   ├── ServicesPage.js
│   │   ├── ContactPage.js
│   │   ├── PortalSelect.js
│   │   ├── InviteCodePage.js    # Handles welcome2lyt AND lytnda2026
│   │   └── NDASignPage.js       # NDA signing wizard (3 steps)
│   └── portals/
│       ├── PortalLogin.js
│       ├── SetPassword.js
│       ├── ForgotPassword.js
│       ├── EmployeeOnboarding.js
│       ├── ContractorOnboarding.js
│       ├── EmployeeDashboard.js
│       ├── ContractorDashboard.js
│       ├── AdminDashboard.js
│       ├── RecruitingTracker.js   # 🟡 READY TO INTEGRATE
│       ├── WorkMap.js             # 🟡 READY TO INTEGRATE
│       └── PotholeVerification.js # 🟡 READY TO INTEGRATE
├── BLUEPRINT.md                 # THIS FILE
└── package.json
```

---

## 🔀 APPLICATION FLOW

```
PUBLIC WEBSITE
    ↓
[Home] [About] [Services] [Contact] [Portal] [Onboarding]
    ↓                                       ↓
PORTAL LOGIN                        INVITE CODE PAGE
(Existing users)                            ↓
    ↓                         ┌─────────────┴─────────────┐
    ↓                         ↓                           ↓
    ↓                   welcome2lyt                 lytnda2026
    ↓                         ↓                           ↓
    ↓             [Employee] [Contractor]           [NDA Only]
    ↓                   ↓           ↓                     ↓
DASHBOARDS       EMPLOYEE      CONTRACTOR           NDA SIGN
                ONBOARDING    ONBOARDING            (3 steps)
                 (5 steps)     (8 steps)
```

### Dashboard Navigation

**Employee Dashboard Tabs:**
- Dashboard (stats, announcements)
- Production Logs
- Equipment Checks
- Toolbox Talks
- OTDR Results
- 811 Tickets
- Certifications
- Incident Reports

**Contractor Dashboard Tabs:**
- Dashboard (job assignments, stats)
- Daily Production
- Equipment Check
- COI / Compliance
- Incident Reports
- Invoices
- Rate Card

**Admin Dashboard Tabs:**
- Dashboard (metrics)
- Pending Approvals
- User Management
- Reports
- Recruiting Tracker (🟡 to integrate)
- Work Map (🟡 to integrate)
- Pothole Verification (🟡 to integrate)

---

## 🔑 ACCESS CODES & ACCOUNTS

### Invite Codes
| Code | Purpose | Route |
|------|---------|-------|
| `welcome2lyt` | Employee/Contractor onboarding | #onboarding |
| `lytnda2026` | NDA signing only | #onboarding → #nda-sign |

### Admin Contacts
- Matt Roy: matt@lytcomm.com (Primary)
- Mason Roy: mason@lytcomm.com
- Donnie Wells: donnie@lytcomm.com

---

## 🔗 INTEGRATIONS

| Service | Purpose | ID/Details |
|---------|---------|------------|
| Vercel | Hosting | Team: team_KdY24IuzstUJ0GmIFbiMTPFn, Project: prj_WaoGvADsQWGd0kxC14n5qlNJ2T4q |
| GitHub | Source | MSRCAM83/lytcomm-website |
| Google Apps Script | Backend | v4.0 deployed from matt@lytcomm.com |
| Google Drive | Storage | Folder: 11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC |
| Google Sheets | Rate Card | Sheet: 10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4 |
| Work Log | Tracking | Doc: 110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo |

---

## ⚠️ HARD RULES FOR CLAUDE

1. **NEVER DELETE** - Fix broken code, don't remove functionality
2. **NEVER GIT CLONE** - Use GitHub API via curl (it stalls otherwise)
3. **VERSION EVERYTHING** - Increment version numbers on all deliverables
4. **MODIFY, DON'T RECREATE** - Use str_replace and mv, not full rewrites
5. **TEST BEFORE PUSH** - Run `CI=true npm run build` locally
6. **ASK BEFORE PUSHING** - Unless extended permission granted
7. **"lyt" LOWERCASE** - Company name always lowercase like the logo
8. **NO ADDRESS/PHONE ON PDFs** - User explicitly removed this

### GitHub API Pattern
```bash
# READ file
curl -s -H "Authorization: token [GITHUB_TOKEN]" \
  -H "Accept: application/vnd.github.v3.raw" \
  "https://api.github.com/repos/MSRCAM83/lytcomm-website/contents/[path]"

# WRITE file (requires SHA)
# 1. Get current SHA
# 2. Base64 encode content
# 3. PUT to contents endpoint
# Token stored in Claude's memory - never commit to repo
```

---

## 🔄 CRASH RECOVERY PROTOCOL

When starting a new session:
1. ☐ Check current time via bash
2. ☐ Read this BLUEPRINT.md
3. ☐ Check work log (Doc ID: 110MX9xNtuVz4pZguJ58X34aqAsVgrRUmj2QjrooZcCo)
4. ☐ Check recent_chats for context
5. ☐ Compare main vs claude-wip branches if needed
6. ☐ Ask user what to work on

---

## 📊 PHASE SUMMARY

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Completed & Live | 25+ | Core portal, onboarding, field ops, compliance, PDF generation |
| 🟡 Built, Need Integration | 4 | RecruitingTracker, WorkMap, PotholeVerification, PortalLogin v3.0 |
| 🟡 Pending Styling | 6 | SetPassword, ForgotPassword, InviteCodePage, EmployeeOnboarding, ContractorOnboarding |
| 🔴 Not Built | 30+ | Auto docs, advanced admin, user self-service, GPS tracking, native features |

---

## 📝 CHANGELOG

| Date | Version | Changes |
|------|---------|---------|
| Jan 17 | 1.0-2.0 | Initial site + portals |
| Jan 18 | 2.1-2.25 | Logo fixes, ESLint audit, mobile responsive |
| Jan 19 | 2.26-2.38 | Theme consistency, Google Drive integration |
| Jan 20 | 2.39-2.43 | PDF generation fixes (W-4, W-9), Apps Script v4.0 |
| Jan 21 | 2.44-2.46 | SSN/EIN digit boxes, mobile optimization |
| Jan 22 | 2.47-2.50 | NDA signing feature, MSA v4.0 work |
| Jan 23 | 2.51-2.66 | W-9 EIN fix (y=355), signature overlap fix, PDF audit |
| Jan 23 | - | Built RecruitingTracker, WorkMap, PotholeVerification, PortalLogin v3.0 |

---

*Update this blueprint whenever significant changes are made.*
