import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'NPOWorker',        // PIN: 1111 - Can only contact Stand Lead
  'StandLead',        // PIN: 2222 - Can only contact Supervisor
  'StandSupervisor',  // PIN: 3333 - Can contact warehouse/kitchen/management
  'ManagementCore',   // PIN: 4444 - Warehouse/Kitchen/Culinary/HR/Bar managers
  'ManagementAssistant', // Assigned by managers for the day
  'Admin',            // System admin
  'IT',               // IT support
  'Developer'         // Dev access
]);

// Management sub-types for ManagementCore role
export const managementTypeEnum = pgEnum('management_type', [
  'WarehouseManager',
  'BarManager', 
  'InventoryManager',
  'KitchenManager',
  'CulinaryManager',
  'HRManager',
  'OperationsManager',
  'GeneralManager'
]);
export const standStatusEnum = pgEnum('stand_status', ['Open', 'Closed', 'Needs Power', 'Spare', 'Hot Spot']);
export const messageTypeEnum = pgEnum('message_type', ['Global', 'Urgent', 'Request']);
export const docCategoryEnum = pgEnum('doc_category', ['Compliance', 'Checklist', 'Reference', 'Contact']);
export const conversationTargetEnum = pgEnum('conversation_target', ['Warehouse', 'Kitchen', 'Manager', 'Bar Manager', 'HR Manager', 'Operations']);
export const conversationStatusEnum = pgEnum('conversation_status', ['Active', 'Closed']);
export const incidentSeverityEnum = pgEnum('incident_severity', ['Low', 'Medium', 'High', 'Critical']);
export const incidentStatusEnum = pgEnum('incident_status', ['Open', 'In Progress', 'Resolved', 'Closed']);
export const countStageEnum = pgEnum('count_stage', ['PreEvent', 'PostEvent', 'DayAfter']);
export const countSessionStatusEnum = pgEnum('count_session_status', ['InProgress', 'Completed', 'Verified']);
export const counterRoleEnum = pgEnum('counter_role', ['NPOLead', 'StandLead', 'Supervisor', 'Manager', 'ManagerAssistant']);
export const employmentAffiliationEnum = pgEnum('employment_affiliation', ['Legends', 'NPO', 'Temp', 'Other']);
export const issueCategoryEnum = pgEnum('issue_category', ['Cooling', 'Beverage', 'Power', 'AV', 'Menu', 'FoodSafety', 'Equipment', 'Staffing', 'Other']);
export const issueSeverityEnum = pgEnum('issue_severity', ['Emergency', 'High', 'Normal', 'Low']);
export const issueStatusEnum = pgEnum('issue_status', ['Open', 'Acknowledged', 'InProgress', 'Resolved', 'Closed']);

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  pin: varchar("pin", { length: 4 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default('NPOWorker'),
  managementType: managementTypeEnum("management_type"), // Only for ManagementCore role
  requiresPinReset: boolean("requires_pin_reset").default(true), // First login requires PIN change
  pinSetAt: timestamp("pin_set_at"), // When user set their personal PIN
  isOnline: boolean("is_online").default(false),
  assignedStandId: varchar("assigned_stand_id", { length: 20 }), // Current stand assignment
  standLeadId: varchar("stand_lead_id", { length: 36 }), // NPO Worker's assigned Stand Lead
  createdAt: timestamp("created_at").defaultNow(),
});

// Stands table
export const stands = pgTable("stands", {
  id: varchar("id", { length: 20 }).primaryKey(),
  name: text("name").notNull(),
  section: text("section").notNull(),
  physicalSection: text("physical_section").notNull(),
  supervisorId: varchar("supervisor_id", { length: 36 }).references(() => users.id),
  status: standStatusEnum("status").notNull().default('Closed'),
  e700Ids: text("e700_ids").array().default(sql`ARRAY[]::text[]`),
  a930Ids: text("a930_ids").array().default(sql`ARRAY[]::text[]`),
  hotspotId: varchar("hotspot_id", { length: 10 }),
});

// Count Sessions - tracks WHO is doing WHICH count at WHAT stage
export const countSessions = pgTable("count_sessions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id).notNull(),
  eventDate: text("event_date").notNull(),
  stage: countStageEnum("stage").notNull(),
  counterName: text("counter_name").notNull(),
  counterRole: counterRoleEnum("counter_role").notNull(),
  counterPhoneLast4: varchar("counter_phone_last4", { length: 4 }).notNull(),
  counterAffiliation: employmentAffiliationEnum("counter_affiliation").notNull().default('Legends'),
  assistingCounterName: text("assisting_counter_name"),
  assistingCounterPhone4: varchar("assisting_counter_phone4", { length: 4 }),
  assistingCounterAffiliation: employmentAffiliationEnum("assisting_counter_affiliation"),
  status: countSessionStatusEnum("status").notNull().default('InProgress'),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  verifiedById: varchar("verified_by_id", { length: 36 }).references(() => users.id),
  notes: text("notes"),
});

