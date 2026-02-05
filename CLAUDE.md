# LYT Communications Website

## Quick Context
Fiber optic construction company website with:
- Public marketing pages
- Employee/Contractor/Admin portals
- PDF extraction system (Claude API) for work order data
- Interactive job maps (Google Maps API)
- Google Sheets backend via Apps Script

## Project Structure
```
/api/                    # Vercel serverless functions
  pdf-import.js          # v4.1.0 - Claude API extraction endpoint

/src/
  /config/
    constants.js         # URLs, colors, company info, GATEWAY_CONFIG
    mapConfig.js         # v1.2.0 - PM thresholds, splitter config

  /pages/
    ProjectMapPage.js    # Google Maps job visualization
    JobImportPage.js     # PDF upload/extraction interface
    PortalLogin.js       # Authentication (uses portalScript API)

  /portals/
    AdminDashboard.js    # Admin panel
    EmployeeDashboard.js # Employee portal
    ContractorDashboard.js
    AdminUserManagement.js

  /services/
    mapService.js        # Map data loading (NO demo data)

  /components/
    ErrorBoundary.js     # Catches render errors

  App.js                 # Main router, page state management
```

## Key APIs

### Portal Script (Auth/Users)
- URL in `URLS.portalScript` (constants.js)
- Actions: login, createUser, resetPassword, getUserList
- Google Apps Script backend

### Onboarding Script
- URL in `URLS.appsScript` (constants.js)
- Handles employee/contractor form submissions

### Gateway API
- URL in `GATEWAY_CONFIG.url` (constants.js)
- Database operations for portal components

### PDF Extraction
- Endpoint: `/api/pdf-import.js`
- Requires: `ANTHROPIC_API_KEY` env var in Vercel
- Uses Claude claude-sonnet-4-20250514 model

## Environment Variables (Vercel)
- `ANTHROPIC_API_KEY` - Required for PDF extraction
- Google Maps API key configured in index.html

## Recent Changes (2026-02-04)
- Removed ALL demo/mock data from entire codebase
- Fixed Google Maps "setAt" error (added map && checks)
- Added ErrorBoundary component
- Removed hardcoded passwords from login pages
- Security: Authentication now uses real portalScript API only

## Important Patterns

### Google Maps Components
Always check `map &&` before rendering children:
```jsx
{map && segments.map(seg => <Polyline ... />)}
{map && showHandholes && handholesData.map(...)}
```

### No Demo Data
All mock arrays are empty. Data comes from:
- PDF extraction (job maps, segments, etc.)
- Google Sheets via Apps Script (users, projects)

### Authentication Flow
1. User submits credentials to PortalLogin
2. Calls URLS.portalScript with action: 'login'
3. On success, routes to role-based dashboard
4. Roles: admin, employee, contractor

## Common Tasks

### Deploy to Vercel
```bash
cd "C:\Users\matth\LYT Metronet Data Extraction\lytcomm-website"
git add -A && git commit -m "message" && git push
```
Vercel auto-deploys from main branch.

### Test PDF Extraction
1. Go to lytcomm.com → Job Import
2. Upload work order PDF
3. Check Vercel function logs if errors

### Add New Portal Page
1. Create component in /src/portals/
2. Add route case in App.js
3. Add navigation link in relevant dashboard
