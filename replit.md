# Orby Commander - Venue Operations Platform

## Overview
Orby Commander (getorby.io) is a comprehensive Progressive Web App (PWA) designed to unify venue operations, replacing fragmented communication with a digital platform. It offers an Emergency Command Center, delivery lifecycle tracking, three-phase inventory counting, alcohol compliance monitoring, GPS-guided navigation, and real-time team communications. Orby aims to provide a complete operational solution for venues, from emergency response to inventory and team management, improving efficiency and compliance for event venues.

## Current Version
**v1.0.14** - Event Setup System + Full Enhancement Suite (December 2025)

### Recent Changelog
- **v1.0.14**: Event Setup System + Full Enhancement Suite
  - Event Setup page with bento grid layout (David's landing page)
  - Pre-Event Checklist validation before activation
  - Department Notes routing to matching dashboards via EventHeader
  - Geofencing toggle (Stadium/Custom mode with configurable radius)
  - Staffing Grid linked to active event (dynamic event name/date)
  - Event History page with past events and metrics
  - Real-time WebSocket notifications for event activation
  - "Event Status" renamed from "Emergency Status"
  - Quick Dispatch expanded with IT, Operations, Kitchen, Warehouse
- **v1.0.12**: ORBIT Ecosystem Hub Integration with DarkWave Developer Hub + Session Persistence Fix + Role Access Fix
- **v1.0.10**: Genesis Hallmark Badge & Footer Fix with clickable verified badge
- **v1.0.9**: Genesis Hallmark Badge on welcome page
- **v1.0.8**: Multi-Tenant SaaS Architecture with tenant types and feature flags
- **v1.0.7**: Orby Commander Rebrand with updated branding throughout
- **v1.0.6**: Chat Optimization for mobile devices
- **v1.0.5**: Complete Manager Roster with all leadership PINs
- **v1.0.4**: Custom Splash Screen with animated Orby logo
- **v1.0.3**: Interactive Weather Map with Windy.com radar
- **v1.0.2**: Culinary Team Management System
- **v1.0.1**: Event Report Builder and Document Hub
- **v1.0.0**: Genesis Release for Nissan Stadium beta testing

## User Preferences
- Mobile-first design critical (operations staff use phones)
- No question dialog boxes - all questions in regular chat
- User must approve all changes before implementation
- Workflow rule: Jason approves all changes
- Brand: Aqua theme (#06B6D4), Orby mascot (aqua planet character)
- Domain: getorby.io
- Strict bento grid styling with horizontal carousels
- Minimal white space with accordions
- Dark theme throughout

## PIN Access Structure
| PIN | User | Role | Dashboard |
|-----|------|------|-----------|
| 2424 | David | Ops Controller | Ops Command Center |
| 8080 | Brian | Regional VP | Executive Dashboard |
| 9090 | Megan | General Manager | Executive Dashboard |
| 5555 | Compliance | Alcohol Compliance | Compliance Dashboard |
| 9999 | New User | Registration | First-time registration flow |

**Hidden Developer Access:**
- Jason (0424) has hidden full developer access with role picker
- Jason (444) and Sid (4444) are Operations Supervisors - contact David for access

## System Architecture
Orby is a full-stack PWA built with a React frontend and an Express backend, utilizing PostgreSQL with Drizzle ORM. The platform emphasizes a mobile-first, touch-optimized UI/UX with Framer Motion animations, dynamic glow effects, glassmorphism with backdrop blur, and a dark theme featuring aqua/cyan accent gradients.

**Core Features:**
- **Event Setup System:** Ops Manager (David) landing page for pre-event configuration including event details, geofencing (Stadium/Custom modes), department notes, and pre-event checklist validation.
- **EventHeader:** Universal component displaying active event information with department-filtered notes across all manager dashboards.
- **Event History:** View past events with metrics (total, completed, average attendance) and expandable details.
- **Event Status & Command:** Real-time incident management, smart message routing, priority escalation, and full audit trails.
- **Delivery Operations:** Full lifecycle tracking (Requested → Approved → Picking → On the Way → Delivered) with status dashboards and quick messages.
- **Inventory Management:** Three-phase counting, digital template creation via OCR, Manager Document Hub, and AI scanning for auto-counting.
- **Staff Management:** Universal PIN login, role-based access, dynamic team lead assignments, and bar scheduler.
- **Compliance & Safety:** Alcohol compliance monitoring, guest services incident reporting, facility issue reporting, and real-time alerts for regulatory inspections.
- **Navigation & Location:** Interactive stadium map, GPS-guided walking directions, and a weather widget.
- **Platform Features:** Presence awareness, guided closing workflows, offline mode, and a sandbox environment.
- **Genesis Hallmark Stamping System:** Universal asset stamping with ORB numbers and optional blockchain verification via Solana for tamper-proof records.
- **Admin Controls:** Role-based widget visibility, alert level settings, data scope controls, and configurable layout presets for authorized managers.
- **Multi-Tenant Architecture:** SaaS-ready platform supporting business, franchise, and beta tenant types with feature flags for content visibility.
- **PWA Ready:** Designed for seamless installation and experience on web and mobile platforms.

**Integration Strategy:**
- **ORBIT Ecosystem Hub:** Live connection to DarkWave Developer Hub for worker sync, timesheet/certification data, code snippet sharing, and activity logging.
- **OrbitStaffing:** Deep integration for roster sync, GPS verification, and shift completion.
- **POS Systems:** Designed for potential real-time sales data integration.

## External Dependencies
- **PostgreSQL:** Primary database.
- **Drizzle ORM:** Schema and query builder.
- **GPT-4o Vision:** AI for image-based counting.
- **Tesseract.js:** Client-side OCR for scanning paper documents.
- **Zustand:** State management.
- **jsPDF:** PDF report generation.
- **Helius/Solana:** Blockchain anchoring for the Genesis Hallmark System.
- **Open-Meteo API:** Weather data for the widget.
- **Windy.com:** Weather radar integration.