// Inventory count entries
export const inventoryCounts = pgTable("inventory_counts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id).notNull(),
  itemId: varchar("item_id", { length: 36 }).notNull(),
  eventDate: text("event_date").notNull(),
  sessionId: varchar("session_id", { length: 36 }).references(() => countSessions.id),
  startCount: integer("start_count").default(0),
  adds: integer("adds").default(0),
  endCount: integer("end_count").default(0),
  spoilage: integer("spoilage").default(0),
  sold: integer("sold").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Items catalog
export const items = pgTable("items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id", { length: 36 }).references(() => users.id).notNull(),
  content: text("content").notNull(),
  type: messageTypeEnum("type").notNull().default('Global'),
  createdAt: timestamp("created_at").defaultNow(),
});

// NPOs (Non-Profit Organizations)
export const npos = pgTable("npos", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  groupLeader: text("group_leader").notNull(),
  contact: text("contact").notNull(),
});

// Staffing Groups
export const staffingGroups = pgTable("staffing_groups", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  supervisorId: varchar("supervisor_id", { length: 36 }).references(() => users.id),
  standIds: text("stand_ids").array().default(sql`ARRAY[]::text[]`),
  npoId: varchar("npo_id", { length: 36 }).references(() => npos.id),
  eventDate: text("event_date"),
});

// Supervisor Pack Documents
export const supervisorDocs = pgTable("supervisor_docs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: docCategoryEnum("category").notNull(),
  content: text("content"),
  imageUrl: text("image_url"),
  requiresSignature: boolean("requires_signature").default(false),
});

// Document Signatures
export const docSignatures = pgTable("doc_signatures", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  docId: varchar("doc_id", { length: 36 }).references(() => supervisorDocs.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  signatureData: text("signature_data"),
  signedAt: timestamp("signed_at").defaultNow(),
});

// Quick Message Templates (canned messages for different targets)
export const quickMessages = pgTable("quick_messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  label: text("label").notNull(),
  targetRole: conversationTargetEnum("target_role").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

// Conversations (threaded communication between supervisor and target)
export const conversations = pgTable("conversations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  initiatorId: varchar("initiator_id", { length: 36 }).references(() => users.id).notNull(),
  targetRole: conversationTargetEnum("target_role").notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  status: conversationStatusEnum("status").notNull().default('Active'),
  createdAt: timestamp("created_at").defaultNow(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
});

// Conversation Messages (individual messages within a conversation thread)
export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id", { length: 36 }).references(() => conversations.id).notNull(),
  senderId: varchar("sender_id", { length: 36 }).references(() => users.id).notNull(),
  content: text("content").notNull(),
  isQuickMessage: boolean("is_quick_message").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Incidents (unified incident reporting across all roles)
export const incidents = pgTable("incidents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id", { length: 36 }).references(() => users.id).notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: incidentSeverityEnum("severity").notNull().default('Medium'),
  status: incidentStatusEnum("status").notNull().default('Open'),
  location: text("location"),
  mediaUrls: text("media_urls").array(),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 36 }).references(() => users.id),
  notes: text("notes"),
});

