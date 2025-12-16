import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'NPOWorker',        // PIN: 1111 - Can only contact Stand Lead
  'StandLead',        // PIN: 2222 - Can only contact Supervisor
  'StandSupervisor',  // PIN: 3333 - Can contact warehouse/kitchen/management
  'ManagementCore',   // PIN: 4444 - Warehouse/Kitchen/Culinary/HR/Bar managers
  'ManagementAssistant', // Assigned by managers for the day
  'AlcoholCompliance', // PIN: 5555 - Monitors vendors, reports violations
  'CheckInAssistant', // PIN: 6666 - Customer service, can only message HR/Managers
  'Admin',            // System admin
  'IT',               // IT support
  'Developer',        // Dev access
  'CulinaryDirector', // Chef Deb - manages culinary team, scheduling, check-ins
  'CulinaryCook'      // Culinary team member - event cooks working in stands
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
export const conversationTargetEnum = pgEnum('conversation_target', ['Warehouse', 'Kitchen', 'Manager', 'Bar Manager', 'HR Manager', 'Operations', 'IT']);
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
export const spoilageReasonEnum = pgEnum('spoilage_reason', ['ThrownAway', 'Returned', 'Damaged', 'Expired', 'Other']);

// Alcohol compliance enums
export const violationTypeEnum = pgEnum('violation_type', [
  'UnderageSale',      // Attempted or completed sale to minor
  'OverService',       // Serving visibly intoxicated patron
  'NoIDCheck',         // Failed to check ID
  'ExpiredLicense',    // Vendor operating with expired license
  'OpenContainer',     // Open container violation
  'UnauthorizedSale',  // Sale outside designated area
  'PricingViolation',  // Incorrect pricing or fraud
  'Other'              // Other violation
]);

export const violationSeverityEnum = pgEnum('violation_severity', ['Warning', 'Minor', 'Major', 'Critical']);
export const violationStatusEnum = pgEnum('violation_status', ['Reported', 'UnderReview', 'Confirmed', 'Dismissed', 'Resolved']);

// Department request system enums
export const departmentEnum = pgEnum('department', ['Warehouse', 'Kitchen', 'Bar', 'IT', 'Operations', 'HR', 'Culinary']);
export const requestPriorityEnum = pgEnum('request_priority', ['Normal', 'Emergency']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['Requested', 'Acknowledged', 'InProgress', 'OnTheWay', 'Delivered', 'Cancelled']);

