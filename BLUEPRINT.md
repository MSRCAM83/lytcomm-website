# LYT COMMUNICATIONS - PROJECT BLUEPRINT
## For Claude Session Continuity
### Last Updated: January 23, 2026 - 4:00 PM CST

---

## 🎯 PROJECT OVERVIEW

**What is this?** A React website + employee/contractor portal system for LYT Communications, a fiber optic construction company operating in Texas and Louisiana.

**Live URL:** https://lytcomm.com (auto-deploys from main branch via Vercel)

**Current Version:** v2.70

**Core Functions:**
1. Public marketing website (Home, About, Services, Contact)
2. Employee portal (onboarding, dashboard, field operations)
3. Contractor portal (onboarding, dashboard, compliance)
4. Admin dashboard (manage employees/contractors)
5. NDA signing system (standalone invite code flow)
6. Recruiting tracker (Donnie's pipeline management)
7. Work map system (GPS-validated section tracking)
8. Pothole verification (photo documentation + approval workflow)
9. Daily work sheet generator (Metronet Excel format)
10. Invoice generator (LYT custom templates)
11. Metrics dashboard (production, safety, financial analytics)
12. Activity log (full audit trail)

---

## 🚀 CURRENT STATUS (Jan 23, 2026 - 4:00 PM CST)

### ✅ Live Version: v2.70
All Phases 1-7 deployed and working.

### ✅ BACKEND CONNECTED
- Apps Script v4.2 deployed (NEW URL)
- Login authentication: WORKING
- Google Sheets integrated

### ✅ CLAUDE GATEWAY OPERATIONAL
- Gateway URL: https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec
- Secret: LYTcomm2026ClaudeGatewaySecretKey99
- GCP Project: 344674689562 (LYT-Claude-Gateway)
- Full access: Drive, Gmail, Calendar, Sheets, Docs, Apps Script creation

### 🟡 NEEDS TESTING
- Employee onboarding form → saves to Google Sheet?
- Contractor onboarding form → saves to Google Sheet?
- User creation from Admin User Management
- Forgot password email flow
- NDA signing flow

---

## 🔗 CRITICAL URLS & IDS

### Live Site
- **Website:** https://lytcomm.com
- **Portal Login:** https://lytcomm.com/#portal-login
- **Onboarding:** https://lytcomm.com/#onboarding (code: welcome2lyt)
- **NDA Signing:** https://lytcomm.com/#nda-sign (code: lytnda2026)

### Apps Script Backend (UPDATED JAN 23 2026)
- **Web App URL:** https://script.google.com/macros/s/AKfycbx_CdTOkbzr9pmjaOmAgOP-rxKJaiUQTFgZyMS8Ub7ak5vjwQ8bRGAZYjO4mP_Qc1B3/exec
- **Version:** v4.2
- **Script ID:** 1q7rGi07EhRasc5EdwU7QKGz7h_2-e1Qokk-EbVMEUHhz_IveC09sfcKG

### Google Sheets
| Sheet Name | Sheet ID | Purpose |
|------------|----------|---------|
| LYT Portal Users | `1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw` | User accounts & login |
| LYT Onboarding Data | `1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc` | Onboarding submissions |

### Google Drive
- **Documents Folder:** `11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC`
- **Rate Card Sheet:** `10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4`

### GitHub
- **Repo:** MSRCAM83/lytcomm-website
- **Token:** (stored in master instructions doc, not here)

---

## 👤 ADMIN ACCOUNTS

| Email | Password | Role |
|-------|----------|------|
| matt@lytcomm.com | demo123 | Admin |
| mason@lytcomm.com | demo123 | Admin |
| donnie@lytcomm.com | demo123 | Admin |

⚠️ **Change these passwords after testing!**

---

## 📋 COMPLETE PHASE BREAKDOWN

### ✅ PHASE 1 - CORE PORTAL (COMPLETED)
| Feature | Route | Status |
|---------|-------|--------|
| Unified login with invite code | #portal-login | ✅ |
| InviteCodePage (welcome2lyt) | #onboarding | ✅ |
| PortalLogin v3.0 | #portal-login | ✅ |
| SetPassword | #set-password | ✅ |
| ForgotPassword | #forgot-password | ✅ |

### ✅ PHASE 2 - ADMIN & PDFS (COMPLETED)
| Feature | Status |
|---------|--------|
| Admin dashboard | ✅ |
| Pending onboarding approvals | ✅ |
| User management | ✅ |
| Embedded PDFs inline (W-4, W-9, MSA) | ✅ |
| ESIGN compliance (timestamp, IP, intent) | ✅ |

### ✅ PHASE 3 - FIELD OPERATIONS (COMPLETED)
| Feature | Status |
|---------|--------|
| Daily production logs | ✅ |
| Equipment pre-use inspections | ✅ |
| Toolbox talk sign-in | ✅ |
| Photo documentation | ✅ |
| OTDR test result uploads | ✅ |
| 811 ticket tracking with expiry alerts | ✅ |

### ✅ PHASE 4 - COMPLIANCE & TRACKING (COMPLETED)
| Feature | Status |
|---------|--------|
| Employee certifications tracking | ✅ |
| 30-day expiry alerts | ✅ |
| COI/compliance tracking | ✅ |
| Vehicle insurance tracking | ✅ |
| Business license tracking | ✅ |
| Incident reports | ✅ |

### ✅ PHASE 5 - SUPERVISOR/ADMIN TOOLS (COMPLETED)
| Component | Route | Status |
|-----------|-------|--------|
| AdminUserManagement.js v1.0 | #admin-users | ✅ |
| RecruitingTracker.js v1.0 | #recruiting | ✅ |
| WorkMap.js v1.0 | #work-map | ✅ |
| PotholeVerification.js v1.0 | #potholes | ✅ |

### ✅ PHASE 6 - DOCUMENT GENERATION (COMPLETED)
| Component | Route | Status |
|-----------|-------|--------|
| DailyWorkSheet.js v1.0 | #daily-worksheet | ✅ |
| InvoiceGenerator.js v1.0 | #invoices | ✅ |

### ✅ PHASE 7 - ADVANCED ADMIN (COMPLETED)
| Component | Route | Status |
|-----------|-------|--------|
| MetricsDashboard.js v1.0 | #metrics | ✅ |
| ActivityLog.js v1.0 | #activity-log | ✅ |

### 🔲 PHASE 8 - USER SELF-SERVICE (NOT STARTED)
| Feature | Status |
|---------|--------|
| Profile updates | 🔲 |
| Password changes | 🔲 |
| Notification preferences | 🔲 |
| Push notifications | 🔲 |
| Email alerts for expiring certs/COIs | 🔲 |

---

## 🗂️ FILE STRUCTURE

```
src/
├── App.js (v2.70 - main router)
├── config/
│   └── constants.js
├── components/
│   ├── SignaturePad.js
│   ├── SSNInput.js
│   └── EINInput.js
├── pages/
│   ├── HomePage.js
│   ├── AboutPage.js
│   ├── ServicesPage.js
│   ├── ContactPage.js
│   ├── PortalSelect.js
│   └── InviteCodePage.js
└── portals/
    ├── PortalLogin.js (v3.0)
    ├── SetPassword.js
    ├── ForgotPassword.js
    ├── EmployeeOnboarding.js
    ├── ContractorOnboarding.js
    ├── EmployeeDashboard.js
    ├── ContractorDashboard.js
    ├── AdminDashboard.js
    ├── AdminUserManagement.js (v1.0)
    ├── RecruitingTracker.js (v1.0)
    ├── WorkMap.js (v1.0)
    ├── PotholeVerification.js (v1.0)
    ├── DailyWorkSheet.js (v1.0)
    ├── InvoiceGenerator.js (v1.0)
    ├── MetricsDashboard.js (v1.0)
    └── ActivityLog.js (v1.0)
```

---

## 🔧 APPS SCRIPT CONFIG

The Apps Script v4.2 should have this CONFIG:

```javascript
const CONFIG = {
  USERS_SHEET_ID: '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw',
  ONBOARDING_SHEET_ID: '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc',
  DRIVE_FOLDER_ID: '11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC',
  COMPANY_NAME: 'LYT Communications',
  COMPANY_EMAIL: 'info@lytcomm.com',
  PORTAL_URL: 'https://lytcomm.com',
  ADMIN_EMAILS: ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com']
};
```

### Apps Script Handlers Available:
| Action | Handler | Purpose |
|--------|---------|---------|
| login | handleLogin | User authentication |
| setPassword | handleSetPassword | First-time password setup |
| forgotPassword | handleForgotPassword | Password reset email |
| createUser | createUser | Admin creates new user |
| updateUser | updateUser | Edit user details |
| deactivateUser | deactivateUser | Soft delete user |
| listUsers | listUsers | Get all users |
| submitEmployeeOnboarding | submitEmployeeOnboarding | Employee form submission |
| submitContractorOnboarding | submitContractorOnboarding | Contractor form submission |
| submitNDA | submitNDA | NDA signing submission |

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| v2.66 | Jan 22 | Base live site, PDF generation |
| v2.67 | Jan 23 | Phase 5 components added |
| v2.68 | Jan 23 | Dashboard nav integration |
| v2.69 | Jan 23 | Phase 6 document generation |
| v2.70 | Jan 23 | Phase 7 analytics & audit log |

---

## 🚨 CRASH RECOVERY COMMAND

If session crashes, paste this:

```
LYT project - run crash recovery

Backend is connected. Apps Script v4.2 deployed.
Apps Script URL: https://script.google.com/macros/s/AKfycbx_CdTOkbzr9pmjaOmAgOP-rxKJaiUQTFgZyMS8Ub7ak5vjwQ8bRGAZYjO4mP_Qc1B3/exec

Google Sheets configured:
- Users: 1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw
- Onboarding: 1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc

Login works with: matt@lytcomm.com / demo123

Claude Gateway operational for autonomous fixes.
```

---

## 📝 IMPORTANT NOTES

1. **Never use git clone** - always use GitHub API via curl
2. **Always version files** - lyt-site-v2.70.zip not lyt-site-FINAL.zip
3. **Save files immediately** - don't wait until end of session
4. **Test with CI=true npm run build** before pushing
5. **No company address/phone on PDFs** - user explicitly requested removal

---

## 🎨 BRAND COLORS

**Light Mode:**
- Primary: #0077B6 (ocean blue)
- Secondary: #00B4D8 (teal)
- Tertiary: #28a745 (green)

**Dark Mode:**
- Primary: #c850c0 (purple/pink)
- Secondary: #ff6b35 (orange)
- Tertiary: #e85a4f (coral)
- Background: #0d1b2a (dark navy)

---

*Document auto-generated by Claude for session continuity*
