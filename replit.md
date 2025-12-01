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

## System Architecture
Orby is a full-stack PWA utilizing React frontend and Express backend with PostgreSQL/Drizzle ORM. The app is designed around role-based access and hierarchical communication.

**Core Roles:**
- NPO Workers (frontline concessions)
- Stand Leads (stand-level coordination)
- Supervisors (section oversight, delivery requests)
- Management (Ops Manager, Warehouse, Kitchen, IT)
- Admin
- Developer

**Key Features:**
1. **Smart Message Routing** - Issues automatically route to the right role (Cooling → Warehouse, Power → IT)
2. **Delivery Tracking** - Full lifecycle: Requested → Approved → Picking → On the Way (ETA) → Delivered
3. **Status Dashboard** - Ops Manager sees all stands, issues, and deliveries in one view
4. **Quick Messages** - Pre-built responses for common situations
5. **Priority Escalation** - Emergency alerts vs normal queue
6. **Presence Awareness** - Who's on duty, who's at which stand
7. **Closing Workflows** - Guided checklists, signatures, PDF generation
8. **AI Scanning** - Photo coolers for auto-count, scan handwritten sheets
9. **Offline Mode** - Works when radio signals don't
10. **Full Audit Trail** - Everything documented for accountability

**Communication Hierarchy:**
- Supervisors can request from Warehouse/Kitchen (Stand Leads cannot)
- Issues route to appropriate management roles based on category
- Two-way threaded conversations with quick responses
- Delivery status updates with ETAs

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