// Inventory control enums for Bar and Kitchen departments
export const inventoryDepartmentEnum = pgEnum('inventory_department', ['Bar', 'Kitchen', 'Warehouse', 'Global']);
export const productTypeEnum = pgEnum('product_type', [
  'Liquor', 'Beer', 'Wine', 'Mixer', 'NABeverage', 'Garnish', 'Chargeable',  // Bar types
  'Ingredient', 'Supply', 'Consumable', 'Equipment',  // Kitchen types
  'Other'
]);
export const inventoryUnitEnum = pgEnum('inventory_unit', ['Each', 'Case', 'Bottle', 'Keg', 'Pound', 'Ounce', 'Gallon', 'Box', 'Bag']);
export const integrationSystemEnum = pgEnum('integration_system', ['YellowDog', 'PAXPay']);
export const integrationDirectionEnum = pgEnum('integration_direction', ['Push', 'Pull', 'Bidirectional']);

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  pin: varchar("pin", { length: 4 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default('NPOWorker'),
  managementType: managementTypeEnum("management_type"), // Only for ManagementCore role
  department: departmentEnum("department"), // For department staff (Warehouse, Kitchen, Bar, IT, Operations, HR)
  requiresPinReset: boolean("requires_pin_reset").default(true), // First login requires PIN change
  pinSetAt: timestamp("pin_set_at"), // When user set their personal PIN
  presetPin: varchar("preset_pin", { length: 4 }), // Original preset PIN assigned by admin
  pinChanged: boolean("pin_changed").default(false), // Has user changed from preset PIN?
  presetPinIssuedAt: timestamp("preset_pin_issued_at"), // When preset was issued
  employmentAffiliation: employmentAffiliationEnum("employment_affiliation").default('Legends'), // Legends, NPO, Temp, Other
  isOnline: boolean("is_online").default(false),
  assignedStandId: varchar("assigned_stand_id", { length: 20 }), // Current stand assignment
  standLeadId: varchar("stand_lead_id", { length: 36 }), // NPO Worker's assigned Stand Lead
  teamLeadId: varchar("team_lead_id", { length: 36 }), // Department worker's assigned Team Lead (Warehouse/Kitchen/Operations)
  isTeamLead: boolean("is_team_lead").default(false), // Is this user a Team Lead?
  hasDualRole: boolean("has_dual_role").default(false), // For users like Brooke with dual roles
  secondaryRole: userRoleEnum("secondary_role"), // Alternate role (e.g., StandSupervisor for event days)
  activeRole: userRoleEnum("active_role"), // Currently active role (for dual-role users)
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

// Items catalog (global items that can be assigned to stands)
export const items = pgTable("items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  // Department-aware inventory fields
  inventoryDepartment: inventoryDepartmentEnum("inventory_department").default('Global'),
  productType: productTypeEnum("product_type").default('Other'),
  unit: inventoryUnitEnum("unit").default('Each'),
  packSize: integer("pack_size").default(1), // Units per case/pack
  sku: text("sku"), // Internal SKU for tracking
  barcode: text("barcode"), // UPC/barcode for scanning
});

// Stand Items - links items to specific stands (semi-permanent templates)
// This defines which chargeable items each stand carries
export const standItems = pgTable("stand_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id).notNull(),
  itemId: varchar("item_id", { length: 36 }).references(() => items.id).notNull(),
  sortOrder: integer("sort_order").default(0), // Display order on count sheet
  isChargeable: boolean("is_chargeable").default(true), // Whether this item counts toward inventory
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory Locations - for Bar and Kitchen inventory tracking
// Bars can link to stands, Kitchen uses a central KitchenHQ location
export const inventoryLocations = pgTable("inventory_locations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  department: inventoryDepartmentEnum("department").notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id), // For bar locations linked to stands
  isPrimary: boolean("is_primary").default(false), // Primary storage location for department
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Department Stock Levels - current on-hand quantities per location
export const departmentStock = pgTable("department_stock", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id", { length: 36 }).references(() => inventoryLocations.id).notNull(),
  itemId: varchar("item_id", { length: 36 }).references(() => items.id).notNull(),
  onHand: integer("on_hand").default(0),
  lastCountedAt: timestamp("last_counted_at"),
  lastCountedBy: varchar("last_counted_by", { length: 36 }).references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Department Par Levels - target stock levels per location
export const departmentParLevels = pgTable("department_par_levels", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id", { length: 36 }).references(() => inventoryLocations.id).notNull(),
  itemId: varchar("item_id", { length: 36 }).references(() => items.id).notNull(),
  parQty: integer("par_qty").notNull(),
  minQty: integer("min_qty").default(0), // Reorder point
  maxQty: integer("max_qty"), // Max capacity
  createdAt: timestamp("created_at").defaultNow(),
});

// Integration Mappings - for Yellow Dog and PAX Pay compatibility
export const inventoryIntegrations = pgTable("inventory_integrations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id", { length: 36 }).references(() => items.id).notNull(),
  system: integrationSystemEnum("system").notNull(),
  externalId: text("external_id"), // External system's item ID
  externalSku: text("external_sku"), // External system's SKU
  externalName: text("external_name"), // Name in external system
  direction: integrationDirectionEnum("direction").default('Bidirectional'),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status"), // 'Synced', 'Pending', 'Error'
  createdAt: timestamp("created_at").defaultNow(),
});

// Manager Documents Hub - central repository for all reports and communications
export const managerDocuments = pgTable("manager_documents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  category: text("category").notNull(), // CountReport, IncidentReport, ViolationReport, Communication, etc.
  subcategory: text("subcategory"), // PreEvent, PostEvent, DayAfter for counts
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  eventDate: text("event_date"),
  submittedById: varchar("submitted_by_id", { length: 36 }).references(() => users.id),
  pdfUrl: text("pdf_url"),
  jsonData: jsonb("json_data"), // Structured data for the document
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Closing Checklists - end-of-shift equipment shutdown verification
export const closingChecklists = pgTable("closing_checklists", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id).notNull(),
  eventDate: text("event_date").notNull(),
  supervisorId: varchar("supervisor_id", { length: 36 }).references(() => users.id).notNull(),
  isComplete: boolean("is_complete").default(false),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Closing Checklist Tasks - individual items on the checklist
export const closingChecklistTasks = pgTable("closing_checklist_tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  checklistId: varchar("checklist_id", { length: 36 }).references(() => closingChecklists.id).notNull(),
  taskKey: text("task_key").notNull(), // e.g., 'grease_pit', 'hood_vent', 'co2', 'lights', etc.
  taskLabel: text("task_label").notNull(), // Human-readable label
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  remarks: text("remarks"),
});

// Spoilage Reports - tracks items thrown away, returned, or wasted
export const spoilageReports = pgTable("spoilage_reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id).notNull(),
  eventDate: text("event_date").notNull(),
  supervisorId: varchar("supervisor_id", { length: 36 }).references(() => users.id).notNull(),
  isSubmitted: boolean("is_submitted").default(false),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Spoilage Items - individual spoiled/wasted items
export const spoilageItems = pgTable("spoilage_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id", { length: 36 }).references(() => spoilageReports.id).notNull(),
  itemId: varchar("item_id", { length: 36 }).references(() => items.id),
  itemName: text("item_name").notNull(), // For custom/manual entries
  quantity: integer("quantity").notNull(),
  unit: text("unit").default('each'),
  reason: spoilageReasonEnum("reason").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery Requests - requests from Supervisors to departments
export const deliveryRequests = pgTable("delivery_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id", { length: 36 }).references(() => users.id).notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  department: departmentEnum("department").notNull(),
  priority: requestPriorityEnum("priority").notNull().default('Normal'),
  status: deliveryStatusEnum("status").notNull().default('Requested'),
  description: text("description").notNull(),
  items: text("items"), // Comma-separated or JSON list of requested items
  quantity: text("quantity"), // Quantity info
  eta: integer("eta"), // Estimated minutes until arrival
  assignedTo: varchar("assigned_to", { length: 36 }).references(() => users.id),
  acknowledgedBy: varchar("acknowledged_by", { length: 36 }).references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  deliveredAt: timestamp("delivered_at"),
  deliveredBy: varchar("delivered_by", { length: 36 }).references(() => users.id),
  notes: text("notes"),
  visibleToStandLead: boolean("visible_to_stand_lead").default(false), // Supervisor controls Stand Lead visibility
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// IT Alerts - broadcasts to IT collective
export const itAlerts = pgTable("it_alerts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id", { length: 36 }).references(() => users.id).notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  priority: requestPriorityEnum("priority").notNull().default('Normal'),
  issueType: text("issue_type").notNull(), // POS, Register, Network, Display, Other
  description: text("description").notNull(),
  status: deliveryStatusEnum("status").notNull().default('Requested'),
  claimedBy: varchar("claimed_by", { length: 36 }).references(() => users.id),
  claimedAt: timestamp("claimed_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 36 }).references(() => users.id),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voucher Reports - tracks employee meal vouchers collected
export const voucherReports = pgTable("voucher_reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id).notNull(),
  eventDate: text("event_date").notNull(),
  supervisorId: varchar("supervisor_id", { length: 36 }).references(() => users.id).notNull(),
  voucherCount: integer("voucher_count").notNull().default(0),
  totalAmountCents: integer("total_amount_cents").notNull().default(0), // in cents, e.g., 1000 = $10
  envelopeId: text("envelope_id"), // Optional envelope number/identifier
  notes: text("notes"),
  isSubmitted: boolean("is_submitted").default(false),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Log - tracks all actions for accountability
export const auditActionEnum = pgEnum('audit_action', [
  'Login', 'Logout', 'DeliveryRequest', 'DeliveryAcknowledge', 'DeliveryPick', 'DeliveryDispatch', 'DeliveryComplete',
  'IssueReport', 'IssueAcknowledge', 'IssueResolve', 'IssueEscalate',
  'MessageSent', 'EmergencyAlert', 'StandStatusChange', 'CountSubmit', 'ClosingSubmit',
  'UserCreate', 'UserUpdate', 'RoleSwitch', 'PresenceUpdate'
]);

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  action: auditActionEnum("action").notNull(),
  targetType: text("target_type"), // 'delivery', 'issue', 'message', 'stand', etc.
  targetId: varchar("target_id", { length: 36 }),
  details: jsonb("details"), // Additional context
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// OrbitStaffing Integration - sync roster and shift data
export const orbitSyncStatusEnum = pgEnum('orbit_sync_status', ['Pending', 'Synced', 'Error']);

export const orbitRosters = pgTable("orbit_rosters", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  orbitEventId: text("orbit_event_id").notNull(),
  eventName: text("event_name").notNull(),
  eventDate: text("event_date").notNull(),
  syncStatus: orbitSyncStatusEnum("sync_status").notNull().default('Pending'),
  lastSyncAt: timestamp("last_sync_at"),
  staffCount: integer("staff_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orbitShifts = pgTable("orbit_shifts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  rosterId: varchar("roster_id", { length: 36 }).references(() => orbitRosters.id).notNull(),
  orbitShiftId: text("orbit_shift_id").notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  role: text("role").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  checkedIn: boolean("checked_in").default(false),
  checkedInAt: timestamp("checked_in_at"),
  checkedOut: boolean("checked_out").default(false),
  checkedOutAt: timestamp("checked_out_at"),
  gpsVerified: boolean("gps_verified").default(false),
});

// Emergency Alert Types
export const emergencyTypeEnum = pgEnum('emergency_type', [
  'Medical',      // Person down, injury, illness
  'Security',     // Fight, threat, suspicious activity
  'Fire',         // Fire, smoke, gas leak
  'Equipment',    // Critical equipment failure
  'Weather',      // Severe weather, lightning
  'Crowd',        // Crowd control, evacuation
  'Other'
]);

// Escalation levels for auto-escalation
export const escalationLevelEnum = pgEnum('escalation_level', [
  'Level1',  // Initial - Stand Lead/Supervisor
  'Level2',  // Department Manager
  'Level3',  // Operations Manager
  'Level4'   // Executive/External (911)
]);

// Command Center Incident Status
export const commandIncidentStatusEnum = pgEnum('command_incident_status', [
  'Reported',      // Just reported, no response yet
  'Dispatched',    // Responder assigned and en route
  'OnScene',       // Responder arrived
  'Stabilized',    // Situation under control
  'Resolved',      // Incident closed
  'Escalated'      // Bumped to higher level
]);

// Emergency Alerts - priority escalation system (enhanced for Command Center)
export const emergencyAlerts = pgTable("emergency_alerts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id", { length: 36 }).references(() => users.id).notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  alertType: emergencyTypeEnum("alert_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  locationDetails: text("location_details"), // "Near Gate 5", "Row 12 Seat 4"
  gpsLat: text("gps_lat"),
  gpsLng: text("gps_lng"),
  
  // Status tracking
  status: commandIncidentStatusEnum("status").notNull().default('Reported'),
  isActive: boolean("is_active").default(true),
  
  // SLA & Escalation
  escalationLevel: escalationLevelEnum("escalation_level").notNull().default('Level1'),
  slaTargetMinutes: integer("sla_target_minutes").default(5), // Response time target
  lastEscalatedAt: timestamp("last_escalated_at"),
  autoEscalate: boolean("auto_escalate").default(true),
  
  // Responder assignment
  assignedResponderId: varchar("assigned_responder_id", { length: 36 }).references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  responderEta: integer("responder_eta"), // Minutes
  
  // Acknowledgement
  acknowledgedBy: varchar("acknowledged_by", { length: 36 }).references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  // On-scene tracking
  arrivedAt: timestamp("arrived_at"),
  stabilizedAt: timestamp("stabilized_at"),
  
  // Resolution
  resolvedBy: varchar("resolved_by", { length: 36 }).references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  resolutionType: text("resolution_type"), // 'handled_internally', 'ems_called', 'police_called', 'false_alarm'
  
  // External services
  externalServicesContacted: text("external_services_contacted").array(), // ['911', 'EMS', 'Police', 'Fire']
  externalCaseNumber: text("external_case_number"),
  
  // Media/evidence
  mediaUrls: text("media_urls").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Emergency Responders - tracks who can respond to emergencies
export const emergencyResponders = pgTable("emergency_responders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  responderType: text("responder_type").notNull(), // 'security', 'medical', 'supervisor', 'manager', 'it'
  isOnDuty: boolean("is_on_duty").default(false),
  currentLocation: text("current_location"),
  gpsLat: text("gps_lat"),
  gpsLng: text("gps_lng"),
  lastLocationUpdate: timestamp("last_location_update"),
  canRespondTo: text("can_respond_to").array(), // ['Medical', 'Security', 'Fire', etc.]
});

// Emergency Escalation History - tracks all escalation events
export const emergencyEscalationHistory = pgTable("emergency_escalation_history", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id", { length: 36 }).references(() => emergencyAlerts.id).notNull(),
  fromLevel: escalationLevelEnum("from_level").notNull(),
  toLevel: escalationLevelEnum("to_level").notNull(),
  reason: text("reason").notNull(), // 'auto_timeout', 'manual', 'severity_increase'
  escalatedBy: varchar("escalated_by", { length: 36 }).references(() => users.id),
  notifiedUsers: text("notified_users").array(), // User IDs who were notified
  createdAt: timestamp("created_at").defaultNow(),
});

// Emergency Alert Notifications - who has been notified
export const emergencyAlertNotifications = pgTable("emergency_alert_notifications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id", { length: 36 }).references(() => emergencyAlerts.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  notificationType: text("notification_type").notNull(), // 'push', 'sms', 'in_app'
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  respondedAt: timestamp("responded_at"),
});

// Alcohol Violations - tracks vendor compliance violations
export const alcoholViolations = pgTable("alcohol_violations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id", { length: 36 }).references(() => users.id).notNull(),
  
  // Location info
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  section: text("section"),
  vendorName: text("vendor_name"),
  vendorBadgeNumber: text("vendor_badge_number"),
  
  // Violation details
  violationType: violationTypeEnum("violation_type").notNull(),
  severity: violationSeverityEnum("severity").notNull().default('Minor'),
  description: text("description").notNull(),
  
  // Evidence - images/videos
  mediaUrls: text("media_urls").array(),
  
  // Status tracking
  status: violationStatusEnum("status").notNull().default('Reported'),
  
  // Review info
  reviewedBy: varchar("reviewed_by", { length: 36 }).references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Resolution
  resolvedBy: varchar("resolved_by", { length: 36 }).references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  actionTaken: text("action_taken"), // 'verbal_warning', 'written_warning', 'removed', 'reported_to_authorities'
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAlcoholViolationSchema = createInsertSchema(alcoholViolations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  reviewedAt: true,
  resolvedAt: true 
});
export type InsertAlcoholViolation = z.infer<typeof insertAlcoholViolationSchema>;
export type AlcoholViolation = typeof alcoholViolations.$inferSelect;

// Communication ACL - defines who can contact whom
export const ROLE_CONTACT_RULES: Record<string, string[]> = {
  NPOWorker: ['StandLead'],                    // Can only contact their Stand Lead
  StandLead: ['StandSupervisor'],              // Can only contact Supervisor
  StandSupervisor: ['StandLead', 'ManagementCore', 'ManagementAssistant'], // Can contact all
  ManagementCore: ['StandSupervisor', 'StandLead', 'ManagementCore', 'ManagementAssistant', 'Admin', 'AlcoholCompliance'],
  ManagementAssistant: ['StandSupervisor', 'ManagementCore'],
  AlcoholCompliance: ['ManagementCore', 'StandSupervisor', 'Admin'], // Can report to management/supervisors
  Admin: ['StandSupervisor', 'StandLead', 'ManagementCore', 'ManagementAssistant', 'NPOWorker', 'AlcoholCompliance'],
  IT: ['Admin', 'ManagementCore'],
  Developer: ['Admin', 'ManagementCore', 'StandSupervisor', 'StandLead', 'NPOWorker', 'AlcoholCompliance'],
};

// Department contact phone numbers - configurable for quick call feature
export const departmentContacts = pgTable("department_contacts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  department: departmentEnum("department").notNull().unique(),
  contactName: text("contact_name").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  alternatePhone: varchar("alternate_phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by", { length: 36 }).references(() => users.id),
});

export const insertDepartmentContactSchema = createInsertSchema(departmentContacts).omit({ id: true, updatedAt: true });
export type InsertDepartmentContact = z.infer<typeof insertDepartmentContactSchema>;
export type DepartmentContact = typeof departmentContacts.$inferSelect;

// Roles that can use quick call feature (Supervisor and above)
export const QUICK_CALL_ROLES = [
  'StandSupervisor', 'Supervisor',
  'ManagementCore', 'ManagementAssistant', 
  'OperationsManager', 'OperationsAssistant',
  'WarehouseManager', 'KitchenManager', 'GeneralManager', 'RegionalVP',
  'Admin', 'Developer'
];

