import { 
  users, stands, inventoryCounts, items, messages, npos, staffingGroups, supervisorDocs, docSignatures,
  quickMessages, conversations, conversationMessages, incidents, incidentNotifications, countSessions,
  standIssues, standIssueNotifications, managerAssignments, geofenceEvents, ISSUE_ROUTING_RULES,
  closingChecklists, closingChecklistTasks, spoilageReports, spoilageItems, voucherReports, DEFAULT_CLOSING_TASKS,
  documentSubmissions, menuBoards, menuSlides,
  warehouseCategories, warehouseProducts, warehouseStock, warehouseParLevels, warehouseRequests, warehouseRequestItems,
  auditLogs, emergencyAlerts, emergencyResponders, emergencyEscalationHistory, emergencyAlertNotifications,
  orbitRosters, orbitShifts, deliveryRequests, departmentContacts, alcoholViolations,
  standItems, managerDocuments, assetStamps, blockchainVerifications, complianceAlerts,
  supervisorSessions, supervisorActivity,
  type User, type InsertUser,
  type Stand, type InsertStand,
  type InventoryCount, type InsertInventoryCount,
  type Item, type InsertItem,
  type StandItem, type InsertStandItem,
  type ManagerDocument, type InsertManagerDocument,
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
  type VoucherReport, type InsertVoucherReport,
  type DocumentSubmission, type InsertDocumentSubmission,
  type MenuBoard, type InsertMenuBoard,
  type MenuSlide, type InsertMenuSlide,
  type WarehouseCategory, type InsertWarehouseCategory,
  type WarehouseProduct, type InsertWarehouseProduct,
  type WarehouseStock, type InsertWarehouseStock,
  type WarehouseParLevel, type InsertWarehouseParLevel,
  type WarehouseRequest, type InsertWarehouseRequest,
  type WarehouseRequestItem, type InsertWarehouseRequestItem,
  type AuditLog, type InsertAuditLog,
  type EmergencyAlert, type InsertEmergencyAlert,
  type EmergencyResponder, type InsertEmergencyResponder,
  type EmergencyEscalationHistory, type InsertEmergencyEscalationHistory,
  type EmergencyAlertNotification, type InsertEmergencyAlertNotification,
  type OrbitRoster, type InsertOrbitRoster,
  type OrbitShift, type InsertOrbitShift,
  type DepartmentContact, type InsertDepartmentContact,
  type AlcoholViolation, type InsertAlcoholViolation,
  type AssetStamp, type InsertAssetStamp,
  type BlockchainVerification, type InsertBlockchainVerification,
  type ComplianceAlert, type InsertComplianceAlert,
  type SupervisorSession, type InsertSupervisorSession,
  type SupervisorActivity, type InsertSupervisorActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, inArray, ilike, sql } from "drizzle-orm";

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
  assignTeamLead(userId: string, teamLeadId: string | null): Promise<void>;
  setTeamLeadStatus(userId: string, isTeamLead: boolean): Promise<void>;
  removeTeamLeadAssignments(teamLeadId: string): Promise<void>;

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
  deleteItem(id: string): Promise<void>;

  // Stand Items (inventory templates per stand)
  getStandItems(standId: string): Promise<Array<StandItem & { item: Item }>>;
  addStandItem(standItem: InsertStandItem): Promise<StandItem>;
  removeStandItem(standId: string, itemId: string): Promise<void>;
  clearStandItems(standId: string): Promise<void>;
  bulkAddStandItems(standId: string, itemIds: string[]): Promise<void>;
  getStandsWithItems(): Promise<string[]>;

  // Manager Documents Hub
  getManagerDocument(id: string): Promise<ManagerDocument | undefined>;
  getManagerDocuments(filters?: { category?: string; standId?: string; eventDate?: string }): Promise<ManagerDocument[]>;
  createManagerDocument(doc: InsertManagerDocument): Promise<ManagerDocument>;
  deleteManagerDocument(id: string): Promise<void>;

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

  // Document Submissions
  createDocumentSubmission(submission: InsertDocumentSubmission): Promise<DocumentSubmission>;
  getDocumentSubmissionsByRecipient(recipientRole: string): Promise<DocumentSubmission[]>;
  getDocumentSubmission(id: string): Promise<DocumentSubmission | undefined>;
  markDocumentSubmissionRead(id: string): Promise<void>;
  getUnreadDocumentCount(recipientRole: string): Promise<number>;
  getOperationsManagerId(): Promise<string | undefined>;

  // Menu Boards
  getAllMenuBoards(): Promise<MenuBoard[]>;
  getMenuBoard(id: string): Promise<MenuBoard | undefined>;
  createMenuBoard(board: InsertMenuBoard): Promise<MenuBoard>;
  updateMenuBoard(id: string, updates: Partial<InsertMenuBoard>): Promise<void>;
  deleteMenuBoard(id: string): Promise<void>;

  // Menu Slides
  getMenuSlides(boardId: string): Promise<MenuSlide[]>;
  saveMenuSlides(boardId: string, slides: Array<{ title: string; backgroundColor: string; backgroundImage?: string; content: any; slideOrder: number }>): Promise<MenuSlide[]>;

  // ============ WAREHOUSE INVENTORY SYSTEM ============
  // NOTE: This is a configurable example based on Nissan Stadium operations.
  // Categories, products, and par levels can be customized to match your specific workflow.

  // Warehouse Categories
  getAllWarehouseCategories(): Promise<WarehouseCategory[]>;
  getWarehouseCategory(id: string): Promise<WarehouseCategory | undefined>;
  createWarehouseCategory(category: InsertWarehouseCategory): Promise<WarehouseCategory>;
  updateWarehouseCategory(id: string, updates: Partial<InsertWarehouseCategory>): Promise<void>;
  deleteWarehouseCategory(id: string): Promise<void>;

  // Warehouse Products
  getAllWarehouseProducts(): Promise<WarehouseProduct[]>;
  getWarehouseProductsByCategory(categoryId: string): Promise<WarehouseProduct[]>;
  getWarehouseProduct(id: string): Promise<WarehouseProduct | undefined>;
  createWarehouseProduct(product: InsertWarehouseProduct): Promise<WarehouseProduct>;
  updateWarehouseProduct(id: string, updates: Partial<InsertWarehouseProduct>): Promise<void>;
  deleteWarehouseProduct(id: string): Promise<void>;

  // Warehouse Stock
  getWarehouseStockByProduct(productId: string): Promise<WarehouseStock[]>;
  getAllWarehouseStock(): Promise<WarehouseStock[]>;
  updateWarehouseStock(productId: string, quantity: number, userId?: string): Promise<void>;
  createWarehouseStock(stock: InsertWarehouseStock): Promise<WarehouseStock>;

  // Warehouse Par Levels
  getParLevelsByStand(standId: string): Promise<WarehouseParLevel[]>;
  getParLevelsByProduct(productId: string): Promise<WarehouseParLevel[]>;
  createParLevel(parLevel: InsertWarehouseParLevel): Promise<WarehouseParLevel>;
  updateParLevel(id: string, updates: Partial<InsertWarehouseParLevel>): Promise<void>;
  deleteParLevel(id: string): Promise<void>;

  // Warehouse Requests
  getAllWarehouseRequests(): Promise<WarehouseRequest[]>;
  getWarehouseRequestsByStand(standId: string): Promise<WarehouseRequest[]>;
  getWarehouseRequestsByStatus(status: 'Pending' | 'Approved' | 'Picking' | 'InTransit' | 'Delivered' | 'Confirmed' | 'Cancelled'): Promise<WarehouseRequest[]>;
  getPendingWarehouseRequests(): Promise<WarehouseRequest[]>;
  getWarehouseRequest(id: string): Promise<WarehouseRequest | undefined>;
  createWarehouseRequest(request: InsertWarehouseRequest): Promise<WarehouseRequest>;
  updateWarehouseRequestStatus(id: string, status: WarehouseRequest['status'], userId: string): Promise<void>;

  // Warehouse Request Items
  getWarehouseRequestItems(requestId: string): Promise<WarehouseRequestItem[]>;
  addWarehouseRequestItem(item: InsertWarehouseRequestItem): Promise<WarehouseRequestItem>;
  updateWarehouseRequestItem(id: string, updates: Partial<InsertWarehouseRequestItem>): Promise<void>;

  // Low Stock Alerts
  getLowStockProducts(): Promise<Array<{ product: WarehouseProduct; stock: WarehouseStock; parLevel?: WarehouseParLevel }>>;

  // Seed example data
  seedExampleWarehouseData(): Promise<void>;

  // ============ AUDIT LOGS ============
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string, limit?: number): Promise<AuditLog[]>;
  getAuditLogsByAction(action: AuditLog['action'], limit?: number): Promise<AuditLog[]>;

  // ============ EMERGENCY COMMAND CENTER ============
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getActiveEmergencyAlerts(): Promise<EmergencyAlert[]>;
  getAllEmergencyAlerts(): Promise<EmergencyAlert[]>;
  getEmergencyAlert(id: string): Promise<EmergencyAlert | undefined>;
  acknowledgeEmergencyAlert(id: string, userId: string): Promise<void>;
  resolveEmergencyAlert(id: string, userId: string, notes?: string, resolutionType?: string): Promise<void>;
  updateEmergencyAlertStatus(id: string, status: EmergencyAlert['status'], userId?: string): Promise<void>;
  assignResponderToAlert(alertId: string, responderId: string, eta?: number): Promise<void>;
  escalateEmergencyAlert(alertId: string, toLevel: EmergencyAlert['escalationLevel'], reason: string, escalatedBy?: string): Promise<void>;
  getEmergencyAlertsByStatus(status: EmergencyAlert['status']): Promise<EmergencyAlert[]>;
  getEmergencyAlertsNeedingEscalation(): Promise<EmergencyAlert[]>;
  
  // Emergency Responders
  createEmergencyResponder(responder: InsertEmergencyResponder): Promise<EmergencyResponder>;
  getEmergencyResponder(id: string): Promise<EmergencyResponder | undefined>;
  getEmergencyResponderByUser(userId: string): Promise<EmergencyResponder | undefined>;
  getOnDutyResponders(): Promise<EmergencyResponder[]>;
  getAvailableRespondersForType(type: string): Promise<EmergencyResponder[]>;
  updateResponderDutyStatus(id: string, isOnDuty: boolean): Promise<void>;
  updateResponderLocation(id: string, location: string, gpsLat?: string, gpsLng?: string): Promise<void>;
  
  // Escalation History
  createEscalationHistory(history: InsertEmergencyEscalationHistory): Promise<EmergencyEscalationHistory>;
  getEscalationHistoryByAlert(alertId: string): Promise<EmergencyEscalationHistory[]>;
  
  // Alert Notifications
  createAlertNotification(notification: InsertEmergencyAlertNotification): Promise<EmergencyAlertNotification>;
  getUnreadAlertNotifications(userId: string): Promise<EmergencyAlertNotification[]>;
  markAlertNotificationRead(id: string): Promise<void>;
  markAlertNotificationResponded(id: string): Promise<void>;

  // ============ ORBIT STAFFING INTEGRATION ============
  createOrbitRoster(roster: InsertOrbitRoster): Promise<OrbitRoster>;
  getAllOrbitRosters(): Promise<OrbitRoster[]>;
  getOrbitRoster(id: string): Promise<OrbitRoster | undefined>;
  getOrbitRosterByEventDate(eventDate: string): Promise<OrbitRoster | undefined>;
  updateOrbitRosterSyncStatus(id: string, status: OrbitRoster['syncStatus']): Promise<void>;
  createOrbitShift(shift: InsertOrbitShift): Promise<OrbitShift>;
  getOrbitShiftsByRoster(rosterId: string): Promise<OrbitShift[]>;
  getOrbitShiftsByUser(userId: string): Promise<OrbitShift[]>;
  checkInOrbitShift(id: string, gpsVerified?: boolean): Promise<void>;
  checkOutOrbitShift(id: string): Promise<void>;

  // ============ DELIVERY REQUESTS (Enhanced) ============
  getDeliveryRequest(id: string): Promise<any | undefined>;
  getAllDeliveryRequests(): Promise<any[]>;
  getDeliveryRequestsByStatus(status: string): Promise<any[]>;
  getDeliveryRequestsByDepartment(department: string): Promise<any[]>;
  createDeliveryRequest(request: any): Promise<any>;
  updateDeliveryRequestStatus(id: string, status: string, userId: string, eta?: number): Promise<void>;

  // ============ DEPARTMENT CONTACTS (Quick Call Feature) ============
  getAllDepartmentContacts(): Promise<DepartmentContact[]>;
  getDepartmentContact(department: string): Promise<DepartmentContact | undefined>;
  updateDepartmentContact(department: string, updates: Partial<InsertDepartmentContact>): Promise<void>;
  createDepartmentContact(contact: InsertDepartmentContact): Promise<DepartmentContact>;

  // ============ ALCOHOL VIOLATIONS (Compliance Reporting) ============
  getAlcoholViolation(id: string): Promise<AlcoholViolation | undefined>;
  getAllAlcoholViolations(): Promise<AlcoholViolation[]>;
  getAlcoholViolationsByStatus(status: string): Promise<AlcoholViolation[]>;
  getAlcoholViolationsByReporter(reporterId: string): Promise<AlcoholViolation[]>;
  createAlcoholViolation(violation: InsertAlcoholViolation): Promise<AlcoholViolation>;
  updateAlcoholViolationStatus(id: string, status: string, reviewerId?: string, reviewNotes?: string): Promise<void>;
  resolveAlcoholViolation(id: string, resolverId: string, notes: string, actionTaken: string): Promise<void>;

  // Asset Stamps (Hallmark System)
  getAssetStamp(id: string): Promise<AssetStamp | undefined>;
  getAssetStampByNumber(assetNumber: string): Promise<AssetStamp | undefined>;
  getAllAssetStamps(): Promise<AssetStamp[]>;
  getAssetStampsByCategory(category: string): Promise<AssetStamp[]>;
  searchAssetStamps(query: string): Promise<AssetStamp[]>;
  getNextAssetNumber(): Promise<string>;
  createAssetStamp(stamp: InsertAssetStamp): Promise<AssetStamp>;
  updateAssetStampBlockchain(id: string, network: string, txSignature: string): Promise<void>;
  getAssetStampStats(): Promise<{ total: number; byCategory: Record<string, number>; blockchain: number }>;

  // Blockchain Verifications
  getBlockchainVerification(id: string): Promise<BlockchainVerification | undefined>;
  getBlockchainVerificationsByEntity(entityType: string, entityId: string): Promise<BlockchainVerification[]>;
  getPendingBlockchainVerifications(): Promise<BlockchainVerification[]>;
  createBlockchainVerification(verification: InsertBlockchainVerification): Promise<BlockchainVerification>;
  updateBlockchainVerificationStatus(id: string, status: string, txSignature?: string, errorMessage?: string): Promise<void>;

  // Compliance Alerts (ABC Board & Health Department)
  getComplianceAlert(id: string): Promise<ComplianceAlert | undefined>;
  getAllComplianceAlerts(): Promise<ComplianceAlert[]>;
  getActiveComplianceAlerts(): Promise<ComplianceAlert[]>;
  getComplianceAlertsByType(alertType: string): Promise<ComplianceAlert[]>;
  createComplianceAlert(alert: InsertComplianceAlert): Promise<ComplianceAlert>;
  resolveComplianceAlert(id: string, resolvedById: string): Promise<void>;
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

  async assignTeamLead(userId: string, teamLeadId: string | null): Promise<void> {
    await db.update(users).set({ teamLeadId }).where(eq(users.id, userId));
  }

  async setTeamLeadStatus(userId: string, isTeamLead: boolean): Promise<void> {
    await db.update(users).set({ isTeamLead }).where(eq(users.id, userId));
  }

  async removeTeamLeadAssignments(teamLeadId: string): Promise<void> {
    await db.update(users).set({ teamLeadId: null }).where(eq(users.teamLeadId, teamLeadId));
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

  async deleteItem(id: string): Promise<void> {
    await db.delete(standItems).where(eq(standItems.itemId, id));
    await db.delete(items).where(eq(items.id, id));
  }

  // Stand Items (inventory templates per stand)
  async getStandItems(standId: string): Promise<Array<StandItem & { item: Item }>> {
    const results = await db
      .select()
      .from(standItems)
      .innerJoin(items, eq(standItems.itemId, items.id))
      .where(eq(standItems.standId, standId))
      .orderBy(asc(standItems.sortOrder));
    
    return results.map(r => ({
      ...r.stand_items,
      item: r.items
    }));
  }

  async addStandItem(standItem: InsertStandItem): Promise<StandItem> {
    const [result] = await db.insert(standItems).values(standItem).returning();
    return result;
  }

  async removeStandItem(standId: string, itemId: string): Promise<void> {
    await db.delete(standItems).where(
      and(eq(standItems.standId, standId), eq(standItems.itemId, itemId))
    );
  }

  async clearStandItems(standId: string): Promise<void> {
    await db.delete(standItems).where(eq(standItems.standId, standId));
  }

  async bulkAddStandItems(standId: string, itemIds: string[]): Promise<void> {
    if (itemIds.length === 0) return;
    
    const inserts = itemIds.map((itemId, index) => ({
      standId,
      itemId,
      sortOrder: index,
      isChargeable: true
    }));
    
    await db.insert(standItems).values(inserts);
  }

  async getStandsWithItems(): Promise<string[]> {
    const results = await db
      .selectDistinct({ standId: standItems.standId })
      .from(standItems);
    return results.map(r => r.standId);
  }

  // Manager Documents Hub
  async getManagerDocument(id: string): Promise<ManagerDocument | undefined> {
    const [doc] = await db.select().from(managerDocuments).where(eq(managerDocuments.id, id));
    return doc;
  }

  async getManagerDocuments(filters?: { category?: string; standId?: string; eventDate?: string }): Promise<ManagerDocument[]> {
    let query = db.select().from(managerDocuments);
    
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(managerDocuments.category, filters.category));
    }
    if (filters?.standId) {
      conditions.push(eq(managerDocuments.standId, filters.standId));
    }
    if (filters?.eventDate) {
      conditions.push(eq(managerDocuments.eventDate, filters.eventDate));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(managerDocuments).where(and(...conditions)).orderBy(desc(managerDocuments.createdAt));
    }
    
    return await db.select().from(managerDocuments).orderBy(desc(managerDocuments.createdAt));
  }

  async createManagerDocument(doc: InsertManagerDocument): Promise<ManagerDocument> {
    const [result] = await db.insert(managerDocuments).values(doc).returning();
    return result;
  }

  async deleteManagerDocument(id: string): Promise<void> {
    await db.delete(managerDocuments).where(eq(managerDocuments.id, id));
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

  // Document Submissions
  async createDocumentSubmission(submission: InsertDocumentSubmission): Promise<DocumentSubmission> {
    const [created] = await db.insert(documentSubmissions).values(submission).returning();
    return created;
  }

  async getDocumentSubmissionsByRecipient(recipientRole: string): Promise<DocumentSubmission[]> {
    return await db.select().from(documentSubmissions)
      .where(eq(documentSubmissions.recipientRole, recipientRole))
      .orderBy(desc(documentSubmissions.submittedAt));
  }

  async getDocumentSubmission(id: string): Promise<DocumentSubmission | undefined> {
    const [submission] = await db.select().from(documentSubmissions)
      .where(eq(documentSubmissions.id, id));
    return submission || undefined;
  }

  async markDocumentSubmissionRead(id: string): Promise<void> {
    await db.update(documentSubmissions)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(documentSubmissions.id, id));
  }

  async getUnreadDocumentCount(recipientRole: string): Promise<number> {
    const unread = await db.select().from(documentSubmissions)
      .where(and(
        eq(documentSubmissions.recipientRole, recipientRole),
        eq(documentSubmissions.isRead, false)
      ));
    return unread.length;
  }

  async getOperationsManagerId(): Promise<string | undefined> {
    const [opsMgr] = await db.select().from(users)
      .where(and(
        eq(users.role, 'ManagementCore'),
        eq(users.managementType, 'OperationsManager')
      ));
    return opsMgr?.id;
  }

  // Menu Boards
  async getAllMenuBoards(): Promise<MenuBoard[]> {
    return await db.select().from(menuBoards).orderBy(desc(menuBoards.updatedAt));
  }

  async getMenuBoard(id: string): Promise<MenuBoard | undefined> {
    const [board] = await db.select().from(menuBoards).where(eq(menuBoards.id, id));
    return board || undefined;
  }

  async createMenuBoard(board: InsertMenuBoard): Promise<MenuBoard> {
    const [created] = await db.insert(menuBoards).values(board).returning();
    return created;
  }

  async updateMenuBoard(id: string, updates: Partial<InsertMenuBoard>): Promise<void> {
    await db.update(menuBoards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(menuBoards.id, id));
  }

  async deleteMenuBoard(id: string): Promise<void> {
    await db.delete(menuSlides).where(eq(menuSlides.menuBoardId, id));
    await db.delete(menuBoards).where(eq(menuBoards.id, id));
  }

  // Menu Slides
  async getMenuSlides(boardId: string): Promise<MenuSlide[]> {
    return await db.select().from(menuSlides)
      .where(eq(menuSlides.menuBoardId, boardId))
      .orderBy(asc(menuSlides.slideOrder));
  }

  async saveMenuSlides(boardId: string, slides: Array<{ title: string; backgroundColor: string; backgroundImage?: string; content: any; slideOrder: number }>): Promise<MenuSlide[]> {
    await db.delete(menuSlides).where(eq(menuSlides.menuBoardId, boardId));
    if (slides.length === 0) return [];
    
    const slidesToInsert = slides.map((slide, index) => ({
      menuBoardId: boardId,
      title: slide.title,
      backgroundColor: slide.backgroundColor,
      backgroundImage: slide.backgroundImage,
      content: slide.content,
      slideOrder: index
    }));
    
    const created = await db.insert(menuSlides).values(slidesToInsert).returning();
    await db.update(menuBoards).set({ updatedAt: new Date() }).where(eq(menuBoards.id, boardId));
    return created;
  }

  // ============ WAREHOUSE INVENTORY SYSTEM ============
  // NOTE: This is a configurable example based on Nissan Stadium operations.
  // Categories, products, and par levels can be customized to match your specific workflow.

  // Warehouse Categories
  async getAllWarehouseCategories(): Promise<WarehouseCategory[]> {
    return await db.select().from(warehouseCategories)
      .where(eq(warehouseCategories.isActive, true))
      .orderBy(asc(warehouseCategories.sortOrder));
  }

  async getWarehouseCategory(id: string): Promise<WarehouseCategory | undefined> {
    const [category] = await db.select().from(warehouseCategories).where(eq(warehouseCategories.id, id));
    return category || undefined;
  }

  async createWarehouseCategory(category: InsertWarehouseCategory): Promise<WarehouseCategory> {
    const [created] = await db.insert(warehouseCategories).values(category).returning();
    return created;
  }

  async updateWarehouseCategory(id: string, updates: Partial<InsertWarehouseCategory>): Promise<void> {
    await db.update(warehouseCategories).set(updates).where(eq(warehouseCategories.id, id));
  }

  async deleteWarehouseCategory(id: string): Promise<void> {
    await db.update(warehouseCategories).set({ isActive: false }).where(eq(warehouseCategories.id, id));
  }

  // Warehouse Products
  async getAllWarehouseProducts(): Promise<WarehouseProduct[]> {
    return await db.select().from(warehouseProducts)
      .where(eq(warehouseProducts.isActive, true))
      .orderBy(asc(warehouseProducts.name));
  }

  async getWarehouseProductsByCategory(categoryId: string): Promise<WarehouseProduct[]> {
    return await db.select().from(warehouseProducts)
      .where(and(
        eq(warehouseProducts.categoryId, categoryId),
        eq(warehouseProducts.isActive, true)
      ))
      .orderBy(asc(warehouseProducts.name));
  }

  async getWarehouseProduct(id: string): Promise<WarehouseProduct | undefined> {
    const [product] = await db.select().from(warehouseProducts).where(eq(warehouseProducts.id, id));
    return product || undefined;
  }

  async createWarehouseProduct(product: InsertWarehouseProduct): Promise<WarehouseProduct> {
    const [created] = await db.insert(warehouseProducts).values(product).returning();
    return created;
  }

  async updateWarehouseProduct(id: string, updates: Partial<InsertWarehouseProduct>): Promise<void> {
    await db.update(warehouseProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(warehouseProducts.id, id));
  }

  async deleteWarehouseProduct(id: string): Promise<void> {
    await db.update(warehouseProducts).set({ isActive: false }).where(eq(warehouseProducts.id, id));
  }

  // Warehouse Stock
  async getWarehouseStockByProduct(productId: string): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock)
      .where(eq(warehouseStock.productId, productId));
  }

  async getAllWarehouseStock(): Promise<WarehouseStock[]> {
    return await db.select().from(warehouseStock);
  }

  async updateWarehouseStock(productId: string, quantity: number, userId?: string): Promise<void> {
    const [existing] = await db.select().from(warehouseStock)
      .where(eq(warehouseStock.productId, productId));
    
    if (existing) {
      await db.update(warehouseStock)
        .set({ 
          quantity, 
          updatedAt: new Date(),
          lastCountedAt: new Date(),
          lastCountedBy: userId || null
        })
        .where(eq(warehouseStock.productId, productId));
    } else {
      await db.insert(warehouseStock).values({
        productId,
        quantity,
        lastCountedAt: new Date(),
        lastCountedBy: userId || null
      });
    }
  }

  async createWarehouseStock(stock: InsertWarehouseStock): Promise<WarehouseStock> {
    const [created] = await db.insert(warehouseStock).values(stock).returning();
    return created;
  }

  // Warehouse Par Levels
  async getParLevelsByStand(standId: string): Promise<WarehouseParLevel[]> {
    return await db.select().from(warehouseParLevels)
      .where(eq(warehouseParLevels.standId, standId));
  }

  async getParLevelsByProduct(productId: string): Promise<WarehouseParLevel[]> {
    return await db.select().from(warehouseParLevels)
      .where(eq(warehouseParLevels.productId, productId));
  }

  async createParLevel(parLevel: InsertWarehouseParLevel): Promise<WarehouseParLevel> {
    const [created] = await db.insert(warehouseParLevels).values(parLevel).returning();
    return created;
  }

  async updateParLevel(id: string, updates: Partial<InsertWarehouseParLevel>): Promise<void> {
    await db.update(warehouseParLevels).set(updates).where(eq(warehouseParLevels.id, id));
  }

  async deleteParLevel(id: string): Promise<void> {
    await db.delete(warehouseParLevels).where(eq(warehouseParLevels.id, id));
  }

  // Warehouse Requests
  async getAllWarehouseRequests(): Promise<WarehouseRequest[]> {
    return await db.select().from(warehouseRequests)
      .orderBy(desc(warehouseRequests.createdAt));
  }

  async getWarehouseRequestsByStand(standId: string): Promise<WarehouseRequest[]> {
    return await db.select().from(warehouseRequests)
      .where(eq(warehouseRequests.standId, standId))
      .orderBy(desc(warehouseRequests.createdAt));
  }

  async getWarehouseRequestsByStatus(status: 'Pending' | 'Approved' | 'Picking' | 'InTransit' | 'Delivered' | 'Confirmed' | 'Cancelled'): Promise<WarehouseRequest[]> {
    return await db.select().from(warehouseRequests)
      .where(eq(warehouseRequests.status, status))
      .orderBy(desc(warehouseRequests.createdAt));
  }

  async getPendingWarehouseRequests(): Promise<WarehouseRequest[]> {
    return await db.select().from(warehouseRequests)
      .where(or(
        eq(warehouseRequests.status, 'Pending'),
        eq(warehouseRequests.status, 'Approved'),
        eq(warehouseRequests.status, 'Picking'),
        eq(warehouseRequests.status, 'InTransit')
      ))
      .orderBy(desc(warehouseRequests.createdAt));
  }

  async getWarehouseRequest(id: string): Promise<WarehouseRequest | undefined> {
    const [request] = await db.select().from(warehouseRequests)
      .where(eq(warehouseRequests.id, id));
    return request || undefined;
  }

  async createWarehouseRequest(request: InsertWarehouseRequest): Promise<WarehouseRequest> {
    const [created] = await db.insert(warehouseRequests).values(request).returning();
    return created;
  }

  async updateWarehouseRequestStatus(id: string, status: WarehouseRequest['status'], userId: string): Promise<void> {
    const updates: Partial<WarehouseRequest> = { status };
    const now = new Date();
    
    switch (status) {
      case 'Approved':
        updates.approvedAt = now;
        updates.approvedById = userId;
        break;
      case 'Picking':
        updates.pickedAt = now;
        updates.pickedById = userId;
        break;
      case 'InTransit':
        updates.deliveredAt = now;
        updates.deliveredById = userId;
        break;
      case 'Delivered':
        updates.deliveredAt = now;
        updates.deliveredById = userId;
        break;
      case 'Confirmed':
        updates.confirmedAt = now;
        updates.confirmedById = userId;
        break;
    }
    
    await db.update(warehouseRequests).set(updates).where(eq(warehouseRequests.id, id));
  }

  // Warehouse Request Items
  async getWarehouseRequestItems(requestId: string): Promise<WarehouseRequestItem[]> {
    return await db.select().from(warehouseRequestItems)
      .where(eq(warehouseRequestItems.requestId, requestId));
  }

  async addWarehouseRequestItem(item: InsertWarehouseRequestItem): Promise<WarehouseRequestItem> {
    const [created] = await db.insert(warehouseRequestItems).values(item).returning();
    return created;
  }

  async updateWarehouseRequestItem(id: string, updates: Partial<InsertWarehouseRequestItem>): Promise<void> {
    await db.update(warehouseRequestItems).set(updates).where(eq(warehouseRequestItems.id, id));
  }

  // Low Stock Alerts
  async getLowStockProducts(): Promise<Array<{ product: WarehouseProduct; stock: WarehouseStock; parLevel?: WarehouseParLevel }>> {
    const allProducts = await this.getAllWarehouseProducts();
    const allStock = await this.getAllWarehouseStock();
    const allParLevels = await db.select().from(warehouseParLevels);
    
    const lowStockItems: Array<{ product: WarehouseProduct; stock: WarehouseStock; parLevel?: WarehouseParLevel }> = [];
    
    for (const product of allProducts) {
      const stockEntry = allStock.find(s => s.productId === product.id);
      if (!stockEntry) continue;
      
      const parLevel = allParLevels.find(p => p.productId === product.id && !p.standId);
      
      if (parLevel && stockEntry.quantity <= parLevel.reorderPoint!) {
        lowStockItems.push({ product, stock: stockEntry, parLevel });
      }
    }
    
    return lowStockItems;
  }

  // Seed example warehouse data based on Nissan Stadium ordering cheat sheet
  async seedExampleWarehouseData(): Promise<void> {
    const existingCategories = await db.select().from(warehouseCategories);
    if (existingCategories.length > 0) return;

    const categoryData = [
      { name: 'Beverages - Canned', description: 'Canned drinks including beer and soda', color: '#3B82F6', icon: 'Beer', sortOrder: 1 },
      { name: 'Beverages - Bottled', description: 'Bottled water and specialty drinks', color: '#0EA5E9', icon: 'Droplet', sortOrder: 2 },
      { name: 'Beverages - Fountain/BIB', description: 'Bag-in-box fountain drinks', color: '#06B6D4', icon: 'Coffee', sortOrder: 3 },
      { name: 'Beverages - Draft Beer', description: 'Kegs and draft equipment', color: '#F59E0B', icon: 'Beer', sortOrder: 4 },
      { name: 'Beverages - Wine & Liquor', description: 'Wine, liquor, and bar mixers', color: '#8B5CF6', icon: 'Wine', sortOrder: 5 },
      { name: 'Food - Hot Dogs & Buns', description: 'Hot dogs, hamburger buns, sausages', color: '#EF4444', icon: 'Sandwich', sortOrder: 6 },
      { name: 'Food - Nachos & Cheese', description: 'Nacho chips and cheese sauce', color: '#F97316', icon: 'Pizza', sortOrder: 7 },
      { name: 'Food - Pretzels & Snacks', description: 'Pretzels, candy, chips', color: '#84CC16', icon: 'Cookie', sortOrder: 8 },
      { name: 'Food - Fried Items', description: 'Fries, corn dogs, chicken tenders', color: '#EAB308', icon: 'Flame', sortOrder: 9 },
      { name: 'Paper Goods', description: 'Cups, boats, trays, boxes, foil wrap', color: '#6B7280', icon: 'Package', sortOrder: 10 },
      { name: 'Condiments', description: 'Ketchup, mustard, mayo, ranch, BBQ', color: '#10B981', icon: 'Droplet', sortOrder: 11 },
      { name: 'Supplies', description: 'Fryer oil, popcorn supplies, etc.', color: '#64748B', icon: 'Wrench', sortOrder: 12 },
    ];

    for (const cat of categoryData) {
      await this.createWarehouseCategory(cat);
    }

    const categories = await this.getAllWarehouseCategories();
    const findCat = (name: string) => categories.find(c => c.name === name)?.id;

    const productData = [
      { categoryId: findCat('Beverages - Canned'), name: 'Bud Light 16oz', sku: 'BL-16', unit: 'case', unitsPerCase: 24 },
      { categoryId: findCat('Beverages - Canned'), name: 'Miller Lite 16oz', sku: 'ML-16', unit: 'case', unitsPerCase: 24 },
      { categoryId: findCat('Beverages - Canned'), name: 'Michelob Ultra 16oz', sku: 'MU-16', unit: 'case', unitsPerCase: 24 },
      { categoryId: findCat('Beverages - Canned'), name: 'Coca-Cola 12oz', sku: 'CC-12', unit: 'case', unitsPerCase: 24 },
      { categoryId: findCat('Beverages - Canned'), name: 'Diet Coke 12oz', sku: 'DC-12', unit: 'case', unitsPerCase: 24 },
      { categoryId: findCat('Beverages - Canned'), name: 'Sprite 12oz', sku: 'SP-12', unit: 'case', unitsPerCase: 24 },
      { categoryId: findCat('Beverages - Bottled'), name: 'Dasani Water 20oz', sku: 'DW-20', unit: 'case', unitsPerCase: 24 },
      { categoryId: findCat('Beverages - Fountain/BIB'), name: 'Coca-Cola BIB 5gal', sku: 'CC-BIB', unit: 'box', unitsPerCase: 1 },
      { categoryId: findCat('Beverages - Fountain/BIB'), name: 'Diet Coke BIB 5gal', sku: 'DC-BIB', unit: 'box', unitsPerCase: 1 },
      { categoryId: findCat('Beverages - Draft Beer'), name: 'Bud Light Keg 1/2 BBL', sku: 'BL-KEG', unit: 'keg', unitsPerCase: 1 },
      { categoryId: findCat('Beverages - Wine & Liquor'), name: 'House Red Wine', sku: 'HRW', unit: 'bottle', unitsPerCase: 12 },
      { categoryId: findCat('Beverages - Wine & Liquor'), name: 'Jack Daniels 750ml', sku: 'JD-750', unit: 'bottle', unitsPerCase: 12 },
      { categoryId: findCat('Food - Hot Dogs & Buns'), name: 'All-Beef Hot Dogs', sku: 'HD-BEEF', unit: 'pack', unitsPerCase: 48, isPerishable: true, shelfLifeDays: 14 },
      { categoryId: findCat('Food - Hot Dogs & Buns'), name: 'Hot Dog Buns', sku: 'HD-BUN', unit: 'pack', unitsPerCase: 48, isPerishable: true, shelfLifeDays: 5 },
      { categoryId: findCat('Food - Hot Dogs & Buns'), name: 'Hamburger Patties', sku: 'HB-PAT', unit: 'case', unitsPerCase: 80, isPerishable: true, shelfLifeDays: 7 },
      { categoryId: findCat('Food - Nachos & Cheese'), name: 'Nacho Chips Bulk', sku: 'NC-BULK', unit: 'bag', unitsPerCase: 6 },
      { categoryId: findCat('Food - Nachos & Cheese'), name: 'Nacho Cheese Sauce', sku: 'NC-SAUCE', unit: 'bag', unitsPerCase: 4, isPerishable: true, shelfLifeDays: 30 },
      { categoryId: findCat('Food - Pretzels & Snacks'), name: 'Soft Pretzels', sku: 'PRET', unit: 'case', unitsPerCase: 50, isPerishable: true, shelfLifeDays: 3 },
      { categoryId: findCat('Food - Pretzels & Snacks'), name: 'Candy Bars Assorted', sku: 'CANDY', unit: 'box', unitsPerCase: 48 },
      { categoryId: findCat('Food - Fried Items'), name: 'French Fries Frozen', sku: 'FF-FRZ', unit: 'bag', unitsPerCase: 6, isPerishable: true, shelfLifeDays: 90 },
      { categoryId: findCat('Food - Fried Items'), name: 'Chicken Tenders', sku: 'CT', unit: 'case', unitsPerCase: 40, isPerishable: true, shelfLifeDays: 7 },
      { categoryId: findCat('Food - Fried Items'), name: 'Corn Dogs', sku: 'CDOG', unit: 'case', unitsPerCase: 48, isPerishable: true, shelfLifeDays: 14 },
      { categoryId: findCat('Paper Goods'), name: 'Cups 16oz', sku: 'CUP-16', unit: 'sleeve', unitsPerCase: 50 },
      { categoryId: findCat('Paper Goods'), name: 'Cups 22oz', sku: 'CUP-22', unit: 'sleeve', unitsPerCase: 50 },
      { categoryId: findCat('Paper Goods'), name: 'Food Boats Large', sku: 'BOAT-L', unit: 'pack', unitsPerCase: 250 },
      { categoryId: findCat('Paper Goods'), name: 'Nacho Trays', sku: 'TRAY-N', unit: 'pack', unitsPerCase: 500 },
      { categoryId: findCat('Paper Goods'), name: 'Clamshell Boxes', sku: 'CLAM', unit: 'pack', unitsPerCase: 200 },
      { categoryId: findCat('Condiments'), name: 'Ketchup Packets', sku: 'KETCH-PKT', unit: 'case', unitsPerCase: 500 },
      { categoryId: findCat('Condiments'), name: 'Mustard Packets', sku: 'MUST-PKT', unit: 'case', unitsPerCase: 500 },
      { categoryId: findCat('Condiments'), name: 'Mayo Packets', sku: 'MAYO-PKT', unit: 'case', unitsPerCase: 500 },
      { categoryId: findCat('Condiments'), name: 'Ranch Cups', sku: 'RANCH', unit: 'case', unitsPerCase: 100 },
      { categoryId: findCat('Supplies'), name: 'Fryer Oil 35lb', sku: 'OIL-35', unit: 'jug', unitsPerCase: 1 },
      { categoryId: findCat('Supplies'), name: 'Popcorn Kernels', sku: 'POP-KERN', unit: 'bag', unitsPerCase: 50 },
      { categoryId: findCat('Supplies'), name: 'Popcorn Salt', sku: 'POP-SALT', unit: 'box', unitsPerCase: 1 },
    ];

    for (const prod of productData) {
      if (prod.categoryId) {
        await this.createWarehouseProduct(prod);
      }
    }

    const products = await this.getAllWarehouseProducts();
    for (const product of products) {
      const randomQty = Math.floor(Math.random() * 50) + 10;
      await this.createWarehouseStock({
        productId: product.id,
        quantity: randomQty,
        location: 'Main Warehouse'
      });
    }
  }

  // ============ AUDIT LOGS ============
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  async getAuditLogsByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByAction(action: AuditLog['action'], limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.action, action))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // ============ EMERGENCY COMMAND CENTER ============
  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [created] = await db.insert(emergencyAlerts).values({
      ...alert,
      status: 'Reported',
      escalationLevel: 'Level1'
    }).returning();
    return created;
  }

  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts)
      .where(eq(emergencyAlerts.isActive, true))
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  async getAllEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts).orderBy(desc(emergencyAlerts.createdAt));
  }

  async getEmergencyAlert(id: string): Promise<EmergencyAlert | undefined> {
    const [alert] = await db.select().from(emergencyAlerts).where(eq(emergencyAlerts.id, id));
    return alert || undefined;
  }

  async acknowledgeEmergencyAlert(id: string, userId: string): Promise<void> {
    await db.update(emergencyAlerts).set({
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
      status: 'Dispatched',
      updatedAt: new Date()
    }).where(eq(emergencyAlerts.id, id));
  }

  async resolveEmergencyAlert(id: string, userId: string, notes?: string, resolutionType?: string): Promise<void> {
    await db.update(emergencyAlerts).set({
      isActive: false,
      resolvedBy: userId,
      resolvedAt: new Date(),
      resolutionNotes: notes,
      resolutionType: resolutionType,
      status: 'Resolved',
      updatedAt: new Date()
    }).where(eq(emergencyAlerts.id, id));
  }

  async updateEmergencyAlertStatus(id: string, status: EmergencyAlert['status'], userId?: string): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    
    if (status === 'OnScene') {
      updates.arrivedAt = new Date();
    } else if (status === 'Stabilized') {
      updates.stabilizedAt = new Date();
    }
    
    await db.update(emergencyAlerts).set(updates).where(eq(emergencyAlerts.id, id));
  }

  async assignResponderToAlert(alertId: string, responderId: string, eta?: number): Promise<void> {
    await db.update(emergencyAlerts).set({
      assignedResponderId: responderId,
      assignedAt: new Date(),
      responderEta: eta,
      status: 'Dispatched',
      updatedAt: new Date()
    }).where(eq(emergencyAlerts.id, alertId));
  }

  async escalateEmergencyAlert(alertId: string, toLevel: EmergencyAlert['escalationLevel'], reason: string, escalatedBy?: string): Promise<void> {
    const alert = await this.getEmergencyAlert(alertId);
    if (!alert) return;
    
    await db.update(emergencyAlerts).set({
      escalationLevel: toLevel,
      lastEscalatedAt: new Date(),
      status: 'Escalated',
      updatedAt: new Date()
    }).where(eq(emergencyAlerts.id, alertId));
    
    await db.insert(emergencyEscalationHistory).values({
      alertId,
      fromLevel: alert.escalationLevel || 'Level1',
      toLevel,
      reason,
      escalatedBy
    });
  }

  async getEmergencyAlertsByStatus(status: EmergencyAlert['status']): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts)
      .where(eq(emergencyAlerts.status, status))
      .orderBy(desc(emergencyAlerts.createdAt));
  }

  async getEmergencyAlertsNeedingEscalation(): Promise<EmergencyAlert[]> {
    const alerts = await db.select().from(emergencyAlerts)
      .where(and(
        eq(emergencyAlerts.isActive, true),
        eq(emergencyAlerts.autoEscalate, true)
      ))
      .orderBy(asc(emergencyAlerts.createdAt));
    
    const now = new Date();
    return alerts.filter(alert => {
      if (!alert.createdAt) return false;
      const slaMinutes = alert.slaTargetMinutes || 5;
      const createdAt = new Date(alert.createdAt);
      const elapsedMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      const isOverdue = elapsedMinutes > slaMinutes;
      const notResolved = alert.status !== 'Resolved' && alert.status !== 'Stabilized';
      return isOverdue && notResolved;
    });
  }

  // Emergency Responders
  async createEmergencyResponder(responder: InsertEmergencyResponder): Promise<EmergencyResponder> {
    const [created] = await db.insert(emergencyResponders).values(responder).returning();
    return created;
  }

  async getEmergencyResponder(id: string): Promise<EmergencyResponder | undefined> {
    const [responder] = await db.select().from(emergencyResponders).where(eq(emergencyResponders.id, id));
    return responder || undefined;
  }

  async getEmergencyResponderByUser(userId: string): Promise<EmergencyResponder | undefined> {
    const [responder] = await db.select().from(emergencyResponders).where(eq(emergencyResponders.userId, userId));
    return responder || undefined;
  }

  async getOnDutyResponders(): Promise<EmergencyResponder[]> {
    return await db.select().from(emergencyResponders).where(eq(emergencyResponders.isOnDuty, true));
  }

  async getAvailableRespondersForType(type: string): Promise<EmergencyResponder[]> {
    const responders = await db.select().from(emergencyResponders).where(eq(emergencyResponders.isOnDuty, true));
    return responders.filter(r => r.canRespondTo?.includes(type));
  }

  async updateResponderDutyStatus(id: string, isOnDuty: boolean): Promise<void> {
    await db.update(emergencyResponders).set({ isOnDuty }).where(eq(emergencyResponders.id, id));
  }

  async updateResponderLocation(id: string, location: string, gpsLat?: string, gpsLng?: string): Promise<void> {
    await db.update(emergencyResponders).set({
      currentLocation: location,
      gpsLat,
      gpsLng,
      lastLocationUpdate: new Date()
    }).where(eq(emergencyResponders.id, id));
  }

  // Escalation History
  async createEscalationHistory(history: InsertEmergencyEscalationHistory): Promise<EmergencyEscalationHistory> {
    const [created] = await db.insert(emergencyEscalationHistory).values(history).returning();
    return created;
  }

  async getEscalationHistoryByAlert(alertId: string): Promise<EmergencyEscalationHistory[]> {
    return await db.select().from(emergencyEscalationHistory)
      .where(eq(emergencyEscalationHistory.alertId, alertId))
      .orderBy(desc(emergencyEscalationHistory.createdAt));
  }

  // Alert Notifications
  async createAlertNotification(notification: InsertEmergencyAlertNotification): Promise<EmergencyAlertNotification> {
    const [created] = await db.insert(emergencyAlertNotifications).values(notification).returning();
    return created;
  }

  async getUnreadAlertNotifications(userId: string): Promise<EmergencyAlertNotification[]> {
    return await db.select().from(emergencyAlertNotifications)
      .where(and(
        eq(emergencyAlertNotifications.userId, userId),
        eq(emergencyAlertNotifications.readAt, null as any)
      ))
      .orderBy(desc(emergencyAlertNotifications.sentAt));
  }

  async markAlertNotificationRead(id: string): Promise<void> {
    await db.update(emergencyAlertNotifications).set({ readAt: new Date() })
      .where(eq(emergencyAlertNotifications.id, id));
  }

  async markAlertNotificationResponded(id: string): Promise<void> {
    await db.update(emergencyAlertNotifications).set({ respondedAt: new Date() })
      .where(eq(emergencyAlertNotifications.id, id));
  }

  // ============ ORBIT STAFFING INTEGRATION ============
  async createOrbitRoster(roster: InsertOrbitRoster): Promise<OrbitRoster> {
    const [created] = await db.insert(orbitRosters).values(roster).returning();
    return created;
  }

  async getAllOrbitRosters(): Promise<OrbitRoster[]> {
    return await db.select().from(orbitRosters).orderBy(desc(orbitRosters.eventDate));
  }

  async getOrbitRoster(id: string): Promise<OrbitRoster | undefined> {
    const [roster] = await db.select().from(orbitRosters).where(eq(orbitRosters.id, id));
    return roster || undefined;
  }

  async getOrbitRosterByEventDate(eventDate: string): Promise<OrbitRoster | undefined> {
    const [roster] = await db.select().from(orbitRosters).where(eq(orbitRosters.eventDate, eventDate));
    return roster || undefined;
  }

  async updateOrbitRosterSyncStatus(id: string, status: OrbitRoster['syncStatus']): Promise<void> {
    await db.update(orbitRosters).set({
      syncStatus: status,
      lastSyncAt: new Date()
    }).where(eq(orbitRosters.id, id));
  }

  async createOrbitShift(shift: InsertOrbitShift): Promise<OrbitShift> {
    const [created] = await db.insert(orbitShifts).values(shift).returning();
    return created;
  }

  async getOrbitShiftsByRoster(rosterId: string): Promise<OrbitShift[]> {
    return await db.select().from(orbitShifts).where(eq(orbitShifts.rosterId, rosterId));
  }

  async getOrbitShiftsByUser(userId: string): Promise<OrbitShift[]> {
    return await db.select().from(orbitShifts).where(eq(orbitShifts.userId, userId));
  }

  async checkInOrbitShift(id: string, gpsVerified?: boolean): Promise<void> {
    await db.update(orbitShifts).set({
      checkedIn: true,
      checkedInAt: new Date(),
      gpsVerified: gpsVerified ?? false
    }).where(eq(orbitShifts.id, id));
  }

  async checkOutOrbitShift(id: string): Promise<void> {
    await db.update(orbitShifts).set({
      checkedOut: true,
      checkedOutAt: new Date()
    }).where(eq(orbitShifts.id, id));
  }

  // ============ DELIVERY REQUESTS (Enhanced) ============
  async getDeliveryRequest(id: string): Promise<any | undefined> {
    const [request] = await db.select().from(deliveryRequests).where(eq(deliveryRequests.id, id));
    return request || undefined;
  }

  async getAllDeliveryRequests(): Promise<any[]> {
    return await db.select().from(deliveryRequests).orderBy(desc(deliveryRequests.createdAt));
  }

  async getDeliveryRequestsByStatus(status: string): Promise<any[]> {
    return await db.select().from(deliveryRequests)
      .where(eq(deliveryRequests.status, status as any))
      .orderBy(desc(deliveryRequests.createdAt));
  }

  async getDeliveryRequestsByDepartment(department: string): Promise<any[]> {
    return await db.select().from(deliveryRequests)
      .where(eq(deliveryRequests.department, department as any))
      .orderBy(desc(deliveryRequests.createdAt));
  }

  async createDeliveryRequest(request: any): Promise<any> {
    const [created] = await db.insert(deliveryRequests).values(request).returning();
    return created;
  }

  async updateDeliveryRequestStatus(id: string, status: string, userId: string, eta?: number): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    
    if (status === 'Acknowledged') {
      updates.acknowledgedBy = userId;
      updates.acknowledgedAt = new Date();
    } else if (status === 'OnTheWay') {
      updates.eta = eta;
    } else if (status === 'Delivered') {
      updates.deliveredBy = userId;
      updates.deliveredAt = new Date();
    }
    
    await db.update(deliveryRequests).set(updates).where(eq(deliveryRequests.id, id));
  }

  // ============ DEPARTMENT CONTACTS (Quick Call Feature) ============
  async getAllDepartmentContacts(): Promise<DepartmentContact[]> {
    return await db.select().from(departmentContacts).where(eq(departmentContacts.isActive, true));
  }

  async getDepartmentContact(department: string): Promise<DepartmentContact | undefined> {
    const [contact] = await db.select().from(departmentContacts)
      .where(and(
        eq(departmentContacts.department, department as any),
        eq(departmentContacts.isActive, true)
      ));
    return contact || undefined;
  }

  async updateDepartmentContact(department: string, updates: Partial<InsertDepartmentContact>): Promise<void> {
    await db.update(departmentContacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(departmentContacts.department, department as any));
  }

  async createDepartmentContact(contact: InsertDepartmentContact): Promise<DepartmentContact> {
    const [created] = await db.insert(departmentContacts).values(contact).returning();
    return created;
  }

  // ============ ALCOHOL VIOLATIONS (Compliance Reporting) ============
  async getAlcoholViolation(id: string): Promise<AlcoholViolation | undefined> {
    const [violation] = await db.select().from(alcoholViolations).where(eq(alcoholViolations.id, id));
    return violation || undefined;
  }

  async getAllAlcoholViolations(): Promise<AlcoholViolation[]> {
    return await db.select().from(alcoholViolations).orderBy(desc(alcoholViolations.createdAt));
  }

  async getAlcoholViolationsByStatus(status: string): Promise<AlcoholViolation[]> {
    return await db.select().from(alcoholViolations)
      .where(eq(alcoholViolations.status, status as any))
      .orderBy(desc(alcoholViolations.createdAt));
  }

  async getAlcoholViolationsByReporter(reporterId: string): Promise<AlcoholViolation[]> {
    return await db.select().from(alcoholViolations)
      .where(eq(alcoholViolations.reporterId, reporterId))
      .orderBy(desc(alcoholViolations.createdAt));
  }

  async createAlcoholViolation(violation: InsertAlcoholViolation): Promise<AlcoholViolation> {
    const [created] = await db.insert(alcoholViolations).values(violation).returning();
    return created;
  }

  async updateAlcoholViolationStatus(id: string, status: string, reviewerId?: string, reviewNotes?: string): Promise<void> {
    const updates: any = { status, updatedAt: new Date() };
    if (reviewerId) {
      updates.reviewedBy = reviewerId;
      updates.reviewedAt = new Date();
    }
    if (reviewNotes !== undefined) {
      updates.reviewNotes = reviewNotes;
    }
    await db.update(alcoholViolations).set(updates).where(eq(alcoholViolations.id, id));
  }

  async resolveAlcoholViolation(id: string, resolverId: string, notes: string, actionTaken: string): Promise<void> {
    await db.update(alcoholViolations).set({
      status: 'Resolved' as any,
      resolvedBy: resolverId,
      resolvedAt: new Date(),
      resolutionNotes: notes,
      actionTaken: actionTaken,
      updatedAt: new Date()
    }).where(eq(alcoholViolations.id, id));
  }

  // ============ ASSET STAMPS (Orby Hallmark System) ============
  async getAssetStamp(id: string): Promise<AssetStamp | undefined> {
    const [stamp] = await db.select().from(assetStamps).where(eq(assetStamps.id, id));
    return stamp || undefined;
  }

  async getAssetStampByNumber(assetNumber: string): Promise<AssetStamp | undefined> {
    const [stamp] = await db.select().from(assetStamps).where(eq(assetStamps.assetNumber, assetNumber));
    return stamp || undefined;
  }

  async getAllAssetStamps(): Promise<AssetStamp[]> {
    return await db.select().from(assetStamps).orderBy(desc(assetStamps.createdAt));
  }

  async getAssetStampsByCategory(category: string): Promise<AssetStamp[]> {
    return await db.select().from(assetStamps)
      .where(eq(assetStamps.category, category as any))
      .orderBy(desc(assetStamps.createdAt));
  }

  async searchAssetStamps(query: string): Promise<AssetStamp[]> {
    const searchQuery = `%${query}%`;
    return await db.select().from(assetStamps)
      .where(
        or(
          ilike(assetStamps.assetNumber, searchQuery),
          ilike(assetStamps.displayName, searchQuery),
          ilike(assetStamps.description || '', searchQuery)
        )
      )
      .orderBy(desc(assetStamps.createdAt))
      .limit(100);
  }

  async getNextAssetNumber(): Promise<string> {
    const [result] = await db.select({ maxNum: sql<string>`MAX(${assetStamps.assetNumber})` }).from(assetStamps);
    if (!result?.maxNum) {
      return 'ORB-000000000001';
    }
    const match = result.maxNum.match(/ORB-(\d+)/);
    const currentNum = match ? parseInt(match[1], 10) : 0;
    return `ORB-${(currentNum + 1).toString().padStart(12, '0')}`;
  }

  async createAssetStamp(stamp: InsertAssetStamp): Promise<AssetStamp> {
    const [created] = await db.insert(assetStamps).values(stamp as any).returning();
    return created;
  }

  async updateAssetStampBlockchain(id: string, network: string, txSignature: string): Promise<void> {
    await db.update(assetStamps).set({
      isBlockchainAnchored: true,
      solanaNetwork: network,
      solanaTxSignature: txSignature,
      solanaConfirmedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(assetStamps.id, id));
  }

  async getAssetStampStats(): Promise<{ total: number; byCategory: Record<string, number>; blockchain: number }> {
    const allStamps = await db.select().from(assetStamps);
    const byCategory: Record<string, number> = {};
    let blockchain = 0;
    allStamps.forEach(stamp => {
      const cat = stamp.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      if (stamp.isBlockchainAnchored) blockchain++;
    });
    return { total: allStamps.length, byCategory, blockchain };
  }

  // ============ BLOCKCHAIN VERIFICATIONS ============
  async getBlockchainVerification(id: string): Promise<BlockchainVerification | undefined> {
    const [verification] = await db.select().from(blockchainVerifications).where(eq(blockchainVerifications.id, id));
    return verification || undefined;
  }

  async getBlockchainVerificationsByEntity(entityType: string, entityId: string): Promise<BlockchainVerification[]> {
    return await db.select().from(blockchainVerifications)
      .where(and(
        eq(blockchainVerifications.entityType, entityType),
        eq(blockchainVerifications.entityId, entityId)
      ))
      .orderBy(desc(blockchainVerifications.createdAt));
  }

  async getPendingBlockchainVerifications(): Promise<BlockchainVerification[]> {
    return await db.select().from(blockchainVerifications)
      .where(eq(blockchainVerifications.status, 'pending'))
      .orderBy(asc(blockchainVerifications.createdAt));
  }

  async createBlockchainVerification(verification: InsertBlockchainVerification): Promise<BlockchainVerification> {
    const [created] = await db.insert(blockchainVerifications).values(verification).returning();
    return created;
  }

  async updateBlockchainVerificationStatus(id: string, status: string, txSignature?: string, errorMessage?: string): Promise<void> {
    const updates: any = { status };
    if (txSignature) {
      updates.txSignature = txSignature;
      updates.confirmedAt = new Date();
    }
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    await db.update(blockchainVerifications).set(updates).where(eq(blockchainVerifications.id, id));
  }

  // ============ COMPLIANCE ALERTS (ABC Board & Health Department) ============
  async getComplianceAlert(id: string): Promise<ComplianceAlert | undefined> {
    const [alert] = await db.select().from(complianceAlerts).where(eq(complianceAlerts.id, id));
    return alert || undefined;
  }

  async getAllComplianceAlerts(): Promise<ComplianceAlert[]> {
    return await db.select().from(complianceAlerts).orderBy(desc(complianceAlerts.createdAt));
  }

  async getActiveComplianceAlerts(): Promise<ComplianceAlert[]> {
    return await db.select().from(complianceAlerts)
      .where(eq(complianceAlerts.isActive, true))
      .orderBy(desc(complianceAlerts.createdAt));
  }

  async getComplianceAlertsByType(alertType: string): Promise<ComplianceAlert[]> {
    return await db.select().from(complianceAlerts)
      .where(sql`${complianceAlerts.alertType} = ${alertType}`)
      .orderBy(desc(complianceAlerts.createdAt));
  }

  async createComplianceAlert(alert: InsertComplianceAlert): Promise<ComplianceAlert> {
    const [created] = await db.insert(complianceAlerts).values(alert).returning();
    return created;
  }

  async resolveComplianceAlert(id: string, resolvedById: string): Promise<void> {
    await db.update(complianceAlerts).set({
      isActive: false,
      resolvedById,
      resolvedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(complianceAlerts.id, id));
  }

  // ============ SUPERVISOR LIVE TRACKING ============
  async getActiveSupervisorSessions(): Promise<SupervisorSession[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return await db.select().from(supervisorSessions)
      .where(and(
        sql`${supervisorSessions.status} != 'offline'`,
        sql`${supervisorSessions.lastHeartbeat} > ${fiveMinutesAgo}`
      ))
      .orderBy(desc(supervisorSessions.lastHeartbeat));
  }

  async getSupervisorSession(supervisorId: string): Promise<SupervisorSession | undefined> {
    const [session] = await db.select().from(supervisorSessions)
      .where(and(
        eq(supervisorSessions.supervisorId, supervisorId),
        sql`${supervisorSessions.status} != 'offline'`
      ))
      .orderBy(desc(supervisorSessions.sessionStartedAt))
      .limit(1);
    return session || undefined;
  }

  async createSupervisorSession(session: InsertSupervisorSession): Promise<SupervisorSession> {
    const [created] = await db.insert(supervisorSessions).values(session).returning();
    return created;
  }

  async updateSupervisorSession(id: string, updates: Partial<SupervisorSession>): Promise<void> {
    await db.update(supervisorSessions).set({
      ...updates,
      lastHeartbeat: new Date()
    }).where(eq(supervisorSessions.id, id));
  }

  async endSupervisorSession(id: string): Promise<void> {
    await db.update(supervisorSessions).set({
      status: 'offline',
      sessionEndedAt: new Date()
    }).where(eq(supervisorSessions.id, id));
  }

  async supervisorHeartbeat(sessionId: string, updates?: Partial<SupervisorSession>): Promise<void> {
    await db.update(supervisorSessions).set({
      ...updates,
      lastHeartbeat: new Date()
    }).where(eq(supervisorSessions.id, sessionId));
  }

  async getRecentSupervisorActivity(limit: number = 50): Promise<SupervisorActivity[]> {
    return await db.select().from(supervisorActivity)
      .orderBy(desc(supervisorActivity.createdAt))
      .limit(limit);
  }

  async getSupervisorActivityBySession(sessionId: string): Promise<SupervisorActivity[]> {
    return await db.select().from(supervisorActivity)
      .where(eq(supervisorActivity.sessionId, sessionId))
      .orderBy(desc(supervisorActivity.createdAt));
  }

  async createSupervisorActivity(activity: InsertSupervisorActivity): Promise<SupervisorActivity> {
    const [created] = await db.insert(supervisorActivity).values(activity).returning();
    return created;
  }

  async getSupervisorLiveView(): Promise<{
    sessions: SupervisorSession[];
    recentActivity: SupervisorActivity[];
  }> {
    const sessions = await this.getActiveSupervisorSessions();
    const recentActivity = await this.getRecentSupervisorActivity(30);
    return { sessions, recentActivity };
  }
}


export const storage = new DatabaseStorage();