// Incident Notifications (tracks who needs to see each incident)
export const incidentNotifications = pgTable("incident_notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  incidentId: varchar("incident_id", { length: 36 }).references(() => incidents.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stand Issues - equipment/operational issues reported by supervisors and stand leads
export const standIssues = pgTable("stand_issues", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id", { length: 36 }).references(() => users.id).notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  category: issueCategoryEnum("category").notNull(),
  severity: issueSeverityEnum("severity").notNull().default('Normal'),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: issueStatusEnum("status").notNull().default('Open'),
  routedTo: userRoleEnum("routed_to"),
  location: text("location"),
  mediaUrls: text("media_urls").array(),
  createdAt: timestamp("created_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: varchar("acknowledged_by", { length: 36 }).references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 36 }).references(() => users.id),
  resolutionNotes: text("resolution_notes"),
});

// Stand Issue Notifications - tracks who gets notified based on routing rules
export const standIssueNotifications = pgTable("stand_issue_notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id", { length: 36 }).references(() => standIssues.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manager Assignments - tracks daily assistant assignments by managers
export const managerAssignments = pgTable("manager_assignments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  managerId: varchar("manager_id", { length: 36 }).references(() => users.id).notNull(),
  assistantId: varchar("assistant_id", { length: 36 }).references(() => users.id).notNull(),
  eventDate: text("event_date").notNull(),
  roleScope: managementTypeEnum("role_scope"), // What role they're assisting with
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Geofence Events - tracks when workers leave their assigned location
export const geofenceEvents = pgTable("geofence_events", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  eventType: text("event_type").notNull(), // 'exit' or 'enter'
  latitude: text("latitude"),
  longitude: text("longitude"),
  notifiedStandLead: boolean("notified_stand_lead").default(false),
  notifiedSupervisor: boolean("notified_supervisor").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Communication ACL - defines who can contact whom
export const ROLE_CONTACT_RULES: Record<string, string[]> = {
  NPOWorker: ['StandLead'],                    // Can only contact their Stand Lead
  StandLead: ['StandSupervisor'],              // Can only contact Supervisor
  StandSupervisor: ['StandLead', 'ManagementCore', 'ManagementAssistant'], // Can contact all
  ManagementCore: ['StandSupervisor', 'StandLead', 'ManagementCore', 'ManagementAssistant', 'Admin'],
  ManagementAssistant: ['StandSupervisor', 'ManagementCore'],
  Admin: ['StandSupervisor', 'StandLead', 'ManagementCore', 'ManagementAssistant', 'NPOWorker'],
  IT: ['Admin', 'ManagementCore'],
  Developer: ['Admin', 'ManagementCore', 'StandSupervisor', 'StandLead', 'NPOWorker'],
};

// Initial PINs for first-time login (users must change on first login)
export const INITIAL_PINS: Record<string, string> = {
  NPOWorker: '1111',
  StandLead: '2222',
  StandSupervisor: '3333',
  ManagementCore: '4444',
  ManagementAssistant: '4444',
};

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  stands: many(stands),
  messages: many(messages),
  staffingGroups: many(staffingGroups),
  signatures: many(docSignatures),
}));

export const standsRelations = relations(stands, ({ one, many }) => ({
  supervisor: one(users, {
    fields: [stands.supervisorId],
    references: [users.id],
  }),
  inventoryCounts: many(inventoryCounts),
  countSessions: many(countSessions),
  signatures: many(docSignatures),
}));

export const countSessionsRelations = relations(countSessions, ({ one, many }) => ({
  stand: one(stands, {
    fields: [countSessions.standId],
    references: [stands.id],
  }),
  verifiedBy: one(users, {
    fields: [countSessions.verifiedById],
    references: [users.id],
  }),
  inventoryCounts: many(inventoryCounts),
}));

export const inventoryCountsRelations = relations(inventoryCounts, ({ one }) => ({
  stand: one(stands, {
    fields: [inventoryCounts.standId],
    references: [stands.id],
  }),
  session: one(countSessions, {
    fields: [inventoryCounts.sessionId],
    references: [countSessions.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const staffingGroupsRelations = relations(staffingGroups, ({ one }) => ({
  supervisor: one(users, {
    fields: [staffingGroups.supervisorId],
    references: [users.id],
  }),
  npo: one(npos, {
    fields: [staffingGroups.npoId],
    references: [npos.id],
  }),
}));

export const supervisorDocsRelations = relations(supervisorDocs, ({ many }) => ({
  signatures: many(docSignatures),
}));

export const docSignaturesRelations = relations(docSignatures, ({ one }) => ({
  doc: one(supervisorDocs, {
    fields: [docSignatures.docId],
    references: [supervisorDocs.id],
  }),
  user: one(users, {
    fields: [docSignatures.userId],
    references: [users.id],
  }),
  stand: one(stands, {
    fields: [docSignatures.standId],
    references: [stands.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  initiator: one(users, {
    fields: [conversations.initiatorId],
    references: [users.id],
  }),
  stand: one(stands, {
    fields: [conversations.standId],
    references: [stands.id],
  }),
  messages: many(conversationMessages),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [conversationMessages.senderId],
    references: [users.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  reporter: one(users, {
    fields: [incidents.reporterId],
    references: [users.id],
  }),
  stand: one(stands, {
    fields: [incidents.standId],
    references: [stands.id],
  }),
  notifications: many(incidentNotifications),
}));

export const incidentNotificationsRelations = relations(incidentNotifications, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentNotifications.incidentId],
    references: [incidents.id],
  }),
  user: one(users, {
    fields: [incidentNotifications.userId],
    references: [users.id],
  }),
}));

export const standIssuesRelations = relations(standIssues, ({ one, many }) => ({
  reporter: one(users, {
    fields: [standIssues.reporterId],
    references: [users.id],
  }),
  stand: one(stands, {
    fields: [standIssues.standId],
    references: [stands.id],
  }),
  acknowledger: one(users, {
    fields: [standIssues.acknowledgedBy],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [standIssues.resolvedBy],
    references: [users.id],
  }),
  notifications: many(standIssueNotifications),
}));

export const standIssueNotificationsRelations = relations(standIssueNotifications, ({ one }) => ({
  issue: one(standIssues, {
    fields: [standIssueNotifications.issueId],
    references: [standIssues.id],
  }),
  user: one(users, {
    fields: [standIssueNotifications.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStandSchema = createInsertSchema(stands);
export const insertCountSessionSchema = createInsertSchema(countSessions).omit({ id: true, startedAt: true, completedAt: true });
export const insertInventoryCountSchema = createInsertSchema(inventoryCounts).omit({ id: true, createdAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertNpoSchema = createInsertSchema(npos).omit({ id: true });
export const insertStaffingGroupSchema = createInsertSchema(staffingGroups).omit({ id: true });
export const insertSupervisorDocSchema = createInsertSchema(supervisorDocs).omit({ id: true });
export const insertDocSignatureSchema = createInsertSchema(docSignatures).omit({ id: true, signedAt: true });
export const insertQuickMessageSchema = createInsertSchema(quickMessages).omit({ id: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, lastMessageAt: true });
export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({ id: true, createdAt: true });
export const insertIncidentSchema = createInsertSchema(incidents).omit({ id: true, createdAt: true, resolvedAt: true });
export const insertIncidentNotificationSchema = createInsertSchema(incidentNotifications).omit({ id: true, createdAt: true, readAt: true });
export const insertStandIssueSchema = createInsertSchema(standIssues).omit({ id: true, createdAt: true, acknowledgedAt: true, resolvedAt: true });
export const insertStandIssueNotificationSchema = createInsertSchema(standIssueNotifications).omit({ id: true, createdAt: true, readAt: true });
export const insertManagerAssignmentSchema = createInsertSchema(managerAssignments).omit({ id: true, createdAt: true });
export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Stand = typeof stands.$inferSelect;
export type InsertStand = z.infer<typeof insertStandSchema>;
export type CountSession = typeof countSessions.$inferSelect;
export type InsertCountSession = z.infer<typeof insertCountSessionSchema>;
export type InventoryCount = typeof inventoryCounts.$inferSelect;
export type InsertInventoryCount = z.infer<typeof insertInventoryCountSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type NPO = typeof npos.$inferSelect;
export type InsertNPO = z.infer<typeof insertNpoSchema>;
export type StaffingGroup = typeof staffingGroups.$inferSelect;
export type InsertStaffingGroup = z.infer<typeof insertStaffingGroupSchema>;
export type SupervisorDoc = typeof supervisorDocs.$inferSelect;
export type InsertSupervisorDoc = z.infer<typeof insertSupervisorDocSchema>;
export type DocSignature = typeof docSignatures.$inferSelect;
export type InsertDocSignature = z.infer<typeof insertDocSignatureSchema>;
export type QuickMessage = typeof quickMessages.$inferSelect;
export type InsertQuickMessage = z.infer<typeof insertQuickMessageSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type IncidentNotification = typeof incidentNotifications.$inferSelect;
export type InsertIncidentNotification = z.infer<typeof insertIncidentNotificationSchema>;
export type StandIssue = typeof standIssues.$inferSelect;
export type InsertStandIssue = z.infer<typeof insertStandIssueSchema>;
export type StandIssueNotification = typeof standIssueNotifications.$inferSelect;
export type InsertStandIssueNotification = z.infer<typeof insertStandIssueNotificationSchema>;
export type ManagerAssignment = typeof managerAssignments.$inferSelect;
export type InsertManagerAssignment = z.infer<typeof insertManagerAssignmentSchema>;
export type GeofenceEvent = typeof geofenceEvents.$inferSelect;
export type InsertGeofenceEvent = z.infer<typeof insertGeofenceEventSchema>;

// Routing rules for issue categories
export const ISSUE_ROUTING_RULES: Record<string, string[]> = {
  Cooling: ['WarehouseManager', 'Warehouse'],
  Beverage: ['WarehouseManager', 'Warehouse'],
  Power: ['OperationsManager', 'OperationsAssistant'],
  AV: ['OperationsManager', 'OperationsAssistant'],
  Menu: ['OperationsManager', 'OperationsAssistant'],
  FoodSafety: ['KitchenManager', 'Kitchen'],
  Equipment: ['WarehouseManager', 'OperationsManager'],
  Staffing: ['GeneralManager', 'OperationsManager'],
  Other: ['OperationsManager', 'GeneralManager'],
};
