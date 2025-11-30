import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['Admin', 'Supervisor', 'Worker', 'IT', 'Warehouse', 'Kitchen', 'NPO', 'TempStaff']);
export const standStatusEnum = pgEnum('stand_status', ['Open', 'Closed', 'Needs Power', 'Spare', 'Hot Spot']);
export const messageTypeEnum = pgEnum('message_type', ['Global', 'Urgent', 'Request']);
export const docCategoryEnum = pgEnum('doc_category', ['Compliance', 'Checklist', 'Reference', 'Contact']);
export const conversationTargetEnum = pgEnum('conversation_target', ['Warehouse', 'Kitchen', 'Manager', 'Bar Manager', 'HR Manager']);
export const conversationStatusEnum = pgEnum('conversation_status', ['Active', 'Closed']);
export const incidentSeverityEnum = pgEnum('incident_severity', ['Low', 'Medium', 'High', 'Critical']);
export const incidentStatusEnum = pgEnum('incident_status', ['Open', 'In Progress', 'Resolved', 'Closed']);
export const countStageEnum = pgEnum('count_stage', ['PreEvent', 'PostEvent', 'DayAfter']);
export const countSessionStatusEnum = pgEnum('count_session_status', ['InProgress', 'Completed', 'Verified']);
export const counterRoleEnum = pgEnum('counter_role', ['NPOLead', 'Supervisor', 'Manager', 'ManagerAssistant']);

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  pin: varchar("pin", { length: 4 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default('Worker'),
  isOnline: boolean("is_online").default(false),
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
