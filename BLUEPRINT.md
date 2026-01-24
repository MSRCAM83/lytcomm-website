# LYT COMMUNICATIONS - PROJECT BLUEPRINT
## For Claude Session Continuity
### Last Updated: January 24, 2026 - 12:15 AM CST

---

## 🎯 PROJECT OVERVIEW

**What is this?** A React website + employee/contractor portal system for LYT Communications, a fiber optic construction company operating in Texas and Louisiana.

**Live URL:** https://lytcomm.com (auto-deploys from main branch via Vercel)

**Current Version:** v5.3

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

## 🚀 CURRENT STATUS (Jan 24, 2026 - 12:15 AM CST)

### ✅ Live Version: v5.3
All Phases 1-7 deployed and working.

### ✅ BACKEND CONNECTED
- Apps Script v5.0 deployed
- Login authentication: WORKING
- Google Sheets integrated
- PDF uploads to correct Drive folders: WORKING
- Accepts both `pdfs` and `filledPdfs` keys (v5.2 fix)
- Folder names no longer include dates (v5.3 fix)

### ✅ CLAUDE GATEWAY OPERATIONAL
- Gateway URL: https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec
- Secret: LYTcomm2026ClaudeGatewaySecretKey99
- GCP Project: 344674689562 (LYT-Claude-Gateway)
- Full access: Drive, Gmail, Calendar, Sheets, Docs, Apps Script creation

