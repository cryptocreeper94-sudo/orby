# Orby - Venue Operations Platform

## Overview
Orby (getorby.io) is a comprehensive venue operations platform designed for Nissan Stadium, replacing texts, phone calls, and two-way radios with unified digital operations. Built as a Progressive Web App (PWA), it provides Emergency Command Center, delivery lifecycle tracking, three-phase inventory counting, alcohol compliance monitoring, GPS-guided navigation, and real-time team communications. Currently in beta testing with Ops Manager David, targeting app store deployment via Capacitor.

**Key Value Proposition:** Complete venue operations in one platform - from emergency response to inventory counting to team communications.

## User Preferences
- Mobile-first design critical (operations staff use phones)
- No question dialog boxes - all questions in regular chat
- User must approve all changes before implementation
- Workflow rule: Jason approves all changes
- Brand: Aqua theme (#06B6D4), Orby mascot (aqua planet character)
- Domain: getorby.io

## Organizational Structure (Nissan Stadium Reference)

### Access Levels

| Level | Role | Dashboard Access |
|-------|------|------------------|
| **Full (Generally)** | All Managers, Ops Controllers | See everything, do everything |
| **Department** | Leads | See their queue + communicate up/down |
| **Field** | Supervisors → Stand Leads → NPO | Scoped to section/stand |

### Executive
- Brian (RVP)
- Megan (GM)

### Command Level (Full Access - All-Seeing)
- David (Ops Manager + IT Manager)
- Sid (Special Ops Controller)
- Jason (Dev + Field Ops - same purview as David/Sid)

### Department Managers (Full Access - Generally)
| Department | Manager(s) | Lead(s) |
|------------|-----------|---------|
| **Warehouse** | Jay (Purchasing Mgr - senior, fields event orders), AJ (Warehouse Mgr) | Sharrod |
| **Kitchen/Culinary** | Chef Deb (Culinary Mgr), Bobby (Kitchen Mgr) | — |
| **Bar** | Darby | — |
| **Operations** | Shelia (Supervisor/Mgr) | Serena |
| **IT** | David (also Ops Mgr) | Event IT collective |
| **HR** | Brooke K | K.D. (Assistant) |
| **Finance** | Pete | — |

### Special Notes
- **Brooke** (not Brooke K): Inventory Clerk/Supervisor - works warehouse during week, Stand Supervisor during events
- **IT Team**: Collective of event-day IT staff, no formal lead - David manages directly

### Field Hierarchy
```
Stand Supervisors (section oversight, can request from departments)
    ↓
Stand Leads (stand flow only, communicate to Supervisors)
    ↓
NPO Workers (frontline concessions)
```

### Communication Rules
- **Stand Leads**: NO direct access to Warehouse/Kitchen/IT/Operations - must go through Supervisor
- **Supervisors**: CAN request from all departments
- **Visibility**: Supervisor controls what Stand Lead sees, but Managers can override
- **All Managers**: Equal access, can see everything, can intervene anywhere

## System Architecture
Orby is a full-stack PWA utilizing React frontend and Express backend with PostgreSQL/Drizzle ORM.

**Core Roles in App (with Demo PINs):**
- Developer (Jason - unified with Ops Manager view + dev tools) - PIN: 0424
- Admin - PIN: 0424
- Management (Generally level - all managers) - PIN: 4444
- IT - PIN: 4444
- Warehouse - PIN: 4444
- Kitchen - PIN: 4444
- Bar - PIN: 4444
- Operations - PIN: 4444
- HR - PIN: 4444
- Alcohol Compliance (event-day vendor monitoring, violation reporting) - PIN: 5555
- Check-in Assistant (customer service, messaging to managers, incident reporting) - PIN: 6666
- Stand Supervisor (full dashboard access) - PIN: 3333
- Stand Lead - PIN: 2222
- NPO Worker - PIN: 1111
- Universal First-Time Staff - PIN: 9999 (geofenced to stadium)

**Key Features:**

### Emergency & Command
1. **Emergency Command Center** - Real-time incident management with priority levels
2. **Smart Message Routing** - Issues automatically route to the right department
3. **Priority Escalation** - Emergency alerts vs normal queue
4. **Full Audit Trail** - Everything documented for accountability

### Delivery Operations
5. **Delivery Tracking** - Full lifecycle: Requested → Approved → Picking → On the Way (ETA) → Delivered
6. **Status Dashboard** - Ops Manager sees all stands, issues, and deliveries in one view
7. **Quick Messages** - Pre-built responses for common situations

### Inventory Management
8. **Three-Phase Inventory Counting** - PreEvent → PostEvent → DayAfter workflow
   - PreEvent: Supervisor + Stand Lead/NPO verify printed counts
   - PostEvent: Different team counts end-of-event inventory
   - DayAfter: Manager verification and reconciliation
9. **Stand Setup** - Scan paper count sheets to create digital templates (OCR)
10. **Manager Document Hub** - Central archive for all reports, searchable by date/stand/category
11. **AI Scanning** - Photo coolers for auto-count, scan handwritten sheets

### Staff Management
12. **Universal PIN Login** - PIN 9999 for first-time staff (geofenced to stadium)
13. **Legends Staff Management** - Staff directory with role-based access
14. **Team Lead Assignments** - Dynamic lead assignments for hierarchical departments
15. **Bar Scheduler** - Darby's beverage operations scheduling

### Compliance & Safety
16. **Alcohol Compliance** - Vendor monitoring with photo/video evidence capture
17. **Check-in Assistant** - Guest services with incident reporting, messaging to HR/Managers
18. **Facility Issue Reporting** - Photo-based issue documentation for maintenance
19. **Tennessee ABC Board Alerts** - System-wide notification when ABC inspectors arrive with ID verification checklist
20. **Tennessee Health Department Alerts** - System-wide notification with 0-100 scoring compliance checklist based on Rule 1200-23

### Navigation & Location
21. **Interactive Stadium Map** - Section/zone navigation with supervisor assignments
22. **GPS-Guided Walking Directions** - Step-by-step navigation between stadium locations
23. **Weather Widget** - Real-time conditions using Open-Meteo API with animated effects

### Platform Features
24. **Presence Awareness** - Who's on duty, who's at which stand
25. **Closing Workflows** - Guided checklists, signatures, PDF generation
26. **Offline Mode** - Works when radio signals don't
27. **Sandbox Mode** - Training and demo environment

### Genesis Hallmark Stamping System (Blockchain Certified)
28. **Universal Asset Stamping** - Every auditable asset gets an ORB number (ORB-000000000001 format, 12 digits = 1 trillion capacity)
29. **Blockchain Verification** - Important documents (customer-facing, compliance, invoices, PDFs) anchored to Solana for tamper-proof verification
30. **Asset Tracker UI** - Full search/filter in Dev Panel and Manager Portal by number, name, date, type, category
31. **Version Badge** - Footer version indicator with changelog modal showing all platform releases
32. **Two-Tier System**: 
    - Internal Only: Everything gets ORB stamp (searchable paper trail)
    - Blockchain: Important docs also get Solana hash (immutable proof)

**Technical Stack:**
- Frontend: React, Wouter (routing), Zustand (state), TailwindCSS
- Backend: Express, Drizzle ORM, PostgreSQL
- PWA: Service Worker, offline support
- AI: GPT-4o Vision for can counting, Tesseract.js for OCR

## Integration Strategy
- **OrbitStaffing:** Roster sync, GPS verification, shift completion (sister product at orbitstaffing.io)
- **Yellow Dog:** Complements (not competes) - Orby = front-of-house ops, Yellow Dog = back-office inventory
- **POS Systems:** Real-time sales data integration potential

## External Dependencies
- PostgreSQL: Primary database
- Drizzle ORM: Schema and queries
- GPT-4o Vision: AI-powered counting from images
- Tesseract.js: Client-side OCR
- Zustand: State management
- jsPDF: PDF report generation
- Helius/Solana: Blockchain anchoring for Genesis Hallmark System (optional - works in demo mode without API key)

## File Structure
- `client/`: React frontend (pages, components, lib)
- `server/`: Express backend (routes, storage)
- `shared/`: Drizzle schema definitions
- `client/public/`: PWA assets, icons, manifest

## Branding
- Name: Orby
- Tagline: "Venue Operations Platform" or "Your team, connected"
- Theme Color: #06B6D4 (Cyan/Aqua)
- Parent Brand: "Orby by Orbit" (connects to OrbitStaffing)
- Powered by: DarkWave Studios, LLC
- Target Venue: Nissan Stadium (beta testing)

## Design Directives (MANDATORY)

### Free-Floating Images Policy
**Effective: December 2024**

All images added to Orby must follow these rules:
1. **No circular or square backgrounds** - Images must not be contained in shape containers
2. **Free-floating assets only** - All icons, mascots, and visual elements must have transparent backgrounds
3. **Use Python rembg** - All generated or imported images must be processed through rembg for clean background removal
4. **Seamless canvas integration** - Images should float over or blend seamlessly into the app background
5. **CSS-based effects** - Glows, shadows, and visual effects applied via CSS/Tailwind, not baked into images

### Premium UI/UX Standards
- Mobile-first, touch-optimized interactions
- Framer Motion animations for smooth transitions
- Dynamic glow effects based on context (weather conditions, alert severity, etc.)
- Glassmorphic effects with backdrop blur
- Dark theme with aqua/cyan accent gradients
- Floating action buttons for quick access features

### Image Processing Workflow
1. Generate image with AI or import asset
2. Run through Python rembg: `rembg i input.png output.png`
3. Verify transparent background
4. Import into React component
5. Apply CSS animations/effects as needed
