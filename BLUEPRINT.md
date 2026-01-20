# LYT COMMUNICATIONS - PROJECT BLUEPRINT
## For Claude Session Continuity
### Last Updated: January 19, 2026

---

## 🎯 PROJECT OVERVIEW

**What is this?** A React website + employee/contractor portal system for LYT Communications, a fiber optic construction company in Houston, TX.

**Live URL:** https://lytcomm-website.vercel.app (auto-deploys from main branch)

**Core Functions:**
1. Public marketing website (Home, About, Services, Contact)
2. Employee portal (onboarding, dashboard, field operations)
3. Contractor portal (onboarding, dashboard, compliance)
4. Admin dashboard (manage employees/contractors)

---

## 🎨 DESIGN SYSTEM

### Colors (MUST USE THESE EXACTLY)
```javascript
const colors = {
  blue: '#0077B6',      // Primary - headers, links, primary buttons
  teal: '#00B4D8',      // Accent - highlights, hover states, icons
  green: '#28a745',     // Success - confirmations, completed states
  coral: '#e85a4f',     // CTA - call-to-action buttons, alerts
  orange: '#ff6b35',    // Secondary accent (use sparingly)
};

// Dark Mode
const darkMode = {
  background: '#0d1b2a',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBgAlt: 'rgba(255,255,255,0.05)',
  text: '#ffffff',
  textMuted: '#94a3b8',
  border: 'rgba(255,255,255,0.1)',
};

// Light Mode
const lightMode = {
  background: '#ffffff',
  cardBg: '#f8fafc',
  cardBgAlt: '#f1f5f9',
  text: '#1e293b',
  textMuted: '#64748b',
  border: 'rgba(0,0,0,0.1)',
};
```

### Typography
- Font: System default (-apple-system, BlinkMacSystemFont, 'Segoe UI', etc.)
- Headings: Bold, use `textColor` variable
- Body: Regular weight, 1.6-1.7 line height
- Small text: `textMuted` color

### Component Styling Patterns
```javascript
// Card pattern
const cardStyle = {
  backgroundColor: cardBg,
  borderRadius: '12px',
  padding: '24px',
  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
};

// Button pattern - Primary
const primaryButton = {
  backgroundColor: colors.coral,
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 24px',
  fontWeight: '600',
  cursor: 'pointer',
};

// Button pattern - Secondary
const secondaryButton = {
  backgroundColor: 'transparent',
  color: colors.blue,
  border: `2px solid ${colors.blue}`,
  borderRadius: '8px',
  padding: '10px 22px',
};

// Input pattern
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`,
  backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
  color: textColor,
  fontSize: '1rem',
};
```

### Icons
- Library: `lucide-react`
- Size: 20px for inline, 24px for standalone, 40-48px for features
- Color: Use `colors.blue`, `colors.teal`, or `textColor`

### NO STOCK PHOTOS
- Use icons, CSS gradients, and the custom logos instead
- Hero sections: Logo-centered with subtle glow effects
- Feature sections: Icon-based cards

---

## 📁 FILE STRUCTURE

```
lytcomm-website/
├── public/
│   ├── index.html
│   ├── lyt_logo_dark.jpg       # Dark mode logo (pink/magenta fiber optic)
│   ├── lyt_logo_light.jpg      # Light mode logo (blue/teal fiber optic)
│   ├── Form W-4 sign.pdf
│   ├── Form W-9 sign.pdf
│   └── LYT MSA 2006 - v3.4.pdf
├── src/
│   ├── App.js                  # Main router, dark mode state, view switching
│   ├── index.js                # React entry point
│   ├── index.css               # Global styles (minimal)
│   ├── config/
│   │   └── constants.js        # Colors, company info, mock data
│   ├── components/
│   │   ├── SignaturePad.js     # Signature capture component
│   │   ├── SSNInput.js         # SSN input with formatting
│   │   └── EINInput.js         # EIN input with formatting
│   ├── pages/
│   │   ├── HomePage.js         # Landing page with hero, services, CTA
│   │   ├── AboutPage.js        # Company info, team, mission
│   │   ├── ServicesPage.js     # Service offerings grid
│   │   ├── ContactPage.js      # Contact form + info
│   │   ├── PortalSelect.js     # Portal type selection cards
│   │   └── InviteCodePage.js   # Invite code entry for onboarding
│   └── portals/
│       ├── PortalLogin.js      # Unified login (employee/contractor)
│       ├── EmployeeLogin.js    # Employee-specific login
│       ├── ContractorLogin.js  # Contractor-specific login
│       ├── AdminLogin.js       # Admin login
│       ├── SetPassword.js      # New user password setup
│       ├── ForgotPassword.js   # Password recovery
│       ├── EmployeeOnboarding.js    # 5-step employee onboarding
│       ├── ContractorOnboarding.js  # 8-step contractor onboarding
│       ├── EmployeeDashboard.js     # Employee field operations
│       ├── ContractorDashboard.js   # Contractor job management
│       └── AdminDashboard.js        # Admin management panel
├── BLUEPRINT.md                # THIS FILE
├── CLAUDE_CRASH_RECOVERY_PROTOCOL.md
├── package.json
└── README.md
```

---

## 🔀 APPLICATION FLOW

```
                         ┌─────────────────┐
                         │   PUBLIC SITE   │
                         │ Home/About/etc  │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
       ┌──────────┐       ┌──────────────┐    ┌─────────────┐
       │  Portal  │       │ Invite Code  │    │   Admin     │
       │  Login   │       │    Entry     │    │   Login     │
       └────┬─────┘       └──────┬───────┘    └──────┬──────┘
            │                    │                   │
            │           ┌───────┴───────┐           │
            │           ▼               ▼           │
            │    ┌──────────┐    ┌────────────┐     │
            │    │ Employee │    │ Contractor │     │
            │    │Onboarding│    │ Onboarding │     │
            │    └────┬─────┘    └─────┬──────┘     │
            │         │                │           │
            ▼         ▼                ▼           ▼
     ┌────────────────────────────────────────────────┐
     │              AUTHENTICATED USERS               │
     ├──────────────┬─────────────────┬──────────────┤
     │   Employee   │   Contractor    │    Admin     │
     │  Dashboard   │   Dashboard     │  Dashboard   │
     └──────────────┴─────────────────┴──────────────┘