// Initial PINs for first-time login
// Public-facing (shown in login accordion): 9999, 1111, 2222, 3333, 7777, 5555, 6666
// Manager-level (hidden, distributed privately): 4444
export const INITIAL_PINS: Record<string, string> = {
  // Field Staff (public)
  NPOWorker: '1111',
  StandLead: '2222',
  StandSupervisor: '3333',
  Bartender: '7777',
  AlcoholCompliance: '5555',
  CheckInAssistant: '6666',
  FirstTimeRegistration: '9999', // Universal PIN for new Legends staff (geofenced)
  // Management (private - not shown in UI)
  ManagementCore: '4444',
  ManagementAssistant: '4444',
  OperationsManager: '4444',
  WarehouseManager: '4444',
  KitchenManager: '4444',
  IT: '4444',
};

// Dashboard Configuration (David's Superpower - controls what other roles see)
// Only accessible by Ops Manager (David, PIN 2424) and Developer
export const dashboardConfigs = pgTable("dashboard_configs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  targetRole: text("target_role").notNull().unique(), // Role being configured
  // Widget Visibility
  showEmergencyFeed: boolean("show_emergency_feed").default(true),
  showDeliveries: boolean("show_deliveries").default(true),
  showCompliance: boolean("show_compliance").default(true),
  showAiChat: boolean("show_ai_chat").default(true),
  showWeather: boolean("show_weather").default(true),
  showMap: boolean("show_map").default(true),
  showMessaging: boolean("show_messaging").default(true),
  showInventory: boolean("show_inventory").default(true),
  // Alert Settings
  alertLevel: text("alert_level").default("normal"), // normal, priority-only, silent
  // Data Scope
  dataScope: text("data_scope").default("assigned"), // all, assigned
  showSensitiveMetrics: boolean("show_sensitive_metrics").default(false),
  // Layout Preset
  layoutPreset: text("layout_preset").default("standard"), // ops-lite, standard, full-command
  // Metadata
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedById: varchar("updated_by_id", { length: 36 }).references(() => users.id),
});

export const insertDashboardConfigSchema = createInsertSchema(dashboardConfigs).omit({ id: true, updatedAt: true });
export type InsertDashboardConfig = z.infer<typeof insertDashboardConfigSchema>;
export type DashboardConfig = typeof dashboardConfigs.$inferSelect;

// Available roles that can be configured
export const CONFIGURABLE_ROLES = [
  'NPOWorker',
  'StandLead', 
  'StandSupervisor',
  'Bartender',
  'AlcoholCompliance',
  'CheckInAssistant',
  'ManagementCore',
  'ManagementAssistant',
  'Warehouse',
  'Kitchen',
  'IT',
];

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

