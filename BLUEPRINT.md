# LYT COMMUNICATIONS - PROJECT BLUEPRINT
## For Claude Session Continuity
### Last Updated: January 22, 2026

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

---

## 🚨 CURRENT STATUS (Jan 22, 2026)

### 🔴 CRITICAL - Files Corrupted
- `pdfService.js` - Empty/corrupted, needs restore from previous commit
- `ContractorOnboarding.js` - Empty/corrupted, needs restore from previous commit

### 🟡 PENDING STYLING (Never Completed)
Portal/onboarding pages need full theme update:
- Header/footer must match main site
- Add Sun/Moon dark/light toggle to all pages
- "lyt" always lowercase, matching logo font/color
- Pass `setDarkMode` from App.js to components

**Files to style:**
1. App.js (pass setDarkMode prop)
2. PortalLogin.js
3. SetPassword.js
4. ForgotPassword.js
5. InviteCodePage.js
6. EmployeeOnboarding.js
7. ContractorOnboarding.js

**Color Scheme by Section:**
| Mode | Portal Pages | Onboarding Pages |
|------|--------------|------------------|
| Dark | #667eea (Purple) | #ff6b35 (Orange) |
| Light | #00b4d8 (Teal) | #28a745 (Green) |

### 🟡 PENDING PDF FIXES
- MSA v4.0 coordinate-based text filling (pages 1 & 15)
- SSN/EIN individual digit boxes (one number per box)
- W-4 worksheet fields (pages 3-4)

### 🟡 PENDING BACKEND
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
│   │   └── pdfService.js        # 🔴 CORRUPTED - needs restore
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
│       ├── ContractorOnboarding.js  # 🔴 CORRUPTED - needs restore
│       ├── EmployeeDashboard.js
│       ├── ContractorDashboard.js
│       └── AdminDashboard.js
├── BLUEPRINT.md                 # THIS FILE
└── package.json
```

---

## 🔀 APPLICATION FLOW

```
PUBLIC WEBSITE
    ↓
[Home] [About] [Services] [Contact] [Portal] [Onboarding]
    ↓                                    ↓
PORTAL LOGIN                    INVITE CODE PAGE
(Existing users)                      ↓
    ↓                    ┌────────────┴────────────┐
    ↓                    ↓                         ↓
    ↓              welcome2lyt               lytnda2026
    ↓                    ↓                         ↓
    ↓          [Employee] [Contractor]         [NDA Only]
    ↓                ↓           ↓                 ↓
DASHBOARDS    EMPLOYEE      CONTRACTOR        NDA SIGN
              ONBOARDING    ONBOARDING        (3 steps)
              (5 steps)     (8 steps)
```

---

## 🔐 ACCESS CODES & ACCOUNTS

### Invite Codes
| Code | Purpose | Route |
|------|---------|-------|
| `welcome2lyt` | Employee/Contractor onboarding | #onboarding |
| `lytnda2026` | NDA signing only | #onboarding → #nda-sign |

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| matt@lytcomm.com | demo123 | Admin |
| john@lytcomm.com | demo123 | Employee |
| sarah@lytcomm.com | demo123 | Contractor |

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

## 📝 CHANGELOG

| Date | Version | Changes |
|------|---------|---------|
| Jan 17 | 1.0-2.0 | Initial site + portals |
| Jan 18 | 2.1-2.25 | Logo fixes, ESLint audit, mobile responsive |
| Jan 19 | 2.26-2.38 | Theme consistency, Google Drive integration |
| Jan 20 | 2.39-2.43 | PDF generation fixes (W-4, W-9), Apps Script v4.0 |
| Jan 21 | 2.44-2.46 | SSN/EIN digit boxes, mobile optimization, data unmasking |
| Jan 22 | 2.47+ | NDA signing feature, MSA v4.0 work (files corrupted) |

---

## ✅ COMPLETED FEATURES

- [x] Public website (Home, About, Services, Contact)
- [x] Logo-centered homepage (no stock photos)
- [x] Dark/Light mode with dynamic logos
- [x] Employee onboarding (5 steps)
- [x] Contractor onboarding (8 steps)
- [x] Employee Dashboard with field operations
- [x] Contractor Dashboard
- [x] Admin Dashboard
- [x] Unified portal login
- [x] W-4 PDF filling with all fields
- [x] W-9 PDF filling with SSN/EIN digit boxes
- [x] Direct deposit forms
- [x] Google Drive integration (matt@lytcomm.com)
- [x] NDA signing feature (lytnda2026)
- [x] Mobile responsive design
- [x] Rate card PDF generation

---

*Update this blueprint whenever significant changes are made.*