```

---

## 📋 COMPONENT SPECIFICATIONS

### App.js (Main Router)
- Manages: `view` state, `darkMode` state, `user` state
- Views: 'home', 'about', 'services', 'contact', 'portal-select', 'invite-code', 'employee-onboarding', 'contractor-onboarding', 'employee-dashboard', 'contractor-dashboard', 'admin-dashboard', 'admin-login', 'portal-login', 'set-password', 'forgot-password'
- Passes to all pages: `darkMode`, `setDarkMode`, `colors`, `setView`, `user`, `setUser`

### HomePage.js
- Hero: Logo-centered (switches dark/light), animated glow, tagline
- Services preview: 4 icon cards (HDD, Splicing, Aerial, Underground)
- CTA section: "Join Our Team" and "Partner With Us"
- Service area: Houston metro cities listed

### EmployeeDashboard.js (~1,600 lines)
Features:
- Dashboard tab: Stats cards, announcements
- Production Logs: Fiber footage, splices, poles, HDD drilling entry
- Equipment Checks: Pre-use inspection forms
- Toolbox Talks: Safety meeting sign-ins
- OTDR Uploads: Fiber test result uploads
- 811 Tickets: Utility locate tracking with expiry alerts
- Certifications: License/cert tracking with 30-day warnings
- Incident Reports: Safety incident documentation

### ContractorDashboard.js (~1,400 lines)
Features:
- Dashboard tab: Active jobs, compliance status
- Jobs: Job listings and details
- Work Logs: Daily work documentation
- Invoices: Invoice submission and tracking
- Documents: COI, W-9, MSA management
- Compliance: Insurance expiry tracking

---

## 🔐 AUTHENTICATION

### Invite Code
- Code: `welcome2lyt`
- Used for: New employee/contractor onboarding access

IGNORE THIS IF IT EXISTS ON THE WEBSITE REMOVE IT ### Demo Accounts
```javascript
const mockUsers = [
  { email: 'matt@lytcomm.com', password: 'demo123', role: 'admin', name: 'Matt Campbell' },
  { email: 'john@lytcomm.com', password: 'demo123', role: 'employee', name: 'John Smith' },
  { email: 'sarah@lytcomm.com', password: 'demo123', role: 'contractor', name: 'Sarah Johnson' },
];
```

### Admin Contacts
- Matt Campbell: matt@lytcomm.com (Primary)
- Mason Roy: mason@lytcomm.com
- Donnie Smith: donnie@lytcomm.com

---

## 🏢 COMPANY INFO

```javascript
const LYT_INFO = {
  name: 'LYT Communications, LLC',
  address: '12130 State Highway 3',
  city: 'Webster',
  state: 'TX',
  zip: '77598',
  phone: '(832) 850-3887',
  email: 'info@lytcomm.com',
};

const SERVICE_AREAS = [
  'Houston', 'Webster', 'League City', 'Pearland', 
  'Sugar Land', 'Katy', 'The Woodlands', 'Galveston', 
  'Pasadena', 'Baytown'
];
```

---

## 🔗 INTEGRATIONS

| Service | Purpose | ID/Details |
|---------|---------|------------|
| Vercel | Hosting/Deploy | Team: matt-roys-projects |
| GitHub | Source control | MSRCAM83/lytcomm-website |
| Google Drive | Document storage | Folder: 11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC |
| Google Sheets | Rate card data | Sheet: 10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4 |
| Adobe Sign | Document signatures | W-4, W-9, MSA workflows |

---

## ⚠️ IMPORTANT RULES FOR CLAUDE

1. **Colors**: Always use the exact hex codes from the Design System
2. **Dark/Light Mode**: Every component must support both modes
3. **No Stock Photos**: Use icons (lucide-react) and CSS effects only
4. **Mobile First**: All layouts must work on iPhone/Android
5. **Inline Styles**: Project uses inline CSS, not Tailwind or external CSS
6. **ESLint**: Remove unused imports, test with `CI=true npm run build`
7. **Versioning**: Increment version numbers on all deliverables
8. **Don't Delete**: Fix broken code, never delete functionality

---

## 🔄 RECOVERY CHECKLIST

If you're a new Claude session:

1. ☐ Read this BLUEPRINT.md
2. ☐ Check CLAUDE_WORK_LOG in Google Drive for current task status
3. ☐ Compare `main` vs `claude-wip` branches for any WIP code
4. ☐ Ask user what they want to work on
5. ☐ Update work log BEFORE starting any task
6. ☐ Commit to `claude-wip` every ~100 lines
7. ☐ Merge to `main` only when complete and tested

---

## 📝 CHANGELOG

| Date | Version | Changes |
|------|---------|---------|
| Jan 17, 2026 | 1.0 | Initial site + portals deployed |
| Jan 18, 2026 | 2.0 | New logo-centered homepage, ESLint fixes |
| Jan 18, 2026 | 2.0.1 | Full ESLint audit, all errors fixed |
| Jan 19, 2026 | 2.1 | Crash recovery system added |

---

*This blueprint should be updated whenever significant changes are made to the project structure, design system, or component specifications.*