export const alcoholViolationsRelations = relations(alcoholViolations, ({ one }) => ({
  reporter: one(users, {
    fields: [alcoholViolations.reporterId],
    references: [users.id],
  }),
  stand: one(stands, {
    fields: [alcoholViolations.standId],
    references: [stands.id],
  }),
  reviewer: one(users, {
    fields: [alcoholViolations.reviewedBy],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [alcoholViolations.resolvedBy],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStandSchema = createInsertSchema(stands);
export const insertCountSessionSchema = createInsertSchema(countSessions).omit({ id: true, startedAt: true, completedAt: true });
export const insertInventoryCountSchema = createInsertSchema(inventoryCounts).omit({ id: true, createdAt: true });
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertStandItemSchema = createInsertSchema(standItems).omit({ id: true, createdAt: true });
export const insertManagerDocumentSchema = createInsertSchema(managerDocuments).omit({ id: true, createdAt: true });
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
export const insertClosingChecklistSchema = createInsertSchema(closingChecklists).omit({ id: true, createdAt: true, submittedAt: true });
export const insertClosingChecklistTaskSchema = createInsertSchema(closingChecklistTasks).omit({ id: true, completedAt: true });
export const insertSpoilageReportSchema = createInsertSchema(spoilageReports).omit({ id: true, createdAt: true, submittedAt: true });
export const insertSpoilageItemSchema = createInsertSchema(spoilageItems).omit({ id: true, createdAt: true });
export const insertVoucherReportSchema = createInsertSchema(voucherReports).omit({ id: true, createdAt: true, submittedAt: true });
export const insertDeliveryRequestSchema = createInsertSchema(deliveryRequests).omit({ id: true, createdAt: true, updatedAt: true, acknowledgedAt: true, deliveredAt: true });
export const insertItAlertSchema = createInsertSchema(itAlerts).omit({ id: true, createdAt: true, claimedAt: true, resolvedAt: true });

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
export type StandItem = typeof standItems.$inferSelect;
export type InsertStandItem = z.infer<typeof insertStandItemSchema>;
export type ManagerDocument = typeof managerDocuments.$inferSelect;
export type InsertManagerDocument = z.infer<typeof insertManagerDocumentSchema>;
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
export type ClosingChecklist = typeof closingChecklists.$inferSelect;
export type InsertClosingChecklist = z.infer<typeof insertClosingChecklistSchema>;
export type ClosingChecklistTask = typeof closingChecklistTasks.$inferSelect;
export type InsertClosingChecklistTask = z.infer<typeof insertClosingChecklistTaskSchema>;
export type SpoilageReport = typeof spoilageReports.$inferSelect;
export type InsertSpoilageReport = z.infer<typeof insertSpoilageReportSchema>;
export type SpoilageItem = typeof spoilageItems.$inferSelect;
export type InsertSpoilageItem = z.infer<typeof insertSpoilageItemSchema>;
export type VoucherReport = typeof voucherReports.$inferSelect;
export type InsertVoucherReport = z.infer<typeof insertVoucherReportSchema>;
export type DeliveryRequest = typeof deliveryRequests.$inferSelect;
export type InsertDeliveryRequest = z.infer<typeof insertDeliveryRequestSchema>;
export type ItAlert = typeof itAlerts.$inferSelect;
export type InsertItAlert = z.infer<typeof insertItAlertSchema>;

// Default closing checklist tasks
export const DEFAULT_CLOSING_TASKS = [
  { key: 'grease_pit', label: 'Grease Pit - Turned Off' },
  { key: 'hood_vent', label: 'Hood Vent - Turned Off' },
  { key: 'oven', label: 'Oven - Turned Off & Unplugged' },
  { key: 'cheese_warmer', label: 'Cheese Warmer - Unplugged' },
  { key: 'hot_dog_roller', label: 'Hot Dog Roller - Turned Off' },
  { key: 'nacho_warmer', label: 'Nacho Warmer - Unplugged' },
  { key: 'co2', label: 'CO2 - Turned Off' },
  { key: 'beer_taps', label: 'Beer Taps - Closed' },
  { key: 'lights', label: 'Lights - Turned Off' },
  { key: 'fans', label: 'Fans - Turned Off' },
  { key: 'pos_terminals', label: 'POS Terminals - Logged Out' },
  { key: 'registers_closed', label: 'Cash Registers - Closed & Secured' },
  { key: 'coolers_checked', label: 'Coolers - Doors Closed & Secure' },
  { key: 'trash_removed', label: 'Trash - Removed' },
  { key: 'counters_wiped', label: 'Counters - Cleaned & Wiped' },
  { key: 'stanchions_removed', label: 'Stanchions - Removed/Delegated' },
];

// Document submissions to Operations Manager
export const documentTypeEnum = pgEnum('document_type', ['ClosingChecklist', 'AlcoholCompliance', 'SpoilageReport', 'VoucherReport']);

export const documentSubmissions = pgTable("document_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentType: documentTypeEnum("document_type").notNull(),
  standId: varchar("stand_id").notNull(),
  eventDate: varchar("event_date").notNull(),
  submittedById: varchar("submitted_by_id").references(() => users.id),
  submittedByName: varchar("submitted_by_name"),
  recipientId: varchar("recipient_id").references(() => users.id),
  recipientRole: varchar("recipient_role").default('OperationsManager'),
  pdfData: text("pdf_data"),
  signatureData: text("signature_data"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
});

export const insertDocumentSubmissionSchema = createInsertSchema(documentSubmissions).omit({ id: true, submittedAt: true, isRead: true, readAt: true });
export type DocumentSubmission = typeof documentSubmissions.$inferSelect;
export type InsertDocumentSubmission = z.infer<typeof insertDocumentSubmissionSchema>;

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

// Menu Board Creator for Operations Manager
export const menuBoards = pgTable("menu_boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isTemplate: boolean("is_template").default(false),
});

export const menuSlides = pgTable("menu_slides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  menuBoardId: varchar("menu_board_id").references(() => menuBoards.id).notNull(),
  slideOrder: integer("slide_order").notNull().default(0),
  title: varchar("title", { length: 255 }),
  backgroundColor: varchar("background_color", { length: 50 }).default('#1a1a2e'),
  backgroundImage: text("background_image"),
  content: jsonb("content").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMenuBoardSchema = createInsertSchema(menuBoards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMenuSlideSchema = createInsertSchema(menuSlides).omit({ id: true, createdAt: true, updatedAt: true });
export type MenuBoard = typeof menuBoards.$inferSelect;
export type InsertMenuBoard = z.infer<typeof insertMenuBoardSchema>;
export type MenuSlide = typeof menuSlides.$inferSelect;
export type InsertMenuSlide = z.infer<typeof insertMenuSlideSchema>;

// Menu slide content element types
export type MenuElement = {
  id: string;
  type: 'text' | 'price' | 'image' | 'divider';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  imageUrl?: string;
};

// ============ WAREHOUSE INVENTORY SYSTEM ============
// NOTE: This is a configurable example based on Nissan Stadium operations.
// Categories, products, and par levels can be customized to match your specific workflow.

export const warehouseCategories = pgTable("warehouse_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default('#3B82F6'),
  icon: varchar("icon", { length: 50 }).default('Package'),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const warehouseProducts = pgTable("warehouse_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => warehouseCategories.id),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 50 }),
  description: text("description"),
  unit: varchar("unit", { length: 50 }).default('each'),
  unitsPerCase: integer("units_per_case").default(1),
  costPerUnit: integer("cost_per_unit_cents"),
  imageUrl: text("image_url"),
  isPerishable: boolean("is_perishable").default(false),
  shelfLifeDays: integer("shelf_life_days"),
  minOrderQty: integer("min_order_qty").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const warehouseStock = pgTable("warehouse_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => warehouseProducts.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  lotNumber: varchar("lot_number", { length: 100 }),
  expirationDate: timestamp("expiration_date"),
  location: varchar("location", { length: 100 }),
  lastCountedAt: timestamp("last_counted_at"),
  lastCountedBy: varchar("last_counted_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const warehouseParLevels = pgTable("warehouse_par_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => warehouseProducts.id).notNull(),
  standId: varchar("stand_id").references(() => stands.id),
  standType: varchar("stand_type", { length: 50 }),
  minQuantity: integer("min_quantity").notNull().default(0),
  maxQuantity: integer("max_quantity"),
  reorderPoint: integer("reorder_point"),
  notes: text("notes"),
});

export const requestStatusEnum = pgEnum('request_status', ['Pending', 'Approved', 'Picking', 'InTransit', 'Delivered', 'Confirmed', 'Cancelled']);

export const warehouseRequests = pgTable("warehouse_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  standId: varchar("stand_id").references(() => stands.id).notNull(),
  requestedById: varchar("requested_by_id").references(() => users.id).notNull(),
  status: requestStatusEnum("status").default('Pending'),
  priority: requestPriorityEnum("priority").default('Normal'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedById: varchar("approved_by_id").references(() => users.id),
  pickedAt: timestamp("picked_at"),
  pickedById: varchar("picked_by_id").references(() => users.id),
  deliveredAt: timestamp("delivered_at"),
  deliveredById: varchar("delivered_by_id").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  confirmedById: varchar("confirmed_by_id").references(() => users.id),
});

export const warehouseRequestItems = pgTable("warehouse_request_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").references(() => warehouseRequests.id).notNull(),
  productId: varchar("product_id").references(() => warehouseProducts.id).notNull(),
  quantityRequested: integer("quantity_requested").notNull(),
  quantityApproved: integer("quantity_approved"),
  quantityDelivered: integer("quantity_delivered"),
  notes: text("notes"),
});

// Insert schemas
export const insertWarehouseCategorySchema = createInsertSchema(warehouseCategories).omit({ id: true, createdAt: true });
export const insertWarehouseProductSchema = createInsertSchema(warehouseProducts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWarehouseStockSchema = createInsertSchema(warehouseStock).omit({ id: true, updatedAt: true });
export const insertWarehouseParLevelSchema = createInsertSchema(warehouseParLevels).omit({ id: true });
export const insertWarehouseRequestSchema = createInsertSchema(warehouseRequests).omit({ id: true, createdAt: true });
export const insertWarehouseRequestItemSchema = createInsertSchema(warehouseRequestItems).omit({ id: true });

// Types
export type WarehouseCategory = typeof warehouseCategories.$inferSelect;
export type InsertWarehouseCategory = z.infer<typeof insertWarehouseCategorySchema>;
export type WarehouseProduct = typeof warehouseProducts.$inferSelect;
export type InsertWarehouseProduct = z.infer<typeof insertWarehouseProductSchema>;
export type WarehouseStock = typeof warehouseStock.$inferSelect;
export type InsertWarehouseStock = z.infer<typeof insertWarehouseStockSchema>;
export type WarehouseParLevel = typeof warehouseParLevels.$inferSelect;
export type InsertWarehouseParLevel = z.infer<typeof insertWarehouseParLevelSchema>;
export type WarehouseRequest = typeof warehouseRequests.$inferSelect;
export type InsertWarehouseRequest = z.infer<typeof insertWarehouseRequestSchema>;
export type WarehouseRequestItem = typeof warehouseRequestItems.$inferSelect;
export type InsertWarehouseRequestItem = z.infer<typeof insertWarehouseRequestItemSchema>;

// Example categories based on Nissan Stadium ordering cheat sheet
// These are configurable and can be modified to match your specific operations
export const EXAMPLE_WAREHOUSE_CATEGORIES = [
  { name: 'Beverages - Canned', color: '#3B82F6', icon: 'Beer' },
  { name: 'Beverages - Bottled', color: '#0EA5E9', icon: 'Bottle' },
  { name: 'Beverages - Fountain/BIB', color: '#06B6D4', icon: 'Coffee' },
  { name: 'Beverages - Draft Beer', color: '#F59E0B', icon: 'Beer' },
  { name: 'Beverages - Wine & Liquor', color: '#8B5CF6', icon: 'Wine' },
  { name: 'Food - Hot Dogs & Buns', color: '#EF4444', icon: 'Sandwich' },
  { name: 'Food - Nachos & Cheese', color: '#F97316', icon: 'Pizza' },
  { name: 'Food - Pretzels & Snacks', color: '#84CC16', icon: 'Cookie' },
  { name: 'Food - Fried Items', color: '#EAB308', icon: 'Flame' },
  { name: 'Paper Goods', color: '#6B7280', icon: 'Package' },
  { name: 'Condiments', color: '#10B981', icon: 'Droplet' },
  { name: 'Supplies', color: '#64748B', icon: 'Wrench' },
];

// ============ COMPLIANCE ALERTS (ABC Board & Health Department) ============
export const complianceAlertTypeEnum = pgEnum('compliance_alert_type', [
  'abc_board',      // Tennessee ABC Board inspection
  'health_dept',    // Health Department inspection
  'fire_marshal',   // Fire Marshal inspection
  'osha',           // OSHA inspection
  'other'           // Other regulatory inspection
]);

export const complianceAlerts = pgTable("compliance_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: complianceAlertTypeEnum("alert_type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true),
  triggeredById: varchar("triggered_by_id").references(() => users.id),
  triggeredByName: varchar("triggered_by_name", { length: 100 }),
  resolvedById: varchar("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertComplianceAlertSchema = createInsertSchema(complianceAlerts).omit({ id: true, createdAt: true, updatedAt: true });
export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = z.infer<typeof insertComplianceAlertSchema>;

// Tennessee ABC Board Compliance Checklist
export const TN_ABC_CHECKLIST = [
  { id: 'id_check', category: 'ID Verification', item: 'Check ID for anyone who does not appear 50 or older', critical: true },
  { id: 'id_hold', category: 'ID Verification', item: 'Hold ID in hand to physically verify - do not just glance', critical: true },
  { id: 'id_valid', category: 'ID Verification', item: 'Verify ID is valid (not expired) and government-issued', critical: true },
  { id: 'id_photo', category: 'ID Verification', item: 'Match photo on ID to customer face', critical: true },
  { id: 'id_dob', category: 'ID Verification', item: 'Verify birth date shows customer is 21+', critical: true },
  { id: 'server_permit', category: 'Server Requirements', item: 'All servers have valid ABC Server Permit', critical: true },
  { id: 'permit_display', category: 'Display', item: 'ABC license prominently displayed', critical: false },
  { id: 'signage', category: 'Display', item: 'Required signage posted: "STATE LAW REQUIRES IDENTIFICATION FOR THE SALE OF BEER"', critical: false },
  { id: 'no_overservice', category: 'Service', item: 'Do not serve visibly intoxicated patrons', critical: true },
  { id: 'designated_area', category: 'Service', item: 'Alcohol sales only in designated areas', critical: true },
  { id: 'hours', category: 'Service', item: 'Verify within legal serving hours', critical: true },
  { id: 'training_current', category: 'Training', item: 'Server training certificates current (within 5 years)', critical: false },
];

// Tennessee Health Department Compliance Checklist (based on Rule 1200-23)
export const TN_HEALTH_CHECKLIST = [
  { id: 'pic_present', category: 'Management', item: 'Person in charge present with food safety certification', points: 5, critical: true },
  { id: 'illness_policy', category: 'Personnel', item: 'Employees not working while ill (vomiting, diarrhea, fever)', points: 5, critical: true },
  { id: 'handwashing', category: 'Personnel', item: 'Proper handwashing - 20 seconds, soap, warm water', points: 5, critical: true },
  { id: 'no_bare_hands', category: 'Personnel', item: 'No bare hand contact with ready-to-eat food', points: 4, critical: true },
  { id: 'glove_change', category: 'Personnel', item: 'Gloves changed between tasks and when contaminated', points: 3, critical: false },
  { id: 'no_eating_work', category: 'Personnel', item: 'No eating, drinking, or smoking in food prep areas', points: 2, critical: false },
  { id: 'hair_restraint', category: 'Personnel', item: 'Hair restraints worn properly', points: 1, critical: false },
  { id: 'temp_cold', category: 'Food Temperature', item: 'Cold foods held at 41°F or below', points: 5, critical: true },
  { id: 'temp_hot', category: 'Food Temperature', item: 'Hot foods held at 135°F or above', points: 5, critical: true },
  { id: 'cooking_temps', category: 'Food Temperature', item: 'Foods cooked to proper internal temperatures', points: 5, critical: true },
  { id: 'thermometer', category: 'Food Temperature', item: 'Probe thermometer available and calibrated', points: 2, critical: false },
  { id: 'cross_contamination', category: 'Food Safety', item: 'Raw meats stored below ready-to-eat foods', points: 4, critical: true },
  { id: 'date_marking', category: 'Food Safety', item: 'Foods date-marked when held more than 24 hours', points: 2, critical: false },
  { id: 'approved_source', category: 'Food Safety', item: 'All food from approved sources', points: 4, critical: true },
  { id: 'surfaces_clean', category: 'Sanitation', item: 'Food contact surfaces clean and sanitized', points: 3, critical: false },
  { id: 'sanitizer_strength', category: 'Sanitation', item: 'Sanitizer at proper concentration (test strips available)', points: 3, critical: false },
  { id: 'wiping_cloths', category: 'Sanitation', item: 'Wiping cloths stored in sanitizer solution', points: 2, critical: false },
  { id: 'pest_free', category: 'Facility', item: 'No evidence of pests (flies, roaches, rodents)', points: 4, critical: true },
  { id: 'garbage', category: 'Facility', item: 'Garbage containers covered and emptied regularly', points: 2, critical: false },
  { id: 'floors_clean', category: 'Facility', item: 'Floors, walls, and ceilings clean and in good repair', points: 2, critical: false },
  { id: 'handwash_station', category: 'Facility', item: 'Handwashing stations stocked (soap, paper towels, warm water)', points: 3, critical: false },
  { id: 'equipment_working', category: 'Equipment', item: 'All equipment in good working order', points: 2, critical: false },
];

// ============ ORBY HALLMARK STAMPING SYSTEM ============
// Asset stamp categories for tracking
export const assetCategoryEnum = pgEnum('asset_category', [
  'platform', 'user', 'version', 'document', 'report', 'inventory_count', 
  'incident', 'violation', 'emergency', 'delivery', 'invoice', 'compliance',
  'audit_log', 'slideshow', 'pdf_export', 'signature', 'other'
]);

export const assetStamps = pgTable("asset_stamps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetNumber: varchar("asset_number", { length: 20 }).unique().notNull(),
  displayName: varchar("display_name", { length: 200 }).notNull(),
  category: assetCategoryEnum("category").default('other'),
  description: text("description"),
  sourceType: varchar("source_type", { length: 50 }),
  sourceId: varchar("source_id"),
  userId: varchar("user_id").references(() => users.id),
  sha256Hash: varchar("sha256_hash", { length: 64 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  isBlockchainAnchored: boolean("is_blockchain_anchored").default(false),
  solanaNetwork: varchar("solana_network", { length: 20 }),
  solanaTxSignature: varchar("solana_tx_signature", { length: 100 }),
  solanaConfirmedAt: timestamp("solana_confirmed_at"),
  version: varchar("version", { length: 20 }),
  changes: jsonb("changes").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_asset_number").on(table.assetNumber),
  index("IDX_asset_category").on(table.category),
  index("IDX_asset_source").on(table.sourceType, table.sourceId),
  index("IDX_asset_user").on(table.userId),
  index("IDX_asset_blockchain").on(table.isBlockchainAnchored),
]);

export const blockchainVerifications = pgTable("blockchain_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id").notNull(),
  assetStampId: varchar("asset_stamp_id").references(() => assetStamps.id),
  userId: varchar("user_id").references(() => users.id),
  dataHash: varchar("data_hash", { length: 64 }).notNull(),
  txSignature: varchar("tx_signature", { length: 100 }),
  status: varchar("status", { length: 20 }).default('pending'),
  network: varchar("network", { length: 20 }).default('devnet'),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  submittedAt: timestamp("submitted_at"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_blockchain_entity").on(table.entityType, table.entityId),
  index("IDX_blockchain_status").on(table.status),
  index("IDX_blockchain_tx").on(table.txSignature),
]);

export const insertAssetStampSchema = createInsertSchema(assetStamps).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlockchainVerificationSchema = createInsertSchema(blockchainVerifications).omit({ id: true, createdAt: true });

export type AssetStamp = typeof assetStamps.$inferSelect;
export type InsertAssetStamp = z.infer<typeof insertAssetStampSchema>;
export type BlockchainVerification = typeof blockchainVerifications.$inferSelect;
export type InsertBlockchainVerification = z.infer<typeof insertBlockchainVerificationSchema>;

// ============ MULTI-TENANT PLATFORM ARCHITECTURE ============
// Tenant types: beta (Nissan Stadium), business (paying customers), franchise (child locations)
export const tenantTypeEnum = pgEnum('tenant_type', ['beta', 'business', 'franchise']);
export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'suspended', 'pending', 'cancelled']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['starter', 'professional', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'cancelled', 'trialing']);
export const tenantMemberRoleEnum = pgEnum('tenant_member_role', ['owner', 'admin', 'manager', 'member', 'viewer']);

// Tenants table - core multi-tenant entity
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  type: tenantTypeEnum("type").notNull().default('business'),
  status: tenantStatusEnum("status").notNull().default('pending'),
  parentTenantId: varchar("parent_tenant_id"),
  domain: varchar("domain", { length: 255 }),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default('#06B6D4'),
  venueAddress: text("venue_address"),
  venueCity: varchar("venue_city", { length: 100 }),
  venueState: varchar("venue_state", { length: 50 }),
  venueZip: varchar("venue_zip", { length: 20 }),
  venueCountry: varchar("venue_country", { length: 100 }).default('USA'),
  timezone: varchar("timezone", { length: 50 }).default('America/Chicago'),
  isSandbox: boolean("is_sandbox").default(false),
  showCommercialFeatures: boolean("show_commercial_features").default(false),
  showSalesContent: boolean("show_sales_content").default(false),
  showInvestorContent: boolean("show_investor_content").default(false),
  hallmarkPrefix: varchar("hallmark_prefix", { length: 10 }),
  assetCounter: integer("asset_counter").default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_tenant_slug").on(table.slug),
  index("IDX_tenant_type").on(table.type),
  index("IDX_tenant_status").on(table.status),
  index("IDX_tenant_parent").on(table.parentTenantId),
]);

// Subscriptions table - billing and plan information
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  plan: subscriptionPlanEnum("plan").notNull().default('starter'),
  status: subscriptionStatusEnum("status").notNull().default('trialing'),
  billingEmail: varchar("billing_email", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelledAt: timestamp("cancelled_at"),
  monthlyPriceCents: integer("monthly_price_cents").default(0),
  maxUsers: integer("max_users").default(10),
  maxStands: integer("max_stands").default(25),
  features: jsonb("features").$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_subscription_tenant").on(table.tenantId),
  index("IDX_subscription_status").on(table.status),
  index("IDX_subscription_stripe").on(table.stripeCustomerId),
]);

// Tenant memberships - links users to tenants with roles
export const tenantMemberships = pgTable("tenant_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: tenantMemberRoleEnum("role").notNull().default('member'),
  isDefault: boolean("is_default").default(false),
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_membership_tenant").on(table.tenantId),
  index("IDX_membership_user").on(table.userId),
  index("IDX_membership_role").on(table.role),
]);

// Feature flags for tenant-specific functionality
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  featureKey: varchar("feature_key", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  config: jsonb("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_feature_tenant").on(table.tenantId),
  index("IDX_feature_key").on(table.featureKey),
]);

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTenantMembershipSchema = createInsertSchema(tenantMemberships).omit({ id: true, createdAt: true });
export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true });

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type TenantMembership = typeof tenantMemberships.$inferSelect;
export type InsertTenantMembership = z.infer<typeof insertTenantMembershipSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

