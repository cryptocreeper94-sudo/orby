import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertStandSchema, insertItemSchema, insertMessageSchema,
  insertNpoSchema, insertStaffingGroupSchema, insertSupervisorDocSchema, insertDocSignatureSchema,
  insertInventoryCountSchema, insertQuickMessageSchema, insertConversationSchema, insertConversationMessageSchema,
  insertIncidentSchema, insertCountSessionSchema, insertStandIssueSchema, insertMenuBoardSchema,
  insertAuditLogSchema, insertEmergencyAlertSchema, insertOrbitRosterSchema, insertOrbitShiftSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
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
        { name: 'IT Support', pin: '9999', role: 'IT' as const, isOnline: false, requiresPinReset: false },
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

  return httpServer;
}
