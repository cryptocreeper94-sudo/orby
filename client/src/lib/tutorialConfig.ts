export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  targetSelector?: string;
  linkRoute?: string;
  linkText?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface PageTutorial {
  page: string;
  title: string;
  steps: TutorialStep[];
}

export const tutorialConfigs: Record<string, PageTutorial> = {
  npo: {
    page: "npo",
    title: "NPO Worker Dashboard",
    steps: [
      {
        id: "welcome",
        title: "Welcome to Your Dashboard",
        body: "This is your home base for all your stand duties. Let's walk through what you can do here.",
        position: "center"
      },
      {
        id: "stand-info",
        title: "Your Stand Assignment",
        body: "At the top, you'll see which stand you're assigned to for today's event.",
        targetSelector: "[data-testid='stand-assignment']",
        position: "bottom"
      },
      {
        id: "pre-event-count",
        title: "Pre-Event Counting",
        body: "Tap this button to start counting inventory before the event. You'll enter the last 4 digits of your phone to sign in.",
        targetSelector: "[data-testid='button-pre-event-count']",
        linkText: "Start Pre-Event Count",
        position: "bottom"
      },
      {
        id: "ai-scanner",
        title: "AI Can Counter",
        body: "Inside the count sheet, you can use the AI scanner to automatically count cans and bottles by taking a photo of the cooler.",
        position: "center"
      },
      {
        id: "check-in",
        title: "Check In",
        body: "Use this to confirm you've arrived at your stand. The system verifies your location.",
        targetSelector: "[data-testid='button-check-in']",
        position: "bottom"
      },
      {
        id: "report-issue",
        title: "Report Issues",
        body: "If something's wrong with equipment or you need help, tap here to report it to your supervisor.",
        targetSelector: "[data-testid='button-report-issue']",
        position: "bottom"
      },
      {
        id: "messages",
        title: "Messages",
        body: "Need to contact your Stand Lead? Use the messages feature to communicate.",
        targetSelector: "[data-testid='button-messages']",
        position: "top"
      }
    ]
  },

  standlead: {
    page: "standlead",
    title: "Stand Lead Dashboard",
    steps: [
      {
        id: "welcome",
        title: "Stand Lead Dashboard",
        body: "As Stand Lead, you oversee your NPO workers and manage inventory counts for your stand.",
        position: "center"
      },
      {
        id: "npo-workers",
        title: "Your Team",
        body: "View all NPO workers assigned to your stand. You'll see their check-in status here.",
        targetSelector: "[data-testid='npo-workers-section']",
        position: "bottom"
      },
      {
        id: "count-sessions",
        title: "Count Sessions",
        body: "Review and manage inventory count sessions. You can see Pre-Event, Post-Event, and Day-After counts.",
        targetSelector: "[data-testid='count-sessions']",
        position: "bottom"
      },
      {
        id: "escalate",
        title: "Escalate Issues",
        body: "If there's a problem you can't solve, escalate it to your Supervisor using the issue reporting.",
        targetSelector: "[data-testid='button-report-issue']",
        position: "bottom"
      },
      {
        id: "messages",
        title: "Contact Supervisor",
        body: "Use messages to communicate with your Supervisor about any stand needs.",
        targetSelector: "[data-testid='button-messages']",
        position: "top"
      }
    ]
  },

  supervisor: {
    page: "supervisor",
    title: "Supervisor Dashboard",
    steps: [
      {
        id: "welcome",
        title: "Supervisor Dashboard",
        body: "Welcome! As Supervisor, you manage multiple stands, handle closing procedures, and submit reports to Operations.",
        position: "center"
      },
      {
        id: "stand-selector",
        title: "Select Your Stand",
        body: "First, choose which stand you're working with from this dropdown. All tabs below will show data for the selected stand.",
        targetSelector: "[data-testid='stand-selector']",
        position: "bottom"
      },
      {
        id: "inventory-tab",
        title: "Inventory Tab",
        body: "View and manage all inventory counts - Pre-Event, Post-Event, and Day-After. You can also generate Variance Reports here.",
        targetSelector: "[data-testid='tab-inventory']",
        linkRoute: "?tab=inventory",
        linkText: "Go to Inventory",
        position: "bottom"
      },
      {
        id: "closeout-tab",
        title: "Closeout Tab",
        body: "End-of-event procedures including equipment shutdown checklist, spoilage logging, and voucher collection.",
        targetSelector: "[data-testid='tab-closeout']",
        linkRoute: "?tab=closeout",
        linkText: "Go to Closeout",
        position: "bottom"
      },
      {
        id: "equipment-checklist",
        title: "Equipment Checklist",
        body: "Check off each piece of equipment as you shut it down. When complete, sign and submit to Operations Manager.",
        targetSelector: "[data-testid='equipment-checklist']",
        linkRoute: "?tab=closeout&section=checklist",
        linkText: "Go to Checklist",
        position: "bottom"
      },
      {
        id: "spoilage",
        title: "Spoilage Log",
        body: "Record any items that were thrown away, returned, damaged, or expired. Download as PDF or submit to Ops Manager.",
        targetSelector: "[data-testid='spoilage-section']",
        linkRoute: "?tab=closeout&section=spoilage",
        linkText: "Go to Spoilage",
        position: "bottom"
      },
      {
        id: "vouchers",
        title: "Voucher Summary",
        body: "Enter the count of $10 meal vouchers collected. Record the envelope ID and submit to Operations.",
        targetSelector: "[data-testid='voucher-section']",
        linkRoute: "?tab=closeout&section=vouchers",
        linkText: "Go to Vouchers",
        position: "bottom"
      },
      {
        id: "compliance-tab",
        title: "Alcohol Compliance",
        body: "Complete the alcohol compliance checklist for stands serving alcohol.",
        targetSelector: "[data-testid='tab-compliance']",
        linkRoute: "?tab=compliance",
        linkText: "Go to Compliance",
        position: "bottom"
      },
      {
        id: "issues-tab",
        title: "Issues",
        body: "View and manage any issues reported for your stands.",
        targetSelector: "[data-testid='tab-issues']",
        linkRoute: "?tab=issues",
        linkText: "Go to Issues",
        position: "bottom"
      },
      {
        id: "incident-report",
        title: "Report Incidents",
        body: "For serious incidents, use this to file a report with photos or video. Supervisors and Admins are notified immediately.",
        targetSelector: "[data-testid='button-incident']",
        position: "top"
      }
    ]
  },

  manager: {
    page: "manager",
    title: "Manager Dashboard",
    steps: [
      {
        id: "welcome",
        title: "Manager Dashboard",
        body: "Welcome! You'll receive documents from supervisors, manage issues routed to your department, and oversee operations.",
        position: "center"
      },
      {
        id: "document-inbox",
        title: "Document Inbox",
        body: "Supervisors submit closing checklists, spoilage reports, voucher summaries, and compliance documents here. All as downloadable PDFs.",
        targetSelector: "[data-testid='document-inbox']",
        linkText: "View Documents",
        position: "bottom"
      },
      {
        id: "stand-issues",
        title: "Stand Issues",
        body: "Issues are automatically routed based on category. Acknowledge them, mark as in-progress, and resolve when fixed.",
        targetSelector: "[data-testid='stand-issues']",
        position: "bottom"
      },
      {
        id: "incidents",
        title: "Incident Reports",
        body: "View all incident reports filed by supervisors. These may include photos or video attachments.",
        targetSelector: "[data-testid='incidents']",
        position: "bottom"
      },
      {
        id: "analytics",
        title: "Analytics",
        body: "View summary statistics and generate reports for your area of responsibility.",
        targetSelector: "[data-testid='analytics']",
        position: "bottom"
      }
    ]
  },

  admin: {
    page: "admin",
    title: "Admin Dashboard",
    steps: [
      {
        id: "welcome",
        title: "Admin Dashboard",
        body: "Full system access for managing events, users, stands, inventory items, and viewing analytics.",
        position: "center"
      },
      {
        id: "staffing-tab",
        title: "Staffing",
        body: "Create and manage event staffing grids. Assign NPO groups and workers to stands.",
        targetSelector: "[data-testid='tab-staffing']",
        linkRoute: "?tab=staffing",
        linkText: "Go to Staffing",
        position: "bottom"
      },
      {
        id: "users-tab",
        title: "User Management",
        body: "View all users, edit roles, and reset PINs when needed.",
        targetSelector: "[data-testid='tab-users']",
        linkRoute: "?tab=users",
        linkText: "Go to Users",
        position: "bottom"
      },
      {
        id: "stands-tab",
        title: "Stand Management",
        body: "Manage the list of stands and assign which items are available at each location.",
        targetSelector: "[data-testid='tab-stands']",
        linkRoute: "?tab=stands",
        linkText: "Go to Stands",
        position: "bottom"
      },
      {
        id: "items-tab",
        title: "Inventory Items",
        body: "Add and edit inventory items with prices and categories.",
        targetSelector: "[data-testid='tab-items']",
        linkRoute: "?tab=items",
        linkText: "Go to Items",
        position: "bottom"
      },
      {
        id: "roster-builder",
        title: "Roster Builder",
        body: "Build complete event rosters with all staff assignments.",
        targetSelector: "[data-testid='link-roster-builder']",
        linkRoute: "/roster-builder",
        linkText: "Open Roster Builder",
        position: "bottom"
      }
    ]
  },

  warehouse: {
    page: "warehouse",
    title: "Warehouse Dashboard",
    steps: [
      {
        id: "welcome",
        title: "Warehouse Dashboard",
        body: "Manage inventory requests, replenishment, and equipment status from this dashboard.",
        position: "center"
      },
      {
        id: "requests",
        title: "Inventory Requests",
        body: "View requests from stands that need items. Fulfill and mark as delivered.",
        targetSelector: "[data-testid='inventory-requests']",
        position: "bottom"
      },
      {
        id: "equipment",
        title: "Equipment Status",
        body: "Track coolers, equipment issues, and maintenance needs.",
        targetSelector: "[data-testid='equipment-status']",
        position: "bottom"
      }
    ]
  },

  kitchen: {
    page: "kitchen",
    title: "Kitchen Dashboard",
    steps: [
      {
        id: "welcome",
        title: "Kitchen Dashboard",
        body: "Manage food safety issues, prep tracking, and temperature logs from here.",
        position: "center"
      },
      {
        id: "food-safety",
        title: "Food Safety Issues",
        body: "Issues categorized as Food Safety are automatically routed here for your attention.",
        targetSelector: "[data-testid='food-safety-issues']",
        position: "bottom"
      },
      {
        id: "temp-logs",
        title: "Temperature Logs",
        body: "Record required temperature checks for compliance.",
        targetSelector: "[data-testid='temperature-logs']",
        position: "bottom"
      }
    ]
  },

  it: {
    page: "it",
    title: "IT Dashboard",
    steps: [
      {
        id: "welcome",
        title: "IT Dashboard",
        body: "Track POS devices, hotspots, and handle technical support requests.",
        position: "center"
      },
      {
        id: "devices",
        title: "Device Tracking",
        body: "Monitor all POS terminals (E700, A930) and hotspot devices assigned to stands.",
        targetSelector: "[data-testid='device-tracking']",
        position: "bottom"
      },
      {
        id: "support",
        title: "Support Tickets",
        body: "View and respond to technical issues reported by staff.",
        targetSelector: "[data-testid='support-tickets']",
        position: "bottom"
      }
    ]
  },

  "event-setup": {
    page: "event-setup",
    title: "Event Setup (Ops Manager)",
    steps: [
      { id: "welcome", title: "Event Setup Hub", body: "This is your first stop before any event. Configure event details, geofencing, staffing, and department notes all in one place.", position: "center" },
      { id: "event-info", title: "Event Information", body: "Set the event name, date, type, and expected attendance. These details flow to all dashboards and the Staffing Grid.", targetSelector: "[data-testid='input-event-name']", position: "bottom" },
      { id: "geofence", title: "Geofence Configuration", body: "Toggle between Stadium mode (default 2000ft) or Custom mode with your own radius. This controls where staff can check in.", targetSelector: "[data-testid='toggle-geofence-mode']", position: "bottom" },
      { id: "department-notes", title: "Department Notes", body: "Add notes for specific departments - Operations, Kitchen, Warehouse, IT. Notes appear on each department's dashboard header.", position: "center" },
      { id: "checklist", title: "Pre-Event Checklist", body: "Complete all required fields (event name, date, time) before activating. The checklist shows your progress.", targetSelector: "[data-testid='pre-event-checklist']", position: "bottom" },
      { id: "activate", title: "Save & Activate", body: "When ready, activate the event. All dashboards switch to LIVE mode and show the active event header.", targetSelector: "[data-testid='btn-save-activate']", position: "bottom" }
    ]
  },

  "command-center": {
    page: "command-center",
    title: "Command Center",
    steps: [
      {
        id: "welcome",
        title: "Command Center Overview",
        body: "Your central hub for monitoring all venue operations in real-time. View event status, dispatch teams, and track emergencies.",
        position: "center"
      },
      {
        id: "event-status",
        title: "Event Status",
        body: "Live overview of the current event including attendance, staffing levels, and operational status across all departments.",
        position: "center"
      },
      {
        id: "quick-dispatch",
        title: "Quick Dispatch",
        body: "One-tap dispatch to IT, Operations, Kitchen, or Warehouse teams. Send urgent requests directly to the right department.",
        position: "center"
      },
      {
        id: "emergency-feed",
        title: "Emergency Feed",
        body: "Real-time alerts and incidents requiring immediate attention. Medical, Security, Fire, and Equipment emergencies appear here.",
        position: "center"
      },
      {
        id: "live-metrics",
        title: "Live Metrics",
        body: "Track key performance indicators: check-in rates, issue resolution times, and department response metrics.",
        position: "center"
      }
    ]
  },

  "ops-manager": {
    page: "ops-manager",
    title: "Ops Manager Command (David)",
    steps: [
      {
        id: "welcome",
        title: "Your Command Center",
        body: "As Ops Manager, you have full visibility and control over all venue operations. This tour covers your superpowers.",
        position: "center"
      },
      {
        id: "event-setup-first",
        title: "Start with Event Setup",
        body: "Before each event, visit Event Setup to configure event details, geofencing mode (Stadium or Custom), staffing, and department notes. It's your pre-event checklist.",
        linkRoute: "/event-setup",
        linkText: "Go to Event Setup",
        position: "center"
      },
      {
        id: "dashboard-controls",
        title: "Dashboard Controls (Your Superpower)",
        body: "Only YOU can access Dashboard Controls. Toggle which widgets each role sees, set alert levels, and control data scope for all users.",
        targetSelector: "[data-testid='button-dashboard-controls']",
        position: "bottom"
      },
      {
        id: "widget-visibility",
        title: "Widget Visibility",
        body: "Control what each role sees: Emergency Feed, Deliveries, Compliance, AI Chat, Weather, Map, Messaging, Inventory. Changes apply instantly.",
        position: "center"
      },
      {
        id: "alert-levels",
        title: "Alert Level Settings",
        body: "Set notification levels per role: Normal (all alerts), Priority-Only, or Silent. Manage noise during high-traffic events.",
        position: "center"
      },
      {
        id: "geofence",
        title: "Venue Geofencing",
        body: "Configure geofencing in Event Setup: Stadium mode (default 2000ft) or Custom mode with your own radius. Controls where staff can check in.",
        position: "center"
      },
      {
        id: "integration-hub",
        title: "Integration Hub",
        body: "View connectivity status with PAX Systems (A930, A700), Yellow Dog Inventory, and OrbitStaffing. All data in one unified view.",
        targetSelector: "[data-testid='button-quick-integrations']",
        position: "bottom"
      },
      {
        id: "pos-tracker",
        title: "POS Device Tracker",
        body: "Track all POS terminals assigned to stands. IT staff manage assignments; you see the full grid and can message IT about issues.",
        targetSelector: "[data-testid='button-quick-pos']",
        position: "bottom"
      },
      {
        id: "emergency-center",
        title: "Emergency Command",
        body: "Real-time emergency alerts with SLA tracking. One-tap to create Medical, Security, Fire, Equipment, Weather, or Crowd alerts.",
        position: "center"
      },
      {
        id: "compliance-alerts",
        title: "Compliance Alerts",
        body: "Tennessee ABC Board and Health Department alerts. When inspectors arrive, system-wide notification with compliance checklists.",
        targetSelector: "[data-testid='button-quick-compliance']",
        position: "bottom"
      },
      {
        id: "asset-tracker",
        title: "Genesis Hallmark System",
        body: "Every auditable asset gets an ORB number. Search/filter assets by number, name, date, or type. Important docs anchored to blockchain.",
        targetSelector: "[data-testid='button-quick-assets']",
        position: "bottom"
      },
      {
        id: "other-roles",
        title: "Role Overview",
        body: "NPO Workers handle inventory counts. Stand Leads oversee NPO teams. Supervisors manage sections. Managers handle department docs. You see it all.",
        position: "center"
      },
      {
        id: "messaging",
        title: "Smart Messaging",
        body: "Messages auto-route to the right department. You can message any role directly: IT, Warehouse, Kitchen, Bar, Operations, HR.",
        position: "center"
      },
      {
        id: "document-hub",
        title: "Document Hub",
        body: "Central archive for all reports: closing checklists, spoilage logs, variance reports, compliance docs. Searchable by date/stand/category.",
        position: "center"
      },
      {
        id: "reporting",
        title: "Full Audit Trail",
        body: "Every action is logged. Deliveries, emergencies, inventory counts, messages - complete accountability for all operations.",
        position: "center"
      },
      {
        id: "weather-map",
        title: "Interactive Weather Map",
        body: "Weather dictates stadium operations. Tap the weather icon, then 'View Interactive Weather Map' for full-screen Windy.com radar with real-time conditions, hourly & 7-day forecasts.",
        targetSelector: "[data-testid='button-weather-toggle']",
        position: "bottom"
      },
      {
        id: "feedback",
        title: "Report Issues",
        body: "See something that's not working right? Report it immediately and the team will fix it on the spot. This is a beta - your feedback shapes the product.",
        position: "center"
      },
      {
        id: "complete",
        title: "You're Ready!",
        body: "Access this tour anytime from the Help button. All pages have contextual help. Let's make operations seamless.",
        position: "center"
      }
    ]
  }
};

export function getTutorialForPage(page: string): PageTutorial | undefined {
  return tutorialConfigs[page];
}