// Default beta tenant configuration for Nissan Stadium
export const NISSAN_STADIUM_BETA_CONFIG = {
  name: 'Nissan Stadium',
  slug: 'nissan-stadium',
  type: 'beta' as const,
  status: 'active' as const,
  venueCity: 'Nashville',
  venueState: 'Tennessee',
  timezone: 'America/Chicago',
  isSandbox: false,
  showCommercialFeatures: false,
  showSalesContent: false,
  showInvestorContent: false,
  hallmarkPrefix: 'ORB',
  metadata: {
    venueName: 'Nissan Stadium',
    operator: 'Legends Hospitality',
    genesisHallmark: 'ORB-000000000013',
    betaVersion: 'v1.0.7',
  }
};

// ============ AUDIT LOG, ORBIT INTEGRATION & EMERGENCY ALERTS ============
// Insert schemas
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertOrbitRosterSchema = createInsertSchema(orbitRosters).omit({ id: true, createdAt: true });
export const insertOrbitShiftSchema = createInsertSchema(orbitShifts).omit({ id: true });
export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmergencyResponderSchema = createInsertSchema(emergencyResponders).omit({ id: true });
export const insertEmergencyEscalationHistorySchema = createInsertSchema(emergencyEscalationHistory).omit({ id: true, createdAt: true });
export const insertEmergencyAlertNotificationSchema = createInsertSchema(emergencyAlertNotifications).omit({ id: true, sentAt: true });

// Types
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type OrbitRoster = typeof orbitRosters.$inferSelect;
export type InsertOrbitRoster = z.infer<typeof insertOrbitRosterSchema>;
export type OrbitShift = typeof orbitShifts.$inferSelect;
export type InsertOrbitShift = z.infer<typeof insertOrbitShiftSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type EmergencyResponder = typeof emergencyResponders.$inferSelect;
export type InsertEmergencyResponder = z.infer<typeof insertEmergencyResponderSchema>;
export type EmergencyEscalationHistory = typeof emergencyEscalationHistory.$inferSelect;
export type InsertEmergencyEscalationHistory = z.infer<typeof insertEmergencyEscalationHistorySchema>;
export type EmergencyAlertNotification = typeof emergencyAlertNotifications.$inferSelect;
export type InsertEmergencyAlertNotification = z.infer<typeof insertEmergencyAlertNotificationSchema>;

// ============ SUPERVISOR LIVE TRACKING SYSTEM ============
// For managers to see real-time supervisor activity
export const supervisorSessionStatusEnum = pgEnum('supervisor_session_status', ['online', 'away', 'busy', 'offline']);

export const supervisorSessions = pgTable("supervisor_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supervisorId: varchar("supervisor_id").references(() => users.id).notNull(),
  supervisorName: text("supervisor_name").notNull(),
  currentStandId: varchar("current_stand_id", { length: 20 }).references(() => stands.id),
  currentStandName: text("current_stand_name"),
  currentSection: text("current_section"),
  status: supervisorSessionStatusEnum("status").default('online'),
  currentTab: varchar("current_tab", { length: 50 }),
  isSandbox: boolean("is_sandbox").default(false),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
  sessionStartedAt: timestamp("session_started_at").defaultNow(),
  sessionEndedAt: timestamp("session_ended_at"),
}, (table) => [
  index("IDX_supervisor_session_supervisor").on(table.supervisorId),
  index("IDX_supervisor_session_status").on(table.status),
  index("IDX_supervisor_session_heartbeat").on(table.lastHeartbeat),
]);

export const supervisorActivityKindEnum = pgEnum('supervisor_activity_kind', [
  'login', 'logout', 'stand_selected', 'tab_changed', 'delivery_requested', 
  'issue_opened', 'issue_resolved', 'count_started', 'count_completed',
  'message_sent', 'compliance_submitted', 'facility_issue', 'emergency_alert'
]);

export const supervisorActivity = pgTable("supervisor_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => supervisorSessions.id).notNull(),
  supervisorId: varchar("supervisor_id").references(() => users.id).notNull(),
  supervisorName: text("supervisor_name").notNull(),
  kind: supervisorActivityKindEnum("kind").notNull(),
  description: text("description"),
  standId: varchar("stand_id", { length: 20 }),
  standName: text("stand_name"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_supervisor_activity_session").on(table.sessionId),
  index("IDX_supervisor_activity_supervisor").on(table.supervisorId),
  index("IDX_supervisor_activity_kind").on(table.kind),
  index("IDX_supervisor_activity_created").on(table.createdAt),
]);

export const insertSupervisorSessionSchema = createInsertSchema(supervisorSessions).omit({ id: true, sessionStartedAt: true });
export const insertSupervisorActivitySchema = createInsertSchema(supervisorActivity).omit({ id: true, createdAt: true });

export type SupervisorSession = typeof supervisorSessions.$inferSelect;
export type InsertSupervisorSession = z.infer<typeof insertSupervisorSessionSchema>;
export type SupervisorActivity = typeof supervisorActivity.$inferSelect;
export type InsertSupervisorActivity = z.infer<typeof insertSupervisorActivitySchema>;

// ============ ACTIVE EVENT SYSTEM ============
// Controls when the system is in LIVE mode vs SANDBOX mode
// Only managers can activate events - when no event is active, system defaults to sandbox
export const eventStatusEnum = pgEnum('event_status', ['scheduled', 'active', 'completed', 'cancelled']);

export const activeEvents = pgTable("active_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventName: text("event_name").notNull(),
  eventDate: text("event_date").notNull(), // YYYY-MM-DD format
  eventType: text("event_type").default('standard'), // standard, concert, special
  status: eventStatusEnum("status").notNull().default('scheduled'),
  doorsOpenTime: text("doors_open_time"), // HH:MM format
  eventStartTime: text("event_start_time"), // HH:MM format
  eventEndTime: text("event_end_time"), // HH:MM format
  expectedAttendance: integer("expected_attendance"),
  activatedById: varchar("activated_by_id").references(() => users.id),
  activatedByName: text("activated_by_name"),
  activatedAt: timestamp("activated_at"),
  deactivatedById: varchar("deactivated_by_id").references(() => users.id),
  deactivatedByName: text("deactivated_by_name"),
  deactivatedAt: timestamp("deactivated_at"),
  notes: text("notes"),
  geofenceMode: text("geofence_mode").default('stadium'), // stadium, custom
  geofenceRadiusFeet: integer("geofence_radius_feet").default(100),
  staffingGridEnabled: boolean("staffing_grid_enabled").default(false),
  departmentNotes: jsonb("department_notes").$type<Array<{department: string; note: string}>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_active_events_date").on(table.eventDate),
  index("IDX_active_events_status").on(table.status),
]);

