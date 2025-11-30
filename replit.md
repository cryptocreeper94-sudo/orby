# StadiumOps - Digital Stadium Concessions Management

## Overview
StadiumOps is a comprehensive digital inventory and staffing management system for stadium concessions operations. Built as a Progressive Web App (PWA) with full backend API, it replaces paper-based processes with a mobile-optimized web application.

## Current State
- Full-stack application with Express backend and PostgreSQL database
- PWA-enabled for mobile installation
- Role-based access control (Admin, Supervisor, IT, Developer, Warehouse, Kitchen)
- Accordion-style UI with pastel blue theme and 3D buttons

## User Roles & PINs
| Role | PIN | Dashboard Route |
|------|-----|-----------------|
| Admin | 1234 | /admin |
| Supervisor | 5678 | /supervisor |
| IT | 9999 | /it |
| Warehouse | 1111 | /warehouse |
| Kitchen | 2222 | /kitchen |
| Developer | 0424 | /dev |

## Key Features
- **Staffing Grid**: Event-based staffing assignments (format: "YY-MM-DD POS [Team] v [Team]")
- **Inventory Counting**: Pre-event count sheets by stand, items counted by EACH (not case)
- **Messaging**: Real-time team communication across all roles
- **POS Terminal Tracking**: Specific unit numbers (e.g., A930 #126, E700 units)
- **Supervisor Pack**: Compliance documents, checklists, signatures

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
- 2024-11-30: Added Warehouse and Kitchen roles with messaging access
- 2024-11-30: Converted to API-backed store management
- 2024-11-30: Full REST API implementation

## Technical Notes
- Database: PostgreSQL with Drizzle ORM
- Frontend State: Zustand with persist middleware
- Migrations: Run `npm run db:push` for schema changes
- Dev PIN: 0424 (developer access)
