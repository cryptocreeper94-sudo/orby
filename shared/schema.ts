import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['Admin', 'Supervisor', 'Worker', 'IT', 'Warehouse', 'Kitchen']);
export const standStatusEnum = pgEnum('stand_status', ['Open', 'Closed', 'Needs Power', 'Spare', 'Hot Spot']);
export const messageTypeEnum = pgEnum('message_type', ['Global', 'Urgent', 'Request']);
export const docCategoryEnum = pgEnum('doc_category', ['Compliance', 'Checklist', 'Reference', 'Contact']);

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

// Inventory count entries
export const inventoryCounts = pgTable("inventory_counts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id).notNull(),
  itemId: varchar("item_id", { length: 36 }).notNull(),
  eventDate: text("event_date").notNull(),
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
  signatures: many(docSignatures),
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

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStandSchema = createInsertSchema(stands);
export const insertInventoryCountSchema = createInsertSchema(inventoryCounts).omit({ id: true, createdAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertNpoSchema = createInsertSchema(npos).omit({ id: true });
export const insertStaffingGroupSchema = createInsertSchema(staffingGroups).omit({ id: true });
export const insertSupervisorDocSchema = createInsertSchema(supervisorDocs).omit({ id: true });
export const insertDocSignatureSchema = createInsertSchema(docSignatures).omit({ id: true, signedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Stand = typeof stands.$inferSelect;
export type InsertStand = z.infer<typeof insertStandSchema>;
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