export const insertActiveEventSchema = createInsertSchema(activeEvents).omit({ id: true, createdAt: true, updatedAt: true });
export type ActiveEvent = typeof activeEvents.$inferSelect;
export type InsertActiveEvent = z.infer<typeof insertActiveEventSchema>;

// Hidden full access PINs (developer access, not publicly visible)
export const HIDDEN_FULL_ACCESS_PINS = ['0424', '444']; // Jason (dev + ops supervisor)

// Authorized PINs for event activation (David + hidden full access)
export const EVENT_ADMIN_PINS = ['2424', ...HIDDEN_FULL_ACCESS_PINS];

// ============ CULINARY TEAM MANAGEMENT ============
// Chef Deb manages culinary team, Shelia provides supervisory oversight during events

export const culinaryCheckInStatusEnum = pgEnum('culinary_check_in_status', [
  'Scheduled',   // Assigned but not yet checked in
  'CheckedIn',   // Currently working
  'OnBreak',     // On break
  'CheckedOut',  // Completed shift
  'NoShow'       // Did not check in
]);

// Culinary Event Assignments - assigns cooks to events and stands
export const culinaryEventAssignments = pgTable("culinary_event_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => activeEvents.id),
  eventDate: text("event_date").notNull(), // YYYY-MM-DD format
  cookId: varchar("cook_id").references(() => users.id).notNull(),
  cookName: text("cook_name").notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  standName: text("stand_name"),
  position: text("position"), // 'Fryer', 'Grill', 'Prep', 'Lead Cook'
  shiftStart: text("shift_start"), // HH:MM format
  shiftEnd: text("shift_end"), // HH:MM format
  assignedById: varchar("assigned_by_id").references(() => users.id),
  assignedByName: text("assigned_by_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_culinary_assignments_event").on(table.eventId),
  index("IDX_culinary_assignments_date").on(table.eventDate),
  index("IDX_culinary_assignments_cook").on(table.cookId),
  index("IDX_culinary_assignments_stand").on(table.standId),
]);

// Culinary Check-Ins - tracks when cooks check in/out for events
export const culinaryCheckIns = pgTable("culinary_check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => culinaryEventAssignments.id).notNull(),
  cookId: varchar("cook_id").references(() => users.id).notNull(),
  cookName: text("cook_name").notNull(),
  eventDate: text("event_date").notNull(),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  status: culinaryCheckInStatusEnum("status").notNull().default('Scheduled'),
  checkInTime: timestamp("check_in_time"),
  checkInById: varchar("check_in_by_id").references(() => users.id), // Chef Deb or Shelia
  checkInByName: text("check_in_by_name"),
  breakStartTime: timestamp("break_start_time"),
  breakEndTime: timestamp("break_end_time"),
  checkOutTime: timestamp("check_out_time"),
  checkOutById: varchar("check_out_by_id").references(() => users.id),
  checkOutByName: text("check_out_by_name"),
  hoursWorked: text("hours_worked"), // Calculated on check-out
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_culinary_checkins_assignment").on(table.assignmentId),
  index("IDX_culinary_checkins_cook").on(table.cookId),
  index("IDX_culinary_checkins_date").on(table.eventDate),
  index("IDX_culinary_checkins_status").on(table.status),
]);

export const insertCulinaryEventAssignmentSchema = createInsertSchema(culinaryEventAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export type CulinaryEventAssignment = typeof culinaryEventAssignments.$inferSelect;
export type InsertCulinaryEventAssignment = z.infer<typeof insertCulinaryEventAssignmentSchema>;

export const insertCulinaryCheckInSchema = createInsertSchema(culinaryCheckIns).omit({ id: true, createdAt: true, updatedAt: true });
export type CulinaryCheckIn = typeof culinaryCheckIns.$inferSelect;
export type InsertCulinaryCheckIn = z.infer<typeof insertCulinaryCheckInSchema>;

// Authorized PINs for culinary team management (Chef Deb and Shelia)
export const CULINARY_MANAGER_PINS: string[] = []; // Will be populated after users are created

// ============ VENUE GEOFENCE CONFIGURATION ============
// Configurable geofencing for different event types (David/Jason only)
export const eventPresetEnum = pgEnum('event_preset', ['standard', 'largeOutdoor', 'extended', 'custom']);

export const venueGeofenceConfig = pgTable("venue_geofence_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  preset: eventPresetEnum("preset").notNull().default('standard'),
  radiusFeet: integer("radius_feet").notNull().default(100),
  customRadiusFeet: integer("custom_radius_feet"),
  maxConcurrentUsers: integer("max_concurrent_users").default(500),
  eventName: text("event_name"),
  isActive: boolean("is_active").default(true),
  updatedById: varchar("updated_by_id").references(() => users.id),
  updatedByName: text("updated_by_name"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVenueGeofenceConfigSchema = createInsertSchema(venueGeofenceConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type VenueGeofenceConfig = typeof venueGeofenceConfig.$inferSelect;
export type InsertVenueGeofenceConfig = z.infer<typeof insertVenueGeofenceConfigSchema>;

// Authorized PINs for geofence configuration (David and Jason only)
export const GEOFENCE_ADMIN_PINS = ['2424', '0424'];

// ============ KEY & RADIO CHECKOUT SYSTEM ============
// For Legends employees only - tracks key sets (1-50) and radio assignments
export const equipmentTypeEnum = pgEnum('equipment_type', ['key', 'radio']);
export const equipmentStatusEnum = pgEnum('equipment_status', ['available', 'checked_out', 'missing', 'maintenance']);

// Key Sets - 50 key sets available for checkout
export const keySets = pgTable("key_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyNumber: integer("key_number").notNull().unique(), // 1-50
  label: text("label"), // Optional label like "Main Gate" or "Suite Level"
  status: equipmentStatusEnum("status").default('available'),
  currentHolderId: varchar("current_holder_id").references(() => users.id),
  currentHolderName: text("current_holder_name"),
  currentHolderRole: text("current_holder_role"),
  checkedOutAt: timestamp("checked_out_at"),
  expectedReturnTime: timestamp("expected_return_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_key_sets_number").on(table.keyNumber),
  index("IDX_key_sets_status").on(table.status),
  index("IDX_key_sets_holder").on(table.currentHolderId),
]);

// Radios - track individual radios
export const radios = pgTable("radios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  radioNumber: integer("radio_number").notNull().unique(), // Radio ID number
  channel: text("channel"), // Default channel assignment
  status: equipmentStatusEnum("status").default('available'),
  currentHolderId: varchar("current_holder_id").references(() => users.id),
  currentHolderName: text("current_holder_name"),
  currentHolderRole: text("current_holder_role"),
  checkedOutAt: timestamp("checked_out_at"),
  batteryLevel: integer("battery_level"), // 0-100 percentage
  lastKnownLocation: text("last_known_location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_radios_number").on(table.radioNumber),
  index("IDX_radios_status").on(table.status),
  index("IDX_radios_holder").on(table.currentHolderId),
]);

// Equipment checkout history - audit trail for all checkouts/checkins
export const equipmentCheckoutHistory = pgTable("equipment_checkout_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentType: equipmentTypeEnum("equipment_type").notNull(),
  equipmentId: varchar("equipment_id").notNull(), // References keySets.id or radios.id
  equipmentNumber: integer("equipment_number").notNull(), // Key set number or radio number
  action: text("action").notNull(), // 'checkout', 'checkin', 'transfer', 'lost', 'found'
  userId: varchar("user_id").references(() => users.id).notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  previousHolderId: varchar("previous_holder_id"),
  previousHolderName: text("previous_holder_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_checkout_history_equipment").on(table.equipmentId),
  index("IDX_checkout_history_user").on(table.userId),
  index("IDX_checkout_history_type").on(table.equipmentType),
  index("IDX_checkout_history_created").on(table.createdAt),
]);

// Equipment alerts - for geofence violations (leaving with equipment)
export const equipmentAlertStatusEnum = pgEnum('equipment_alert_status', ['pending', 'acknowledged', 'resolved', 'dismissed']);

export const equipmentAlerts = pgTable("equipment_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  userName: text("user_name").notNull(),
  alertType: text("alert_type").notNull(), // 'geofence_exit', 'overdue_return', 'missing'
  equipmentType: equipmentTypeEnum("equipment_type").notNull(),
  equipmentId: varchar("equipment_id").notNull(),
  equipmentNumber: integer("equipment_number").notNull(),
  message: text("message").notNull(),
  status: equipmentAlertStatusEnum("status").default('pending'),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_equipment_alerts_user").on(table.userId),
  index("IDX_equipment_alerts_status").on(table.status),
  index("IDX_equipment_alerts_created").on(table.createdAt),
]);

// Insert schemas
export const insertKeySetSchema = createInsertSchema(keySets).omit({ id: true, createdAt: true });
export const insertRadioSchema = createInsertSchema(radios).omit({ id: true, createdAt: true });
export const insertEquipmentCheckoutHistorySchema = createInsertSchema(equipmentCheckoutHistory).omit({ id: true, createdAt: true });
export const insertEquipmentAlertSchema = createInsertSchema(equipmentAlerts).omit({ id: true, createdAt: true });

// Types
export type KeySet = typeof keySets.$inferSelect;
export type InsertKeySet = z.infer<typeof insertKeySetSchema>;
export type Radio = typeof radios.$inferSelect;
export type InsertRadio = z.infer<typeof insertRadioSchema>;
export type EquipmentCheckoutHistory = typeof equipmentCheckoutHistory.$inferSelect;
export type InsertEquipmentCheckoutHistory = z.infer<typeof insertEquipmentCheckoutHistorySchema>;
export type EquipmentAlert = typeof equipmentAlerts.$inferSelect;
export type InsertEquipmentAlert = z.infer<typeof insertEquipmentAlertSchema>;

// Legends employee roles (eligible for key/radio checkout)
export const LEGENDS_EMPLOYEE_ROLES = [
  'StandLead',
  'StandSupervisor', 
  'ManagementCore',
  'ManagementAssistant',
  'AlcoholCompliance',
  'CheckInAssistant',
  'IT',
  'Admin',
  'Developer'
] as const;

// ============ POS DEVICE TRACKING SYSTEM ============
// For IT team to track and assign POS devices to stands/portables/bars

// POS device types - configurable for different hardware
export const posDeviceTypeEnum = pgEnum('pos_device_type', ['A930', 'A700', 'PAX', 'Other']);
export const posDeviceStatusEnum = pgEnum('pos_device_status', ['available', 'assigned', 'maintenance', 'missing', 'retired']);
export const posLocationTypeEnum = pgEnum('pos_location_type', ['Stand', 'Portable', 'Bar', 'Suites', 'Other']);
export const posAssignmentStatusEnum = pgEnum('pos_assignment_status', ['active', 'returned', 'replaced', 'transferred']);

