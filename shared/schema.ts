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
export const departmentEnum = pgEnum('department', ['Warehouse', 'Kitchen', 'Bar', 'IT', 'Operations', 'HR']);
export const requestPriorityEnum = pgEnum('request_priority', ['Normal', 'Emergency']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['Requested', 'Acknowledged', 'InProgress', 'OnTheWay', 'Delivered', 'Cancelled']);

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