### 🟡 PENDING STYLING
- Portal/onboarding pages need header/footer to match main site
- Sun/Moon dark mode toggle on all portal pages
- Accent colors: Portal (#667eea dark / #00b4d8 light), Onboarding (#ff6b35 dark / #28a745 light)
- "lyt" lowercase to match logo throughout

---

## 🔗 CRITICAL URLS & IDS

### Live Site
- **Website:** https://lytcomm.com
- **Portal Login:** https://lytcomm.com/#portal-login
- **Onboarding:** https://lytcomm.com/#onboarding (code: welcome2lyt)
- **NDA Signing:** https://lytcomm.com/#nda-sign (code: lytnda2026)

### Apps Script Backend (UPDATED JAN 24 2026)
- **Web App URL:** https://script.google.com/macros/s/AKfycbx6xm1vIF4YpPvdU8XhZrHm4SEX_oMzBEKZnF9MMO81U-fP9ngxI3G-7JYBXkhJF95m9Q/exec
- **Version:** v5.0
- **Script ID:** 1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub

### Google Drive Folders
- **Main Documents Folder:** `11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC`
- **Employee Onboarding Folder:** `1SWvghSxKR2uQN7I2xR7rGWzlBtpIYf62`
- **Contractor Onboarding Folder:** `1bsz8Zdue0Bw4ZojJQKIE76hyBGLpQIvk`

### Google Sheets
| Sheet Name | Sheet ID | Purpose |
|------------|----------|---------|
| LYT Portal Users | `1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw` | User accounts & login |
| LYT Onboarding Data | `1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc` | Onboarding submissions |

### Google Drive
- **Documents Folder:** `11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC`
- **Employee Folder:** `1SWvghSxKR2uQN7I2xR7rGWzlBtpIYf62`
- **Contractor Folder:** `1bsz8Zdue0Bw4ZojJQKIE76hyBGLpQIvk`
- **Rate Card Sheet:** `10Py5x0vIUWPzKn1ZeTaIGyaEJonbz-0BHmSYV-20rB4`

### Reserved Pre-Auth Scripts (10 available)
| # | Script ID |
|---|-----------|
| 1 | `1eJPgH6...` |
| 2 | `1M6ChVJ...` |
| 3 | `1yOMZE7...` |
| 4 | `13mUhCF...` |
| 5 | `17kc_Zj...` |
| 6 | `1pmjBFv...` |
| 7 | `1rnjvEo...` |
| 8 | `1Az2rJN...` |
| 9 | `1BXJNtl...` |
| 10 | `1nvnyca...` |

*(Full IDs stored in work log document)*

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
├── App.js (v5.3 - main router)
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

The Apps Script v5.0 should have this CONFIG:

```javascript
const CONFIG = {
  USERS_SHEET_ID: '1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw',
  ONBOARDING_SHEET_ID: '1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc',
  DRIVE_FOLDER_ID: '11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC',
  EMPLOYEE_FOLDER_ID: '1SWvghSxKR2uQN7I2xR7rGWzlBtpIYf62',
  CONTRACTOR_FOLDER_ID: '1bsz8Zdue0Bw4ZojJQKIE76hyBGLpQIvk',
  COMPANY_NAME: 'LYT Communications',
  COMPANY_EMAIL: 'info@lytcomm.com',
  PORTAL_URL: 'https://lytcomm.com',
  ADMIN_EMAILS: ['matt@lytcomm.com', 'mason@lytcomm.com', 'donnie@lytcomm.com']
};
```

### v5.x Key Fixes:
- Accepts both `pdfs` and `filledPdfs` keys for PDF data
- Name extraction: `d.name || ((f.firstName||'') + ' ' + (f.lastName||'')).trim()`
- Folder names no longer include dates
- PDFs saved to correct employee/contractor folders

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
| v2.80 | Jan 23 | W-9 sig fix, MSA v4.1, test panel mock docs |
| v2.81 | Jan 23 | New transparent dark/light logos |
| v2.82 | Jan 23 | Realistic onboarding test suite |
| v2.83 | Jan 24 | Fixed action field names for Apps Script API |
| v5.0 | Jan 24 | New Apps Script with correct folder locations |
| v5.1 | Jan 24 | Apps Script URL update |
| v5.2 | Jan 24 | Accepts both pdfs and filledPdfs keys |
| v5.3 | Jan 24 | No date in folder names |

---

## 🚨 CRASH RECOVERY COMMAND

If session crashes, paste this:

```
LYT project - run crash recovery

Backend is connected. Apps Script v5.0 deployed.
Apps Script URL: https://script.google.com/macros/s/AKfycbx6xm1vIF4YpPvdU8XhZrHm4SEX_oMzBEKZnF9MMO81U-fP9ngxI3G-7JYBXkhJF95m9Q/exec
Script ID: 1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub

Google Sheets configured:
- Users: 1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw
- Onboarding: 1VciM5TqHC5neB7JzpcFkX0qyoyzjBvIS0fKkOXQqnrc

Google Drive folders:
- Main: 11EuU2K-DzaT9KrDdbKOI4Q21c0-jKtiC
- Employees: 1SWvghSxKR2uQN7I2xR7rGWzlBtpIYf62
- Contractors: 1bsz8Zdue0Bw4ZojJQKIE76hyBGLpQIvk

Login works with: matt@lytcomm.com / demo123

Claude Gateway operational for autonomous fixes.
```

---

## 📝 IMPORTANT NOTES

1. **Never use git clone** - always use GitHub API via curl
2. **Always version files** - lyt-site-v5.3.zip not lyt-site-FINAL.zip
3. **Save files immediately** - don't wait until end of session
4. **Test with CI=true npm run build** before pushing
5. **No company address/phone on PDFs** - user explicitly requested removal
6. **Apps Script deployments are versioned snapshots** - must create new deployment after code changes

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

---

## 🤖 CLAUDE GATEWAY - HOW TO USE IT

### ⚠️ CRITICAL WARNING FOR FUTURE CLAUDES
**DO NOT:**
- Upload Apps Script code in chunks
- Remove vital code to "make it fit" 
- Try hacky workarounds for large file updates
- Use GitHub for Apps Script changes
- Use GET method for large payloads (>8KB)

**DO:**
- Use the Gateway's `updateScript` action to push complete code in one call
- Use **POST** method for large payloads (updateScript with full code)
- Use GET only for small operations (ping, getScript, driveList, etc.)

---

### Quick Start - Copy This Python Function

```python
import urllib.parse
import urllib.request
import json
import ssl

# Claude Gateway Configuration
GATEWAY_URL = "https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec"
GATEWAY_SECRET = "LYTcomm2026ClaudeGatewaySecretKey99"

def call_gateway(action, params=None, use_post=False):
    """
    Execute any Gateway action.
    
    Args:
        action: The action name (ping, getScript, updateScript, etc.)
        params: Dict of parameters for the action
        use_post: Set True for large payloads (updateScript with full code)
                  GET URLs have ~8KB limit, POST has no practical limit
    
    Returns:
        Dict with 'success' and 'data' or 'error'
    """
    payload = {"secret": GATEWAY_SECRET, "action": action}
    if params:
        payload["params"] = params
    
    ctx = ssl.create_default_context()
    
    if use_post:
        # POST for large payloads (updateScript, etc.)
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            GATEWAY_URL,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
    else:
        # GET for small payloads
        encoded_payload = urllib.parse.quote(json.dumps(payload))
        req = urllib.request.Request(f"{GATEWAY_URL}?payload={encoded_payload}")
    
    with urllib.request.urlopen(req, context=ctx) as response:
        return json.loads(response.read().decode())
```

---

### When to Use GET vs POST

| Method | Use For | Size Limit |
|--------|---------|------------|
| **GET** (default) | ping, getScript, getInfo, driveList, sheetsRead, small operations | ~8KB URL |
| **POST** (use_post=True) | updateScript, any operation with large payload | Unlimited |

**Rule of thumb:** If your `params` contains code or large data, use `use_post=True`

---

### Available Actions Reference

| Category | Action | Parameters | Method |
|----------|--------|------------|--------|
| **System** | `ping` | none | GET |
| **System** | `getInfo` | none | GET |
| **Apps Script** | `createScript` | `title`, `files[]`, `parentId?` | POST |
| **Apps Script** | `updateScript` | `scriptId`, `files[]` | **POST** |
| **Apps Script** | `deployScript` | `scriptId`, `description?` | POST |
| **Apps Script** | `getScript` | `scriptId` | GET |
| **Apps Script** | `listScripts` | `maxResults?`, `folderId?` | GET |
| **Apps Script** | `deleteScript` | `scriptId` | GET |
| **Drive** | `driveList` | `folderId?`, `mimeType?`, `maxResults?` | GET |
| **Drive** | `driveGet` | `fileId`, `includeContent?` | GET |
| **Drive** | `driveCreate` | `name`, `content?`, `mimeType?`, `folderId?` | POST |
| **Drive** | `driveUpdate` | `fileId`, `content?`, `name?` | POST |
| **Drive** | `driveDelete` | `fileId`, `permanent?` | GET |
| **Drive** | `driveSearch` | `query`, `maxResults?` | GET |
| **Gmail** | `gmailSearch` | `query`, `maxResults?` | GET |
| **Gmail** | `gmailGet` | `threadId` or `messageId` | GET |
| **Gmail** | `gmailSend` | `to`, `subject`, `body`, `htmlBody?` | POST |
| **Gmail** | `gmailCreateDraft` | `to`, `subject`, `body` | POST |
| **Calendar** | `calendarList` | `maxResults?` | GET |
| **Calendar** | `calendarGetEvents` | `calendarId?`, `startDate?`, `endDate?` | GET |
| **Calendar** | `calendarCreateEvent` | `title`, `startTime`, `endTime`, etc. | POST |
| **Sheets** | `sheetsRead` | `spreadsheetId`, `sheetName?`, `range?` | GET |
| **Sheets** | `sheetsWrite` | `spreadsheetId`, `range`, `values[][]` | POST |
| **Sheets** | `sheetsAppend` | `spreadsheetId`, `values[][]` | POST |
| **Docs** | `docsCreate` | `name`, `content?`, `folderId?` | POST |
| **Docs** | `docsGet` | `documentId` | GET |
| **Docs** | `docsUpdate` | `documentId`, `content`, `append?` | POST |

---

### Common Examples

**1. Update the LYT Portal Apps Script (FULL CODE REPLACEMENT):**
```python
# First, get the current code
result = call_gateway("getScript", {
    "scriptId": "1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub"
})

# Extract current files
code = None
manifest = None
for f in result["data"]["files"]:
    if f["name"] == "Code":
        code = f["source"]
    elif f["name"] == "appsscript":
        manifest = f["source"]

# Make your edits to `code`
modified_code = code.replace("old_text", "new_text")

# Push the complete updated code - USE POST!
result = call_gateway("updateScript", {
    "scriptId": "1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub",
    "files": [
        {"name": "Code", "type": "SERVER_JS", "source": modified_code},
        {"name": "appsscript", "type": "JSON", "source": manifest}
    ]
}, use_post=True)  # <-- IMPORTANT: use_post=True for large payloads!

print(result)  # {"success": true, "data": {"scriptId": "...", "filesUpdated": 2}}
```

**2. Read a Google Sheet:**
```python
result = call_gateway("sheetsRead", {
    "spreadsheetId": "1OjSak2YJJvbXjyX3FSND_GfaQUZ2IQkFiMRgLuNfqVw",
    "sheetName": "Sheet1"
})
print(result["data"]["data"])  # 2D array of values
```

**3. Send an Email:**
```python
result = call_gateway("gmailSend", {
    "to": "someone@example.com",
    "subject": "Test from Claude",
    "body": "This email was sent via Claude Gateway!"
}, use_post=True)
```

**4. Create a Calendar Event:**
```python
result = call_gateway("calendarCreateEvent", {
    "title": "Meeting scheduled by Claude",
    "startTime": "2026-01-25T10:00:00-06:00",
    "endTime": "2026-01-25T11:00:00-06:00",
    "description": "Auto-created via Gateway"
}, use_post=True)
```

**5. Search Drive:**
```python
result = call_gateway("driveSearch", {
    "query": "name contains 'LYT'",
    "maxResults": 10
})
for f in result["data"]["files"]:
    print(f["name"], f["url"])
```

---

### Important Script IDs

| Script | ID | Purpose |
|--------|-----|---------|
| LYT Portal Backend | `1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub` | Main website backend (v5.0) |
| Claude Gateway | (the Gateway itself) | This tool |

---

### Troubleshooting

**"Authentication failed"** → Check GATEWAY_SECRET matches exactly

**"Unknown action"** → Check spelling of action name (case-sensitive)

**HTTP 400 Bad Request** → Your payload is too large for GET. Use `use_post=True`

**Response is just health check JSON** → Make sure you're encoding the payload correctly

**"Failed to update project"** → Check scriptId is correct, and you have edit access

---

### Full Working Example: Edit and Update Apps Script

```python
import urllib.parse
import urllib.request
import json
import ssl

GATEWAY_URL = "https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec"
GATEWAY_SECRET = "LYTcomm2026ClaudeGatewaySecretKey99"
LYT_SCRIPT_ID = "1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub"

def call_gateway(action, params=None, use_post=False):
    payload = {"secret": GATEWAY_SECRET, "action": action}
    if params:
        payload["params"] = params
    
    ctx = ssl.create_default_context()
    
    if use_post:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            GATEWAY_URL,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
    else:
        encoded_payload = urllib.parse.quote(json.dumps(payload))
        req = urllib.request.Request(f"{GATEWAY_URL}?payload={encoded_payload}")
    
    with urllib.request.urlopen(req, context=ctx) as response:
        return json.loads(response.read().decode())

# 1. Get current script
result = call_gateway("getScript", {"scriptId": LYT_SCRIPT_ID})
files = {f["name"]: f for f in result["data"]["files"]}

code = files["Code"]["source"]
manifest = files["appsscript"]["source"]

# 2. Make edits
modified_code = code.replace("something", "something_else")

# 3. Push update (MUST use POST for large code!)
update_result = call_gateway("updateScript", {
    "scriptId": LYT_SCRIPT_ID,
    "files": [
        {"name": "Code", "type": "SERVER_JS", "source": modified_code},
        {"name": "appsscript", "type": "JSON", "source": manifest}
    ]
}, use_post=True)

print("Update result:", update_result)
```

