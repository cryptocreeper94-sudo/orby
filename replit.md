# Orby - Venue Operations Platform

## Current Version: v1.0.2 (Beta) - STAMPED
**Release Date:** December 3, 2024
**Genesis Hallmark:** ORB-000000000007

### v1.0.2 Release Notes
- **Culinary Team Management System:** Event-based cook scheduling and check-in tracking
  - Chef Deb (PIN 3737) as Culinary Director with full scheduling controls
  - Supervisor Shelia (PIN 4545) with oversight capabilities
  - Cook assignment to stands by event date
  - Check-in/check-out tracking with no-show marking
  - Culinary team visibility panel in Ops Command Center
- Sample cooks added: Lisa (5252), Marcus (5151), Tony (5353)
- **Department Inventory Control System:** Bar/Kitchen inventory tracking with integration readiness
  - Darby (PIN 4646) as Bar Manager with full inventory controls
  - Inventory locations with department assignment (Bar/Kitchen)
  - Stock levels with on-hand, par, and variance tracking
  - Product types: Liquor, Mixer, Beer, Wine, NABeverage, Garnish, Chargeable, Ingredient, Supply
  - Yellow Dog and PAX Pay integration mapping tables ready
  - Authorized inventory admins: David (2424), Jason (0424), Chef Deb (3737), Shelia (4545), Darby (4646)
- **Smart Document Routing:** Universal Document Scanner auto-routes to correct destination
  - AI classification suggests routing based on document type
  - User confirmation with option to change destination
  - Routes saved to Manager's Document Hub with destination metadata
  - Success/error toast notifications on document submission

### v1.0.1 Release Notes
- Event Report Builder for combined PDF packages (Finance, Compliance, Operations, Custom templates)
- Ops Manager Tour for David on first login covering all controls and integrations
- HR Admin Tour for KD with staffing-focused walkthrough
- Personalized Welcome Tours for all roles with name-based greetings
- Document Hub restricted to Managers and Developers only (enhanced security)
- Staff PIN Management panel in Dev Dashboard for preset PIN distribution
- Enhanced PDF generation with full item tables for count reports
- Integration Hub with PAX Systems, Yellow Dog, and OrbitStaffing preview
- Orby Commander watermark and enhanced welcome screen
- Desktop responsive layouts verified across all major dashboards
- PWA ready for Google Play and web installation
- **Culinary Team Management System:** Event-based cook scheduling and check-in tracking
  - Chef Deb (PIN 3737) as Culinary Director with full scheduling controls
  - Supervisor Shelia (PIN 4545) with oversight capabilities
  - Cook assignment to stands by event date
  - Check-in/check-out tracking with no-show marking
  - Culinary team visibility panel in Ops Command Center

## Overview
Orby (getorby.io) is a comprehensive Progressive Web App (PWA) designed to unify venue operations, replacing fragmented communication with a digital platform. It offers an Emergency Command Center, delivery lifecycle tracking, three-phase inventory counting, alcohol compliance monitoring, GPS-guided navigation, and real-time team communications. Orby aims to provide a complete operational solution for venues, from emergency response to inventory and team management.

## User Preferences
- Mobile-first design critical (operations staff use phones)
- No question dialog boxes - all questions in regular chat
- User must approve all changes before implementation
- Workflow rule: Jason approves all changes
- Brand: Aqua theme (#06B6D4), Orby mascot (aqua planet character)
- Domain: getorby.io

## System Architecture
Orby is a full-stack PWA built with a React frontend and an Express backend, using PostgreSQL with Drizzle ORM. The platform emphasizes a mobile-first, touch-optimized UI/UX with Framer Motion animations, dynamic glow effects, glassmorphism with backdrop blur, and a dark theme featuring aqua/cyan accent gradients.

**Core Features include:**
- **Emergency & Command:** Real-time incident management, smart message routing, priority escalation, and full audit trails.
- **Delivery Operations:** Full lifecycle tracking (Requested → Approved → Picking → On the Way → Delivered) with status dashboards and quick messages.
- **Inventory Management:** Three-phase counting (PreEvent → PostEvent → DayAfter), digital template creation from paper counts via OCR, a Manager Document Hub, and AI scanning for auto-counting.
- **Staff Management:** Universal PIN login, role-based access, dynamic team lead assignments, and a bar scheduler.
- **Compliance & Safety:** Alcohol compliance monitoring with photo/video, guest services with incident reporting, facility issue reporting, and real-time alerts for Tennessee ABC Board and Health Department inspections.
- **Navigation & Location:** Interactive stadium map, GPS-guided walking directions, and a weather widget.
- **Platform Features:** Presence awareness, guided closing workflows, offline mode, and a sandbox environment for training.
- **Genesis Hallmark Stamping System:** Universal asset stamping with ORB numbers and optional blockchain verification via Solana for critical documents, ensuring tamper-proof records.
- **Admin Controls:** Role-based widget visibility, alert level settings, data scope controls, and layout presets are configurable by authorized managers.

**Integration Strategy:**
- **OrbitStaffing:** Deep integration for roster sync, GPS verification, and shift completion.
- **POS Systems:** Potential for real-time sales data integration.

## External Dependencies
- **PostgreSQL:** Primary database.
- **Drizzle ORM:** Schema and query builder.
- **GPT-4o Vision:** AI for image-based counting.
- **Tesseract.js:** Client-side OCR for scanning paper documents.
- **Zustand:** State management.
- **jsPDF:** PDF report generation.
- **Helius/Solana:** Blockchain anchoring for the Genesis Hallmark System.
- **Open-Meteo API:** Weather data for the widget.