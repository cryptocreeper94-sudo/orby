# StadiumOps - Digital Stadium Concessions Management

## Overview
StadiumOps is a comprehensive digital inventory and staffing management system for stadium concessions operations. Built as a Progressive Web App (PWA) with full backend API, it replaces paper-based processes with a mobile-optimized web application.

## Current State
- Full-stack application with Express backend and PostgreSQL database
- PWA-enabled for mobile installation
- Role-based access control with new hierarchy
- First-time PIN reset required for all field roles
- Accordion-style UI with pastel blue theme and 3D buttons

## New Role Hierarchy & Communication Rules

### Role Hierarchy (Initial PINs)
| Role | Initial PIN | Dashboard | Can Contact |
|------|-------------|-----------|-------------|
| NPOWorker | 1111 | /npo | Stand Lead only |
| StandLead | 2222 | /standlead | Supervisor only |
| StandSupervisor | 3333 | /supervisor | Everyone |
| ManagementCore | 4444 | /manager | Everyone |
| ManagementAssistant | 4444 | /manager | Supervisor, Management |
| Admin | 1234 | /admin | Everyone |
| IT | 9999 | /it | Admin, Management |
| Developer | 0424 | /dev | Everyone |

### Management Sub-Types (ManagementCore role)
- WarehouseManager
- BarManager
- InventoryManager
- KitchenManager
- CulinaryManager
- HRManager
- OperationsManager
- GeneralManager

### First-Time PIN Reset Flow
1. Users login with initial role-based PIN (1111, 2222, 3333, or 4444)
2. System detects `requiresPinReset: true` flag
3. Redirects to /set-pin page
4. User creates personal 4-digit PIN
5. PIN stored securely, `requiresPinReset` set to false
6. User must re-login with new personal PIN

### Communication Access Control
- **NPO Worker → Stand Lead**: Can only message their assigned Stand Lead
- **Stand Lead → Supervisor**: Cannot contact warehouse/kitchen/management directly
- **Supervisor → All**: Full access to warehouse, kitchen, management
- **Management → All**: Can reach any role

### Geofencing Alerts
When NPO Worker leaves stand boundary:
- Stand Lead notified automatically
- Supervisor notified automatically
- Event logged in geofence_events table

### Manager Assistant Assignment
- Managers can assign assistants for event day
- Assistants inherit contact privileges of assigning manager
- Stored in manager_assignments table with event date scope

## Key Features
- **Staffing Grid**: Event-based staffing assignments (format: "YY-MM-DD POS [Team] v [Team]")
- **Inventory Counting**: Pre-event count sheets by stand, items counted by EACH (not case)
- **POS Terminal Tracking**: Specific unit numbers (e.g., A930 #126, E700 units)
- **Supervisor Pack**: Compliance documents, checklists, signatures

### Communication System
- **Threaded Conversations**: Two-way communication between any roles
- **Target Selection**: Supervisor selects target (Warehouse, Kitchen, Manager, Bar Manager, HR Manager)
- **Quick Messages**: Pre-populated canned responses for common requests
- **Auto-Timeout**: Conversations reset after 1-2 minutes of inactivity

### Incident Reporting
- **Unified Incidents**: All roles can report incidents
- **Media Upload**: Photo/video attachment support (up to 5 files, 50MB limit)
- **Auto-Notification**: All supervisors and admins notified immediately on new incidents
- **Status Tracking**: Open → In Progress → Resolved → Closed

### Stand Issue Reporting (Equipment/Operations)
- **Issue Categories**: Cooling, Beverage, Power, AV, Menu, FoodSafety, Equipment, Staffing, Other
- **Auto-Routing by Category**:
  - Cooling/Beverage → Warehouse Manager
  - Power/AV/Menu → Operations Manager
  - FoodSafety → Kitchen Manager
  - Equipment → Warehouse + Operations
  - Staffing → General Manager + Operations
- **Severity Levels**: Emergency (immediate notification), High, Normal, Low
- **Emergency Escalation**: Emergency issues also notify General Manager and Regional VP
- **Status Flow**: Open → Acknowledged → InProgress → Resolved → Closed

### POS Hardware Tracking
- **E700 Terminals**: Full-featured POS units (e.g., E700 #201, #202)
- **A930 Terminals**: Handheld units (e.g., A930 #126, #130)
- **Hotspot Devices**: Mobile internet devices for stands without wired connection (e.g., "3 hot" = Hotspot #3)

### OCR Scanner (Future)
- **Tesseract.js**: Client-side OCR for inventory counting automation
- **API Endpoint**: POST /api/ocr/scan for image processing
- **Text Extraction**: Returns text, confidence scores, and word positions

## Project Structure
```
├── client/src/          # React frontend
│   ├── pages/           # Dashboard pages by role
│   ├── components/      # Shared UI components
│   └── lib/             # API client, store (Zustand)
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── db.ts            # Drizzle DB connection
└── shared/
    └── schema.ts        # Drizzle ORM schema
```

## Stadium Sections
- 2 East, 2 West, 7 East, 7 West
- Physical sections (e.g., "102") vs Stand IDs (e.g., "102S")
- Same stand types repeat throughout stadium (Classic Hits, Nash Grills, etc.)

## Workflow
1. **Pre-Event Setup**: Managers create staffing grid, assign NPO groups
2. **Counting**: Each stand has separate count sheets (1-5 pages each)
3. **Event Operations**: Supervisors manage stands, track inventory
4. **Communication**: All roles communicate via messaging system

## User Preferences
- Mobile-first design critical
- No question dialog boxes - all questions in regular chat
- User must approve all changes before implementation
- Workflow rule: Jason approves all changes

## Recent Changes
- 2024-11-30: Three-stage inventory count workflow (Pre-event, Post-event, Day-after) with counter identity tracking
- 2024-11-30: CounterLogin component for counter authentication via last 4 phone digits
- 2024-11-30: CountSheet component with category accordion, session tracking, and progress display
- 2024-11-30: NPO Dashboard Pre-Event Count button with session creation and item counting
- 2024-11-30: Added threaded conversation system with target selection and quick messages
- 2024-11-30: Added unified incident reporting with photo/video upload
- 2024-11-30: Added OCR scanner foundation with Tesseract.js
- 2024-11-30: Auto-notification system for incident reports to all supervisors/admins
- 2024-11-30: Added Warehouse (PIN: 1111) and Kitchen (PIN: 2222) roles
- 2024-11-30: Full REST API implementation with database backend

## Technical Notes
- Database: PostgreSQL with Drizzle ORM
- Frontend State: Zustand with persist middleware
- Migrations: Run `npm run db:push` for schema changes
- Dev PIN: 0424 (developer access)