// POS Device Types - configurable list of device types (David can add/edit)
export const posDeviceTypes = pgTable("pos_device_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // A930, A700, PAX, etc.
  description: text("description"),
  manufacturer: text("manufacturer"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Devices - individual POS units with serial numbers
export const posDevices = pgTable("pos_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceNumber: integer("device_number").notNull().unique(), // Unique identifier for this POS
  deviceType: posDeviceTypeEnum("device_type").notNull(), // A930, A700, PAX, Other
  customType: text("custom_type"), // If type is "Other", specify here
  serialNumber: text("serial_number"), // Manufacturer serial
  assetTag: text("asset_tag"), // Internal asset tag
  status: posDeviceStatusEnum("status").default('available'),
  currentLocationId: varchar("current_location_id"), // Stand/Portable/Bar ID
  currentLocationType: posLocationTypeEnum("current_location_type"),
  currentLocationName: text("current_location_name"),
  assignedById: varchar("assigned_by_id").references(() => users.id),
  assignedByName: text("assigned_by_name"),
  assignedAt: timestamp("assigned_at"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_pos_devices_number").on(table.deviceNumber),
  index("IDX_pos_devices_type").on(table.deviceType),
  index("IDX_pos_devices_status").on(table.status),
  index("IDX_pos_devices_location").on(table.currentLocationId),
]);

// POS Location Grid - David's setup of which locations get which POS numbers
// This is the "master grid" that IT uses to know where each POS should go
export const posLocationGrid = pgTable("pos_location_grid", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").notNull(), // Stand/Portable/Bar ID
  locationType: posLocationTypeEnum("location_type").notNull(),
  locationName: text("location_name").notNull(),
  section: text("section"), // Stadium section
  expectedPosCount: integer("expected_pos_count").default(1), // How many POS should be here
  posDeviceNumbers: integer("pos_device_numbers").array().default(sql`ARRAY[]::integer[]`), // Which device numbers are assigned
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdById: varchar("created_by_id").references(() => users.id),
  createdByName: text("created_by_name"),
  updatedById: varchar("updated_by_id").references(() => users.id),
  updatedByName: text("updated_by_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_pos_grid_location").on(table.locationId),
  index("IDX_pos_grid_type").on(table.locationType),
  index("IDX_pos_grid_section").on(table.section),
]);

// POS Assignments - actual assignments for events (who assigned what, when)
export const posAssignments = pgTable("pos_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  posDeviceId: varchar("pos_device_id").references(() => posDevices.id).notNull(),
  posDeviceNumber: integer("pos_device_number").notNull(),
  posDeviceType: posDeviceTypeEnum("pos_device_type").notNull(),
  locationId: varchar("location_id").notNull(),
  locationType: posLocationTypeEnum("location_type").notNull(),
  locationName: text("location_name").notNull(),
  eventDate: text("event_date"), // For event-specific assignments
  eventName: text("event_name"),
  status: posAssignmentStatusEnum("status").default('active'),
  assignedById: varchar("assigned_by_id").references(() => users.id).notNull(),
  assignedByName: text("assigned_by_name").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  returnedAt: timestamp("returned_at"),
  returnedById: varchar("returned_by_id").references(() => users.id),
  returnedByName: text("returned_by_name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_pos_assignments_device").on(table.posDeviceId),
  index("IDX_pos_assignments_location").on(table.locationId),
  index("IDX_pos_assignments_status").on(table.status),
  index("IDX_pos_assignments_event").on(table.eventDate),
]);

// POS Replacement History - when a POS is swapped mid-event
export const posReplacements = pgTable("pos_replacements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalPosId: varchar("original_pos_id").references(() => posDevices.id).notNull(),
  originalPosNumber: integer("original_pos_number").notNull(),
  replacementPosId: varchar("replacement_pos_id").references(() => posDevices.id).notNull(),
  replacementPosNumber: integer("replacement_pos_number").notNull(),
  locationId: varchar("location_id").notNull(),
  locationType: posLocationTypeEnum("location_type").notNull(),
  locationName: text("location_name").notNull(),
  reason: text("reason").notNull(), // "malfunction", "damage", "upgrade", etc.
  reportedIssue: text("reported_issue"), // What was wrong
  replacedById: varchar("replaced_by_id").references(() => users.id).notNull(),
  replacedByName: text("replaced_by_name").notNull(),
  eventDate: text("event_date"),
  eventName: text("event_name"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_pos_replacements_original").on(table.originalPosId),
  index("IDX_pos_replacements_replacement").on(table.replacementPosId),
  index("IDX_pos_replacements_location").on(table.locationId),
  index("IDX_pos_replacements_event").on(table.eventDate),
]);

// POS Issue Reports - for reporting problems (feeds into David's message to IT)
export const posIssueStatusEnum = pgEnum('pos_issue_status', ['Open', 'Acknowledged', 'InProgress', 'Resolved', 'Closed']);

