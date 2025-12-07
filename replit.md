# Orby - Venue Operations Platform

## Overview
Orby (getorby.io) is a comprehensive Progressive Web App (PWA) designed to unify venue operations, replacing fragmented communication with a digital platform. It offers an Emergency Command Center, delivery lifecycle tracking, three-phase inventory counting, alcohol compliance monitoring, GPS-guided navigation, and real-time team communications. Orby aims to provide a complete operational solution for venues, from emergency response to inventory and team management, improving efficiency and compliance for event venues.

## User Preferences
- Mobile-first design critical (operations staff use phones)
- No question dialog boxes - all questions in regular chat
- User must approve all changes before implementation
- Workflow rule: Jason approves all changes
- Brand: Aqua theme (#06B6D4), Orby mascot (aqua planet character)
- Domain: getorby.io

## System Architecture
Orby is a full-stack PWA built with a React frontend and an Express backend, utilizing PostgreSQL with Drizzle ORM. The platform emphasizes a mobile-first, touch-optimized UI/UX with Framer Motion animations, dynamic glow effects, glassmorphism with backdrop blur, and a dark theme featuring aqua/cyan accent gradients.

**Core Features:**
- **Emergency & Command:** Real-time incident management, smart message routing, priority escalation, and full audit trails.
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