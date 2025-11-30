import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertStandSchema, insertItemSchema, insertMessageSchema,
  insertNpoSchema, insertStaffingGroupSchema, insertSupervisorDocSchema, insertDocSignatureSchema,
  insertInventoryCountSchema
} from "@shared/schema";
import { z } from "zod";

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

  // ============ SEED DATA ============
  app.post("/api/seed", async (_req: Request, res: Response) => {
    try {
      // Check if data already exists
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.json({ message: "Database already seeded", seeded: false });
      }

      // Seed Users
      const users = [
        { name: 'Admin User', pin: '1234', role: 'Admin' as const, isOnline: false },
        { name: 'Sup. Sarah', pin: '5678', role: 'Supervisor' as const, isOnline: false },
        { name: 'Sup. Mike', pin: '9012', role: 'Supervisor' as const, isOnline: false },
        { name: 'IT Support', pin: '9999', role: 'IT' as const, isOnline: false },
        { name: 'Developer', pin: '0424', role: 'Admin' as const, isOnline: false },
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
