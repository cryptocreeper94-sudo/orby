import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertStandSchema, insertItemSchema, insertMessageSchema,
  insertNpoSchema, insertStaffingGroupSchema, insertSupervisorDocSchema, insertDocSignatureSchema,
  insertInventoryCountSchema, insertQuickMessageSchema, insertConversationSchema, insertConversationMessageSchema,
  insertIncidentSchema, insertCountSessionSchema, insertStandIssueSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { createWorker } from "tesseract.js";

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

  // ============ AUTH ============
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({ error: "PIN required" });
      }
      const user = await storage.getUserByPin(pin);
      if (!user) {
        return res.status(401).json({ error: "Invalid PIN" });
      }
      await storage.updateUserOnlineStatus(user.id, true);
      res.json({ user });
    } catch (error) {
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

  // ============ STAND ISSUES ============
  // Get all stand issues
  app.get("/api/stand-issues", async (_req: Request, res: Response) => {
    try {
      const issues = await storage.getAllStandIssues();
      res.json(issues);
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
      await storage.createStandIssueNotifications(issue.id, parsed.category, isEmergency);
      
      res.status(201).json(issue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
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
        { name: 'IT Support', pin: '9999', role: 'IT' as const, isOnline: false, requiresPinReset: false },
        { name: 'Developer', pin: '0424', role: 'Developer' as const, isOnline: false, requiresPinReset: false },
        { name: 'NPO Worker 1', pin: '1111', role: 'NPOWorker' as const, isOnline: false, requiresPinReset: true },
        { name: 'Stand Lead 1', pin: '2222', role: 'StandLead' as const, isOnline: false, requiresPinReset: true },
        { name: 'Warehouse Manager', pin: '4444', role: 'ManagementCore' as const, managementType: 'WarehouseManager' as const, isOnline: false, requiresPinReset: true },
        { name: 'Kitchen Manager', pin: '4445', role: 'ManagementCore' as const, managementType: 'KitchenManager' as const, isOnline: false, requiresPinReset: true },
        { name: 'HR Manager', pin: '4446', role: 'ManagementCore' as const, managementType: 'HRManager' as const, isOnline: false, requiresPinReset: true },
        { name: 'General Manager', pin: '4447', role: 'ManagementCore' as const, managementType: 'GeneralManager' as const, isOnline: false, requiresPinReset: true },
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

  return httpServer;
}