export const posIssues = pgTable("pos_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  posDeviceId: varchar("pos_device_id").references(() => posDevices.id),
  posDeviceNumber: integer("pos_device_number"),
  locationId: varchar("location_id").notNull(),
  locationType: posLocationTypeEnum("location_type").notNull(),
  locationName: text("location_name").notNull(),
  issueType: text("issue_type").notNull(), // "not_working", "slow", "display_issue", "card_reader", etc.
  description: text("description").notNull(),
  priority: text("priority").default('normal'), // "low", "normal", "high", "critical"
  status: posIssueStatusEnum("status").default('Open'),
  reportedById: varchar("reported_by_id").references(() => users.id).notNull(),
  reportedByName: text("reported_by_name").notNull(),
  reportedByRole: text("reported_by_role").notNull(),
  assignedToId: varchar("assigned_to_id").references(() => users.id), // IT team member
  assignedToName: text("assigned_to_name"),
  resolvedById: varchar("resolved_by_id").references(() => users.id),
  resolvedByName: text("resolved_by_name"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  eventDate: text("event_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("IDX_pos_issues_device").on(table.posDeviceId),
  index("IDX_pos_issues_location").on(table.locationId),
  index("IDX_pos_issues_status").on(table.status),
  index("IDX_pos_issues_assigned").on(table.assignedToId),
]);

// Insert schemas for POS system
export const insertPosDeviceTypeSchema = createInsertSchema(posDeviceTypes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPosDeviceSchema = createInsertSchema(posDevices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPosLocationGridSchema = createInsertSchema(posLocationGrid).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPosAssignmentSchema = createInsertSchema(posAssignments).omit({ id: true, createdAt: true });
export const insertPosReplacementSchema = createInsertSchema(posReplacements).omit({ id: true, createdAt: true });
export const insertPosIssueSchema = createInsertSchema(posIssues).omit({ id: true, createdAt: true, updatedAt: true });

// Types for POS system
export type PosDeviceType = typeof posDeviceTypes.$inferSelect;
export type InsertPosDeviceType = z.infer<typeof insertPosDeviceTypeSchema>;
export type PosDevice = typeof posDevices.$inferSelect;
export type InsertPosDevice = z.infer<typeof insertPosDeviceSchema>;
export type PosLocationGrid = typeof posLocationGrid.$inferSelect;
export type InsertPosLocationGrid = z.infer<typeof insertPosLocationGridSchema>;
export type PosAssignment = typeof posAssignments.$inferSelect;
export type InsertPosAssignment = z.infer<typeof insertPosAssignmentSchema>;
export type PosReplacement = typeof posReplacements.$inferSelect;
export type InsertPosReplacement = z.infer<typeof insertPosReplacementSchema>;
export type PosIssue = typeof posIssues.$inferSelect;
export type InsertPosIssue = z.infer<typeof insertPosIssueSchema>;

// Default POS device types (seed data)
export const DEFAULT_POS_TYPES = [
  { name: 'A930', description: 'Ingenico Axium A930 - Mobile POS', manufacturer: 'Ingenico' },
  { name: 'A700', description: 'Ingenico Axium A700 - Countertop POS', manufacturer: 'Ingenico' },
  { name: 'PAX', description: 'PAX Payment Terminal', manufacturer: 'PAX Technology' },
] as const;

// =====================================
// DOCUMENT SCANNING & TEMPLATES SYSTEM
// =====================================

// Document type categories for auto-recognition and routing
export const scannedDocTypeEnum = pgEnum('scanned_doc_type', [
  'bar_control',        // Bar control sheets
  'alcohol_compliance', // Alcohol compliance forms
  'stand_grid',         // Stand layout grids
  'worker_grid',        // Worker assignment grids
  'schedule',           // Staff schedules
  'inventory_count',    // Inventory count sheets
  'incident_report',    // Incident reports
  'closing_checklist',  // Stand closing checklists
  'temperature_log',    // Food temperature logs
  'cash_count',         // Cash drawer counts
  'delivery_receipt',   // Delivery receipts
  'other'               // Other documents
]);

// Document templates - configurable by managers
export const documentTemplates = pgTable("document_templates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  documentType: scannedDocTypeEnum("document_type").notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull(), // Array of field definitions: {name, type, required, options}
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // System-provided default templates
  createdById: varchar("created_by_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scanned documents - all scanned/captured documents with auto-classification
export const scannedDocuments = pgTable("scanned_documents", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  documentType: scannedDocTypeEnum("document_type").notNull(),
  detectedType: scannedDocTypeEnum("detected_type"), // AI-detected type (may differ from final)
  confidence: text("confidence"), // AI confidence: high, medium, low
  templateId: varchar("template_id", { length: 36 }).references(() => documentTemplates.id),
  standId: varchar("stand_id", { length: 20 }).references(() => stands.id),
  eventDate: text("event_date"),
  eventName: text("event_name"),
  imageUrl: text("image_url"), // Original scanned image
  thumbnailUrl: text("thumbnail_url"),
  extractedData: jsonb("extracted_data"), // OCR/AI extracted structured data
  rawOcrText: text("raw_ocr_text"), // Raw OCR text for searchability
  submittedById: varchar("submitted_by_id", { length: 36 }).references(() => users.id),
  submittedByName: text("submitted_by_name"),
  verifiedById: varchar("verified_by_id", { length: 36 }).references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  status: text("status").default('pending'), // pending, verified, rejected
  notes: text("notes"),
  isSandbox: boolean("is_sandbox").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("IDX_scanned_docs_type").on(table.documentType),
  index("IDX_scanned_docs_stand").on(table.standId),
  index("IDX_scanned_docs_event").on(table.eventDate),
  index("IDX_scanned_docs_status").on(table.status),
]);

// Insert schemas for document system
export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScannedDocumentSchema = createInsertSchema(scannedDocuments).omit({ id: true, createdAt: true });

// Types for document system
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;
export type ScannedDocument = typeof scannedDocuments.$inferSelect;
export type InsertScannedDocument = z.infer<typeof insertScannedDocumentSchema>;

// Release Management System - aligned with ORBIT Dev Hub blueprint
export const releases = pgTable("releases", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  version: varchar("version", { length: 50 }).notNull().unique(),
  versionType: varchar("version_type", { length: 20 }), // 'major' | 'minor' | 'patch'
  versionNumber: integer("version_number"), // Numeric version counter
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  changes: jsonb("changes"), // Changelog JSON
  highlights: text("highlights"), // Key highlights summary
  notes: text("notes"), // Additional release notes
  releaseHash: varchar("release_hash", { length: 128 }), // SHA-256 hash stored
  releasedById: varchar("released_by_id", { length: 36 }).references(() => users.id),
  releasedAt: timestamp("released_at"),
  solanaTransactionHash: varchar("solana_transaction_hash", { length: 128 }),
  solanaNetwork: varchar("solana_network", { length: 50 }),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReleaseSchema = createInsertSchema(releases).omit({ id: true, createdAt: true });
export type Release = typeof releases.$inferSelect;
export type InsertRelease = z.infer<typeof insertReleaseSchema>;

// Document type display names and routing
export const DOCUMENT_TYPE_CONFIG = {
  bar_control: {
    name: 'Bar Control Sheet',
    category: 'Compliance',
    icon: 'Wine',
    routeTo: ['BarManager', 'OperationsManager'],
    color: 'purple'
  },
  alcohol_compliance: {
    name: 'Alcohol Compliance',
    category: 'Compliance',
    icon: 'Shield',
    routeTo: ['AlcoholCompliance', 'BarManager'],
    color: 'red'
  },
  stand_grid: {
    name: 'Stand Grid',
    category: 'Operations',
    icon: 'Grid',
    routeTo: ['OperationsManager', 'StandSupervisor'],
    color: 'blue'
  },
  worker_grid: {
    name: 'Worker Grid',
    category: 'Operations',
    icon: 'Users',
    routeTo: ['OperationsManager', 'HRManager'],
    color: 'green'
  },
  schedule: {
    name: 'Schedule',
    category: 'Operations',
    icon: 'Calendar',
    routeTo: ['OperationsManager', 'HRManager'],
    color: 'cyan'
  },
  inventory_count: {
    name: 'Inventory Count',
    category: 'Finance',
    icon: 'Package',
    routeTo: ['WarehouseManager', 'OperationsManager'],
    color: 'amber'
  },
  incident_report: {
    name: 'Incident Report',
    category: 'Compliance',
    icon: 'AlertTriangle',
    routeTo: ['OperationsManager', 'HRManager'],
    color: 'red'
  },
  closing_checklist: {
    name: 'Closing Checklist',
    category: 'Operations',
    icon: 'CheckSquare',
    routeTo: ['StandSupervisor', 'OperationsManager'],
    color: 'green'
  },
  temperature_log: {
    name: 'Temperature Log',
    category: 'Compliance',
    icon: 'Thermometer',
    routeTo: ['KitchenManager', 'OperationsManager'],
    color: 'orange'
  },
  cash_count: {
    name: 'Cash Count',
    category: 'Finance',
    icon: 'DollarSign',
    routeTo: ['OperationsManager', 'WarehouseManager'],
    color: 'green'
  },
  delivery_receipt: {
    name: 'Delivery Receipt',
    category: 'Operations',
    icon: 'Truck',
    routeTo: ['WarehouseManager'],
    color: 'blue'
  },
  other: {
    name: 'Other Document',
    category: 'Other',
    icon: 'FileText',
    routeTo: ['OperationsManager'],
    color: 'gray'
  }
} as const;

// Analytics metric type enum
export const analyticsMetricTypeEnum = pgEnum('analytics_metric_type', [
  'page_view', 'unique_visitor', 'unique_user', 'seo_edit', 'api_call', 'login', 'error'
]);

// Analytics visits - tracks each page visit
export const analyticsVisits = pgTable("analytics_visits", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('demo'),
  route: text("route").notNull(),
  userId: varchar("user_id", { length: 36 }),
  sessionId: varchar("session_id", { length: 64 }).notNull(),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  isUniqueVisitor: boolean("is_unique_visitor").default(false),
  isUniqueUser: boolean("is_unique_user").default(false),
  occurredAt: timestamp("occurred_at").defaultNow(),
}, (table) => [
  index("analytics_visits_tenant_idx").on(table.tenantId),
  index("analytics_visits_date_idx").on(table.occurredAt)
]);

// Analytics daily rollups - aggregated metrics by day and tenant
export const analyticsDailyRollups = pgTable("analytics_daily_rollups", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('demo'),
  date: text("date").notNull(),
  metricType: analyticsMetricTypeEnum("metric_type").notNull(),
  value: integer("value").notNull().default(0),
  metadata: jsonb("metadata"),
}, (table) => [
  index("analytics_rollups_tenant_date_idx").on(table.tenantId, table.date)
]);

// SEO tag edits tracking
export const seoTagEdits = pgTable("seo_tag_edits", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id", { length: 50 }).notNull().default('demo'),
  tagType: text("tag_type").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  editedBy: varchar("edited_by", { length: 36 }),
  editedAt: timestamp("edited_at").defaultNow(),
});

export type AnalyticsVisit = typeof analyticsVisits.$inferSelect;
export type InsertAnalyticsVisit = typeof analyticsVisits.$inferInsert;
export type AnalyticsDailyRollup = typeof analyticsDailyRollups.$inferSelect;
export type InsertAnalyticsDailyRollup = typeof analyticsDailyRollups.$inferInsert;
export type SeoTagEdit = typeof seoTagEdits.$inferSelect;
export type InsertSeoTagEdit = typeof seoTagEdits.$inferInsert;

export const insertAnalyticsVisitSchema = createInsertSchema(analyticsVisits).omit({ id: true, occurredAt: true });
export const insertAnalyticsDailyRollupSchema = createInsertSchema(analyticsDailyRollups).omit({ id: true });
export const insertSeoTagEditSchema = createInsertSchema(seoTagEdits).omit({ id: true, editedAt: true });

// Default document templates (seed data)
export const DEFAULT_DOCUMENT_TEMPLATES = [
  {
    name: 'Standard Bar Control Sheet',
    documentType: 'bar_control',
    description: 'Daily bar control sheet for tracking alcohol inventory and sales',
    isDefault: true,
    fields: [
      { name: 'stand', type: 'text', required: true, label: 'Stand/Location' },
      { name: 'date', type: 'date', required: true, label: 'Date' },
      { name: 'shift', type: 'select', required: true, label: 'Shift', options: ['Day', 'Night'] },
      { name: 'bartender', type: 'text', required: true, label: 'Bartender Name' },
      { name: 'startingInventory', type: 'number', required: true, label: 'Starting Inventory' },
      { name: 'received', type: 'number', required: false, label: 'Received During Shift' },
      { name: 'endingInventory', type: 'number', required: true, label: 'Ending Inventory' },
      { name: 'waste', type: 'number', required: false, label: 'Waste/Spillage' },
      { name: 'sales', type: 'number', required: false, label: 'Total Sales' },
      { name: 'notes', type: 'textarea', required: false, label: 'Notes' }
    ]
  },
  {
    name: 'Alcohol Compliance Check',
    documentType: 'alcohol_compliance',
    description: 'Alcohol compliance monitoring form',
    isDefault: true,
    fields: [
      { name: 'stand', type: 'text', required: true, label: 'Stand/Location' },
      { name: 'date', type: 'date', required: true, label: 'Date' },
      { name: 'time', type: 'time', required: true, label: 'Time of Check' },
      { name: 'vendorName', type: 'text', required: true, label: 'Vendor Name' },
      { name: 'idChecked', type: 'boolean', required: true, label: 'ID Checked' },
      { name: 'wristbandVerified', type: 'boolean', required: true, label: 'Wristband Verified' },
      { name: 'overserviceObserved', type: 'boolean', required: true, label: 'Overservice Observed' },
      { name: 'violationNoted', type: 'boolean', required: true, label: 'Violation Noted' },
      { name: 'violationDetails', type: 'textarea', required: false, label: 'Violation Details' },
      { name: 'inspector', type: 'text', required: true, label: 'Inspector Name' }
    ]
  },
  {
    name: 'Stand Assignment Grid',
    documentType: 'stand_grid',
    description: 'Stand layout and position assignments',
    isDefault: true,
    fields: [
      { name: 'section', type: 'text', required: true, label: 'Section' },
      { name: 'date', type: 'date', required: true, label: 'Date' },
      { name: 'event', type: 'text', required: true, label: 'Event Name' },
      { name: 'positions', type: 'grid', required: true, label: 'Positions', columns: ['Position', 'Stand ID', 'Status'] },
      { name: 'notes', type: 'textarea', required: false, label: 'Notes' }
    ]
  },
  {
    name: 'Worker Assignment Grid',
    documentType: 'worker_grid',
    description: 'Worker assignments to stands and positions',
    isDefault: true,
    fields: [
      { name: 'date', type: 'date', required: true, label: 'Date' },
      { name: 'event', type: 'text', required: true, label: 'Event Name' },
      { name: 'assignments', type: 'grid', required: true, label: 'Assignments', columns: ['Name', 'Stand', 'Position', 'Check-in Time'] },
      { name: 'supervisor', type: 'text', required: true, label: 'Supervisor' },
      { name: 'notes', type: 'textarea', required: false, label: 'Notes' }
    ]
  },
  {
    name: 'Staff Schedule',
    documentType: 'schedule',
    description: 'Daily staff schedule',
    isDefault: true,
    fields: [
      { name: 'date', type: 'date', required: true, label: 'Date' },
      { name: 'department', type: 'select', required: true, label: 'Department', options: ['Warehouse', 'Kitchen', 'Bar', 'Operations'] },
      { name: 'shifts', type: 'grid', required: true, label: 'Shifts', columns: ['Name', 'Role', 'Start Time', 'End Time', 'Assignment'] },
      { name: 'manager', type: 'text', required: true, label: 'Manager on Duty' }
    ]
  },
  {
    name: 'Inventory Count Sheet',
    documentType: 'inventory_count',
    description: 'Standard inventory count sheet',
    isDefault: true,
    fields: [
      { name: 'stand', type: 'text', required: true, label: 'Stand/Location' },
      { name: 'date', type: 'date', required: true, label: 'Date' },
      { name: 'countType', type: 'select', required: true, label: 'Count Type', options: ['PreEvent', 'PostEvent', 'DayAfter'] },
      { name: 'items', type: 'grid', required: true, label: 'Items', columns: ['Item Name', 'Count', 'Notes'] },
      { name: 'counterName', type: 'text', required: true, label: 'Counter Name' },
      { name: 'counterPhone', type: 'text', required: false, label: 'Counter Phone (Last 4)' }
    ]
  }
] as const;
