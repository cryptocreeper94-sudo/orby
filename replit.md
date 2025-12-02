# Orby - Operations Communication Platform

## Overview
Orby (getorby.io) is a comprehensive venue operations communications platform designed to replace texts, phone calls, and two-way radios. Built as a Progressive Web App (PWA), it provides real-time communication, delivery tracking, and issue routing for stadium and venue operations. Orby focuses on front-of-house operations and complements enterprise systems like Yellow Dog (inventory) and OrbitStaffing (scheduling/staffing).

**Key Value Proposition:** Contextual, trackable communication that's better than fragmented texts, interruptive calls, or spotty radios.

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
- Admin
- Management (Generally level - all managers) - PIN: 4444
- IT
- Warehouse
- Kitchen
- Bar
- Operations
- HR
- AlcoholCompliance (event-day vendor monitoring, violation reporting) - PIN: 5555
- CheckInAssistant (customer service, messaging to managers, incident reporting) - PIN: 6666
- Stand Supervisor (full dashboard access) - PIN: 3333
- Stand Lead - PIN: 2222
- NPO Worker - PIN: 1111

**Key Features:**
1. **Smart Message Routing** - Issues automatically route to the right department
2. **Delivery Tracking** - Full lifecycle: Requested → Approved → Picking → On the Way (ETA) → Delivered
3. **Status Dashboard** - Ops Manager sees all stands, issues, and deliveries in one view
4. **Quick Messages** - Pre-built responses for common situations
5. **Priority Escalation** - Emergency alerts vs normal queue
6. **Presence Awareness** - Who's on duty, who's at which stand
7. **Closing Workflows** - Guided checklists, signatures, PDF generation
8. **AI Scanning** - Photo coolers for auto-count, scan handwritten sheets
9. **Offline Mode** - Works when radio signals don't
10. **Full Audit Trail** - Everything documented for accountability
11. **Alcohol Compliance** - Vendor monitoring with photo/video evidence capture for violation reporting
12. **Check-in Assistant** - Customer service role with:
    - Messaging to HR/Managers only
    - Incident reporting with photo/video capture
    - Interactive stadium map for guest assistance
    - GPS-guided walking directions
13. **Weather Widget** - Real-time weather conditions using Open-Meteo API with animated effects
14. **Interactive Stadium Map** - Section/zone navigation with supervisor assignments
15. **Walking Directions** - Step-by-step navigation between stadium locations
16. **Facility Issue Reporting** - Photo-based issue documentation for maintenance

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

## File Structure
- `client/`: React frontend (pages, components, lib)
- `server/`: Express backend (routes, storage)
- `shared/`: Drizzle schema definitions
- `client/public/`: PWA assets, icons, manifest

## Branding
- Name: Orby
- Tagline: "Operations Communication Platform" or "Your team, connected"
- Theme Color: #06B6D4 (Cyan/Aqua)
- Parent Brand: "Orby by Orbit" (connects to OrbitStaffing)
- Powered by: DarkWave Studios, LLC

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
