import { 
  users, stands, inventoryCounts, items, messages, npos, staffingGroups, supervisorDocs, docSignatures,
  quickMessages, conversations, conversationMessages, incidents, incidentNotifications,
  type User, type InsertUser,
  type Stand, type InsertStand,
  type InventoryCount, type InsertInventoryCount,
  type Item, type InsertItem,
  type Message, type InsertMessage,
  type NPO, type InsertNPO,
  type StaffingGroup, type InsertStaffingGroup,
  type SupervisorDoc, type InsertSupervisorDoc,
  type DocSignature, type InsertDocSignature,
  type QuickMessage, type InsertQuickMessage,
  type Conversation, type InsertConversation,
  type ConversationMessage, type InsertConversationMessage,
  type Incident, type InsertIncident,
  type IncidentNotification, type InsertIncidentNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByPin(pin: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRoles(roles: User['role'][]): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;

  // Stands
  getStand(id: string): Promise<Stand | undefined>;
  getAllStands(): Promise<Stand[]>;
  getStandsBySection(section: string): Promise<Stand[]>;
  getStandsBySupervisor(supervisorId: string): Promise<Stand[]>;
  createStand(stand: InsertStand): Promise<Stand>;
  updateStandStatus(id: string, status: Stand['status']): Promise<void>;
  updateStandAssets(id: string, e700Ids: string[], a930Ids: string[]): Promise<void>;

  // Inventory Counts
  getInventoryCount(standId: string, itemId: string, eventDate: string): Promise<InventoryCount | undefined>;
  getInventoryCountsByStand(standId: string, eventDate: string): Promise<InventoryCount[]>;
  upsertInventoryCount(count: InsertInventoryCount): Promise<InventoryCount>;

  // Items
  getItem(id: string): Promise<Item | undefined>;
  getAllItems(): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getAllMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // NPOs
  getNpo(id: string): Promise<NPO | undefined>;
  getAllNpos(): Promise<NPO[]>;
  createNpo(npo: InsertNPO): Promise<NPO>;

  // Staffing Groups
  getStaffingGroup(id: string): Promise<StaffingGroup | undefined>;
  getAllStaffingGroups(): Promise<StaffingGroup[]>;
  createStaffingGroup(group: InsertStaffingGroup): Promise<StaffingGroup>;
  updateStaffingGroup(id: string, group: Partial<InsertStaffingGroup>): Promise<void>;

  // Supervisor Docs
  getSupervisorDoc(id: string): Promise<SupervisorDoc | undefined>;
  getAllSupervisorDocs(): Promise<SupervisorDoc[]>;
  createSupervisorDoc(doc: InsertSupervisorDoc): Promise<SupervisorDoc>;

  // Doc Signatures
  getDocSignature(docId: string, userId: string, standId?: string): Promise<DocSignature | undefined>;
  createDocSignature(signature: InsertDocSignature): Promise<DocSignature>;

  // Quick Messages (canned responses)
  getAllQuickMessages(): Promise<QuickMessage[]>;
  getQuickMessagesByTarget(targetRole: Conversation['targetRole']): Promise<QuickMessage[]>;
  createQuickMessage(msg: InsertQuickMessage): Promise<QuickMessage>;

  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getActiveConversations(): Promise<Conversation[]>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;
  getConversationsByTarget(targetRole: Conversation['targetRole']): Promise<Conversation[]>;
  createConversation(conv: InsertConversation): Promise<Conversation>;
  updateConversationLastMessage(id: string): Promise<void>;
  closeConversation(id: string): Promise<void>;
  closeStaleConversations(timeoutMinutes: number): Promise<void>;

  // Conversation Messages
  getConversationMessages(conversationId: string): Promise<ConversationMessage[]>;
  createConversationMessage(msg: InsertConversationMessage): Promise<ConversationMessage>;

  // Incidents
  getIncident(id: string): Promise<Incident | undefined>;
  getAllIncidents(): Promise<Incident[]>;
  getIncidentsByReporter(reporterId: string): Promise<Incident[]>;
  getOpenIncidents(): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncidentStatus(id: string, status: Incident['status'], resolvedBy?: string): Promise<void>;
  addIncidentNote(id: string, note: string): Promise<void>;

  // Incident Notifications
  getUnreadIncidentNotifications(userId: string): Promise<IncidentNotification[]>;
  markIncidentNotificationRead(id: string): Promise<void>;
  createIncidentNotificationsForManagers(incidentId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pin, pin));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRoles(roles: User['role'][]): Promise<User[]> {
    return await db.select().from(users).where(inArray(users.role, roles));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await db.update(users).set({ isOnline }).where(eq(users.id, id));
  }

  // Stands
  async getStand(id: string): Promise<Stand | undefined> {
    const [stand] = await db.select().from(stands).where(eq(stands.id, id));
    return stand || undefined;
  }

  async getAllStands(): Promise<Stand[]> {
    return await db.select().from(stands);
  }

  async getStandsBySection(section: string): Promise<Stand[]> {
    return await db.select().from(stands).where(eq(stands.section, section));
  }

  async getStandsBySupervisor(supervisorId: string): Promise<Stand[]> {
    return await db.select().from(stands).where(eq(stands.supervisorId, supervisorId));
  }

  async createStand(insertStand: InsertStand): Promise<Stand> {
    const [stand] = await db.insert(stands).values(insertStand).returning();
    return stand;
  }

  async updateStandStatus(id: string, status: Stand['status']): Promise<void> {
    await db.update(stands).set({ status }).where(eq(stands.id, id));
  }

  async updateStandAssets(id: string, e700Ids: string[], a930Ids: string[]): Promise<void> {
    await db.update(stands).set({ e700Ids, a930Ids }).where(eq(stands.id, id));
  }

  // Inventory Counts
  async getInventoryCount(standId: string, itemId: string, eventDate: string): Promise<InventoryCount | undefined> {
    const [count] = await db.select().from(inventoryCounts)
      .where(and(
        eq(inventoryCounts.standId, standId),
        eq(inventoryCounts.itemId, itemId),
        eq(inventoryCounts.eventDate, eventDate)
      ));
    return count || undefined;
  }

  async getInventoryCountsByStand(standId: string, eventDate: string): Promise<InventoryCount[]> {
    return await db.select().from(inventoryCounts)
      .where(and(
        eq(inventoryCounts.standId, standId),
        eq(inventoryCounts.eventDate, eventDate)
      ));
  }

  async upsertInventoryCount(count: InsertInventoryCount): Promise<InventoryCount> {
    const existing = await this.getInventoryCount(count.standId, count.itemId, count.eventDate);
    if (existing) {
      const [updated] = await db.update(inventoryCounts)
        .set(count)
        .where(eq(inventoryCounts.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(inventoryCounts).values(count).returning();
    return created;
  }

  // Items
  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db.insert(items).values(insertItem).returning();
    return item;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  // NPOs
  async getNpo(id: string): Promise<NPO | undefined> {
    const [npo] = await db.select().from(npos).where(eq(npos.id, id));
    return npo || undefined;
  }

  async getAllNpos(): Promise<NPO[]> {
    return await db.select().from(npos);
  }

  async createNpo(insertNpo: InsertNPO): Promise<NPO> {
    const [npo] = await db.insert(npos).values(insertNpo).returning();
    return npo;
  }

  // Staffing Groups
  async getStaffingGroup(id: string): Promise<StaffingGroup | undefined> {
    const [group] = await db.select().from(staffingGroups).where(eq(staffingGroups.id, id));
    return group || undefined;
  }

  async getAllStaffingGroups(): Promise<StaffingGroup[]> {
    return await db.select().from(staffingGroups);
  }

  async createStaffingGroup(insertGroup: InsertStaffingGroup): Promise<StaffingGroup> {
    const [group] = await db.insert(staffingGroups).values(insertGroup).returning();
    return group;
  }

  async updateStaffingGroup(id: string, updates: Partial<InsertStaffingGroup>): Promise<void> {
    await db.update(staffingGroups).set(updates).where(eq(staffingGroups.id, id));
  }

  // Supervisor Docs
  async getSupervisorDoc(id: string): Promise<SupervisorDoc | undefined> {
    const [doc] = await db.select().from(supervisorDocs).where(eq(supervisorDocs.id, id));
    return doc || undefined;
  }

  async getAllSupervisorDocs(): Promise<SupervisorDoc[]> {
    return await db.select().from(supervisorDocs);
  }

  async createSupervisorDoc(insertDoc: InsertSupervisorDoc): Promise<SupervisorDoc> {
    const [doc] = await db.insert(supervisorDocs).values(insertDoc).returning();
    return doc;
  }

  // Doc Signatures
  async getDocSignature(docId: string, userId: string, standId?: string): Promise<DocSignature | undefined> {
    const conditions = [eq(docSignatures.docId, docId), eq(docSignatures.userId, userId)];
    if (standId) {
      conditions.push(eq(docSignatures.standId, standId));
    }
    const [signature] = await db.select().from(docSignatures).where(and(...conditions));
    return signature || undefined;
  }

  async createDocSignature(insertSignature: InsertDocSignature): Promise<DocSignature> {
    const [signature] = await db.insert(docSignatures).values(insertSignature).returning();
    return signature;
  }

  // Quick Messages (canned responses)
  async getAllQuickMessages(): Promise<QuickMessage[]> {
    return await db.select().from(quickMessages)
      .where(eq(quickMessages.isActive, true))
      .orderBy(asc(quickMessages.sortOrder));
  }

  async getQuickMessagesByTarget(targetRole: Conversation['targetRole']): Promise<QuickMessage[]> {
    return await db.select().from(quickMessages)
      .where(and(
        eq(quickMessages.targetRole, targetRole),
        eq(quickMessages.isActive, true)
      ))
      .orderBy(asc(quickMessages.sortOrder));
  }

  async createQuickMessage(insertMsg: InsertQuickMessage): Promise<QuickMessage> {
    const [msg] = await db.insert(quickMessages).values(insertMsg).returning();
    return msg;
  }

  // Conversations
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv || undefined;
  }

  async getActiveConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(eq(conversations.status, 'Active'))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(eq(conversations.initiatorId, userId))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationsByTarget(targetRole: Conversation['targetRole']): Promise<Conversation[]> {
    return await db.select().from(conversations)
      .where(eq(conversations.targetRole, targetRole))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(insertConv: InsertConversation): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values(insertConv).returning();
    return conv;
  }

  async updateConversationLastMessage(id: string): Promise<void> {
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async closeConversation(id: string): Promise<void> {
    await db.update(conversations)
      .set({ status: 'Closed' })
      .where(eq(conversations.id, id));
  }

  async closeStaleConversations(timeoutMinutes: number): Promise<void> {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    await db.update(conversations)
      .set({ status: 'Closed' })
      .where(and(
        eq(conversations.status, 'Active'),
        // Drizzle doesn't have lt for timestamps easily, so we handle this differently
      ));
    // Note: For now, we'll handle stale conversation closing client-side or via a cron
  }

  // Conversation Messages
  async getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
    return await db.select().from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(asc(conversationMessages.createdAt));
  }

  async createConversationMessage(insertMsg: InsertConversationMessage): Promise<ConversationMessage> {
    const [msg] = await db.insert(conversationMessages).values(insertMsg).returning();
    // Update the conversation's lastMessageAt
    await this.updateConversationLastMessage(insertMsg.conversationId);
    return msg;
  }

  // Incidents
  async getIncident(id: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident || undefined;
  }

  async getAllIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
  }

  async getIncidentsByReporter(reporterId: string): Promise<Incident[]> {
    return await db.select().from(incidents)
      .where(eq(incidents.reporterId, reporterId))
      .orderBy(desc(incidents.createdAt));
  }

  async getOpenIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents)
      .where(eq(incidents.status, 'Open'))
      .orderBy(desc(incidents.createdAt));
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const [incident] = await db.insert(incidents).values(insertIncident).returning();
    return incident;
  }

  async updateIncidentStatus(id: string, status: Incident['status'], resolvedBy?: string): Promise<void> {
    const updates: Partial<Incident> = { status };
    if (status === 'Resolved' || status === 'Closed') {
      updates.resolvedAt = new Date();
      if (resolvedBy) {
        updates.resolvedBy = resolvedBy;
      }
    }
    await db.update(incidents).set(updates).where(eq(incidents.id, id));
  }

  async addIncidentNote(id: string, note: string): Promise<void> {
    const incident = await this.getIncident(id);
    if (incident) {
      const existingNotes = incident.notes || '';
      const timestamp = new Date().toISOString();
      const updatedNotes = existingNotes + `\n[${timestamp}] ${note}`;
      await db.update(incidents).set({ notes: updatedNotes.trim() }).where(eq(incidents.id, id));
    }
  }

  // Incident Notifications
  async getUnreadIncidentNotifications(userId: string): Promise<IncidentNotification[]> {
    return await db.select().from(incidentNotifications)
      .where(and(
        eq(incidentNotifications.userId, userId),
        eq(incidentNotifications.isRead, false)
      ))
      .orderBy(desc(incidentNotifications.createdAt));
  }

  async markIncidentNotificationRead(id: string): Promise<void> {
    await db.update(incidentNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(incidentNotifications.id, id));
  }

  async createIncidentNotificationsForManagers(incidentId: string): Promise<void> {
    // Get all supervisors and admins to notify
    const managersAndSupervisors = await this.getUsersByRoles(['Supervisor', 'Admin']);
    
    // Create notification for each
    const notifications = managersAndSupervisors.map(user => ({
      incidentId,
      userId: user.id,
      isRead: false
    }));
    
    if (notifications.length > 0) {
      await db.insert(incidentNotifications).values(notifications);
    }
  }
}

export const storage = new DatabaseStorage();
