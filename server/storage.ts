import { 
  users, stands, inventoryCounts, items, messages, npos, staffingGroups, supervisorDocs, docSignatures,
  quickMessages, conversations, conversationMessages, incidents, incidentNotifications, countSessions,
  standIssues, standIssueNotifications, managerAssignments, geofenceEvents, ISSUE_ROUTING_RULES,
  closingChecklists, closingChecklistTasks, spoilageReports, spoilageItems, voucherReports, DEFAULT_CLOSING_TASKS,
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
  type IncidentNotification, type InsertIncidentNotification,
  type CountSession, type InsertCountSession,
  type StandIssue, type InsertStandIssue,
  type StandIssueNotification, type InsertStandIssueNotification,
  type ManagerAssignment, type InsertManagerAssignment,
  type GeofenceEvent, type InsertGeofenceEvent,
  type ClosingChecklist, type InsertClosingChecklist,
  type ClosingChecklistTask, type InsertClosingChecklistTask,
  type SpoilageReport, type InsertSpoilageReport,
  type SpoilageItem, type InsertSpoilageItem,
  type VoucherReport, type InsertVoucherReport
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, inArray } from "drizzle-orm";

export interface VarianceReportItem {
  itemId: string;
  itemName: string;
  category: string;
  preEventCount: number;
  postEventCount: number;
  used: number;
  spoilage: number;
  adds: number;
}

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
  getInventoryCountsBySession(sessionId: string): Promise<InventoryCount[]>;
  upsertInventoryCount(count: InsertInventoryCount): Promise<InventoryCount>;
  getVarianceReport(standId: string, eventDate: string): Promise<VarianceReportItem[]>;

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

  // Count Sessions
  getCountSession(id: string): Promise<CountSession | undefined>;
  getCountSessionByStand(standId: string, eventDate: string, stage: CountSession['stage']): Promise<CountSession | undefined>;
  getCountSessionsByStand(standId: string, eventDate: string): Promise<CountSession[]>;
  getActiveCountSession(standId: string, eventDate: string): Promise<CountSession | undefined>;
  createCountSession(session: InsertCountSession): Promise<CountSession>;
  completeCountSession(id: string): Promise<void>;
  verifyCountSession(id: string, verifiedById: string): Promise<void>;
  addCountSessionNote(id: string, note: string): Promise<void>;

  // Stand Issues
  getStandIssue(id: string): Promise<StandIssue | undefined>;
  getAllStandIssues(): Promise<StandIssue[]>;
  getStandIssuesByStand(standId: string): Promise<StandIssue[]>;
  getOpenStandIssues(): Promise<StandIssue[]>;
  getEmergencyStandIssues(): Promise<StandIssue[]>;
  getStandIssuesByRouting(routedTo: User['role']): Promise<StandIssue[]>;
  createStandIssue(issue: InsertStandIssue): Promise<StandIssue>;
  acknowledgeStandIssue(id: string, userId: string): Promise<void>;
  resolveStandIssue(id: string, userId: string, notes?: string): Promise<void>;
  updateStandIssueStatus(id: string, status: StandIssue['status']): Promise<void>;

  // Stand Issue Notifications
  getUnreadStandIssueNotifications(userId: string): Promise<StandIssueNotification[]>;
  markStandIssueNotificationRead(id: string): Promise<void>;
  createStandIssueNotifications(issueId: string, category: string, isEmergency: boolean): Promise<void>;

  // Manager Assignments
  getManagerAssignments(eventDate: string): Promise<ManagerAssignment[]>;
  getAssignmentsByManager(managerId: string, eventDate: string): Promise<ManagerAssignment[]>;
  createManagerAssignment(assignment: InsertManagerAssignment): Promise<ManagerAssignment>;
  deactivateManagerAssignment(id: string): Promise<void>;

  // Geofence Events
  createGeofenceEvent(event: InsertGeofenceEvent): Promise<GeofenceEvent>;
  getRecentGeofenceEvents(userId: string): Promise<GeofenceEvent[]>;
  markGeofenceEventNotified(id: string, notifiedStandLead: boolean, notifiedSupervisor: boolean): Promise<void>;

  // PIN Reset
  updateUserPin(id: string, newPin: string): Promise<void>;
  getUsersRequiringPinReset(): Promise<User[]>;

  // Closing Checklists
  getClosingChecklist(standId: string, eventDate: string): Promise<ClosingChecklist | undefined>;
  createClosingChecklist(checklist: InsertClosingChecklist): Promise<ClosingChecklist>;
  getClosingChecklistTasks(checklistId: string): Promise<ClosingChecklistTask[]>;
  toggleChecklistTask(taskId: string, isCompleted: boolean, remarks?: string): Promise<void>;
  completeClosingChecklist(checklistId: string): Promise<void>;

  // Spoilage Reports
  getSpoilageReport(standId: string, eventDate: string): Promise<SpoilageReport | undefined>;
  createSpoilageReport(report: InsertSpoilageReport): Promise<SpoilageReport>;
  getSpoilageItems(reportId: string): Promise<SpoilageItem[]>;
  addSpoilageItem(item: InsertSpoilageItem): Promise<SpoilageItem>;
  removeSpoilageItem(itemId: string): Promise<void>;
  submitSpoilageReport(reportId: string): Promise<void>;

  // Voucher Reports
  getVoucherReport(standId: string, eventDate: string): Promise<VoucherReport | undefined>;
  createVoucherReport(report: InsertVoucherReport): Promise<VoucherReport>;
  updateVoucherReport(reportId: string, voucherCount: number, totalAmountCents: number, notes?: string): Promise<void>;
  submitVoucherReport(reportId: string): Promise<void>;
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

  async getInventoryCountsBySession(sessionId: string): Promise<InventoryCount[]> {
    return await db.select().from(inventoryCounts)
      .where(eq(inventoryCounts.sessionId, sessionId));
  }

  async getVarianceReport(standId: string, eventDate: string): Promise<VarianceReportItem[]> {
    const allCounts = await this.getInventoryCountsByStand(standId, eventDate);
    const allItems = await this.getAllItems();
    const sessions = await this.getCountSessionsByStand(standId, eventDate);
    
    const itemMap = new Map(allItems.map(item => [item.id, item]));
    
    const preEventSession = sessions.find(s => s.stage === 'PreEvent' && s.status !== 'InProgress');
    const postEventSession = sessions.find(s => s.stage === 'PostEvent' && s.status !== 'InProgress');
    
    const preEventCounts = allCounts.filter(c => c.sessionId === preEventSession?.id);
    const postEventCounts = allCounts.filter(c => c.sessionId === postEventSession?.id);
    
    const preCountMap = new Map(preEventCounts.map(c => [c.itemId, c]));
    const postCountMap = new Map(postEventCounts.map(c => [c.itemId, c]));
    
    const allItemIds = Array.from(new Set([
      ...preEventCounts.map(c => c.itemId),
      ...postEventCounts.map(c => c.itemId)
    ]));
    
    const report: VarianceReportItem[] = [];
    
    for (const itemId of allItemIds) {
      const item = itemMap.get(itemId);
      if (!item) continue;
      
      const preCount = preCountMap.get(itemId);
      const postCount = postCountMap.get(itemId);
      
      const preEventCount = preCount?.startCount || preCount?.endCount || 0;
      const adds = postCount?.adds || preCount?.adds || 0;
      const postEventCount = postCount?.endCount || 0;
      const spoilage = postCount?.spoilage || 0;
      
      const used = preEventSession && postEventSession 
        ? (preEventCount + adds) - postEventCount - spoilage
        : 0;
      
      report.push({
        itemId,
        itemName: item.name,
        category: item.category,
        preEventCount,
        postEventCount,
        used: Math.max(0, used),
        spoilage,
        adds
      });
    }
    
    return report.sort((a, b) => a.category.localeCompare(b.category) || a.itemName.localeCompare(b.itemName));
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
    const managersAndSupervisors = await this.getUsersByRoles(['StandSupervisor', 'ManagementCore', 'Admin']);
    
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

  // Count Sessions
  async getCountSession(id: string): Promise<CountSession | undefined> {
    const [session] = await db.select().from(countSessions).where(eq(countSessions.id, id));
    return session || undefined;
  }

  async getCountSessionByStand(standId: string, eventDate: string, stage: CountSession['stage']): Promise<CountSession | undefined> {
    const [session] = await db.select().from(countSessions)
      .where(and(
        eq(countSessions.standId, standId),
        eq(countSessions.eventDate, eventDate),
        eq(countSessions.stage, stage)
      ));
    return session || undefined;
  }

  async getCountSessionsByStand(standId: string, eventDate: string): Promise<CountSession[]> {
    return await db.select().from(countSessions)
      .where(and(
        eq(countSessions.standId, standId),
        eq(countSessions.eventDate, eventDate)
      ))
      .orderBy(asc(countSessions.startedAt));
  }

  async getActiveCountSession(standId: string, eventDate: string): Promise<CountSession | undefined> {
    const [session] = await db.select().from(countSessions)
      .where(and(
        eq(countSessions.standId, standId),
        eq(countSessions.eventDate, eventDate),
        eq(countSessions.status, 'InProgress')
      ));
    return session || undefined;
  }

  async createCountSession(insertSession: InsertCountSession): Promise<CountSession> {
    const [session] = await db.insert(countSessions).values(insertSession).returning();
    return session;
  }

  async completeCountSession(id: string): Promise<void> {
    await db.update(countSessions)
      .set({ status: 'Completed', completedAt: new Date() })
      .where(eq(countSessions.id, id));
  }

  async verifyCountSession(id: string, verifiedById: string): Promise<void> {
    await db.update(countSessions)
      .set({ status: 'Verified', verifiedById })
      .where(eq(countSessions.id, id));
  }

  async addCountSessionNote(id: string, note: string): Promise<void> {
    const session = await this.getCountSession(id);
    if (session) {
      const existingNotes = session.notes || '';
      const timestamp = new Date().toISOString();
      const updatedNotes = existingNotes + `\n[${timestamp}] ${note}`;
      await db.update(countSessions).set({ notes: updatedNotes.trim() }).where(eq(countSessions.id, id));
    }
  }

  // Stand Issues
  async getStandIssue(id: string): Promise<StandIssue | undefined> {
    const [issue] = await db.select().from(standIssues).where(eq(standIssues.id, id));
    return issue || undefined;
  }

  async getAllStandIssues(): Promise<StandIssue[]> {
    return await db.select().from(standIssues).orderBy(desc(standIssues.createdAt));
  }

  async getStandIssuesByStand(standId: string): Promise<StandIssue[]> {
    return await db.select().from(standIssues)
      .where(eq(standIssues.standId, standId))
      .orderBy(desc(standIssues.createdAt));
  }

  async getOpenStandIssues(): Promise<StandIssue[]> {
    return await db.select().from(standIssues)
      .where(or(
        eq(standIssues.status, 'Open'),
        eq(standIssues.status, 'Acknowledged'),
        eq(standIssues.status, 'InProgress')
      ))
      .orderBy(desc(standIssues.createdAt));
  }

  async getEmergencyStandIssues(): Promise<StandIssue[]> {
    return await db.select().from(standIssues)
      .where(and(
        eq(standIssues.severity, 'Emergency'),
        or(
          eq(standIssues.status, 'Open'),
          eq(standIssues.status, 'Acknowledged'),
          eq(standIssues.status, 'InProgress')
        )
      ))
      .orderBy(desc(standIssues.createdAt));
  }

  async getStandIssuesByRouting(routedTo: User['role']): Promise<StandIssue[]> {
    return await db.select().from(standIssues)
      .where(eq(standIssues.routedTo, routedTo))
      .orderBy(desc(standIssues.createdAt));
  }

  async createStandIssue(insertIssue: InsertStandIssue): Promise<StandIssue> {
    // Determine routing based on category
    const routingRoles = ISSUE_ROUTING_RULES[insertIssue.category] || ['OperationsManager'];
    const primaryRoute = routingRoles[0] as User['role'];
    
    const [issue] = await db.insert(standIssues).values({
      ...insertIssue,
      routedTo: primaryRoute
    }).returning();
    return issue;
  }

  async acknowledgeStandIssue(id: string, userId: string): Promise<void> {
    await db.update(standIssues)
      .set({ 
        status: 'Acknowledged', 
        acknowledgedAt: new Date(),
        acknowledgedBy: userId 
      })
      .where(eq(standIssues.id, id));
  }

  async resolveStandIssue(id: string, userId: string, notes?: string): Promise<void> {
    await db.update(standIssues)
      .set({ 
        status: 'Resolved', 
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: notes 
      })
      .where(eq(standIssues.id, id));
  }

  async updateStandIssueStatus(id: string, status: StandIssue['status']): Promise<void> {
    await db.update(standIssues).set({ status }).where(eq(standIssues.id, id));
  }

  // Stand Issue Notifications
  async getUnreadStandIssueNotifications(userId: string): Promise<StandIssueNotification[]> {
    return await db.select().from(standIssueNotifications)
      .where(and(
        eq(standIssueNotifications.userId, userId),
        eq(standIssueNotifications.isRead, false)
      ))
      .orderBy(desc(standIssueNotifications.createdAt));
  }

  async markStandIssueNotificationRead(id: string): Promise<void> {
    await db.update(standIssueNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(standIssueNotifications.id, id));
  }

  async createStandIssueNotifications(issueId: string, category: string, isEmergency: boolean): Promise<void> {
    // All management roles receive issue notifications, filtered by category/type later
    // For now, notify all ManagementCore users for issues
    const rolesToNotify: User['role'][] = ['ManagementCore', 'StandSupervisor'];
    
    // For emergencies, also notify Admin
    if (isEmergency) {
      if (!rolesToNotify.includes('Admin')) rolesToNotify.push('Admin');
    }

    // Get all users with matching roles
    const usersToNotify = await this.getUsersByRoles(rolesToNotify);
    
    // Create notifications for each user
    const notifications = usersToNotify.map(user => ({
      issueId,
      userId: user.id,
      isRead: false
    }));
    
    if (notifications.length > 0) {
      await db.insert(standIssueNotifications).values(notifications);
    }
  }

  // Manager Assignments
  async getManagerAssignments(eventDate: string): Promise<ManagerAssignment[]> {
    return await db.select().from(managerAssignments)
      .where(and(
        eq(managerAssignments.eventDate, eventDate),
        eq(managerAssignments.isActive, true)
      ));
  }

  async getAssignmentsByManager(managerId: string, eventDate: string): Promise<ManagerAssignment[]> {
    return await db.select().from(managerAssignments)
      .where(and(
        eq(managerAssignments.managerId, managerId),
        eq(managerAssignments.eventDate, eventDate),
        eq(managerAssignments.isActive, true)
      ));
  }

  async createManagerAssignment(assignment: InsertManagerAssignment): Promise<ManagerAssignment> {
    const [created] = await db.insert(managerAssignments).values(assignment).returning();
    return created;
  }

  async deactivateManagerAssignment(id: string): Promise<void> {
    await db.update(managerAssignments)
      .set({ isActive: false })
      .where(eq(managerAssignments.id, id));
  }

  // Geofence Events
  async createGeofenceEvent(event: InsertGeofenceEvent): Promise<GeofenceEvent> {
    const [created] = await db.insert(geofenceEvents).values(event).returning();
    return created;
  }

  async getRecentGeofenceEvents(userId: string): Promise<GeofenceEvent[]> {
    return await db.select().from(geofenceEvents)
      .where(eq(geofenceEvents.userId, userId))
      .orderBy(desc(geofenceEvents.createdAt))
      .limit(10);
  }

  async markGeofenceEventNotified(id: string, notifiedStandLead: boolean, notifiedSupervisor: boolean): Promise<void> {
    await db.update(geofenceEvents)
      .set({ notifiedStandLead, notifiedSupervisor })
      .where(eq(geofenceEvents.id, id));
  }

  // PIN Reset
  async updateUserPin(id: string, newPin: string): Promise<void> {
    await db.update(users)
      .set({ 
        pin: newPin, 
        requiresPinReset: false, 
        pinSetAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async getUsersRequiringPinReset(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.requiresPinReset, true));
  }

  // Closing Checklists
  async getClosingChecklist(standId: string, eventDate: string): Promise<ClosingChecklist | undefined> {
    const [checklist] = await db.select().from(closingChecklists)
      .where(and(
        eq(closingChecklists.standId, standId),
        eq(closingChecklists.eventDate, eventDate)
      ));
    return checklist || undefined;
  }

  async createClosingChecklist(checklist: InsertClosingChecklist): Promise<ClosingChecklist> {
    const [created] = await db.insert(closingChecklists).values(checklist).returning();
    
    // Create default tasks for this checklist
    const defaultTasks = DEFAULT_CLOSING_TASKS.map(task => ({
      checklistId: created.id,
      taskKey: task.key,
      taskLabel: task.label,
      isCompleted: false
    }));
    
    await db.insert(closingChecklistTasks).values(defaultTasks);
    
    return created;
  }

  async getClosingChecklistTasks(checklistId: string): Promise<ClosingChecklistTask[]> {
    return await db.select().from(closingChecklistTasks)
      .where(eq(closingChecklistTasks.checklistId, checklistId));
  }

  async toggleChecklistTask(taskId: string, isCompleted: boolean, remarks?: string): Promise<void> {
    await db.update(closingChecklistTasks)
      .set({ 
        isCompleted, 
        completedAt: isCompleted ? new Date() : null,
        remarks 
      })
      .where(eq(closingChecklistTasks.id, taskId));
  }

  async completeClosingChecklist(checklistId: string): Promise<void> {
    await db.update(closingChecklists)
      .set({ 
        isComplete: true,
        submittedAt: new Date()
      })
      .where(eq(closingChecklists.id, checklistId));
  }

  // Spoilage Reports
  async getSpoilageReport(standId: string, eventDate: string): Promise<SpoilageReport | undefined> {
    const [report] = await db.select().from(spoilageReports)
      .where(and(
        eq(spoilageReports.standId, standId),
        eq(spoilageReports.eventDate, eventDate)
      ));
    return report || undefined;
  }

  async createSpoilageReport(report: InsertSpoilageReport): Promise<SpoilageReport> {
    const [created] = await db.insert(spoilageReports).values(report).returning();
    return created;
  }

  async getSpoilageItems(reportId: string): Promise<SpoilageItem[]> {
    return await db.select().from(spoilageItems)
      .where(eq(spoilageItems.reportId, reportId));
  }

  async addSpoilageItem(item: InsertSpoilageItem): Promise<SpoilageItem> {
    const [created] = await db.insert(spoilageItems).values(item).returning();
    return created;
  }

  async removeSpoilageItem(itemId: string): Promise<void> {
    await db.delete(spoilageItems).where(eq(spoilageItems.id, itemId));
  }

  async submitSpoilageReport(reportId: string): Promise<void> {
    await db.update(spoilageReports)
      .set({ 
        isSubmitted: true,
        submittedAt: new Date()
      })
      .where(eq(spoilageReports.id, reportId));
  }

  // Voucher Reports
  async getVoucherReport(standId: string, eventDate: string): Promise<VoucherReport | undefined> {
    const [report] = await db.select().from(voucherReports)
      .where(and(
        eq(voucherReports.standId, standId),
        eq(voucherReports.eventDate, eventDate)
      ));
    return report || undefined;
  }

  async createVoucherReport(report: InsertVoucherReport): Promise<VoucherReport> {
    const [created] = await db.insert(voucherReports).values(report).returning();
    return created;
  }

  async updateVoucherReport(reportId: string, voucherCount: number, totalAmountCents: number, notes?: string): Promise<void> {
    await db.update(voucherReports)
      .set({ voucherCount, totalAmountCents, notes })
      .where(eq(voucherReports.id, reportId));
  }

  async submitVoucherReport(reportId: string): Promise<void> {
    await db.update(voucherReports)
      .set({ 
        isSubmitted: true,
        submittedAt: new Date()
      })
      .where(eq(voucherReports.id, reportId));
  }
}


export const storage = new DatabaseStorage();
