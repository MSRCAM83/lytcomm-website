# LYT COMMUNICATIONS - PROJECT BLUEPRINT
## For Claude Session Continuity
### Last Updated: January 29, 2026 - 3:55 AM CST

---

## 🎯 PROJECT OVERVIEW

**What is this?** A React website + employee/contractor portal system for LYT Communications, a fiber optic construction company operating in Texas and Louisiana.

**Live URL:** https://lytcomm.com (auto-deploys from main branch via Vercel)

## 🚀 CURRENT STATUS (Jan 24, 2026 - 1:50 AM CST)

### ✅ Live Version: v3.6
Website deployed and working.

### ✅ ARCHITECTURE SUMMARY

**Onboarding (Employee/Contractor forms):**
- Script: LYT Onboarding v5.5
- URL: `https://script.google.com/macros/s/AKfycbw3cnZ7eZJu1wWovxE-_xKDyyWwPR2Mw3jqH05rjrF2XN00jqeaQW3S3aiRwXaxi2skJw/exec`
- Script ID: `1q0dbtkwSS9JNPeT_-eHQTzaiWRIPyKzukcEO0C6hg6h4bizOfsLN4Cub`
- STATUS: ✅ WORKING

**Portal (Login, User Management):**
- Uses Claude Gateway for all operations
- Gateway URL: `https://script.google.com/macros/s/AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ/exec`
- Gateway Secret: `LYTcomm2026ClaudeGatewaySecretKey99`
- Actions used: `sheetsRead`, `sheetsWrite`, `sheetsAppend`, `gmailSend`
- STATUS: ✅ WORKING

**Why Gateway instead of separate Portal script:**
- Google Apps Script web app deployments require OAuth consent via UI
- API-created deployments don't work without manual authorization
- Gateway is already deployed and has Sheets/Gmail access
- Portal functions use Gateway's sheetsRead/Write to access Users sheet directly

---

## 🔗 CRITICAL URLS & IDS

### Live Site
- **Website:** https://lytcomm.com
- **Portal Login:** https://lytcomm.com/#portal-login
- **Onboarding:** https://lytcomm.com/#onboarding (code: welcome2lyt)
- **NDA Signing:** https://lytcomm.com/#nda-sign (code: lytnda2026)
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
- **v3.6** (Jan 29, 2026): Fixed Portal Login - new Portal Backend deployment, added redirect handling, visible version numbers
- **v3.5** (Jan 29, 2026): Updated PortalLogin to use Portal Backend with CORS redirect workaround

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


## 🚨 CRITICAL: GOOGLE APPS SCRIPT CORS/REDIRECT ISSUE

### THE PROBLEM
Google Apps Script web apps return a **302 redirect** to `script.googleusercontent.com`. While curl can follow this redirect with `-L`, **browsers CANNOT follow cross-origin redirects** when using `fetch()`. This causes "Unable to connect" errors even when the script is working.

### HOW TO TEST IF A SCRIPT IS ACTUALLY WORKING
```bash
# Step 1: Get the redirect URL
curl -s "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec" | grep -oP 'HREF="\K[^"]+'

# Step 2: Follow the redirect manually (decode &amp; to &)
curl -s "REDIRECT_URL_HERE" 
```
If Step 2 returns JSON, the script IS working - the problem is CORS, not the script.

### HOW TO FIX IN FRONTEND CODE
The frontend must handle the redirect manually:
```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify(payload)
});
const text = await response.text();

// Check if we got HTML redirect instead of JSON
if (text.trim().startsWith('<')) {
  const match = text.match(/HREF="([^"]+)"/i);
  if (match) {
    const redirectUrl = match[1].replace(/&amp;/g, '&');
    const redirectResponse = await fetch(redirectUrl);
    const result = await redirectResponse.json();
    // Use result...
  }
}
```

### WHEN DEPLOYMENTS LOSE AUTHORIZATION
If a script returns "Page Not Found" after following redirect, it means the **deployment lost OAuth authorization**. This happens when:
1. Drive restrictions are changed
2. Script permissions are modified
3. Too much time passes without use

**FIX:** Create a NEW deployment:
1. Open the script in script.google.com
2. Deploy → New deployment
3. Type: Web app
4. Execute as: Me
5. Who has access: Anyone
6. Copy the NEW URL and update the frontend code

### CURRENT WORKING URLS (Jan 29, 2026)

| Script | Purpose | Deployment URL |
|--------|---------|----------------|
| **LYT Portal Backend v1.0** | Portal login, user mgmt | `AKfycbyUHklFqQCDIFzHKVq488fYtAIW1lChNnWV2FWHnvGEr7Eq0oREhDE5CueoBJ6k-xhKOg` |
| **LYT Onboarding v5.0** | Employee/Contractor forms | `AKfycbw3cnZ7eZJu1wWovxE-_xKDyyWwPR2Mw3jqH05rjrF2XN00jqeaQW3S3aiRwXaxi2skJw` |
| **Claude Gateway** | Claude's API access | `AKfycbyFWHLgFOglJ75Y6AGnyme0P00OjFgE_-qrDN9m0spn4HCgcyBpjvMopsB1_l9MDjIctQ` |

### ALWAYS ADD VISIBLE VERSION NUMBERS
Every page that gets updated MUST show a visible version number in the UI so the user can verify they're seeing the new version. **MANDATORY RULE:** Every page/component MUST have a version number displayed in the **bottom-right corner**, visible after **triple-click**.

Example:
```jsx
<p style={{ fontSize: '0.7rem', opacity: 0.5 }}>v3.6</p>
```

### FILES THAT USE THESE SCRIPTS
| File | Script Used | Variable/Constant |
|------|-------------|-------------------|
| `PortalLogin.js` | Portal Backend | `PORTAL_URL` constant |
| `AdminUserManagement.js` | Claude Gateway | `GATEWAY_URL` constant |
| `EmployeeOnboarding.js` | Onboarding v5.0 | `URLS.appsScript` from constants |
| `ContractorOnboarding.js` | Onboarding v5.0 | `URLS.appsScript` from constants |
| `NDASignPage.js` | Onboarding v5.0 | `URLS.appsScript` from constants |
| `constants.js` | Both | `URLS.appsScript`, `URLS.portalScript`, `GATEWAY_CONFIG.url` |


## 🚨 MANDATORY VERSION NUMBER RULE

**EVERY page or component that is created or modified MUST include a version number:**
- **Location:** Bottom-right corner of the page
- **Visibility:** Shown after triple-click (hidden by default to keep UI clean)
- **Format:** Small text, semi-transparent
- **This is NON-NEGOTIABLE for ALL code changes**

Example implementation:
```jsx
// Add to every page component
const [showVersion, setShowVersion] = useState(false);

// In the JSX, add click handler to main container
<div onClick={(e) => { if (e.detail === 3) setShowVersion(!showVersion); }}>
  {/* page content */}
  
  {showVersion && (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      fontSize: '0.7rem', 
      opacity: 0.5,
      color: darkMode ? '#fff' : '#333'
    }}>
      v1.0.0
    </div>
  )}
</div>
```
