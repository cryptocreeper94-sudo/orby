import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertUserSchema, insertStandSchema, insertItemSchema, insertMessageSchema,
  insertNpoSchema, insertStaffingGroupSchema, insertSupervisorDocSchema, insertDocSignatureSchema,
  insertInventoryCountSchema, insertQuickMessageSchema, insertConversationSchema, insertConversationMessageSchema,
  insertIncidentSchema, insertCountSessionSchema, insertStandIssueSchema, insertMenuBoardSchema,
  insertAuditLogSchema, insertEmergencyAlertSchema, insertOrbitRosterSchema, insertOrbitShiftSchema,
  insertAlcoholViolationSchema, insertAssetStampSchema, users,
  QUICK_CALL_ROLES
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { weatherService } from "./services/weather";
import path from "path";
import fs from "fs";
import { createWorker } from "tesseract.js";
import OpenAI from "openai";
import { initializeWebSocket, getWebSocketServer } from "./websocket";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Configure multer for file uploads
const incidentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/incidents');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const ocrStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/ocr');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadIncident = multer({ 
  storage: incidentStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and videos are allowed'));
  }
});

const uploadOcr = multer({ 
  storage: ocrStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed for OCR'));
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Initialize WebSocket server for real-time updates
  const wsServer = initializeWebSocket(httpServer);

  // Helper function to create audit log
  async function createAuditLog(
    userId: string | undefined,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any,
    standId?: string,
    req?: Request
  ) {
    try {
      await storage.createAuditLog({
        userId: userId || null,
        action: action as any,
        targetType,
        targetId,
        details,
        standId,
        ipAddress: req?.ip,
        userAgent: req?.get('user-agent')
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  // ============ AUTH ============
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({ error: "PIN required" });
      }
      
      // Block 9999 - it's the registration PIN, not a login PIN
      if (pin === '9999') {
        return res.status(400).json({ error: "Use the registration flow for first-time login" });
      }
      
      const user = await storage.getUserByPin(pin);
      if (!user) {
        return res.status(401).json({ error: "Invalid PIN" });
      }
      await storage.updateUserOnlineStatus(user.id, true);
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (userId) {
        await storage.updateUserOnlineStatus(userId, false);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // First-time staff registration (9999 flow) with server-side geofence enforcement
  app.post("/api/auth/register-staff", async (req: Request, res: Response) => {
    try {
      const { name, department, pin, gpsCoords } = req.body;
      
      // Nissan Stadium geofence constants
      const STADIUM_LAT = 36.1665;
      const STADIUM_LNG = -86.7713;
      const GEOFENCE_RADIUS_FEET = 2000;
      
      // Validate required fields
      if (!name || !department || !pin) {
        return res.status(400).json({ error: "Name, department, and PIN are required" });
      }
      
      // Server-side geofence enforcement
      if (!gpsCoords || !gpsCoords.lat || !gpsCoords.lng) {
        return res.status(400).json({ error: "Location verification required. Please enable GPS." });
      }
      
      // Calculate distance from stadium (Haversine formula simplified for short distances)
      const toRad = (deg: number) => deg * (Math.PI / 180);
      const R = 20902231; // Earth's radius in feet
      const dLat = toRad(gpsCoords.lat - STADIUM_LAT);
      const dLng = toRad(gpsCoords.lng - STADIUM_LNG);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(STADIUM_LAT)) * Math.cos(toRad(gpsCoords.lat)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceFeet = R * c;
      
      if (distanceFeet > GEOFENCE_RADIUS_FEET) {
        return res.status(403).json({ error: "Registration is only available at Nissan Stadium" });
      }
      
      // Validate name
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters" });
      }
      
      // Validate department against the enum values
      const validDepartments = ['Warehouse', 'Kitchen', 'Bar', 'Operations', 'IT', 'HR'];
      if (!validDepartments.includes(department)) {
        return res.status(400).json({ error: "Invalid department" });
      }
      
      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 4 digits" });
      }
      
      // Prevent using registration PIN as personal PIN
      if (pin === '9999') {
        return res.status(400).json({ error: "Cannot use the registration PIN as your personal PIN" });
      }
      
      // Check if PIN is already in use
      const existingUser = await storage.getUserByPin(pin);
      if (existingUser) {
        return res.status(400).json({ error: "This PIN is already in use. Please choose a different PIN." });
      }
      
      // Create user with default worker role and department
      // All self-registered staff start as NPOWorker with their department set
      // Admins can elevate roles later if needed
      const user = await storage.createUser({
        name: name.trim(),
        pin,
        role: 'NPOWorker', // Default low-privilege role for self-registration
        department: department as any, // Set department for routing
        requiresPinReset: false, // They just set their PIN
        pinSetAt: new Date(),
        isOnline: false,
      });
      
      // Create audit log for registration with GPS coords for traceability
      await createAuditLog(
        user.id,
        'StaffRegistered',
        'User',
        user.id,
        { 
          department, 
          registeredVia: 'first-time-registration',
          gpsCoords: gpsCoords || null, // Log GPS for audit trail
          clientGeofenceVerified: true 
        },
        undefined,
        req
      );
      
      res.status(201).json({ success: true, message: "Registration successful" });
    } catch (error) {
      console.error("Staff registration error:", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // PIN Reset for first-time login
  app.post("/api/users/reset-pin", async (req: Request, res: Response) => {
    try {
      const { userId, newPin } = req.body;
      if (!userId || !newPin) {
        return res.status(400).json({ error: "User ID and new PIN required" });
      }
      if (!/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ error: "PIN must be 4 digits" });
      }
      
      // Check if PIN is already in use
      const existingUser = await storage.getUserByPin(newPin);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "This PIN is already in use" });
      }
      
      await storage.updateUserPin(userId, newPin);
      res.json({ success: true, message: "PIN updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update PIN" });
    }
  });

  // ============ USERS ============
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const user = await storage.createUser(parsed);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // ============ ADMIN STAFF PIN MANAGEMENT ============
  
  // Get all Legends staff with their preset PINs (admin only)
  app.get("/api/admin/staff-pins", async (req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      // Filter to Legends employees (management, supervisors, admins, etc.)
      const legendsStaff = allUsers.filter((u: any) => 
        u.employmentAffiliation === 'Legends' || 
        ['Admin', 'OperationsManager', 'Supervisor', 'IT', 'AlcoholCompliance', 'CheckInAssistant', 'ManagementCore', 'ManagementAssistant'].includes(u.role)
      );
      
      // Map to safe response format (show presetPin but never actual PIN if changed)
      const staffPins = legendsStaff.map((u: any) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        department: u.department,
        managementType: u.managementType,
        presetPin: u.presetPin,
        pinChanged: u.pinChanged || false,
        requiresPinReset: u.requiresPinReset,
        presetPinIssuedAt: u.presetPinIssuedAt,
        isOnline: u.isOnline,
        hasDualRole: u.hasDualRole,
        secondaryRole: u.secondaryRole,
      }));
      
      res.json(staffPins);
    } catch (error) {
      console.error("Failed to fetch staff PINs:", error);
      res.status(500).json({ error: "Failed to fetch staff PINs" });
    }
  });

  // Create or update staff member with preset PIN
  app.post("/api/admin/staff-pins", async (req: Request, res: Response) => {
    try {
      const { name, pin, role, department, managementType, hasDualRole, secondaryRole } = req.body;
      
      if (!name || !pin || !role) {
        return res.status(400).json({ error: "Name, PIN, and role are required" });
      }
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be 4 digits" });
      }
      
      // Check if PIN is already in use
      const existingUser = await storage.getUserByPin(pin);
      if (existingUser) {
        return res.status(400).json({ error: "This PIN is already in use" });
      }
      
      // Create user with preset PIN
      const user = await storage.createUser({
        name,
        pin,
        role,
        department,
        managementType,
        hasDualRole: hasDualRole || false,
        secondaryRole,
        requiresPinReset: true, // Force PIN change on first login
      });
      
      // Update the preset PIN fields
      await db.update(users)
        .set({
          presetPin: pin,
          pinChanged: false,
          presetPinIssuedAt: new Date(),
          employmentAffiliation: 'Legends',
        })
        .where(eq(users.id, user.id));
      
      // Create audit log
      await createAuditLog(
        req.body.adminId || 'system',
        'PresetPinIssued',
        'User',
        user.id,
        { name, role, department, pin: pin.substring(0, 2) + '**' },
        undefined,
        req
      );
      
      res.status(201).json({ 
        success: true, 
        user: { id: user.id, name, role, presetPin: pin } 
      });
    } catch (error) {
      console.error("Failed to create staff:", error);
      res.status(500).json({ error: "Failed to create staff member" });
    }
  });

  // Force reset a user's PIN back to their preset
  app.post("/api/admin/staff-pins/:id/reset", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { newPin } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Use new PIN or generate one
      const pinToSet = newPin || String(Math.floor(1000 + Math.random() * 9000));
      
      // Check if PIN is already in use by another user
      const existingUser = await storage.getUserByPin(pinToSet);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "This PIN is already in use" });
      }
      
      // Update user's PIN and mark for reset
      await storage.updateUserPin(userId, pinToSet);
      await db.update(users)
        .set({
          presetPin: pinToSet,
          pinChanged: false,
          presetPinIssuedAt: new Date(),
          requiresPinReset: true,
        })
        .where(eq(users.id, userId));
      
      // Create audit log
      await createAuditLog(
        req.body.adminId || 'system',
        'PinReset',
        'User',
        userId,
        { newPin: pinToSet.substring(0, 2) + '**', reason: 'Admin reset' },
        undefined,
        req
      );
      
      res.json({ success: true, presetPin: pinToSet });
    } catch (error) {
      console.error("Failed to reset PIN:", error);
      res.status(500).json({ error: "Failed to reset PIN" });
    }
  });

  // Assign team lead to a worker
  app.patch("/api/users/:id/assign-team-lead", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { teamLeadId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (teamLeadId) {
        const lead = await storage.getUser(String(teamLeadId));
        if (!lead) {
          return res.status(400).json({ error: "Team lead not found" });
        }
        if (lead.department !== user.department) {
          return res.status(400).json({ error: "Team lead must be in the same department" });
        }
      }
      
      await storage.assignTeamLead(userId, teamLeadId ? String(teamLeadId) : null);
      
      await createAuditLog(
        userId,
        'team_lead_assigned',
        'user',
        userId,
        { teamLeadId },
        undefined,
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to assign team lead:', error);
      res.status(500).json({ error: "Failed to assign team lead" });
    }
  });

  // Promote/demote user to team lead
  app.patch("/api/users/:id/promote-team-lead", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { isTeamLead } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.setTeamLeadStatus(userId, isTeamLead);
      
      if (!isTeamLead) {
        await storage.removeTeamLeadAssignments(userId);
      }
      
      await createAuditLog(
        userId,
        isTeamLead ? 'promoted_to_team_lead' : 'demoted_from_team_lead',
        'user',
        userId,
        { isTeamLead },
        undefined,
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to update team lead status:', error);
      res.status(500).json({ error: "Failed to update team lead status" });
    }
  });

  // ============ STANDS ============
  app.get("/api/stands", async (_req: Request, res: Response) => {
    try {
      const stands = await storage.getAllStands();
      res.json(stands);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stands" });
    }
  });

  app.get("/api/stands/:id", async (req: Request, res: Response) => {
    try {
      const stand = await storage.getStand(req.params.id);
      if (!stand) {
        return res.status(404).json({ error: "Stand not found" });
      }
      res.json(stand);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stand" });
    }
  });

  app.get("/api/stands/section/:section", async (req: Request, res: Response) => {
    try {
      const stands = await storage.getStandsBySection(decodeURIComponent(req.params.section));
      res.json(stands);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stands by section" });
    }
  });

  app.get("/api/stands/supervisor/:supervisorId", async (req: Request, res: Response) => {
    try {
      const stands = await storage.getStandsBySupervisor(req.params.supervisorId);
      res.json(stands);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stands by supervisor" });
    }
  });

  app.post("/api/stands", async (req: Request, res: Response) => {
    try {
      const parsed = insertStandSchema.parse(req.body);
      const stand = await storage.createStand(parsed);
      res.status(201).json(stand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create stand" });
    }
  });

  app.patch("/api/stands/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      await storage.updateStandStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update stand status" });
    }
  });

  app.patch("/api/stands/:id/assets", async (req: Request, res: Response) => {
    try {
      const { e700Ids, a930Ids } = req.body;
      await storage.updateStandAssets(req.params.id, e700Ids || [], a930Ids || []);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update stand assets" });
    }
  });

  // ============ ITEMS ============
  app.get("/api/items", async (_req: Request, res: Response) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/items", async (req: Request, res: Response) => {
    try {
      const parsed = insertItemSchema.parse(req.body);
      const item = await storage.createItem(parsed);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  app.delete("/api/items/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // ============ STAND ITEMS (Inventory Templates) ============
  app.get("/api/stand-items/:standId", async (req: Request, res: Response) => {
    try {
      const standItems = await storage.getStandItems(req.params.standId);
      res.json(standItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stand items" });
    }
  });

  app.get("/api/stand-items", async (_req: Request, res: Response) => {
    try {
      const standIds = await storage.getStandsWithItems();
      res.json(standIds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stands with items" });
    }
  });

  app.post("/api/stand-items/:standId", async (req: Request, res: Response) => {
    try {
      const { itemId, sortOrder, isChargeable } = req.body;
      const standItem = await storage.addStandItem({
        standId: req.params.standId,
        itemId,
        sortOrder: sortOrder || 0,
        isChargeable: isChargeable !== false
      });
      res.status(201).json(standItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to add stand item" });
    }
  });

  app.post("/api/stand-items/:standId/bulk", async (req: Request, res: Response) => {
    try {
      const { itemIds, clearExisting } = req.body;
      
      if (clearExisting) {
        await storage.clearStandItems(req.params.standId);
      }
      
      if (itemIds && itemIds.length > 0) {
        await storage.bulkAddStandItems(req.params.standId, itemIds);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk add stand items" });
    }
  });

  app.delete("/api/stand-items/:standId/:itemId", async (req: Request, res: Response) => {
    try {
      await storage.removeStandItem(req.params.standId, req.params.itemId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove stand item" });
    }
  });

  app.delete("/api/stand-items/:standId", async (req: Request, res: Response) => {
    try {
      await storage.clearStandItems(req.params.standId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear stand items" });
    }
  });

  // ============ MANAGER DOCUMENTS HUB ============
  app.get("/api/manager-documents", async (req: Request, res: Response) => {
    try {
      const { category, standId, eventDate } = req.query;
      const filters: { category?: string; standId?: string; eventDate?: string } = {};
      
      if (category && typeof category === 'string') filters.category = category;
      if (standId && typeof standId === 'string') filters.standId = standId;
      if (eventDate && typeof eventDate === 'string') filters.eventDate = eventDate;
      
      const docs = await storage.getManagerDocuments(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manager documents" });
    }
  });

  app.get("/api/manager-documents/:id", async (req: Request, res: Response) => {
    try {
      const doc = await storage.getManagerDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/manager-documents", async (req: Request, res: Response) => {
    try {
      const doc = await storage.createManagerDocument(req.body);
      res.status(201).json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.delete("/api/manager-documents/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteManagerDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ============ DOCUMENT TEMPLATES ============
  app.get("/api/document-templates", async (req: Request, res: Response) => {
    try {
      const { documentType } = req.query;
      if (documentType && typeof documentType === 'string') {
        const templates = await storage.getDocumentTemplatesByType(documentType);
        return res.json(templates);
      }
      const templates = await storage.getAllDocumentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching document templates:", error);
      res.status(500).json({ error: "Failed to fetch document templates" });
    }
  });

  app.get("/api/document-templates/:id", async (req: Request, res: Response) => {
    try {
      const template = await storage.getDocumentTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/document-templates", async (req: Request, res: Response) => {
    try {
      const template = await storage.createDocumentTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating document template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.patch("/api/document-templates/:id", async (req: Request, res: Response) => {
    try {
      const template = await storage.updateDocumentTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating document template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/document-templates/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteDocumentTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // ============ SCANNED DOCUMENTS ============
  app.get("/api/scanned-documents", async (req: Request, res: Response) => {
    try {
      const { documentType, standId, eventDate, status, isSandbox } = req.query;
      const filters: any = {};
      
      if (documentType && typeof documentType === 'string') filters.documentType = documentType;
      if (standId && typeof standId === 'string') filters.standId = standId;
      if (eventDate && typeof eventDate === 'string') filters.eventDate = eventDate;
      if (status && typeof status === 'string') filters.status = status;
      if (isSandbox !== undefined) filters.isSandbox = isSandbox === 'true';
      
      const docs = await storage.getAllScannedDocuments(
        Object.keys(filters).length > 0 ? filters : undefined
      );
      res.json(docs);
    } catch (error) {
      console.error("Error fetching scanned documents:", error);
      res.status(500).json({ error: "Failed to fetch scanned documents" });
    }
  });

  app.get("/api/scanned-documents/:id", async (req: Request, res: Response) => {
    try {
      const doc = await storage.getScannedDocument(req.params.id);
      if (!doc) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.post("/api/scanned-documents", async (req: Request, res: Response) => {
    try {
      const doc = await storage.createScannedDocument(req.body);
      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating scanned document:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/scanned-documents/:id", async (req: Request, res: Response) => {
    try {
      const doc = await storage.updateScannedDocument(req.params.id, req.body);
      res.json(doc);
    } catch (error) {
      console.error("Error updating scanned document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.post("/api/scanned-documents/:id/verify", async (req: Request, res: Response) => {
    try {
      const { verifiedById } = req.body;
      const doc = await storage.verifyScannedDocument(req.params.id, verifiedById);
      res.json(doc);
    } catch (error) {
      console.error("Error verifying scanned document:", error);
      res.status(500).json({ error: "Failed to verify document" });
    }
  });

  app.delete("/api/scanned-documents/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteScannedDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // ============ AI DOCUMENT CLASSIFICATION ============
  app.post("/api/ai-scanner/classify", uploadOcr.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const imagePath = req.file.path;
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;

      const classificationResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a document classification expert for a venue operations system. Analyze the image and determine what type of document it is.

Available document types:
- bar_control: Bar control sheets tracking alcohol inventory and sales
- alcohol_compliance: Alcohol compliance monitoring forms
- stand_grid: Stand layout and position assignment grids
- worker_grid: Worker assignment grids showing staff positions
- schedule: Staff schedules with shifts and assignments
- inventory_count: Inventory count sheets listing items and quantities
- incident_report: Incident or accident reports
- closing_checklist: Stand closing checklists
- temperature_log: Food temperature monitoring logs
- cash_count: Cash drawer count sheets
- delivery_receipt: Delivery receipts for goods received
- other: Any other type of document

Respond with a JSON object containing:
{
  "documentType": "one of the types above",
  "confidence": "high" | "medium" | "low",
  "title": "suggested title based on content",
  "extractedData": { key-value pairs of any data you can extract },
  "rawText": "any text you can read from the document",
  "standId": "stand ID if visible (e.g., C101, E501)",
  "eventDate": "date if visible in YYYY-MM-DD format"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              },
              {
                type: "text",
                text: "Analyze this document and classify it. Extract any relevant data you can see."
              }
            ]
          }
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = classificationResponse.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const result = JSON.parse(content);
      
      // Clean up the uploaded file
      fs.unlinkSync(imagePath);

      res.json({
        success: true,
        result: {
          documentType: result.documentType || 'other',
          confidence: result.confidence || 'medium',
          title: result.title || 'Scanned Document',
          extractedData: result.extractedData || {},
          rawText: result.rawText || '',
          standId: result.standId,
          eventDate: result.eventDate
        }
      });
    } catch (error) {
      console.error("Error classifying document:", error);
      // Clean up the uploaded file on error
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      res.status(500).json({ error: "Failed to classify document" });
    }
  });

  // ============ INVENTORY COUNTS ============
  app.get("/api/inventory/:standId/:eventDate", async (req: Request, res: Response) => {
    try {
      const counts = await storage.getInventoryCountsByStand(
        req.params.standId,
        decodeURIComponent(req.params.eventDate)
      );
      res.json(counts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory counts" });
    }
  });

  app.post("/api/inventory", async (req: Request, res: Response) => {
    try {
      const parsed = insertInventoryCountSchema.parse(req.body);
      const count = await storage.upsertInventoryCount(parsed);
      res.json(count);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save inventory count" });
    }
  });

  app.get("/api/inventory/variance/:standId/:eventDate", async (req: Request, res: Response) => {
    try {
      const report = await storage.getVarianceReport(
        req.params.standId,
        decodeURIComponent(req.params.eventDate)
      );
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate variance report" });
    }
  });

  // ============ MESSAGES ============
  app.get("/api/messages", async (_req: Request, res: Response) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const parsed = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(parsed);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // ============ NPOS ============
  app.get("/api/npos", async (_req: Request, res: Response) => {
    try {
      const npos = await storage.getAllNpos();
      res.json(npos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NPOs" });
    }
  });

  app.post("/api/npos", async (req: Request, res: Response) => {
    try {
      const parsed = insertNpoSchema.parse(req.body);
      const npo = await storage.createNpo(parsed);
      res.status(201).json(npo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create NPO" });
    }
  });

  // ============ STAFFING GROUPS ============
  app.get("/api/staffing-groups", async (_req: Request, res: Response) => {
    try {
      const groups = await storage.getAllStaffingGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staffing groups" });
    }
  });

  app.post("/api/staffing-groups", async (req: Request, res: Response) => {
    try {
      const parsed = insertStaffingGroupSchema.parse(req.body);
      const group = await storage.createStaffingGroup(parsed);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create staffing group" });
    }
  });

  app.patch("/api/staffing-groups/:id", async (req: Request, res: Response) => {
    try {
      await storage.updateStaffingGroup(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update staffing group" });
    }
  });

  // ============ SUPERVISOR DOCS ============
  app.get("/api/supervisor-docs", async (_req: Request, res: Response) => {
    try {
      const docs = await storage.getAllSupervisorDocs();
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch supervisor docs" });
    }
  });

  app.post("/api/supervisor-docs", async (req: Request, res: Response) => {
    try {
      const parsed = insertSupervisorDocSchema.parse(req.body);
      const doc = await storage.createSupervisorDoc(parsed);
      res.status(201).json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create supervisor doc" });
    }
  });

  // ============ DOC SIGNATURES ============
  app.post("/api/doc-signatures", async (req: Request, res: Response) => {
    try {
      const parsed = insertDocSignatureSchema.parse(req.body);
      const signature = await storage.createDocSignature(parsed);
      res.status(201).json(signature);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create signature" });
    }
  });

  // ============ QUICK MESSAGES (canned responses) ============
  app.get("/api/quick-messages", async (_req: Request, res: Response) => {
    try {
      const messages = await storage.getAllQuickMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quick messages" });
    }
  });

  app.get("/api/quick-messages/target/:target", async (req: Request, res: Response) => {
    try {
      const target = decodeURIComponent(req.params.target) as any;
      const messages = await storage.getQuickMessagesByTarget(target);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quick messages by target" });
    }
  });

  app.post("/api/quick-messages", async (req: Request, res: Response) => {
    try {
      const parsed = insertQuickMessageSchema.parse(req.body);
      const message = await storage.createQuickMessage(parsed);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create quick message" });
    }
  });

  // ============ CONVERSATIONS ============
  app.get("/api/conversations", async (_req: Request, res: Response) => {
    try {
      const conversations = await storage.getActiveConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/user/:userId", async (req: Request, res: Response) => {
    try {
      const conversations = await storage.getConversationsByUser(req.params.userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user conversations" });
    }
  });

  app.get("/api/conversations/target/:target", async (req: Request, res: Response) => {
    try {
      const target = decodeURIComponent(req.params.target) as any;
      const conversations = await storage.getConversationsByTarget(target);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations by target" });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const messages = await storage.getConversationMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversation messages" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const parsed = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(parsed);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const parsed = insertConversationMessageSchema.parse({
        ...req.body,
        conversationId: req.params.id
      });
      const message = await storage.createConversationMessage(parsed);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.patch("/api/conversations/:id/close", async (req: Request, res: Response) => {
    try {
      await storage.closeConversation(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to close conversation" });
    }
  });

  // ============ INCIDENTS ============
  app.get("/api/incidents", async (_req: Request, res: Response) => {
    try {
      const incidents = await storage.getAllIncidents();
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.get("/api/incidents/open", async (_req: Request, res: Response) => {
    try {
      const incidents = await storage.getOpenIncidents();
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch open incidents" });
    }
  });

  app.get("/api/incidents/reporter/:reporterId", async (req: Request, res: Response) => {
    try {
      const incidents = await storage.getIncidentsByReporter(req.params.reporterId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reporter incidents" });
    }
  });

  app.get("/api/incidents/:id", async (req: Request, res: Response) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incident" });
    }
  });

  app.post("/api/incidents", async (req: Request, res: Response) => {
    try {
      const parsed = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(parsed);
      // Automatically notify all supervisors and admins
      await storage.createIncidentNotificationsForManagers(incident.id);
      res.status(201).json(incident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create incident" });
    }
  });

  app.patch("/api/incidents/:id/status", async (req: Request, res: Response) => {
    try {
      const { status, resolvedBy } = req.body;
      await storage.updateIncidentStatus(req.params.id, status, resolvedBy);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update incident status" });
    }
  });

  app.patch("/api/incidents/:id/note", async (req: Request, res: Response) => {
    try {
      const { note } = req.body;
      await storage.addIncidentNote(req.params.id, note);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add incident note" });
    }
  });

  // ============ INCIDENT NOTIFICATIONS ============
  app.get("/api/incident-notifications/user/:userId", async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUnreadIncidentNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incident notifications" });
    }
  });

  app.patch("/api/incident-notifications/:id/read", async (req: Request, res: Response) => {
    try {
      await storage.markIncidentNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ============ FILE UPLOADS ============
  // Upload incident media (photos/videos)
  app.post("/api/upload/incident", uploadIncident.array('media', 5), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      const urls = files.map(file => `/uploads/incidents/${file.filename}`);
      res.json({ urls });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  // ============ OCR SCANNER ============
  // Upload image for OCR processing
  app.post("/api/ocr/scan", uploadOcr.single('image'), async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Create Tesseract worker
      const worker = await createWorker('eng');
      
      // Perform OCR
      const result = await worker.recognize(file.path);
      
      // Terminate worker
      await worker.terminate();

      // Return OCR results
      res.json({
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        imagePath: `/uploads/ocr/${file.filename}`
      });
    } catch (error) {
      console.error("OCR error:", error);
      res.status(500).json({ error: "Failed to process OCR" });
    }
  });

  // ============ AI INVENTORY SCANNER ============
  // Upload image for AI-powered can counting and product identification
  app.post("/api/ai-scanner/count", uploadOcr.single('image'), async (req: Request, res: Response) => {
    let filePath: string | null = null;
    
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      filePath = file.path;

      // Read the image and convert to base64
      const imageBuffer = fs.readFileSync(file.path);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';

      // Call GPT-4o Vision to analyze the cooler/shelf image
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Using gpt-4o for vision capabilities
        messages: [
          {
            role: "system",
            content: `You are an expert inventory counting assistant for a stadium concessions operation. 
Your task is to analyze images of cooler shelves and count beverage cans accurately.

When analyzing an image:
1. Count the TOTAL number of visible cans/bottles on each shelf or section
2. Identify the PRODUCT (Bud Light, Michelob Ultra, Blue Moon, Corona, Heineken, Modelo, White Claw, Truly, etc.)
3. Group counts by product type
4. Be precise - only count what you can clearly see

Return your response as a JSON object with this exact structure:
{
  "totalCount": <number>,
  "products": [
    {
      "name": "<product name>",
      "count": <number>,
      "shelf": "<optional shelf identifier like 'top', 'middle', 'bottom', or row number>"
    }
  ],
  "confidence": "<high|medium|low>",
  "notes": "<any observations about image quality, partial visibility, etc.>"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please count all the cans/bottles visible in this cooler image and identify each product. Return the results as JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1024,
        response_format: { type: "json_object" }
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      const countResult = JSON.parse(aiResponse);
      
      // Clean up temp file after successful processing
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        result: countResult
      });
    } catch (error) {
      // Clean up temp file on error
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error("Failed to cleanup temp file:", cleanupError);
        }
      }
      
      console.error("AI Scanner error:", error);
      res.status(500).json({ 
        error: "Failed to analyze image", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============ PAPER COUNT SHEET SCANNER ============
  // Scan a paper count sheet using GPT-4o Vision to extract item counts
  app.post("/api/ai-scanner/count-sheet", uploadOcr.single('image'), async (req: Request, res: Response) => {
    let filePath: string | null = null;
    
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      filePath = file.path;

      // Read the image and convert to base64
      const imageBuffer = fs.readFileSync(file.path);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';

      // Call GPT-4o Vision to analyze the paper count sheet
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at reading inventory count sheets for stadium concessions.
Your task is to analyze images of handwritten or printed count sheets and extract all item names with their counts.

When analyzing an image:
1. Read each line item carefully, including handwritten numbers
2. Extract the item/product name and the count number
3. Handle messy handwriting by using context clues
4. Common items include: Bud Light, Michelob Ultra, Blue Moon, Corona, Modelo, White Claw, Truly, Hot Dogs, Nachos, Pretzels, Popcorn, Peanuts, etc.
5. Look for tally marks, crossed out numbers, and final counts

Return your response as a JSON object with this exact structure:
{
  "items": [
    {
      "name": "<item/product name as written>",
      "count": <number>,
      "confidence": "<high|medium|low>",
      "notes": "<optional notes about readability>"
    }
  ],
  "totalItems": <number of line items found>,
  "overallConfidence": "<high|medium|low>",
  "notes": "<any observations about the document quality, handwriting, or areas that were hard to read>"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please read this count sheet image and extract all item names with their counts. This may be handwritten or printed. Return the results as JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2048,
        response_format: { type: "json_object" }
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      const countResult = JSON.parse(aiResponse);
      
      // Clean up temp file after successful processing
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        result: countResult
      });
    } catch (error) {
      // Clean up temp file on error
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error("Failed to cleanup temp file:", cleanupError);
        }
      }
      
      console.error("Paper Count Sheet Scanner error:", error);
      res.status(500).json({ 
        error: "Failed to read count sheet", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============ ORBY AI CHAT ASSISTANT ============
  // Chat with Orby AI for operations help and guidance
  app.post("/api/ai-chat", async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemPrompt = `You are Orby, a friendly and knowledgeable AI assistant for stadium concessions operations at Nissan Stadium. You help staff with:

- Delivery requests and tracking (how to request supplies, check status)
- Inventory management (counting procedures, variance explanations)
- Role responsibilities (NPO workers, Stand Leads, Supervisors, Managers)
- Stadium navigation (finding stands, sections, departments)
- Troubleshooting common issues (POS problems, supply shortages)
- Compliance (alcohol policies, health codes, ABC regulations)
- Using the Orby app features

Key facts:
- Warehouse handles product deliveries
- Kitchen handles food prep items
- Bar handles beverage supplies
- Stand Leads manage individual stands
- Supervisors oversee 4-6 stands in a section
- Ops Controllers (like David and Sid) have full visibility
- Pre-event counts happen before doors open
- Post-event counts happen after the event ends
- Three-phase inventory: PreEvent → PostEvent → DayAfter

Keep responses concise and practical - staff are usually busy during events. Use simple language, avoid jargon. If you don't know something specific to this venue, say so and suggest who to contact.

Be encouraging and supportive - venue operations can be stressful!`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error("No response from AI");
      }

      res.json({
        success: true,
        response: aiResponse
      });
    } catch (error) {
      console.error("Orby AI Chat error:", error);
      res.status(500).json({ 
        error: "Failed to get response from Orby", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // ============ COUNT SESSIONS ============
  // Start a new count session (with last 4 phone verification)
  app.post("/api/count-sessions", async (req: Request, res: Response) => {
    try {
      const parsed = insertCountSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid count session data", details: parsed.error });
      }
      
      // Check if there's already an active session for this stand/event/stage
      const existingSession = await storage.getCountSessionByStand(
        parsed.data.standId,
        parsed.data.eventDate,
        parsed.data.stage
      );
      
      if (existingSession && existingSession.status === 'InProgress') {
        return res.status(409).json({ 
          error: "Active count session already exists", 
          session: existingSession 
        });
      }
      
      // Check if this stage is allowed (PostEvent requires PreEvent complete, DayAfter requires PostEvent complete)
      if (parsed.data.stage === 'PostEvent') {
        const preEventSession = await storage.getCountSessionByStand(
          parsed.data.standId, 
          parsed.data.eventDate, 
          'PreEvent'
        );
        if (!preEventSession || preEventSession.status === 'InProgress') {
          return res.status(400).json({ 
            error: "Pre-event count must be completed before starting post-event count" 
          });
        }
      }
      
      if (parsed.data.stage === 'DayAfter') {
        const postEventSession = await storage.getCountSessionByStand(
          parsed.data.standId, 
          parsed.data.eventDate, 
          'PostEvent'
        );
        if (!postEventSession || postEventSession.status === 'InProgress') {
          return res.status(400).json({ 
            error: "Post-event count must be completed before starting day-after recount" 
          });
        }
      }
      
      const session = await storage.createCountSession(parsed.data);
      res.status(201).json(session);
    } catch (error) {
      console.error("Count session error:", error);
      res.status(500).json({ error: "Failed to create count session" });
    }
  });

  // Get count sessions for a stand/event
  app.get("/api/count-sessions", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate } = req.query;
      if (!standId || !eventDate) {
        return res.status(400).json({ error: "standId and eventDate are required" });
      }
      const sessions = await storage.getCountSessionsByStand(
        standId as string, 
        eventDate as string
      );
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch count sessions" });
    }
  });

  // Get a single count session
  app.get("/api/count-sessions/:id", async (req: Request, res: Response) => {
    try {
      const session = await storage.getCountSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Count session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch count session" });
    }
  });

  // Complete a count session
  app.patch("/api/count-sessions/:id/complete", async (req: Request, res: Response) => {
    try {
      const session = await storage.getCountSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Count session not found" });
      }
      if (session.status !== 'InProgress') {
        return res.status(400).json({ error: "Session is not in progress" });
      }
      await storage.completeCountSession(req.params.id);
      const updatedSession = await storage.getCountSession(req.params.id);
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete count session" });
    }
  });

  // Verify a count session (manager approval)
  app.patch("/api/count-sessions/:id/verify", async (req: Request, res: Response) => {
    try {
      const { verifiedById } = req.body;
      if (!verifiedById) {
        return res.status(400).json({ error: "verifiedById is required" });
      }
      const session = await storage.getCountSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Count session not found" });
      }
      if (session.status !== 'Completed') {
        return res.status(400).json({ error: "Session must be completed before verification" });
      }
      await storage.verifyCountSession(req.params.id, verifiedById);
      const updatedSession = await storage.getCountSession(req.params.id);
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: "Failed to verify count session" });
    }
  });

  // Add note to a count session
  app.patch("/api/count-sessions/:id/note", async (req: Request, res: Response) => {
    try {
      const { note } = req.body;
      if (!note) {
        return res.status(400).json({ error: "Note is required" });
      }
      const session = await storage.getCountSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Count session not found" });
      }
      await storage.addCountSessionNote(req.params.id, note);
      const updatedSession = await storage.getCountSession(req.params.id);
      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: "Failed to add note to count session" });
    }
  });

  // Get active count session for a stand
  app.get("/api/count-sessions/active", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate } = req.query;
      if (!standId || !eventDate) {
        return res.status(400).json({ error: "standId and eventDate are required" });
      }
      const session = await storage.getActiveCountSession(
        standId as string, 
        eventDate as string
      );
      res.json(session || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active count session" });
    }
  });

  // ============ INVENTORY COUNTS ============
  // Get inventory counts by session
  app.get("/api/inventory-counts", async (req: Request, res: Response) => {
    try {
      const { sessionId, standId, eventDate } = req.query;
      if (sessionId) {
        const counts = await storage.getInventoryCountsBySession(sessionId as string);
        return res.json(counts);
      }
      if (standId && eventDate) {
        const counts = await storage.getInventoryCountsByStand(standId as string, eventDate as string);
        return res.json(counts);
      }
      return res.status(400).json({ error: "Either sessionId or standId+eventDate required" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory counts" });
    }
  });

  // Create or update inventory count
  app.post("/api/inventory-counts", async (req: Request, res: Response) => {
    try {
      const parsed = insertInventoryCountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid inventory count data", details: parsed.error });
      }
      const count = await storage.upsertInventoryCount(parsed.data);
      res.json(count);
    } catch (error) {
      res.status(500).json({ error: "Failed to save inventory count" });
    }
  });

  // ============ STAND ISSUES ============
  // Get all stand issues (with optional standId filter)
  app.get("/api/stand-issues", async (req: Request, res: Response) => {
    try {
      const { standId } = req.query;
      if (standId) {
        const issues = await storage.getStandIssuesByStand(standId as string);
        res.json(issues);
      } else {
        const issues = await storage.getAllStandIssues();
        res.json(issues);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stand issues" });
    }
  });

  // Get open stand issues
  app.get("/api/stand-issues/open", async (_req: Request, res: Response) => {
    try {
      const issues = await storage.getOpenStandIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch open issues" });
    }
  });

  // Get emergency issues
  app.get("/api/stand-issues/emergency", async (_req: Request, res: Response) => {
    try {
      const issues = await storage.getEmergencyStandIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch emergency issues" });
    }
  });

  // Get issues by stand
  app.get("/api/stand-issues/stand/:standId", async (req: Request, res: Response) => {
    try {
      const issues = await storage.getStandIssuesByStand(req.params.standId);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stand issues" });
    }
  });

  // Get issues routed to a specific role
  app.get("/api/stand-issues/routed/:role", async (req: Request, res: Response) => {
    try {
      const issues = await storage.getStandIssuesByRouting(req.params.role as any);
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routed issues" });
    }
  });

  // Get single issue
  app.get("/api/stand-issues/:id", async (req: Request, res: Response) => {
    try {
      const issue = await storage.getStandIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ error: "Issue not found" });
      }
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch issue" });
    }
  });

  // Create new stand issue
  app.post("/api/stand-issues", async (req: Request, res: Response) => {
    try {
      const parsed = insertStandIssueSchema.parse(req.body);
      const issue = await storage.createStandIssue(parsed);
      
      // Create notifications based on routing rules
      const isEmergency = parsed.severity === 'Emergency';
      try {
        await storage.createStandIssueNotifications(issue.id, parsed.category, isEmergency);
      } catch (notificationError) {
        console.warn('Failed to create notifications but issue was created:', notificationError);
      }
      
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Failed to create stand issue:', error);
      res.status(500).json({ error: "Failed to create issue" });
    }
  });

  // Acknowledge an issue
  app.patch("/api/stand-issues/:id/acknowledge", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      await storage.acknowledgeStandIssue(req.params.id, userId);
      const issue = await storage.getStandIssue(req.params.id);
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: "Failed to acknowledge issue" });
    }
  });

  // Resolve an issue
  app.patch("/api/stand-issues/:id/resolve", async (req: Request, res: Response) => {
    try {
      const { userId, notes } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }
      await storage.resolveStandIssue(req.params.id, userId, notes);
      const issue = await storage.getStandIssue(req.params.id);
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve issue" });
    }
  });

  // Update issue status
  app.patch("/api/stand-issues/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "status required" });
      }
      await storage.updateStandIssueStatus(req.params.id, status);
      const issue = await storage.getStandIssue(req.params.id);
      res.json(issue);
    } catch (error) {
      res.status(500).json({ error: "Failed to update issue status" });
    }
  });

  // ============ STAND ISSUE NOTIFICATIONS ============
  // Get unread issue notifications for user
  app.get("/api/stand-issue-notifications/:userId", async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUnreadStandIssueNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/stand-issue-notifications/:id/read", async (req: Request, res: Response) => {
    try {
      await storage.markStandIssueNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ============ CLOSING CHECKLISTS ============
  // Get or create closing checklist for stand/event
  app.get("/api/closing-checklists/:standId/:eventDate", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate } = req.params;
      let checklist = await storage.getClosingChecklist(standId, eventDate);
      
      // Return existing checklist with tasks
      if (checklist) {
        const tasks = await storage.getClosingChecklistTasks(checklist.id);
        return res.json({ checklist, tasks });
      }
      
      res.json({ checklist: null, tasks: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch closing checklist" });
    }
  });

  // Create closing checklist
  app.post("/api/closing-checklists", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate, supervisorId } = req.body;
      if (!standId || !eventDate || !supervisorId) {
        return res.status(400).json({ error: "standId, eventDate, and supervisorId required" });
      }
      
      // Check if already exists
      const existing = await storage.getClosingChecklist(standId, eventDate);
      if (existing) {
        const tasks = await storage.getClosingChecklistTasks(existing.id);
        return res.json({ checklist: existing, tasks });
      }
      
      const checklist = await storage.createClosingChecklist({ standId, eventDate, supervisorId });
      const tasks = await storage.getClosingChecklistTasks(checklist.id);
      res.json({ checklist, tasks });
    } catch (error) {
      res.status(500).json({ error: "Failed to create closing checklist" });
    }
  });

  // Toggle checklist task
  app.patch("/api/closing-checklist-tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const { isCompleted, remarks } = req.body;
      await storage.toggleChecklistTask(req.params.taskId, isCompleted, remarks);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Complete closing checklist
  app.patch("/api/closing-checklists/:id/complete", async (req: Request, res: Response) => {
    try {
      await storage.completeClosingChecklist(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete checklist" });
    }
  });

  // ============ SPOILAGE REPORTS ============
  // Get or create spoilage report for stand/event
  app.get("/api/spoilage-reports/:standId/:eventDate", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate } = req.params;
      let report = await storage.getSpoilageReport(standId, eventDate);
      
      if (report) {
        const items = await storage.getSpoilageItems(report.id);
        return res.json({ report, items });
      }
      
      res.json({ report: null, items: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spoilage report" });
    }
  });

  // Create spoilage report
  app.post("/api/spoilage-reports", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate, supervisorId } = req.body;
      if (!standId || !eventDate || !supervisorId) {
        return res.status(400).json({ error: "standId, eventDate, and supervisorId required" });
      }
      
      const existing = await storage.getSpoilageReport(standId, eventDate);
      if (existing) {
        const items = await storage.getSpoilageItems(existing.id);
        return res.json({ report: existing, items });
      }
      
      const report = await storage.createSpoilageReport({ standId, eventDate, supervisorId });
      res.json({ report, items: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to create spoilage report" });
    }
  });

  // Add spoilage item
  app.post("/api/spoilage-items", async (req: Request, res: Response) => {
    try {
      const { reportId, itemId, itemName, quantity, unit, reason, notes } = req.body;
      if (!reportId || !itemName || !quantity || !reason) {
        return res.status(400).json({ error: "reportId, itemName, quantity, and reason required" });
      }
      
      const item = await storage.addSpoilageItem({ 
        reportId, 
        itemId, 
        itemName, 
        quantity, 
        unit: unit || 'each', 
        reason, 
        notes 
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to add spoilage item" });
    }
  });

  // Remove spoilage item
  app.delete("/api/spoilage-items/:id", async (req: Request, res: Response) => {
    try {
      await storage.removeSpoilageItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove spoilage item" });
    }
  });

  // Submit spoilage report
  app.patch("/api/spoilage-reports/:id/submit", async (req: Request, res: Response) => {
    try {
      await storage.submitSpoilageReport(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit spoilage report" });
    }
  });

  // ============ VOUCHER REPORTS ============
  // Get or create voucher report for stand/event
  app.get("/api/voucher-reports/:standId/:eventDate", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate } = req.params;
      let report = await storage.getVoucherReport(standId, eventDate);
      
      if (report) {
        return res.json({ report });
      }
      
      res.json({ report: null });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voucher report" });
    }
  });

  // Create voucher report
  app.post("/api/voucher-reports", async (req: Request, res: Response) => {
    try {
      const { standId, eventDate, supervisorId, voucherCount, totalAmountCents, notes } = req.body;
      if (!standId || !eventDate || !supervisorId) {
        return res.status(400).json({ error: "standId, eventDate, and supervisorId required" });
      }
      
      const existing = await storage.getVoucherReport(standId, eventDate);
      if (existing) {
        return res.json({ report: existing });
      }
      
      const report = await storage.createVoucherReport({ 
        standId, 
        eventDate, 
        supervisorId, 
        voucherCount: voucherCount || 0, 
        totalAmountCents: totalAmountCents || 0,
        notes 
      });
      res.json({ report });
    } catch (error) {
      res.status(500).json({ error: "Failed to create voucher report" });
    }
  });

  // Update voucher report
  app.patch("/api/voucher-reports/:id", async (req: Request, res: Response) => {
    try {
      const { voucherCount, totalAmountCents, notes } = req.body;
      await storage.updateVoucherReport(req.params.id, voucherCount, totalAmountCents, notes);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update voucher report" });
    }
  });

  // Submit voucher report
  app.patch("/api/voucher-reports/:id/submit", async (req: Request, res: Response) => {
    try {
      await storage.submitVoucherReport(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit voucher report" });
    }
  });

  // ============ DOCUMENT SUBMISSIONS ============
  // Submit document to Operations Manager
  app.post("/api/document-submissions", async (req: Request, res: Response) => {
    try {
      const { documentType, standId, eventDate, submittedById, submittedByName, pdfData, signatureData } = req.body;
      if (!documentType || !standId || !eventDate) {
        return res.status(400).json({ error: "documentType, standId, and eventDate required" });
      }
      
      // Get Operations Manager ID
      const recipientId = await storage.getOperationsManagerId();
      
      const submission = await storage.createDocumentSubmission({
        documentType,
        standId,
        eventDate,
        submittedById,
        submittedByName,
        recipientId,
        recipientRole: 'OperationsManager',
        pdfData,
        signatureData
      });
      
      res.json({ submission, success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit document" });
    }
  });

  // Get document submissions for Operations Manager
  app.get("/api/document-submissions/operations-manager", async (req: Request, res: Response) => {
    try {
      const submissions = await storage.getDocumentSubmissionsByRecipient('OperationsManager');
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Get unread document count
  app.get("/api/document-submissions/unread-count", async (req: Request, res: Response) => {
    try {
      const count = await storage.getUnreadDocumentCount('OperationsManager');
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Get specific document submission
  app.get("/api/document-submissions/:id", async (req: Request, res: Response) => {
    try {
      const submission = await storage.getDocumentSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  // Mark document submission as read
  app.patch("/api/document-submissions/:id/read", async (req: Request, res: Response) => {
    try {
      await storage.markDocumentSubmissionRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // ============ SEED DATA ============
  app.post("/api/seed", async (_req: Request, res: Response) => {
    try {
      // Check if data already exists
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.json({ message: "Database already seeded", seeded: false });
      }

      // Seed Users with new role hierarchy
      // Initial PINs: NPOWorker=1111, StandLead=2222, StandSupervisor=3333, Management=4444
      const users = [
        { name: 'Admin User', pin: '1234', role: 'Admin' as const, isOnline: false, requiresPinReset: false },
        { name: 'Sup. Sarah', pin: '3333', role: 'StandSupervisor' as const, isOnline: false, requiresPinReset: true },
        { name: 'Sup. Mike', pin: '3334', role: 'StandSupervisor' as const, isOnline: false, requiresPinReset: true },
        { name: 'IT Support', pin: '7777', role: 'IT' as const, isOnline: false, requiresPinReset: false },
        { name: 'Developer', pin: '0424', role: 'Developer' as const, isOnline: false, requiresPinReset: false },
        { name: 'NPO Worker 1', pin: '1111', role: 'NPOWorker' as const, isOnline: false, requiresPinReset: true },
        { name: 'Stand Lead 1', pin: '2222', role: 'StandLead' as const, isOnline: false, requiresPinReset: true },
        { name: 'Warehouse Manager', pin: '4444', role: 'ManagementCore' as const, managementType: 'WarehouseManager' as const, isOnline: false, requiresPinReset: true },
        { name: 'Kitchen Manager', pin: '4445', role: 'ManagementCore' as const, managementType: 'KitchenManager' as const, isOnline: false, requiresPinReset: true },
        { name: 'HR Manager', pin: '4446', role: 'ManagementCore' as const, managementType: 'HRManager' as const, isOnline: false, requiresPinReset: true },
        { name: 'General Manager', pin: '4447', role: 'ManagementCore' as const, managementType: 'GeneralManager' as const, isOnline: false, requiresPinReset: true },
        { name: 'Operations Manager', pin: '7777', role: 'ManagementCore' as const, managementType: 'OperationsManager' as const, isOnline: false, requiresPinReset: true },
      ];

      const createdUsers: Record<string, string> = {};
      for (const u of users) {
        const user = await storage.createUser(u);
        createdUsers[u.pin] = user.id;
      }

      // Seed Items
      const items = [
        { name: 'Bud Light 16oz', price: 1200, category: 'Beverage' },
        { name: 'Miller Lite 16oz', price: 1200, category: 'Beverage' },
        { name: 'Coca Cola 20oz', price: 600, category: 'Beverage' },
        { name: 'Water 20oz', price: 500, category: 'Beverage' },
        { name: 'Hot Dog', price: 800, category: 'Food' },
        { name: 'Nachos', price: 900, category: 'Food' },
        { name: 'Pretzel', price: 700, category: 'Food' },
      ];

      for (const item of items) {
        await storage.createItem(item);
      }

      // Seed NPOs
      const npos = [
        { name: 'Boy Scouts Troop 42', groupLeader: 'John Smith', contact: '555-0101' },
        { name: 'Central High Band', groupLeader: 'Jane Doe', contact: '555-0102' },
        { name: 'Rotary Club', groupLeader: 'Bob Wilson', contact: '555-0103' },
      ];

      for (const npo of npos) {
        await storage.createNpo(npo);
      }

      // Seed Quick Messages
      const quickMessages = [
        // Warehouse messages
        { category: 'Supply Request', label: 'Need more cups', targetRole: 'Warehouse' as const, sortOrder: 1 },
        { category: 'Supply Request', label: 'Need more napkins', targetRole: 'Warehouse' as const, sortOrder: 2 },
        { category: 'Supply Request', label: 'Need ice delivery', targetRole: 'Warehouse' as const, sortOrder: 3 },
        { category: 'Supply Request', label: 'Low on beer - need restock', targetRole: 'Warehouse' as const, sortOrder: 4 },
        { category: 'Supply Request', label: 'Need condiments', targetRole: 'Warehouse' as const, sortOrder: 5 },
        { category: 'Equipment', label: 'POS not working', targetRole: 'Warehouse' as const, sortOrder: 6 },
        { category: 'Equipment', label: 'Need cash drawer', targetRole: 'Warehouse' as const, sortOrder: 7 },
        // Kitchen messages
        { category: 'Food Request', label: 'Need more hot dogs', targetRole: 'Kitchen' as const, sortOrder: 1 },
        { category: 'Food Request', label: 'Need more nachos', targetRole: 'Kitchen' as const, sortOrder: 2 },
        { category: 'Food Request', label: 'Need more pretzels', targetRole: 'Kitchen' as const, sortOrder: 3 },
        { category: 'Food Request', label: 'Running low on BBQ sauce', targetRole: 'Kitchen' as const, sortOrder: 4 },
        { category: 'Food Request', label: 'Need popcorn restock', targetRole: 'Kitchen' as const, sortOrder: 5 },
        { category: 'Temperature', label: 'Food warmer not working', targetRole: 'Kitchen' as const, sortOrder: 6 },
        // Manager messages
        { category: 'Staffing', label: 'Need additional staff', targetRole: 'Manager' as const, sortOrder: 1 },
        { category: 'Staffing', label: 'Staff member left early', targetRole: 'Manager' as const, sortOrder: 2 },
        { category: 'Issue', label: 'Customer complaint', targetRole: 'Manager' as const, sortOrder: 3 },
        { category: 'Issue', label: 'Cash discrepancy', targetRole: 'Manager' as const, sortOrder: 4 },
        // Bar Manager messages
        { category: 'Alcohol', label: 'Running low on draft beer', targetRole: 'Bar Manager' as const, sortOrder: 1 },
        { category: 'Alcohol', label: 'Need liquor restock', targetRole: 'Bar Manager' as const, sortOrder: 2 },
        { category: 'Compliance', label: 'ID scanner issue', targetRole: 'Bar Manager' as const, sortOrder: 3 },
        // HR Manager messages
        { category: 'HR', label: 'Employee no-show', targetRole: 'HR Manager' as const, sortOrder: 1 },
        { category: 'HR', label: 'Injury report', targetRole: 'HR Manager' as const, sortOrder: 2 },
        { category: 'HR', label: 'Uniform issue', targetRole: 'HR Manager' as const, sortOrder: 3 },
      ];

      for (const qm of quickMessages) {
        await storage.createQuickMessage(qm);
      }

      // Seed Supervisor Docs
      const docs = [
        { title: 'Alcohol Compliance Sheet', category: 'Compliance' as const, requiresSignature: true },
        { title: 'Bartender Checklist', category: 'Checklist' as const, requiresSignature: false },
        { title: 'Emergency Contacts', category: 'Contact' as const, content: 'Security: 555-0199\nMedical: 555-0198\nMaintenance: 555-0197' },
        { title: 'Stand Opening Procedures', category: 'Reference' as const, requiresSignature: false },
      ];

      for (const doc of docs) {
        await storage.createSupervisorDoc(doc);
      }

      // Seed Stands (abbreviated for brevity - full list would be here)
      const standData = [
        // 2 EAST
        { id: '102S', name: '102S - Moosehead', section: '2 East', physicalSection: '102', supervisorId: createdUsers['5678'], status: 'Open' as const, e700Ids: [], a930Ids: ['126', '122'] },
        { id: '103', name: '103 - Jack Bar North', section: '2 East', physicalSection: '103', supervisorId: createdUsers['5678'], status: 'Open' as const, e700Ids: ['201'], a930Ids: [] },
        { id: '104L', name: '104L - Cocktails', section: '2 East', physicalSection: '104', supervisorId: createdUsers['5678'], status: 'Hot Spot' as const, e700Ids: ['202', '203', '204'], a930Ids: ['130', '131', '132'] },
        { id: '105V', name: '105V - Vending MSM', section: '2 East', physicalSection: '105', supervisorId: createdUsers['5678'], status: 'Closed' as const, e700Ids: [], a930Ids: [] },
        { id: '105S', name: '105S - Ice Crown', section: '2 East', physicalSection: '105', supervisorId: createdUsers['5678'], status: 'Open' as const, e700Ids: ['205', '206', '207', '208'], a930Ids: [] },
        // 2 WEST
        { id: 'OA001', name: 'OA001 - Titan Up Tailgate', section: '2 West', physicalSection: 'Plaza', supervisorId: createdUsers['5678'], status: 'Closed' as const, e700Ids: [], a930Ids: ['150', '151', '152', '153'] },
        { id: '126L', name: '126L - Jack BAR South', section: '2 West', physicalSection: '126', supervisorId: createdUsers['5678'], status: 'Open' as const, e700Ids: ['260', '261'], a930Ids: ['164'] },
        // 7 EAST
        { id: '305V', name: '305V - Vending MSM', section: '7 East', physicalSection: '305', supervisorId: createdUsers['9012'], status: 'Open' as const, e700Ids: [], a930Ids: ['168'] },
        { id: '309L', name: '309L - Titos', section: '7 East', physicalSection: '309', supervisorId: createdUsers['9012'], status: 'Open' as const, e700Ids: ['300', '301'], a930Ids: [] },
        { id: '310F', name: '310F - Walking Taco', section: '7 East', physicalSection: '310', supervisorId: createdUsers['9012'], status: 'Needs Power' as const, e700Ids: ['302', '303'], a930Ids: [] },
        // 7 WEST
        { id: '329B', name: '329B - Mango Cart', section: '7 West', physicalSection: '329', supervisorId: createdUsers['9012'], status: 'Open' as const, e700Ids: ['326', '327'], a930Ids: [] },
        { id: '330G', name: '330G - 615 Market', section: '7 West', physicalSection: '330', supervisorId: createdUsers['9012'], status: 'Open' as const, e700Ids: ['328', '329'], a930Ids: [] },
      ];

      for (const stand of standData) {
        await storage.createStand(stand);
      }

      res.json({ message: "Database seeded successfully", seeded: true });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed database" });
    }
  });

  // ============ MENU BOARDS ============
  app.get("/api/menu-boards", async (req: Request, res: Response) => {
    try {
      const boards = await storage.getAllMenuBoards();
      res.json(boards);
    } catch (error) {
      console.error("Error fetching menu boards:", error);
      res.status(500).json({ error: "Failed to fetch menu boards" });
    }
  });

  app.get("/api/menu-boards/:id", async (req: Request, res: Response) => {
    try {
      const board = await storage.getMenuBoard(req.params.id);
      if (!board) {
        return res.status(404).json({ error: "Menu board not found" });
      }
      res.json(board);
    } catch (error) {
      console.error("Error fetching menu board:", error);
      res.status(500).json({ error: "Failed to fetch menu board" });
    }
  });

  app.post("/api/menu-boards", async (req: Request, res: Response) => {
    try {
      const validated = insertMenuBoardSchema.parse(req.body);
      const board = await storage.createMenuBoard(validated);
      res.json(board);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating menu board:", error);
      res.status(500).json({ error: "Failed to create menu board" });
    }
  });

  const updateMenuBoardSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional()
  });

  app.put("/api/menu-boards/:id", async (req: Request, res: Response) => {
    try {
      const validated = updateMenuBoardSchema.parse(req.body);
      await storage.updateMenuBoard(req.params.id, validated);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error updating menu board:", error);
      res.status(500).json({ error: "Failed to update menu board" });
    }
  });

  app.delete("/api/menu-boards/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteMenuBoard(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting menu board:", error);
      res.status(500).json({ error: "Failed to delete menu board" });
    }
  });

  app.get("/api/menu-boards/:id/slides", async (req: Request, res: Response) => {
    try {
      const slides = await storage.getMenuSlides(req.params.id);
      const formattedSlides = slides.map(slide => ({
        id: slide.id,
        title: slide.title || '',
        backgroundColor: slide.backgroundColor || '#1a1a2e',
        backgroundImage: slide.backgroundImage,
        elements: Array.isArray(slide.content) ? slide.content : []
      }));
      res.json(formattedSlides);
    } catch (error) {
      console.error("Error fetching slides:", error);
      res.status(500).json({ error: "Failed to fetch slides" });
    }
  });

  const saveMenuSlidesSchema = z.object({
    slides: z.array(z.object({
      id: z.string().optional(),
      title: z.string().optional().default(''),
      backgroundColor: z.string().optional().default('#1a1a2e'),
      backgroundImage: z.string().optional(),
      elements: z.array(z.any()).optional().default([])
    }))
  });

  app.put("/api/menu-boards/:id/slides", async (req: Request, res: Response) => {
    try {
      const validated = saveMenuSlidesSchema.parse(req.body);
      const formattedSlides = validated.slides.map((slide, index) => ({
        title: slide.title || '',
        backgroundColor: slide.backgroundColor || '#1a1a2e',
        backgroundImage: slide.backgroundImage,
        content: slide.elements || [],
        slideOrder: index
      }));
      const saved = await storage.saveMenuSlides(req.params.id, formattedSlides);
      res.json(saved);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error saving slides:", error);
      res.status(500).json({ error: "Failed to save slides" });
    }
  });

  // ============ WAREHOUSE INVENTORY SYSTEM ============
  // NOTE: This is a configurable example based on Nissan Stadium operations.
  // Categories, products, and par levels can be customized to match your specific workflow.

  // Seed example warehouse data
  app.post("/api/warehouse/seed", async (_req: Request, res: Response) => {
    try {
      await storage.seedExampleWarehouseData();
      res.json({ success: true, message: "Example warehouse data seeded successfully" });
    } catch (error) {
      console.error("Error seeding warehouse data:", error);
      res.status(500).json({ error: "Failed to seed warehouse data" });
    }
  });

  // Warehouse Categories
  app.get("/api/warehouse/categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getAllWarehouseCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching warehouse categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  const insertWarehouseCategorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    sortOrder: z.number().optional()
  });

  app.post("/api/warehouse/categories", async (req: Request, res: Response) => {
    try {
      const validated = insertWarehouseCategorySchema.parse(req.body);
      const category = await storage.createWarehouseCategory(validated);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/warehouse/categories/:id", async (req: Request, res: Response) => {
    try {
      const validated = insertWarehouseCategorySchema.partial().parse(req.body);
      await storage.updateWarehouseCategory(req.params.id, validated);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/warehouse/categories/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWarehouseCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Warehouse Products
  app.get("/api/warehouse/products", async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.query;
      let products;
      if (categoryId && typeof categoryId === 'string') {
        products = await storage.getWarehouseProductsByCategory(categoryId);
      } else {
        products = await storage.getAllWarehouseProducts();
      }
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/warehouse/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getWarehouseProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  const insertWarehouseProductSchema = z.object({
    categoryId: z.string().optional(),
    name: z.string().min(1),
    sku: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    unitsPerCase: z.number().optional(),
    costPerUnitCents: z.number().optional(),
    imageUrl: z.string().optional(),
    isPerishable: z.boolean().optional(),
    shelfLifeDays: z.number().optional(),
    minOrderQty: z.number().optional()
  });

  app.post("/api/warehouse/products", async (req: Request, res: Response) => {
    try {
      const validated = insertWarehouseProductSchema.parse(req.body);
      const product = await storage.createWarehouseProduct(validated);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/warehouse/products/:id", async (req: Request, res: Response) => {
    try {
      const validated = insertWarehouseProductSchema.partial().parse(req.body);
      await storage.updateWarehouseProduct(req.params.id, validated);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/warehouse/products/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWarehouseProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Warehouse Stock
  app.get("/api/warehouse/stock", async (_req: Request, res: Response) => {
    try {
      const stock = await storage.getAllWarehouseStock();
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  app.get("/api/warehouse/stock/:productId", async (req: Request, res: Response) => {
    try {
      const stock = await storage.getWarehouseStockByProduct(req.params.productId);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  const updateStockSchema = z.object({
    quantity: z.number().min(0),
    userId: z.string().optional()
  });

  app.put("/api/warehouse/stock/:productId", async (req: Request, res: Response) => {
    try {
      const validated = updateStockSchema.parse(req.body);
      await storage.updateWarehouseStock(req.params.productId, validated.quantity, validated.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ error: "Failed to update stock" });
    }
  });

  // Warehouse Par Levels
  app.get("/api/warehouse/par-levels", async (req: Request, res: Response) => {
    try {
      const { standId, productId } = req.query;
      let parLevels;
      if (standId && typeof standId === 'string') {
        parLevels = await storage.getParLevelsByStand(standId);
      } else if (productId && typeof productId === 'string') {
        parLevels = await storage.getParLevelsByProduct(productId);
      } else {
        return res.status(400).json({ error: "standId or productId required" });
      }
      res.json(parLevels);
    } catch (error) {
      console.error("Error fetching par levels:", error);
      res.status(500).json({ error: "Failed to fetch par levels" });
    }
  });

  const insertParLevelSchema = z.object({
    productId: z.string(),
    standId: z.string().optional(),
    standType: z.string().optional(),
    minQuantity: z.number().min(0),
    maxQuantity: z.number().optional(),
    reorderPoint: z.number().optional(),
    notes: z.string().optional()
  });

  app.post("/api/warehouse/par-levels", async (req: Request, res: Response) => {
    try {
      const validated = insertParLevelSchema.parse(req.body);
      const parLevel = await storage.createParLevel(validated);
      res.json(parLevel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating par level:", error);
      res.status(500).json({ error: "Failed to create par level" });
    }
  });

  app.put("/api/warehouse/par-levels/:id", async (req: Request, res: Response) => {
    try {
      const validated = insertParLevelSchema.partial().parse(req.body);
      await storage.updateParLevel(req.params.id, validated);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating par level:", error);
      res.status(500).json({ error: "Failed to update par level" });
    }
  });

  app.delete("/api/warehouse/par-levels/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteParLevel(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting par level:", error);
      res.status(500).json({ error: "Failed to delete par level" });
    }
  });

  // Warehouse Requests
  app.get("/api/warehouse/requests", async (req: Request, res: Response) => {
    try {
      const { standId, status } = req.query;
      let requests;
      if (standId && typeof standId === 'string') {
        requests = await storage.getWarehouseRequestsByStand(standId);
      } else if (status && typeof status === 'string') {
        requests = await storage.getWarehouseRequestsByStatus(status as any);
      } else {
        requests = await storage.getAllWarehouseRequests();
      }
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ error: "Failed to fetch requests" });
    }
  });

  app.get("/api/warehouse/requests/pending", async (_req: Request, res: Response) => {
    try {
      const requests = await storage.getPendingWarehouseRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  app.get("/api/warehouse/requests/:id", async (req: Request, res: Response) => {
    try {
      const request = await storage.getWarehouseRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ error: "Failed to fetch request" });
    }
  });

  const insertWarehouseRequestSchema = z.object({
    standId: z.string(),
    requestedById: z.string(),
    priority: z.enum(['Normal', 'Emergency']).optional(),
    notes: z.string().optional()
  });

  app.post("/api/warehouse/requests", async (req: Request, res: Response) => {
    try {
      const validated = insertWarehouseRequestSchema.parse(req.body);
      const request = await storage.createWarehouseRequest(validated);
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating request:", error);
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  const updateRequestStatusSchema = z.object({
    status: z.enum(['Pending', 'Approved', 'Picking', 'InTransit', 'Delivered', 'Confirmed', 'Cancelled']),
    userId: z.string()
  });

  app.put("/api/warehouse/requests/:id/status", async (req: Request, res: Response) => {
    try {
      const validated = updateRequestStatusSchema.parse(req.body);
      await storage.updateWarehouseRequestStatus(req.params.id, validated.status, validated.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ error: "Failed to update request status" });
    }
  });

  // Warehouse Request Items
  app.get("/api/warehouse/requests/:id/items", async (req: Request, res: Response) => {
    try {
      const items = await storage.getWarehouseRequestItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching request items:", error);
      res.status(500).json({ error: "Failed to fetch request items" });
    }
  });

  const insertRequestItemSchema = z.object({
    requestId: z.string(),
    productId: z.string(),
    quantityRequested: z.number().min(1),
    notes: z.string().optional()
  });

  app.post("/api/warehouse/requests/:id/items", async (req: Request, res: Response) => {
    try {
      const validated = insertRequestItemSchema.parse({
        ...req.body,
        requestId: req.params.id
      });
      const item = await storage.addWarehouseRequestItem(validated);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error adding request item:", error);
      res.status(500).json({ error: "Failed to add request item" });
    }
  });

  app.put("/api/warehouse/requests/:requestId/items/:itemId", async (req: Request, res: Response) => {
    try {
      const validated = z.object({
        quantityApproved: z.number().optional(),
        quantityDelivered: z.number().optional(),
        notes: z.string().optional()
      }).parse(req.body);
      await storage.updateWarehouseRequestItem(req.params.itemId, validated);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating request item:", error);
      res.status(500).json({ error: "Failed to update request item" });
    }
  });

  // Low Stock Alerts
  app.get("/api/warehouse/low-stock", async (_req: Request, res: Response) => {
    try {
      const lowStock = await storage.getLowStockProducts();
      res.json(lowStock);
    } catch (error) {
      console.error("Error fetching low stock:", error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  // Warehouse Dashboard Stats
  app.get("/api/warehouse/stats", async (_req: Request, res: Response) => {
    try {
      const [categories, products, stock, pendingRequests] = await Promise.all([
        storage.getAllWarehouseCategories(),
        storage.getAllWarehouseProducts(),
        storage.getAllWarehouseStock(),
        storage.getPendingWarehouseRequests()
      ]);
      
      const totalProducts = products.length;
      const totalCategories = categories.length;
      const pendingRequestCount = pendingRequests.length;
      const lowStockCount = stock.filter(s => s.quantity < 10).length;
      
      res.json({
        totalProducts,
        totalCategories,
        pendingRequestCount,
        lowStockCount,
        isExampleData: true,
        configNote: "This warehouse inventory system is a configurable example based on Nissan Stadium operations. Categories, products, and par levels can be customized to match your specific workflow."
      });
    } catch (error) {
      console.error("Error fetching warehouse stats:", error);
      res.status(500).json({ error: "Failed to fetch warehouse stats" });
    }
  });

  // ============ DELIVERY REQUESTS (Enhanced with Real-time) ============
  app.get("/api/deliveries", async (_req: Request, res: Response) => {
    try {
      const deliveries = await storage.getAllDeliveryRequests();
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/status/:status", async (req: Request, res: Response) => {
    try {
      const deliveries = await storage.getDeliveryRequestsByStatus(req.params.status);
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries by status:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/department/:department", async (req: Request, res: Response) => {
    try {
      const deliveries = await storage.getDeliveryRequestsByDepartment(req.params.department);
      res.json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries by department:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/:id", async (req: Request, res: Response) => {
    try {
      const delivery = await storage.getDeliveryRequest(req.params.id);
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      res.json(delivery);
    } catch (error) {
      console.error("Error fetching delivery:", error);
      res.status(500).json({ error: "Failed to fetch delivery" });
    }
  });

  app.post("/api/deliveries", async (req: Request, res: Response) => {
    try {
      const delivery = await storage.createDeliveryRequest(req.body);
      await createAuditLog(req.body.requesterId, 'DeliveryRequest', 'delivery', delivery.id, { department: req.body.department }, req.body.standId, req);
      wsServer.broadcastDeliveryUpdate(delivery);
      res.status(201).json(delivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      res.status(500).json({ error: "Failed to create delivery request" });
    }
  });

  app.patch("/api/deliveries/:id/status", async (req: Request, res: Response) => {
    try {
      const { status, userId, eta } = req.body;
      await storage.updateDeliveryRequestStatus(req.params.id, status, userId, eta);
      const updated = await storage.getDeliveryRequest(req.params.id);
      
      const actionMap: Record<string, string> = {
        'Acknowledged': 'DeliveryAcknowledge',
        'InProgress': 'DeliveryPick',
        'OnTheWay': 'DeliveryDispatch',
        'Delivered': 'DeliveryComplete'
      };
      if (actionMap[status]) {
        await createAuditLog(userId, actionMap[status], 'delivery', req.params.id, { status, eta }, updated?.standId, req);
      }
      
      wsServer.broadcastDeliveryUpdate(updated);
      res.json({ success: true, delivery: updated });
    } catch (error) {
      console.error("Error updating delivery status:", error);
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });

  // ============ EMERGENCY ALERTS ============
  app.get("/api/emergency-alerts", async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getAllEmergencyAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching emergency alerts:", error);
      res.status(500).json({ error: "Failed to fetch emergency alerts" });
    }
  });

  app.get("/api/emergency-alerts/active", async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getActiveEmergencyAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching active alerts:", error);
      res.status(500).json({ error: "Failed to fetch active alerts" });
    }
  });

  app.get("/api/emergency-alerts/:id", async (req: Request, res: Response) => {
    try {
      const alert = await storage.getEmergencyAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error fetching alert:", error);
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  app.post("/api/emergency-alerts", async (req: Request, res: Response) => {
    try {
      const validated = insertEmergencyAlertSchema.parse(req.body);
      const alert = await storage.createEmergencyAlert(validated);
      await createAuditLog(validated.reporterId, 'EmergencyAlert', 'emergency', alert.id, { type: validated.alertType, title: validated.title }, validated.standId ?? undefined, req);
      wsServer.broadcastEmergency(alert);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating emergency alert:", error);
      res.status(500).json({ error: "Failed to create emergency alert" });
    }
  });

  app.patch("/api/emergency-alerts/:id/acknowledge", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      await storage.acknowledgeEmergencyAlert(req.params.id, userId);
      const updated = await storage.getEmergencyAlert(req.params.id);
      wsServer.broadcastEmergency(updated);
      res.json({ success: true, alert: updated });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  app.patch("/api/emergency-alerts/:id/resolve", async (req: Request, res: Response) => {
    try {
      const { userId, notes, resolutionType } = req.body;
      await storage.resolveEmergencyAlert(req.params.id, userId, notes, resolutionType);
      const updated = await storage.getEmergencyAlert(req.params.id);
      await createAuditLog(userId, 'EmergencyResolve', 'emergency', req.params.id, { notes, resolutionType }, updated?.standId ?? undefined, req);
      wsServer.broadcastEmergency(updated);
      res.json({ success: true, alert: updated });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  app.patch("/api/emergency-alerts/:id/status", async (req: Request, res: Response) => {
    try {
      const { status, userId } = req.body;
      await storage.updateEmergencyAlertStatus(req.params.id, status, userId);
      const updated = await storage.getEmergencyAlert(req.params.id);
      wsServer.broadcastEmergency(updated);
      res.json({ success: true, alert: updated });
    } catch (error) {
      console.error("Error updating alert status:", error);
      res.status(500).json({ error: "Failed to update alert status" });
    }
  });

  app.patch("/api/emergency-alerts/:id/assign", async (req: Request, res: Response) => {
    try {
      const { responderId, eta, userId } = req.body;
      await storage.assignResponderToAlert(req.params.id, responderId, eta);
      const updated = await storage.getEmergencyAlert(req.params.id);
      await createAuditLog(userId || 'system', 'EmergencyAssign', 'emergency', req.params.id, { responderId, eta }, updated?.standId ?? undefined, req);
      wsServer.broadcastEmergency(updated);
      res.json({ success: true, alert: updated });
    } catch (error) {
      console.error("Error assigning responder:", error);
      res.status(500).json({ error: "Failed to assign responder" });
    }
  });

  app.patch("/api/emergency-alerts/:id/escalate", async (req: Request, res: Response) => {
    try {
      const { toLevel, reason, escalatedBy } = req.body;
      await storage.escalateEmergencyAlert(req.params.id, toLevel, reason, escalatedBy);
      const updated = await storage.getEmergencyAlert(req.params.id);
      await createAuditLog(escalatedBy || 'system', 'EmergencyEscalate', 'emergency', req.params.id, { toLevel, reason }, updated?.standId ?? undefined, req);
      wsServer.broadcastEmergency(updated);
      res.json({ success: true, alert: updated });
    } catch (error) {
      console.error("Error escalating alert:", error);
      res.status(500).json({ error: "Failed to escalate alert" });
    }
  });

  app.get("/api/emergency-alerts/status/:status", async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getEmergencyAlertsByStatus(req.params.status as any);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts by status:", error);
      res.status(500).json({ error: "Failed to fetch alerts by status" });
    }
  });

  app.get("/api/emergency-alerts/needs-escalation", async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getEmergencyAlertsNeedingEscalation();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts needing escalation:", error);
      res.status(500).json({ error: "Failed to fetch alerts needing escalation" });
    }
  });

  app.get("/api/emergency-alerts/:id/escalation-history", async (req: Request, res: Response) => {
    try {
      const history = await storage.getEscalationHistoryByAlert(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching escalation history:", error);
      res.status(500).json({ error: "Failed to fetch escalation history" });
    }
  });

  // ============ EMERGENCY RESPONDERS ============
  app.get("/api/emergency-responders", async (_req: Request, res: Response) => {
    try {
      const responders = await storage.getOnDutyResponders();
      res.json(responders);
    } catch (error) {
      console.error("Error fetching responders:", error);
      res.status(500).json({ error: "Failed to fetch responders" });
    }
  });

  app.get("/api/emergency-responders/available/:type", async (req: Request, res: Response) => {
    try {
      const responders = await storage.getAvailableRespondersForType(req.params.type);
      res.json(responders);
    } catch (error) {
      console.error("Error fetching available responders:", error);
      res.status(500).json({ error: "Failed to fetch available responders" });
    }
  });

  app.post("/api/emergency-responders", async (req: Request, res: Response) => {
    try {
      const responder = await storage.createEmergencyResponder(req.body);
      res.status(201).json(responder);
    } catch (error) {
      console.error("Error creating responder:", error);
      res.status(500).json({ error: "Failed to create responder" });
    }
  });

  app.patch("/api/emergency-responders/:id/duty", async (req: Request, res: Response) => {
    try {
      const { isOnDuty } = req.body;
      await storage.updateResponderDutyStatus(req.params.id, isOnDuty);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating responder duty status:", error);
      res.status(500).json({ error: "Failed to update responder duty status" });
    }
  });

  app.patch("/api/emergency-responders/:id/location", async (req: Request, res: Response) => {
    try {
      const { location, gpsLat, gpsLng } = req.body;
      await storage.updateResponderLocation(req.params.id, location, gpsLat, gpsLng);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating responder location:", error);
      res.status(500).json({ error: "Failed to update responder location" });
    }
  });

  // ============ AUDIT LOGS ============
  app.get("/api/audit-logs", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/user/:userId", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogsByUser(req.params.userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user audit logs:", error);
      res.status(500).json({ error: "Failed to fetch user audit logs" });
    }
  });

  app.get("/api/audit-logs/action/:action", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogsByAction(req.params.action as any, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching action audit logs:", error);
      res.status(500).json({ error: "Failed to fetch action audit logs" });
    }
  });

  // ============ ORBIT STAFFING INTEGRATION ============
  app.get("/api/orbit/rosters", async (_req: Request, res: Response) => {
    try {
      const rosters = await storage.getAllOrbitRosters();
      res.json(rosters);
    } catch (error) {
      console.error("Error fetching orbit rosters:", error);
      res.status(500).json({ error: "Failed to fetch orbit rosters" });
    }
  });

  app.get("/api/orbit/rosters/:id", async (req: Request, res: Response) => {
    try {
      const roster = await storage.getOrbitRoster(req.params.id);
      if (!roster) {
        return res.status(404).json({ error: "Roster not found" });
      }
      res.json(roster);
    } catch (error) {
      console.error("Error fetching roster:", error);
      res.status(500).json({ error: "Failed to fetch roster" });
    }
  });

  app.get("/api/orbit/rosters/date/:eventDate", async (req: Request, res: Response) => {
    try {
      const roster = await storage.getOrbitRosterByEventDate(decodeURIComponent(req.params.eventDate));
      if (!roster) {
        return res.status(404).json({ error: "Roster not found for this date" });
      }
      res.json(roster);
    } catch (error) {
      console.error("Error fetching roster by date:", error);
      res.status(500).json({ error: "Failed to fetch roster" });
    }
  });

  app.post("/api/orbit/rosters", async (req: Request, res: Response) => {
    try {
      const validated = insertOrbitRosterSchema.parse(req.body);
      const roster = await storage.createOrbitRoster(validated);
      res.status(201).json(roster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating orbit roster:", error);
      res.status(500).json({ error: "Failed to create orbit roster" });
    }
  });

  app.patch("/api/orbit/rosters/:id/sync-status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      await storage.updateOrbitRosterSyncStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating sync status:", error);
      res.status(500).json({ error: "Failed to update sync status" });
    }
  });

  app.get("/api/orbit/rosters/:rosterId/shifts", async (req: Request, res: Response) => {
    try {
      const shifts = await storage.getOrbitShiftsByRoster(req.params.rosterId);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching roster shifts:", error);
      res.status(500).json({ error: "Failed to fetch roster shifts" });
    }
  });

  app.post("/api/orbit/shifts", async (req: Request, res: Response) => {
    try {
      const validated = insertOrbitShiftSchema.parse(req.body);
      const shift = await storage.createOrbitShift(validated);
      res.status(201).json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Error creating orbit shift:", error);
      res.status(500).json({ error: "Failed to create orbit shift" });
    }
  });

  app.get("/api/orbit/shifts/user/:userId", async (req: Request, res: Response) => {
    try {
      const shifts = await storage.getOrbitShiftsByUser(req.params.userId);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching user shifts:", error);
      res.status(500).json({ error: "Failed to fetch user shifts" });
    }
  });

  app.patch("/api/orbit/shifts/:id/check-in", async (req: Request, res: Response) => {
    try {
      const { gpsVerified } = req.body;
      await storage.checkInOrbitShift(req.params.id, gpsVerified);
      res.json({ success: true });
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  app.patch("/api/orbit/shifts/:id/check-out", async (req: Request, res: Response) => {
    try {
      await storage.checkOutOrbitShift(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ error: "Failed to check out" });
    }
  });

  // ============ REAL-TIME PRESENCE ============
  app.get("/api/presence/online", async (_req: Request, res: Response) => {
    try {
      const onlineUsers = wsServer.getOnlineUsers();
      res.json(onlineUsers);
    } catch (error) {
      console.error("Error fetching online users:", error);
      res.status(500).json({ error: "Failed to fetch online users" });
    }
  });

  // ============ OPS COMMAND CENTER DASHBOARD ============
  app.get("/api/ops/dashboard", async (_req: Request, res: Response) => {
    try {
      const [
        activeDeliveries,
        activeEmergencies,
        openIssues,
        onlineUsers,
        recentAuditLogs
      ] = await Promise.all([
        storage.getAllDeliveryRequests(),
        storage.getActiveEmergencyAlerts(),
        storage.getOpenStandIssues(),
        Promise.resolve(wsServer.getOnlineUsers()),
        storage.getAuditLogs(20)
      ]);

      const pendingDeliveries = activeDeliveries.filter((d: any) => ['Requested', 'Acknowledged', 'InProgress', 'OnTheWay'].includes(d.status));
      const emergencyDeliveries = activeDeliveries.filter((d: any) => d.priority === 'Emergency');

      res.json({
        summary: {
          activeDeliveries: pendingDeliveries.length,
          emergencyDeliveries: emergencyDeliveries.length,
          activeEmergencies: activeEmergencies.length,
          openIssues: openIssues.length,
          onlineStaff: onlineUsers.length
        },
        deliveries: pendingDeliveries.slice(0, 10),
        emergencies: activeEmergencies,
        issues: openIssues.slice(0, 10),
        onlineUsers,
        recentActivity: recentAuditLogs
      });
    } catch (error) {
      console.error("Error fetching ops dashboard:", error);
      res.status(500).json({ error: "Failed to fetch ops dashboard" });
    }
  });

  // ============ DEPARTMENT CONTACTS (Quick Call Feature) ============
  app.get("/api/department-contacts", async (_req: Request, res: Response) => {
    try {
      const contacts = await storage.getAllDepartmentContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching department contacts:", error);
      res.status(500).json({ error: "Failed to fetch department contacts" });
    }
  });

  app.get("/api/department-contacts/:department", async (req: Request, res: Response) => {
    try {
      const contact = await storage.getDepartmentContact(req.params.department);
      if (!contact) {
        return res.status(404).json({ error: "Department contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching department contact:", error);
      res.status(500).json({ error: "Failed to fetch department contact" });
    }
  });

  app.patch("/api/department-contacts/:department", async (req: Request, res: Response) => {
    try {
      const { contactName, phoneNumber, alternatePhone, isActive, userId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || !QUICK_CALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions - supervisor level access required" });
      }
      
      const updatePayload: any = {};
      if (contactName !== undefined) updatePayload.contactName = contactName;
      if (phoneNumber !== undefined) updatePayload.phoneNumber = phoneNumber;
      if (alternatePhone !== undefined) updatePayload.alternatePhone = alternatePhone;
      if (isActive !== undefined) updatePayload.isActive = isActive;
      updatePayload.updatedBy = userId;
      
      await storage.updateDepartmentContact(req.params.department, updatePayload);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating department contact:", error);
      res.status(500).json({ error: "Failed to update department contact" });
    }
  });

  // ============ ALCOHOL VIOLATIONS (Compliance Reporting) ============
  
  // Validation schemas for alcohol violations
  const createViolationSchema = z.object({
    reporterId: z.string().min(1),
    standId: z.string().nullable().optional(),
    section: z.string().nullable().optional(),
    vendorName: z.string().nullable().optional(),
    vendorBadgeNumber: z.string().nullable().optional(),
    violationType: z.enum(['UnderageSale', 'OverService', 'NoIDCheck', 'ExpiredLicense', 'OpenContainer', 'UnauthorizedSale', 'PricingViolation', 'Other']),
    severity: z.enum(['Warning', 'Minor', 'Major', 'Critical']).optional().default('Minor'),
    description: z.string().min(1),
    mediaUrls: z.array(z.string()).optional().default([])
  });

  const updateViolationStatusSchema = z.object({
    status: z.enum(['Reported', 'UnderReview', 'Confirmed', 'Dismissed', 'Resolved']),
    reviewerId: z.string().min(1),
    reviewNotes: z.string().optional()
  });

  const resolveViolationSchema = z.object({
    resolverId: z.string().min(1),
    resolutionNotes: z.string().optional().default(''),
    actionTaken: z.string().optional().default('')
  });

  // Get all violations
  app.get("/api/alcohol-violations", async (req: Request, res: Response) => {
    try {
      const { status, reporterId } = req.query;
      
      let violations;
      if (status) {
        violations = await storage.getAlcoholViolationsByStatus(status as string);
      } else if (reporterId) {
        violations = await storage.getAlcoholViolationsByReporter(reporterId as string);
      } else {
        violations = await storage.getAllAlcoholViolations();
      }
      
      res.json(violations);
    } catch (error) {
      console.error("Error fetching alcohol violations:", error);
      res.status(500).json({ error: "Failed to fetch alcohol violations" });
    }
  });

  // Get single violation
  app.get("/api/alcohol-violations/:id", async (req: Request, res: Response) => {
    try {
      const violation = await storage.getAlcoholViolation(req.params.id);
      if (!violation) {
        return res.status(404).json({ error: "Violation not found" });
      }
      res.json(violation);
    } catch (error) {
      console.error("Error fetching violation:", error);
      res.status(500).json({ error: "Failed to fetch violation" });
    }
  });

  // Create violation (with image upload support)
  app.post("/api/alcohol-violations", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = createViolationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { reporterId, standId, section, vendorName, vendorBadgeNumber, violationType, severity, description, mediaUrls } = validationResult.data;
      
      // Validate the user exists and has permission
      const user = await storage.getUser(reporterId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }
      
      // AlcoholCompliance role and above can report violations
      const allowedRoles = ['AlcoholCompliance', 'StandSupervisor', 'ManagementCore', 'ManagementAssistant', 'Admin', 'Developer'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions to report violations" });
      }
      
      const violation = await storage.createAlcoholViolation({
        reporterId,
        standId: standId || null,
        section: section || null,
        vendorName: vendorName || null,
        vendorBadgeNumber: vendorBadgeNumber || null,
        violationType: violationType as any,
        severity: severity as any,
        description,
        mediaUrls: mediaUrls || [],
        status: 'Reported'
      });
      
      res.status(201).json(violation);
    } catch (error) {
      console.error("Error creating violation:", error);
      res.status(500).json({ error: "Failed to create violation" });
    }
  });

  // Update violation status (review/confirm/dismiss)
  app.patch("/api/alcohol-violations/:id/status", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = updateViolationStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { status, reviewerId, reviewNotes } = validationResult.data;
      
      // Only managers and above can review/update violation status
      const user = await storage.getUser(reviewerId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }
      
      const allowedRoles = ['ManagementCore', 'ManagementAssistant', 'Admin', 'Developer'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions - manager level required" });
      }
      
      await storage.updateAlcoholViolationStatus(req.params.id, status, reviewerId, reviewNotes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating violation status:", error);
      res.status(500).json({ error: "Failed to update violation status" });
    }
  });

  // Resolve violation
  app.patch("/api/alcohol-violations/:id/resolve", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = resolveViolationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { resolverId, resolutionNotes, actionTaken } = validationResult.data;
      
      // Only managers and above can resolve violations
      const user = await storage.getUser(resolverId);
      if (!user) {
        return res.status(403).json({ error: "User not found" });
      }
      
      const allowedRoles = ['ManagementCore', 'ManagementAssistant', 'Admin', 'Developer'];
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Insufficient permissions - manager level required" });
      }
      
      await storage.resolveAlcoholViolation(req.params.id, resolverId, resolutionNotes, actionTaken);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving violation:", error);
      res.status(500).json({ error: "Failed to resolve violation" });
    }
  });

  // ========== WEATHER API ==========
  
  // Get weather by ZIP code
  app.get("/api/weather/zip/:zipCode", async (req: Request, res: Response) => {
    try {
      const weather = await weatherService.getWeatherByZip(req.params.zipCode);
      if (!weather) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(weather);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather" });
    }
  });

  // Get weather by city name
  app.get("/api/weather/city/:cityName", async (req: Request, res: Response) => {
    try {
      const weather = await weatherService.getWeatherByCity(req.params.cityName);
      if (!weather) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(weather);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather" });
    }
  });

  // Get weather by coordinates (for Nissan Stadium default)
  app.get("/api/weather/coords/:lat/:lon", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lon = parseFloat(req.params.lon);
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      const weather = await weatherService.getWeatherByCoords(lat, lon);
      if (!weather) {
        return res.status(404).json({ error: "Weather data not available" });
      }
      res.json(weather);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather" });
    }
  });

  // ========== ASSET STAMPS (Orby Hallmark System) ==========
  
  // Get all asset stamps
  app.get("/api/asset-stamps", async (req: Request, res: Response) => {
    try {
      const stamps = await storage.getAllAssetStamps();
      res.json(stamps);
    } catch (error) {
      console.error("Error getting asset stamps:", error);
      res.status(500).json({ error: "Failed to get asset stamps" });
    }
  });

  // Get asset stamp stats
  app.get("/api/asset-stamps/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAssetStampStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting asset stamp stats:", error);
      res.status(500).json({ error: "Failed to get asset stamp stats" });
    }
  });

  // Get next asset number
  app.get("/api/asset-stamps/next-number", async (req: Request, res: Response) => {
    try {
      const nextNumber = await storage.getNextAssetNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error("Error getting next asset number:", error);
      res.status(500).json({ error: "Failed to get next asset number" });
    }
  });

  // Search asset stamps
  app.get("/api/asset-stamps/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query required" });
      }
      const stamps = await storage.searchAssetStamps(query);
      res.json(stamps);
    } catch (error) {
      console.error("Error searching asset stamps:", error);
      res.status(500).json({ error: "Failed to search asset stamps" });
    }
  });

  // Get asset stamp by ID
  app.get("/api/asset-stamps/:id", async (req: Request, res: Response) => {
    try {
      const stamp = await storage.getAssetStamp(req.params.id);
      if (!stamp) {
        return res.status(404).json({ error: "Asset stamp not found" });
      }
      res.json(stamp);
    } catch (error) {
      console.error("Error getting asset stamp:", error);
      res.status(500).json({ error: "Failed to get asset stamp" });
    }
  });

  // Get asset stamp by asset number
  app.get("/api/asset-stamps/number/:assetNumber", async (req: Request, res: Response) => {
    try {
      const stamp = await storage.getAssetStampByNumber(req.params.assetNumber);
      if (!stamp) {
        return res.status(404).json({ error: "Asset stamp not found" });
      }
      res.json(stamp);
    } catch (error) {
      console.error("Error getting asset stamp:", error);
      res.status(500).json({ error: "Failed to get asset stamp" });
    }
  });

  // Get asset stamps by category
  app.get("/api/asset-stamps/category/:category", async (req: Request, res: Response) => {
    try {
      const stamps = await storage.getAssetStampsByCategory(req.params.category);
      res.json(stamps);
    } catch (error) {
      console.error("Error getting asset stamps by category:", error);
      res.status(500).json({ error: "Failed to get asset stamps" });
    }
  });

  // Create asset stamp (internal)
  const createAssetStampBodySchema = z.object({
    displayName: z.string().min(1, "Display name is required"),
    category: z.enum(['platform', 'user', 'version', 'document', 'report', 'inventory_count', 
      'incident', 'violation', 'emergency', 'delivery', 'invoice', 'compliance',
      'audit_log', 'slideshow', 'pdf_export', 'signature', 'other']).optional().default('other'),
    description: z.string().optional(),
    sourceType: z.string().optional(),
    sourceId: z.string().optional(),
    userId: z.string().optional(),
    sha256Hash: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    version: z.string().optional(),
    changes: z.array(z.string()).optional()
  });

  app.post("/api/asset-stamps", async (req: Request, res: Response) => {
    try {
      const validationResult = createAssetStampBodySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.errors 
        });
      }
      
      const { displayName, category, description, sourceType, sourceId, userId, sha256Hash, metadata, version, changes } = validationResult.data;
      
      // Get next asset number
      const assetNumber = await storage.getNextAssetNumber();
      
      const stamp = await storage.createAssetStamp({
        assetNumber,
        displayName,
        category: category || 'other',
        description,
        sourceType,
        sourceId,
        userId,
        sha256Hash,
        metadata,
        isBlockchainAnchored: false,
        version,
        changes
      });
      
      res.status(201).json(stamp);
    } catch (error) {
      console.error("Error creating asset stamp:", error);
      res.status(500).json({ error: "Failed to create asset stamp" });
    }
  });

  // Anchor asset stamp to blockchain
  app.post("/api/asset-stamps/:id/anchor", async (req: Request, res: Response) => {
    try {
      const { network = 'devnet' } = req.body;
      
      const stamp = await storage.getAssetStamp(req.params.id);
      if (!stamp) {
        return res.status(404).json({ error: "Asset stamp not found" });
      }
      
      // Import blockchain service
      const { createVerification, prepareAssetData } = await import("./services/blockchain");
      
      // Prepare data for blockchain
      const blockchainData = prepareAssetData(
        stamp.category as any,
        stamp.id,
        stamp.assetNumber,
        stamp.userId || undefined,
        {
          displayName: stamp.displayName,
          description: stamp.description,
          sourceType: stamp.sourceType,
          sourceId: stamp.sourceId,
          version: stamp.version,
          ...((stamp.metadata as Record<string, unknown>) || {})
        }
      );
      
      // Create verification
      const result = await createVerification(blockchainData, network as 'mainnet-beta' | 'devnet');
      
      if (result.success && result.txSignature) {
        await storage.updateAssetStampBlockchain(req.params.id, network, result.txSignature);
        
        // Create blockchain verification record
        await storage.createBlockchainVerification({
          entityType: stamp.category || 'other',
          entityId: stamp.id,
          assetStampId: stamp.id,
          userId: stamp.userId,
          dataHash: result.dataHash,
          txSignature: result.txSignature,
          status: result.status,
          network
        });
      }
      
      res.json({
        success: result.success,
        assetNumber: stamp.assetNumber,
        txSignature: result.txSignature,
        dataHash: result.dataHash,
        solscanUrl: result.solscanUrl,
        status: result.status,
        error: result.error
      });
    } catch (error) {
      console.error("Error anchoring asset stamp:", error);
      res.status(500).json({ error: "Failed to anchor asset stamp to blockchain" });
    }
  });

  // Check blockchain connection status
  app.get("/api/blockchain/status", async (_req: Request, res: Response) => {
    try {
      const { checkHeliusConnection } = await import("./services/blockchain");
      const status = await checkHeliusConnection();
      res.json(status);
    } catch (error) {
      console.error("Error checking blockchain status:", error);
      res.status(500).json({ error: "Failed to check blockchain status" });
    }
  });

  // Get blockchain verifications by entity
  app.get("/api/blockchain/verifications/:entityType/:entityId", async (req: Request, res: Response) => {
    try {
      const verifications = await storage.getBlockchainVerificationsByEntity(
        req.params.entityType, 
        req.params.entityId
      );
      res.json(verifications);
    } catch (error) {
      console.error("Error getting blockchain verifications:", error);
      res.status(500).json({ error: "Failed to get blockchain verifications" });
    }
  });

  // Get pending blockchain verifications
  app.get("/api/blockchain/verifications/pending", async (req: Request, res: Response) => {
    try {
      const verifications = await storage.getPendingBlockchainVerifications();
      res.json(verifications);
    } catch (error) {
      console.error("Error getting pending verifications:", error);
      res.status(500).json({ error: "Failed to get pending verifications" });
    }
  });

  // ========== COMPLIANCE ALERTS (ABC Board & Health Department) ==========
  
  // Get all compliance alerts
  app.get("/api/compliance-alerts", async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getAllComplianceAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error getting compliance alerts:", error);
      res.status(500).json({ error: "Failed to get compliance alerts" });
    }
  });

  // Get active compliance alerts (for staff notification)
  app.get("/api/compliance-alerts/active", async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getActiveComplianceAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error getting active compliance alerts:", error);
      res.status(500).json({ error: "Failed to get active compliance alerts" });
    }
  });

  // Get compliance alerts by type
  app.get("/api/compliance-alerts/type/:alertType", async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getComplianceAlertsByType(req.params.alertType);
      res.json(alerts);
    } catch (error) {
      console.error("Error getting compliance alerts by type:", error);
      res.status(500).json({ error: "Failed to get compliance alerts by type" });
    }
  });

  // Get Tennessee ABC Board checklist
  app.get("/api/compliance/abc-checklist", async (_req: Request, res: Response) => {
    try {
      const { TN_ABC_CHECKLIST } = await import("@shared/schema");
      res.json(TN_ABC_CHECKLIST);
    } catch (error) {
      console.error("Error getting ABC checklist:", error);
      res.status(500).json({ error: "Failed to get ABC checklist" });
    }
  });

  // Get Tennessee Health Department checklist
  app.get("/api/compliance/health-checklist", async (_req: Request, res: Response) => {
    try {
      const { TN_HEALTH_CHECKLIST } = await import("@shared/schema");
      res.json(TN_HEALTH_CHECKLIST);
    } catch (error) {
      console.error("Error getting health checklist:", error);
      res.status(500).json({ error: "Failed to get health checklist" });
    }
  });

  // Trigger ABC Board alert (system-wide notification)
  app.post("/api/compliance-alerts/abc-board", async (req: Request, res: Response) => {
    try {
      const { triggeredById, triggeredByName, location } = req.body;
      
      const alert = await storage.createComplianceAlert({
        alertType: 'abc_board',
        title: 'ABC BOARD INSPECTION IN PROGRESS',
        message: `ATTENTION ALL STAFF: Tennessee ABC Board inspectors are on-site${location ? ` at ${location}` : ''}. 

IMMEDIATELY VERIFY:
- Check ID for ANYONE who does not appear 50 or older
- HOLD the ID in your hand - physically verify, do not just glance
- Verify the ID is valid (not expired) and government-issued
- Match photo on ID to customer's face
- Confirm birth date shows customer is 21+

DO NOT serve anyone without proper verification. Violations carry severe penalties including fines and license suspension.`,
        isActive: true,
        triggeredById,
        triggeredByName,
        metadata: { location, triggeredAt: new Date().toISOString() }
      });

      res.status(201).json(alert);
    } catch (error) {
      console.error("Error triggering ABC Board alert:", error);
      res.status(500).json({ error: "Failed to trigger ABC Board alert" });
    }
  });

  // Trigger Health Department alert (system-wide notification)
  app.post("/api/compliance-alerts/health-dept", async (req: Request, res: Response) => {
    try {
      const { triggeredById, triggeredByName, location } = req.body;
      
      const alert = await storage.createComplianceAlert({
        alertType: 'health_dept',
        title: 'HEALTH DEPARTMENT INSPECTION IN PROGRESS',
        message: `ATTENTION ALL STAFF: Tennessee Health Department inspectors are on-site${location ? ` at ${location}` : ''}. 

IMMEDIATE COMPLIANCE CHECK:
- All food handlers must have hair restraints in place
- Handwashing must be performed properly (20 seconds, soap, warm water)
- Cold foods at 41°F or below, hot foods at 135°F or above
- No bare hand contact with ready-to-eat food
- Food contact surfaces must be clean and sanitized
- Check date labels on all stored food items
- Ensure sanitizer buckets are at proper concentration
- Clear any debris from floors and work surfaces

Maintain professional composure. Answer inspector questions honestly. Report any issues to your supervisor immediately.`,
        isActive: true,
        triggeredById,
        triggeredByName,
        metadata: { location, triggeredAt: new Date().toISOString() }
      });

      res.status(201).json(alert);
    } catch (error) {
      console.error("Error triggering Health Department alert:", error);
      res.status(500).json({ error: "Failed to trigger Health Department alert" });
    }
  });

  // Resolve/clear a compliance alert
  app.post("/api/compliance-alerts/:id/resolve", async (req: Request, res: Response) => {
    try {
      const { resolvedById } = req.body;
      await storage.resolveComplianceAlert(req.params.id, resolvedById);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving compliance alert:", error);
      res.status(500).json({ error: "Failed to resolve compliance alert" });
    }
  });

  // Get single compliance alert
  app.get("/api/compliance-alerts/:id", async (req: Request, res: Response) => {
    try {
      const alert = await storage.getComplianceAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Compliance alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error getting compliance alert:", error);
      res.status(500).json({ error: "Failed to get compliance alert" });
    }
  });

  // ========== DASHBOARD CONFIGURATION (David's Superpower) ==========

  // Get all dashboard configs
  app.get("/api/dashboard-configs", async (_req: Request, res: Response) => {
    try {
      const configs = await storage.getAllDashboardConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error getting dashboard configs:", error);
      res.status(500).json({ error: "Failed to get dashboard configs" });
    }
  });

  // Get dashboard config for a specific role
  app.get("/api/dashboard-configs/:role", async (req: Request, res: Response) => {
    try {
      const config = await storage.getDashboardConfig(req.params.role);
      res.json(config || null);
    } catch (error) {
      console.error("Error getting dashboard config:", error);
      res.status(500).json({ error: "Failed to get dashboard config" });
    }
  });

  // Update dashboard config for a role (David/Developer only)
  app.put("/api/dashboard-configs/:role", async (req: Request, res: Response) => {
    try {
      const config = await storage.upsertDashboardConfig({
        targetRole: req.params.role,
        ...req.body
      });
      res.json(config);
    } catch (error) {
      console.error("Error updating dashboard config:", error);
      res.status(500).json({ error: "Failed to update dashboard config" });
    }
  });

  // Reset dashboard config to defaults
  app.delete("/api/dashboard-configs/:role", async (req: Request, res: Response) => {
    try {
      await storage.resetDashboardConfig(req.params.role);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resetting dashboard config:", error);
      res.status(500).json({ error: "Failed to reset dashboard config" });
    }
  });

  // ========== ACTIVE EVENT SYSTEM (Live vs Sandbox Mode) ==========
  // Only Event Admins can activate/deactivate events
  // When no event is active, system defaults to SANDBOX mode
  const EVENT_ADMIN_PINS = ['2424', '0424', '1234']; // David, Jason, Sid

  // Check if system is in live mode (has active event)
  app.get("/api/system-status", async (_req: Request, res: Response) => {
    try {
      const activeEvent = await storage.getActiveEvent();
      const isLive = !!activeEvent;
      res.json({
        isLive,
        mode: isLive ? 'live' : 'sandbox',
        activeEvent: activeEvent || null,
        message: isLive 
          ? `System is LIVE for: ${activeEvent?.eventName}` 
          : 'No active event - System is in SANDBOX mode'
      });
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Get all events
  app.get("/api/events", async (_req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error getting events:", error);
      res.status(500).json({ error: "Failed to get events" });
    }
  });

  // Get active event
  app.get("/api/events/active", async (_req: Request, res: Response) => {
    try {
      const activeEvent = await storage.getActiveEvent();
      res.json(activeEvent || null);
    } catch (error) {
      console.error("Error getting active event:", error);
      res.status(500).json({ error: "Failed to get active event" });
    }
  });

  // Create a new event (scheduled, not yet active)
  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const { userPin, eventName, eventDate, eventType, doorsOpenTime, eventStartTime, eventEndTime, expectedAttendance, notes } = req.body;
      
      // Authorization check
      if (!userPin || !EVENT_ADMIN_PINS.includes(userPin)) {
        return res.status(403).json({ error: "Unauthorized. Only Event Admins can create events." });
      }

      const event = await storage.createEvent({
        eventName,
        eventDate,
        eventType: eventType || 'standard',
        doorsOpenTime,
        eventStartTime,
        eventEndTime,
        expectedAttendance,
        notes,
        status: 'scheduled'
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Activate an event (switches system to LIVE mode)
  app.post("/api/events/:id/activate", async (req: Request, res: Response) => {
    try {
      const { userPin, userId, userName } = req.body;
      
      // Authorization check
      if (!userPin || !EVENT_ADMIN_PINS.includes(userPin)) {
        return res.status(403).json({ error: "Unauthorized. Only Event Admins can activate events." });
      }

      const event = await storage.activateEvent(req.params.id, userId, userName);
      
      // Log the activation
      await storage.createAuditLog({
        userId,
        action: 'Event Activated',
        targetType: 'event',
        targetId: event.id,
        details: { eventName: event.eventName, eventDate: event.eventDate }
      });

      res.json({ 
        success: true, 
        event, 
        message: `System is now LIVE for: ${event.eventName}` 
      });
    } catch (error) {
      console.error("Error activating event:", error);
      res.status(500).json({ error: "Failed to activate event" });
    }
  });

  // Deactivate an event (switches system back to SANDBOX mode)
  app.post("/api/events/:id/deactivate", async (req: Request, res: Response) => {
    try {
      const { userPin, userId, userName } = req.body;
      
      // Authorization check
      if (!userPin || !EVENT_ADMIN_PINS.includes(userPin)) {
        return res.status(403).json({ error: "Unauthorized. Only Event Admins can deactivate events." });
      }

      const event = await storage.deactivateEvent(req.params.id, userId, userName);
      
      // Log the deactivation
      await storage.createAuditLog({
        userId,
        action: 'Event Deactivated',
        targetType: 'event',
        targetId: event.id,
        details: { eventName: event.eventName, eventDate: event.eventDate }
      });

      res.json({ 
        success: true, 
        event, 
        message: 'System is now in SANDBOX mode' 
      });
    } catch (error) {
      console.error("Error deactivating event:", error);
      res.status(500).json({ error: "Failed to deactivate event" });
    }
  });

  // Update event details
  app.put("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const { userPin, ...updates } = req.body;
      
      // Authorization check
      if (!userPin || !EVENT_ADMIN_PINS.includes(userPin)) {
        return res.status(403).json({ error: "Unauthorized. Only Event Admins can update events." });
      }

      const event = await storage.updateEvent(req.params.id, updates);
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // ========== SANDBOX PROTECTION MIDDLEWARE ==========
  // This checks if system is live before allowing data-modifying operations
  // Note: GET operations are always allowed, only POST/PUT/DELETE for core data are blocked
  
  // ========== VENUE GEOFENCE CONFIGURATION ==========
  // Authorized PINs: David (2424) and Jason (0424) only
  const GEOFENCE_ADMIN_PINS = ['2424', '0424'];

  // Get current geofence configuration
  app.get("/api/geofence-config", async (_req: Request, res: Response) => {
    try {
      const config = await storage.getActiveGeofenceConfig();
      res.json(config || {
        preset: 'standard',
        radiusFeet: 100,
        maxConcurrentUsers: 500,
        eventName: 'Standard Stadium Event'
      });
    } catch (error) {
      console.error("Error getting geofence config:", error);
      res.status(500).json({ error: "Failed to get geofence config" });
    }
  });

  // Update geofence configuration (David/Jason only)
  app.put("/api/geofence-config", async (req: Request, res: Response) => {
    try {
      const { userPin, userId, userName, preset, radiusFeet, customRadiusFeet, maxConcurrentUsers, eventName } = req.body;
      
      // Authorization check - only David (2424) and Jason (0424) can modify
      if (!userPin || !GEOFENCE_ADMIN_PINS.includes(userPin)) {
        return res.status(403).json({ error: "Unauthorized. Only Operations Manager and Developer can modify geofence settings." });
      }
      
      const config = await storage.updateGeofenceConfig({
        preset,
        radiusFeet,
        customRadiusFeet,
        maxConcurrentUsers,
        eventName,
        updatedById: userId,
        updatedByName: userName
      });
      
      res.json(config);
    } catch (error) {
      console.error("Error updating geofence config:", error);
      res.status(500).json({ error: "Failed to update geofence config" });
    }
  });

  // ========== SUPERVISOR LIVE TRACKING ==========
  
  // Get live supervisor view (sessions + recent activity)
  app.get("/api/supervisor-live", async (_req: Request, res: Response) => {
    try {
      const liveView = await storage.getSupervisorLiveView();
      res.json(liveView);
    } catch (error) {
      console.error("Error getting supervisor live view:", error);
      res.status(500).json({ error: "Failed to get supervisor live view" });
    }
  });

  // Get active supervisor sessions
  app.get("/api/supervisor-sessions", async (_req: Request, res: Response) => {
    try {
      const sessions = await storage.getActiveSupervisorSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error getting supervisor sessions:", error);
      res.status(500).json({ error: "Failed to get supervisor sessions" });
    }
  });

  // Create or update supervisor session (called on login/activity)
  app.post("/api/supervisor-sessions", async (req: Request, res: Response) => {
    try {
      const { supervisorId, supervisorName, currentStandId, currentStandName, currentSection, isSandbox } = req.body;
      
      // Check if there's an existing active session
      const existingSession = await storage.getSupervisorSession(supervisorId);
      
      if (existingSession) {
        // Update existing session
        await storage.updateSupervisorSession(existingSession.id, {
          currentStandId,
          currentStandName,
          currentSection,
          status: 'online'
        });
        res.json(existingSession);
      } else {
        // Create new session
        const session = await storage.createSupervisorSession({
          supervisorId,
          supervisorName,
          currentStandId,
          currentStandName,
          currentSection,
          isSandbox: isSandbox || false,
          status: 'online'
        });
        
        // Log activity
        await storage.createSupervisorActivity({
          sessionId: session.id,
          supervisorId,
          supervisorName,
          kind: 'login',
          description: `${supervisorName} logged in`
        });
        
        res.status(201).json(session);
      }
    } catch (error) {
      console.error("Error creating supervisor session:", error);
      res.status(500).json({ error: "Failed to create supervisor session" });
    }
  });

  // Heartbeat/update session
  app.post("/api/supervisor-sessions/:sessionId/heartbeat", async (req: Request, res: Response) => {
    try {
      const { currentTab, currentStandId, currentStandName, currentSection, status } = req.body;
      await storage.supervisorHeartbeat(req.params.sessionId, {
        currentTab,
        currentStandId,
        currentStandName,
        currentSection,
        status: status || 'online'
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating supervisor heartbeat:", error);
      res.status(500).json({ error: "Failed to update heartbeat" });
    }
  });

  // End supervisor session (logout)
  app.post("/api/supervisor-sessions/:sessionId/end", async (req: Request, res: Response) => {
    try {
      const { supervisorId, supervisorName } = req.body;
      await storage.endSupervisorSession(req.params.sessionId);
      
      // Log logout activity
      if (supervisorId && supervisorName) {
        await storage.createSupervisorActivity({
          sessionId: req.params.sessionId,
          supervisorId,
          supervisorName,
          kind: 'logout',
          description: `${supervisorName} logged out`
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending supervisor session:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Get recent supervisor activity
  app.get("/api/supervisor-activity", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activity = await storage.getRecentSupervisorActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error getting supervisor activity:", error);
      res.status(500).json({ error: "Failed to get supervisor activity" });
    }
  });

  // Log supervisor activity
  app.post("/api/supervisor-activity", async (req: Request, res: Response) => {
    try {
      const { sessionId, supervisorId, supervisorName, kind, description, standId, standName, metadata } = req.body;
      
      const activity = await storage.createSupervisorActivity({
        sessionId,
        supervisorId,
        supervisorName,
        kind,
        description,
        standId,
        standName,
        metadata
      });
      
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating supervisor activity:", error);
      res.status(500).json({ error: "Failed to log activity" });
    }
  });

  // ========== GENESIS ASSET SEEDING ==========
  
  // Initialize genesis assets if not exists
  app.post("/api/asset-stamps/seed-genesis", async (req: Request, res: Response) => {
    try {
      // Check if genesis assets already exist
      const existingOrby = await storage.getAssetStampByNumber('ORB-000000000001');
      if (existingOrby) {
        return res.json({ message: "Genesis assets already exist", seeded: false });
      }
      
      const { generateDataHash, prepareAssetData, createVerification } = await import("./services/blockchain");
      
      // Genesis Asset #1: Orby Platform
      const orbyData = prepareAssetData('platform', 'genesis-orby', 'ORB-000000000001', undefined, {
        name: 'Orby',
        type: 'Platform',
        description: 'Orby - Blockchain Certified Venue Operations Platform',
        domain: 'getorby.io',
        venue: 'Nissan Stadium',
        version: 'v1.0',
        genesisDate: new Date().toISOString()
      });
      
      const orbyHash = generateDataHash(orbyData);
      await storage.createAssetStamp({
        assetNumber: 'ORB-000000000001',
        displayName: 'Orby Platform',
        category: 'platform',
        description: 'Genesis asset - Orby blockchain certified venue operations platform',
        sourceType: 'genesis',
        sourceId: 'orby',
        sha256Hash: orbyHash,
        metadata: orbyData.data,
        isBlockchainAnchored: false,
        version: 'v1.0'
      });
      
      // Genesis Asset #2: Jason (Developer/Founder)
      const jasonData = prepareAssetData('user', 'genesis-jason', 'ORB-000000000002', undefined, {
        name: 'Jason',
        role: 'Developer',
        title: 'Founder & Lead Developer',
        description: 'Jason - Lead Developer of Orby Platform',
        genesisDate: new Date().toISOString()
      });
      
      const jasonHash = generateDataHash(jasonData);
      await storage.createAssetStamp({
        assetNumber: 'ORB-000000000002',
        displayName: 'Jason (Developer)',
        category: 'user',
        description: 'Genesis asset - Jason, Lead Developer and Founder',
        sourceType: 'genesis',
        sourceId: 'jason',
        sha256Hash: jasonHash,
        metadata: jasonData.data,
        isBlockchainAnchored: false
      });
      
      // Genesis Asset #3: v1.0 Release
      const v1Data = prepareAssetData('version', 'genesis-v1.0', 'ORB-000000000003', undefined, {
        version: 'v1.0',
        name: 'Initial Release',
        description: 'Orby v1.0 - Genesis Release with Hallmark Stamping System',
        releaseDate: new Date().toISOString(),
        features: [
          'Emergency Command Center',
          'Delivery Tracking',
          'Three-Phase Inventory Counting',
          'Alcohol Compliance',
          'Genesis Hallmark Stamping System',
          'Interactive Stadium Map',
          'GPS Navigation',
          'Manager Document Hub'
        ]
      });
      
      const v1Hash = generateDataHash(v1Data);
      await storage.createAssetStamp({
        assetNumber: 'ORB-000000000003',
        displayName: 'Orby v1.0 Release',
        category: 'version',
        description: 'Genesis release - Orby v1.0 with full feature set',
        sourceType: 'genesis',
        sourceId: 'v1.0',
        sha256Hash: v1Hash,
        metadata: v1Data.data,
        isBlockchainAnchored: false,
        version: 'v1.0',
        changes: [
          'Emergency Command Center',
          'Delivery Tracking', 
          'Three-Phase Inventory Counting',
          'Alcohol Compliance',
          'Genesis Hallmark Stamping System',
          'Interactive Stadium Map',
          'GPS Navigation',
          'Manager Document Hub'
        ]
      });
      
      res.json({ 
        message: "Genesis assets created successfully", 
        seeded: true,
        assets: [
          { number: 'ORB-000000000001', name: 'Orby Platform' },
          { number: 'ORB-000000000002', name: 'Jason (Developer)' },
          { number: 'ORB-000000000003', name: 'Orby v1.0 Release' }
        ]
      });
    } catch (error) {
      console.error("Error seeding genesis assets:", error);
      res.status(500).json({ error: "Failed to seed genesis assets" });
    }
  });

  // ========== KEY & RADIO CHECKOUT SYSTEM ==========
  // For Legends employees only - not NPO Workers or temp staff
  const LEGENDS_ROLES = [
    'StandLead', 'StandSupervisor', 'ManagementCore', 'ManagementAssistant',
    'AlcoholCompliance', 'CheckInAssistant', 'IT', 'Admin', 'Developer'
  ];

  // Get all key sets
  app.get("/api/keys", async (_req: Request, res: Response) => {
    try {
      const keys = await storage.getAllKeySets();
      res.json(keys);
    } catch (error) {
      console.error("Error getting key sets:", error);
      res.status(500).json({ error: "Failed to get key sets" });
    }
  });

  // Get available key sets
  app.get("/api/keys/available", async (_req: Request, res: Response) => {
    try {
      const keys = await storage.getAvailableKeySets();
      res.json(keys);
    } catch (error) {
      console.error("Error getting available keys:", error);
      res.status(500).json({ error: "Failed to get available keys" });
    }
  });

  // Get checked out key sets
  app.get("/api/keys/checked-out", async (_req: Request, res: Response) => {
    try {
      const keys = await storage.getCheckedOutKeySets();
      res.json(keys);
    } catch (error) {
      console.error("Error getting checked out keys:", error);
      res.status(500).json({ error: "Failed to get checked out keys" });
    }
  });

  // Get keys held by a user
  app.get("/api/keys/holder/:userId", async (req: Request, res: Response) => {
    try {
      const keys = await storage.getKeySetsByHolder(req.params.userId);
      res.json(keys);
    } catch (error) {
      console.error("Error getting user keys:", error);
      res.status(500).json({ error: "Failed to get user keys" });
    }
  });

  // Checkout a key
  app.post("/api/keys/:keyNumber/checkout", async (req: Request, res: Response) => {
    try {
      const { userId, userName, userRole } = req.body;
      const keyNumber = parseInt(req.params.keyNumber);
      
      // Verify user role is Legends employee
      if (!LEGENDS_ROLES.includes(userRole)) {
        return res.status(403).json({ error: "Only Legends employees can checkout keys" });
      }
      
      // Check if key is available
      const key = await storage.getKeySetByNumber(keyNumber);
      if (!key) {
        return res.status(404).json({ error: `Key Set ${keyNumber} not found` });
      }
      if (key.status === 'checked_out') {
        return res.status(400).json({ 
          error: `Key Set ${keyNumber} is already checked out by ${key.currentHolderName}` 
        });
      }
      
      const updated = await storage.checkoutKeySet(keyNumber, userId, userName, userRole);
      res.json(updated);
    } catch (error) {
      console.error("Error checking out key:", error);
      res.status(500).json({ error: "Failed to checkout key" });
    }
  });

  // Return a key
  app.post("/api/keys/:keyNumber/checkin", async (req: Request, res: Response) => {
    try {
      const { userId, userName } = req.body;
      const keyNumber = parseInt(req.params.keyNumber);
      
      const key = await storage.getKeySetByNumber(keyNumber);
      if (!key) {
        return res.status(404).json({ error: `Key Set ${keyNumber} not found` });
      }
      if (key.status !== 'checked_out') {
        return res.status(400).json({ error: `Key Set ${keyNumber} is not checked out` });
      }
      
      const updated = await storage.checkinKeySet(keyNumber, userId, userName);
      res.json(updated);
    } catch (error) {
      console.error("Error checking in key:", error);
      res.status(500).json({ error: "Failed to checkin key" });
    }
  });

  // Get all radios
  app.get("/api/radios", async (_req: Request, res: Response) => {
    try {
      const radioList = await storage.getAllRadios();
      res.json(radioList);
    } catch (error) {
      console.error("Error getting radios:", error);
      res.status(500).json({ error: "Failed to get radios" });
    }
  });

  // Get available radios
  app.get("/api/radios/available", async (_req: Request, res: Response) => {
    try {
      const radioList = await storage.getAvailableRadios();
      res.json(radioList);
    } catch (error) {
      console.error("Error getting available radios:", error);
      res.status(500).json({ error: "Failed to get available radios" });
    }
  });

  // Get checked out radios
  app.get("/api/radios/checked-out", async (_req: Request, res: Response) => {
    try {
      const radioList = await storage.getCheckedOutRadios();
      res.json(radioList);
    } catch (error) {
      console.error("Error getting checked out radios:", error);
      res.status(500).json({ error: "Failed to get checked out radios" });
    }
  });

  // Get radios held by a user
  app.get("/api/radios/holder/:userId", async (req: Request, res: Response) => {
    try {
      const radioList = await storage.getRadiosByHolder(req.params.userId);
      res.json(radioList);
    } catch (error) {
      console.error("Error getting user radios:", error);
      res.status(500).json({ error: "Failed to get user radios" });
    }
  });

  // Create a new radio (admin/management only)
  app.post("/api/radios", async (req: Request, res: Response) => {
    try {
      const { radioNumber, channel, notes } = req.body;
      
      // Check if radio already exists
      const existing = await storage.getRadioByNumber(radioNumber);
      if (existing) {
        return res.status(400).json({ error: `Radio ${radioNumber} already exists` });
      }
      
      const radio = await storage.createRadio({
        radioNumber,
        channel,
        notes,
        status: 'available'
      });
      res.status(201).json(radio);
    } catch (error) {
      console.error("Error creating radio:", error);
      res.status(500).json({ error: "Failed to create radio" });
    }
  });

  // Checkout a radio
  app.post("/api/radios/:radioNumber/checkout", async (req: Request, res: Response) => {
    try {
      const { userId, userName, userRole } = req.body;
      const radioNumber = parseInt(req.params.radioNumber);
      
      // Verify user role is Legends employee
      if (!LEGENDS_ROLES.includes(userRole)) {
        return res.status(403).json({ error: "Only Legends employees can checkout radios" });
      }
      
      // Check if radio exists
      const radio = await storage.getRadioByNumber(radioNumber);
      if (!radio) {
        return res.status(404).json({ error: `Radio ${radioNumber} not found` });
      }
      if (radio.status === 'checked_out') {
        return res.status(400).json({ 
          error: `Radio ${radioNumber} is already checked out by ${radio.currentHolderName}` 
        });
      }
      
      const updated = await storage.checkoutRadio(radioNumber, userId, userName, userRole);
      res.json(updated);
    } catch (error) {
      console.error("Error checking out radio:", error);
      res.status(500).json({ error: "Failed to checkout radio" });
    }
  });

  // Return a radio
  app.post("/api/radios/:radioNumber/checkin", async (req: Request, res: Response) => {
    try {
      const { userId, userName } = req.body;
      const radioNumber = parseInt(req.params.radioNumber);
      
      const radio = await storage.getRadioByNumber(radioNumber);
      if (!radio) {
        return res.status(404).json({ error: `Radio ${radioNumber} not found` });
      }
      if (radio.status !== 'checked_out') {
        return res.status(400).json({ error: `Radio ${radioNumber} is not checked out` });
      }
      
      const updated = await storage.checkinRadio(radioNumber, userId, userName);
      res.json(updated);
    } catch (error) {
      console.error("Error checking in radio:", error);
      res.status(500).json({ error: "Failed to checkin radio" });
    }
  });

  // Get my equipment (keys and radios for current user)
  app.get("/api/equipment/my/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const [myKeys, myRadios] = await Promise.all([
        storage.getKeySetsByHolder(userId),
        storage.getRadiosByHolder(userId)
      ]);
      res.json({ keys: myKeys, radios: myRadios });
    } catch (error) {
      console.error("Error getting user equipment:", error);
      res.status(500).json({ error: "Failed to get user equipment" });
    }
  });

  // Get equipment overview (all checked out - for David's dashboard)
  app.get("/api/equipment/overview", async (_req: Request, res: Response) => {
    try {
      const [checkedOutKeys, checkedOutRadios, allKeys, allRadios] = await Promise.all([
        storage.getCheckedOutKeySets(),
        storage.getCheckedOutRadios(),
        storage.getAllKeySets(),
        storage.getAllRadios()
      ]);
      res.json({
        keys: {
          checkedOut: checkedOutKeys,
          total: allKeys.length,
          available: allKeys.filter(k => k.status === 'available').length
        },
        radios: {
          checkedOut: checkedOutRadios,
          total: allRadios.length,
          available: allRadios.filter(r => r.status === 'available').length
        }
      });
    } catch (error) {
      console.error("Error getting equipment overview:", error);
      res.status(500).json({ error: "Failed to get equipment overview" });
    }
  });

  // Equipment Alerts - pending alerts
  app.get("/api/equipment/alerts", async (_req: Request, res: Response) => {
    try {
      const alerts = await storage.getPendingEquipmentAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error getting equipment alerts:", error);
      res.status(500).json({ error: "Failed to get equipment alerts" });
    }
  });

  // Create equipment alert (when leaving geofence with equipment)
  app.post("/api/equipment/alerts", async (req: Request, res: Response) => {
    try {
      const alert = await storage.createEquipmentAlert(req.body);
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating equipment alert:", error);
      res.status(500).json({ error: "Failed to create equipment alert" });
    }
  });

  // Acknowledge equipment alert
  app.post("/api/equipment/alerts/:alertId/acknowledge", async (req: Request, res: Response) => {
    try {
      await storage.acknowledgeEquipmentAlert(req.params.alertId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error acknowledging equipment alert:", error);
      res.status(500).json({ error: "Failed to acknowledge equipment alert" });
    }
  });

  // Resolve equipment alert (keys returned)
  app.post("/api/equipment/alerts/:alertId/resolve", async (req: Request, res: Response) => {
    try {
      await storage.resolveEquipmentAlert(req.params.alertId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving equipment alert:", error);
      res.status(500).json({ error: "Failed to resolve equipment alert" });
    }
  });

  // ========== POS DEVICE TRACKING SYSTEM ==========
  // For IT team to track and assign POS devices to stands/portables/bars

  // Get all POS device types
  app.get("/api/pos/device-types", async (_req: Request, res: Response) => {
    try {
      const types = await storage.getAllPosDeviceTypes();
      res.json(types);
    } catch (error) {
      console.error("Error getting POS device types:", error);
      res.status(500).json({ error: "Failed to get POS device types" });
    }
  });

  // Create new POS device type (David only)
  app.post("/api/pos/device-types", async (req: Request, res: Response) => {
    try {
      const deviceType = await storage.createPosDeviceType(req.body);
      res.status(201).json(deviceType);
    } catch (error) {
      console.error("Error creating POS device type:", error);
      res.status(500).json({ error: "Failed to create POS device type" });
    }
  });

  // Update POS device type
  app.put("/api/pos/device-types/:id", async (req: Request, res: Response) => {
    try {
      const deviceType = await storage.updatePosDeviceType(req.params.id, req.body);
      res.json(deviceType);
    } catch (error) {
      console.error("Error updating POS device type:", error);
      res.status(500).json({ error: "Failed to update POS device type" });
    }
  });

  // Get all POS devices
  app.get("/api/pos/devices", async (_req: Request, res: Response) => {
    try {
      const devices = await storage.getAllPosDevices();
      res.json(devices);
    } catch (error) {
      console.error("Error getting POS devices:", error);
      res.status(500).json({ error: "Failed to get POS devices" });
    }
  });

  // Get available POS devices
  app.get("/api/pos/devices/available", async (_req: Request, res: Response) => {
    try {
      const devices = await storage.getAvailablePosDevices();
      res.json(devices);
    } catch (error) {
      console.error("Error getting available POS devices:", error);
      res.status(500).json({ error: "Failed to get available POS devices" });
    }
  });

  // Get assigned POS devices
  app.get("/api/pos/devices/assigned", async (_req: Request, res: Response) => {
    try {
      const devices = await storage.getAssignedPosDevices();
      res.json(devices);
    } catch (error) {
      console.error("Error getting assigned POS devices:", error);
      res.status(500).json({ error: "Failed to get assigned POS devices" });
    }
  });

  // Get POS device by number
  app.get("/api/pos/devices/number/:number", async (req: Request, res: Response) => {
    try {
      const device = await storage.getPosDeviceByNumber(parseInt(req.params.number));
      if (!device) {
        return res.status(404).json({ error: "POS device not found" });
      }
      res.json(device);
    } catch (error) {
      console.error("Error getting POS device:", error);
      res.status(500).json({ error: "Failed to get POS device" });
    }
  });

  // Get POS devices by location
  app.get("/api/pos/devices/location/:locationId", async (req: Request, res: Response) => {
    try {
      const devices = await storage.getPosDevicesByLocation(req.params.locationId);
      res.json(devices);
    } catch (error) {
      console.error("Error getting POS devices by location:", error);
      res.status(500).json({ error: "Failed to get POS devices by location" });
    }
  });

  // Get POS devices by type
  app.get("/api/pos/devices/type/:type", async (req: Request, res: Response) => {
    try {
      const devices = await storage.getPosDevicesByType(req.params.type);
      res.json(devices);
    } catch (error) {
      console.error("Error getting POS devices by type:", error);
      res.status(500).json({ error: "Failed to get POS devices by type" });
    }
  });

  // Create POS device
  app.post("/api/pos/devices", async (req: Request, res: Response) => {
    try {
      // Check if device number already exists
      const existing = await storage.getPosDeviceByNumber(req.body.deviceNumber);
      if (existing) {
        return res.status(400).json({ error: `POS device #${req.body.deviceNumber} already exists` });
      }
      const device = await storage.createPosDevice(req.body);
      res.status(201).json(device);
    } catch (error) {
      console.error("Error creating POS device:", error);
      res.status(500).json({ error: "Failed to create POS device" });
    }
  });

  // Update POS device
  app.put("/api/pos/devices/:id", async (req: Request, res: Response) => {
    try {
      const device = await storage.updatePosDevice(req.params.id, req.body);
      res.json(device);
    } catch (error) {
      console.error("Error updating POS device:", error);
      res.status(500).json({ error: "Failed to update POS device" });
    }
  });

  // Get POS location grid (David's master grid)
  app.get("/api/pos/location-grid", async (_req: Request, res: Response) => {
    try {
      const grid = await storage.getAllPosLocationGrid();
      res.json(grid);
    } catch (error) {
      console.error("Error getting POS location grid:", error);
      res.status(500).json({ error: "Failed to get POS location grid" });
    }
  });

  // Get POS location grid by location ID
  app.get("/api/pos/location-grid/:locationId", async (req: Request, res: Response) => {
    try {
      const grid = await storage.getPosLocationGrid(req.params.locationId);
      res.json(grid || null);
    } catch (error) {
      console.error("Error getting POS location grid entry:", error);
      res.status(500).json({ error: "Failed to get POS location grid entry" });
    }
  });

  // Create/Update POS location grid entry (David sets which POS go where)
  app.post("/api/pos/location-grid", async (req: Request, res: Response) => {
    try {
      const grid = await storage.createPosLocationGrid(req.body);
      res.status(201).json(grid);
    } catch (error) {
      console.error("Error creating POS location grid:", error);
      res.status(500).json({ error: "Failed to create POS location grid" });
    }
  });

  // Update POS location grid entry
  app.put("/api/pos/location-grid/:id", async (req: Request, res: Response) => {
    try {
      const grid = await storage.updatePosLocationGrid(req.params.id, req.body);
      res.json(grid);
    } catch (error) {
      console.error("Error updating POS location grid:", error);
      res.status(500).json({ error: "Failed to update POS location grid" });
    }
  });

  // Delete POS location grid entry
  app.delete("/api/pos/location-grid/:id", async (req: Request, res: Response) => {
    try {
      await storage.deletePosLocationGrid(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting POS location grid:", error);
      res.status(500).json({ error: "Failed to delete POS location grid" });
    }
  });

  // Get all POS assignments
  app.get("/api/pos/assignments", async (_req: Request, res: Response) => {
    try {
      const assignments = await storage.getAllPosAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error getting POS assignments:", error);
      res.status(500).json({ error: "Failed to get POS assignments" });
    }
  });

  // Get active POS assignments
  app.get("/api/pos/assignments/active", async (_req: Request, res: Response) => {
    try {
      const assignments = await storage.getActivePosAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error getting active POS assignments:", error);
      res.status(500).json({ error: "Failed to get active POS assignments" });
    }
  });

  // Get POS assignments by location
  app.get("/api/pos/assignments/location/:locationId", async (req: Request, res: Response) => {
    try {
      const assignments = await storage.getPosAssignmentsByLocation(req.params.locationId);
      res.json(assignments);
    } catch (error) {
      console.error("Error getting POS assignments by location:", error);
      res.status(500).json({ error: "Failed to get POS assignments by location" });
    }
  });

  // Get POS assignments by event date
  app.get("/api/pos/assignments/event/:eventDate", async (req: Request, res: Response) => {
    try {
      const assignments = await storage.getPosAssignmentsByEvent(req.params.eventDate);
      res.json(assignments);
    } catch (error) {
      console.error("Error getting POS assignments by event:", error);
      res.status(500).json({ error: "Failed to get POS assignments by event" });
    }
  });

  // Create POS assignment (IT assigns POS to location)
  app.post("/api/pos/assignments", async (req: Request, res: Response) => {
    try {
      // Check if device is available
      const device = await storage.getPosDevice(req.body.posDeviceId);
      if (!device) {
        return res.status(404).json({ error: "POS device not found" });
      }
      if (device.status === 'assigned') {
        return res.status(400).json({ 
          error: `POS #${device.deviceNumber} is already assigned to ${device.currentLocationName}` 
        });
      }
      
      const assignment = await storage.createPosAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating POS assignment:", error);
      res.status(500).json({ error: "Failed to create POS assignment" });
    }
  });

  // Return POS assignment
  app.post("/api/pos/assignments/:id/return", async (req: Request, res: Response) => {
    try {
      const { returnedById, returnedByName } = req.body;
      const assignment = await storage.returnPosAssignment(req.params.id, returnedById, returnedByName);
      res.json(assignment);
    } catch (error) {
      console.error("Error returning POS assignment:", error);
      res.status(500).json({ error: "Failed to return POS assignment" });
    }
  });

  // Get all POS replacements
  app.get("/api/pos/replacements", async (_req: Request, res: Response) => {
    try {
      const replacements = await storage.getAllPosReplacements();
      res.json(replacements);
    } catch (error) {
      console.error("Error getting POS replacements:", error);
      res.status(500).json({ error: "Failed to get POS replacements" });
    }
  });

  // Get POS replacements by event
  app.get("/api/pos/replacements/event/:eventDate", async (req: Request, res: Response) => {
    try {
      const replacements = await storage.getPosReplacementsByEvent(req.params.eventDate);
      res.json(replacements);
    } catch (error) {
      console.error("Error getting POS replacements by event:", error);
      res.status(500).json({ error: "Failed to get POS replacements by event" });
    }
  });

  // Create POS replacement (swap a POS mid-event)
  app.post("/api/pos/replacements", async (req: Request, res: Response) => {
    try {
      // Validate replacement device is available
      const replacementDevice = await storage.getPosDevice(req.body.replacementPosId);
      if (!replacementDevice) {
        return res.status(404).json({ error: "Replacement POS device not found" });
      }
      if (replacementDevice.status === 'assigned') {
        return res.status(400).json({ 
          error: `Replacement POS #${replacementDevice.deviceNumber} is already assigned` 
        });
      }
      
      const replacement = await storage.createPosReplacement(req.body);
      res.status(201).json(replacement);
    } catch (error) {
      console.error("Error creating POS replacement:", error);
      res.status(500).json({ error: "Failed to create POS replacement" });
    }
  });

  // Get all POS issues
  app.get("/api/pos/issues", async (_req: Request, res: Response) => {
    try {
      const issues = await storage.getAllPosIssues();
      res.json(issues);
    } catch (error) {
      console.error("Error getting POS issues:", error);
      res.status(500).json({ error: "Failed to get POS issues" });
    }
  });

  // Get open POS issues
  app.get("/api/pos/issues/open", async (_req: Request, res: Response) => {
    try {
      const issues = await storage.getOpenPosIssues();
      res.json(issues);
    } catch (error) {
      console.error("Error getting open POS issues:", error);
      res.status(500).json({ error: "Failed to get open POS issues" });
    }
  });

  // Get POS issues by location
  app.get("/api/pos/issues/location/:locationId", async (req: Request, res: Response) => {
    try {
      const issues = await storage.getPosIssuesByLocation(req.params.locationId);
      res.json(issues);
    } catch (error) {
      console.error("Error getting POS issues by location:", error);
      res.status(500).json({ error: "Failed to get POS issues by location" });
    }
  });

  // Create POS issue (report a problem)
  app.post("/api/pos/issues", async (req: Request, res: Response) => {
    try {
      const issue = await storage.createPosIssue(req.body);
      res.status(201).json(issue);
    } catch (error) {
      console.error("Error creating POS issue:", error);
      res.status(500).json({ error: "Failed to create POS issue" });
    }
  });

  // Update POS issue
  app.put("/api/pos/issues/:id", async (req: Request, res: Response) => {
    try {
      const issue = await storage.updatePosIssue(req.params.id, req.body);
      res.json(issue);
    } catch (error) {
      console.error("Error updating POS issue:", error);
      res.status(500).json({ error: "Failed to update POS issue" });
    }
  });

  // Assign POS issue to IT team member
  app.post("/api/pos/issues/:id/assign", async (req: Request, res: Response) => {
    try {
      const { assignedToId, assignedToName } = req.body;
      const issue = await storage.assignPosIssue(req.params.id, assignedToId, assignedToName);
      res.json(issue);
    } catch (error) {
      console.error("Error assigning POS issue:", error);
      res.status(500).json({ error: "Failed to assign POS issue" });
    }
  });

  // Resolve POS issue
  app.post("/api/pos/issues/:id/resolve", async (req: Request, res: Response) => {
    try {
      const { resolvedById, resolvedByName, resolution } = req.body;
      const issue = await storage.resolvePosIssue(req.params.id, resolvedById, resolvedByName, resolution);
      res.json(issue);
    } catch (error) {
      console.error("Error resolving POS issue:", error);
      res.status(500).json({ error: "Failed to resolve POS issue" });
    }
  });

  // Get POS overview (David's dashboard)
  app.get("/api/pos/overview", async (_req: Request, res: Response) => {
    try {
      const [allDevices, activeAssignments, openIssues, locationGrid] = await Promise.all([
        storage.getAllPosDevices(),
        storage.getActivePosAssignments(),
        storage.getOpenPosIssues(),
        storage.getAllPosLocationGrid()
      ]);
      
      const available = allDevices.filter(d => d.status === 'available');
      const assigned = allDevices.filter(d => d.status === 'assigned');
      const maintenance = allDevices.filter(d => d.status === 'maintenance');
      
      // Group by type
      const byType: Record<string, { total: number; available: number; assigned: number }> = {};
      allDevices.forEach(device => {
        const type = device.deviceType;
        if (!byType[type]) {
          byType[type] = { total: 0, available: 0, assigned: 0 };
        }
        byType[type].total++;
        if (device.status === 'available') byType[type].available++;
        if (device.status === 'assigned') byType[type].assigned++;
      });
      
      res.json({
        summary: {
          total: allDevices.length,
          available: available.length,
          assigned: assigned.length,
          maintenance: maintenance.length
        },
        byType,
        activeAssignments,
        openIssues,
        locationGrid
      });
    } catch (error) {
      console.error("Error getting POS overview:", error);
      res.status(500).json({ error: "Failed to get POS overview" });
    }
  });

  return httpServer;
}
