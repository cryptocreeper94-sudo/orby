# StadiumOps - Digital Stadium Concessions Management

## Overview
StadiumOps is a comprehensive digital inventory and staffing management system for stadium concessions operations. It is a Progressive Web App (PWA) with a full backend API, designed to replace traditional paper-based processes with a mobile-optimized web application. The system streamlines inventory, manages staffing, facilitates inter-role communication, and provides robust incident and issue reporting. Its core purpose is to enhance operational efficiency and accountability within stadium concession environments.

## User Preferences
- Mobile-first design critical
- No question dialog boxes - all questions in regular chat
- User must approve all changes before implementation
- Workflow rule: Jason approves all changes

## System Architecture
StadiumOps is a full-stack PWA utilizing a React frontend and an Express backend, with a PostgreSQL database managed by Drizzle ORM. The application is designed with role-based access control, featuring a new hierarchical structure for stadium personnel including NPO Workers, Stand Leads, Supervisors, various Management roles, Admin, IT, and Developer.

**UI/UX Decisions:** The application features an accordion-style UI with a pastel blue theme and 3D buttons, optimized for mobile use.

**Technical Implementations & Features:**
- **Role-based Access Control:** A detailed hierarchy dictates access and communication permissions, including a mandatory first-time PIN reset for security.
- **Communication System:** A threaded messaging system allows two-way communication between specific roles, with target selection and quick message capabilities. Conversations auto-timeout after inactivity.
- **Geofencing Alerts:** Automatic notifications and event logging when NPO Workers leave their assigned stand boundaries.
- **Staffing Grid:** Event-based staffing assignments and NPO group management.
- **Inventory Management:** Supports pre-event counting by stand, item counting by EACH (not case), and a three-stage inventory count workflow (Pre-event, Post-event, Day-after) with counter identity tracking.
- **POS Hardware Tracking:** Management of E700, A930 terminals, and hotspot devices.
- **Supervisor Closing Workflow:** A guided process for supervisors including equipment shutdown checklists, spoilage logging (thrown away, returned, damaged, expired items), and voucher summary tracking, all of which generate and submit PDFs.
- **Incident Reporting:** A unified system for all roles to report incidents, supporting photo/video attachments and auto-notifying supervisors and admins.
- **Stand Issue Reporting:** Categorized issue reporting (e.g., Cooling, Beverage, Power, FoodSafety) with auto-routing to relevant management roles (e.g., Warehouse Manager, Operations Manager, Kitchen Manager) and severity levels including emergency escalations.
- **Variance Reporting:** API for calculating and displaying inventory variance (Started, Added, Ended, Used, Spoilage) with CSV export.

**Project Structure:**
- `client/`: React frontend (pages, components, Zustand store)
- `server/`: Express backend (routes, storage, Drizzle DB connection)
- `shared/`: Drizzle ORM schema

## External Dependencies
- **PostgreSQL:** Primary database for persistent storage.
- **Drizzle ORM:** Used for database schema definition and interaction.
- **GPT-4o Vision API:** Integrated for AI-powered can counting and product identification from cooler images and for reading handwritten count sheets.
- **Tesseract.js:** Client-side OCR for extracting text from images, primarily for legacy OCR scanning.
- **Zustand:** Frontend state management library with persist middleware.
- **jsPDF:** Client-side library for generating PDF documents (e.g., variance reports, closing checklists).