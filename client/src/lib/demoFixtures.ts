export const demoStands = [
  { id: 1, name: 'Stand 101', section: 'A', level: 'Lower', status: 'operational', supervisor: 'Marcus T.' },
  { id: 2, name: 'Stand 102', section: 'A', level: 'Lower', status: 'operational', supervisor: 'Sarah K.' },
  { id: 3, name: 'Stand 103', section: 'B', level: 'Lower', status: 'needs_attention', supervisor: 'James R.' },
  { id: 4, name: 'Stand 201', section: 'C', level: 'Club', status: 'operational', supervisor: 'Emily D.' },
  { id: 5, name: 'Stand 202', section: 'C', level: 'Club', status: 'critical', supervisor: 'Mike B.' },
  { id: 6, name: 'Stand 301', section: 'D', level: 'Upper', status: 'operational', supervisor: 'Lisa M.' },
];

export const demoDeliveries = [
  { 
    id: 1, 
    standId: 3, 
    standName: 'Stand 103',
    items: 'Bud Light (2 cases), Nachos supplies',
    status: 'on_the_way',
    eta: '5 min',
    requestedBy: 'James R.',
    requestedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    driver: 'Warehouse Team'
  },
  { 
    id: 2, 
    standId: 5, 
    standName: 'Stand 202',
    items: 'Ice (4 bags), Cups (large)',
    status: 'picking',
    eta: '12 min',
    requestedBy: 'Mike B.',
    requestedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    driver: null
  },
  { 
    id: 3, 
    standId: 1, 
    standName: 'Stand 101',
    items: 'Hot dogs (3 boxes)',
    status: 'requested',
    eta: null,
    requestedBy: 'Marcus T.',
    requestedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    driver: null
  },
  { 
    id: 4, 
    standId: 4, 
    standName: 'Stand 201',
    items: 'Premium wine (6 bottles)',
    status: 'delivered',
    eta: null,
    requestedBy: 'Emily D.',
    requestedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    deliveredAt: new Date(Date.now() - 25 * 60000).toISOString(),
    driver: 'AJ'
  },
];

export const demoEmergencies = [
  {
    id: 1,
    type: 'medical',
    location: 'Section 115, Row 12',
    description: 'Fan experiencing dizziness, requesting medical assistance',
    status: 'active',
    priority: 'high',
    reportedBy: 'Stand 103 - James R.',
    reportedAt: new Date(Date.now() - 4 * 60000).toISOString(),
    assignedTo: 'Medical Team Alpha'
  },
  {
    id: 2,
    type: 'spill',
    location: 'Stand 202 - Club Level',
    description: 'Large beverage spill near service counter',
    status: 'responding',
    priority: 'medium',
    reportedBy: 'Stand 202 - Mike B.',
    reportedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    assignedTo: 'Operations - Serena'
  }
];

export const demoMessages = [
  {
    id: 1,
    from: 'James R.',
    fromRole: 'Stand Lead',
    to: 'Warehouse',
    content: 'Running low on Bud Light, need 2 cases ASAP',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'read',
    thread: 'delivery-1'
  },
  {
    id: 2,
    from: 'Warehouse',
    fromRole: 'Department',
    to: 'James R.',
    content: 'Got it, Sharrod is picking now. ETA 5 minutes.',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    status: 'read',
    thread: 'delivery-1'
  },
  {
    id: 3,
    from: 'Mike B.',
    fromRole: 'Stand Supervisor',
    to: 'Command',
    content: 'POS terminal 2 is frozen, need IT support',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    status: 'unread',
    thread: 'it-support-1'
  },
  {
    id: 4,
    from: 'David',
    fromRole: 'IT Manager',
    to: 'Mike B.',
    content: 'Sending someone now. Try a hard restart while waiting.',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'unread',
    thread: 'it-support-1'
  }
];

export const demoUsers = [
  { id: 1, name: 'David', role: 'Ops Controller', status: 'online', location: 'Command Center' },
  { id: 2, name: 'Jay', role: 'Purchasing Manager', status: 'online', location: 'Warehouse' },
  { id: 3, name: 'Jason', role: 'Operations Supervisor', status: 'online', location: 'Field Ops', pin: '444' },
  { id: 4, name: 'Sid', role: 'Operations Supervisor', status: 'online', location: 'Field Ops', pin: '4444' },
  { id: 5, name: 'Chef Deb', role: 'Culinary Manager', status: 'online', location: 'Kitchen' },
  { id: 6, name: 'Darby', role: 'Bar Manager', status: 'online', location: 'Field' },
  { id: 7, name: 'Shelia', role: 'Operations Manager', status: 'online', location: 'Field' },
  { id: 8, name: 'James R.', role: 'Stand Supervisor', status: 'online', location: 'Section B' },
  { id: 9, name: 'Marcus T.', role: 'Stand Lead', status: 'online', location: 'Stand 101' },
  { id: 10, name: 'Sarah K.', role: 'Stand Lead', status: 'online', location: 'Stand 102' },
];

export const demoStats = {
  activeStands: 47,
  openIssues: 3,
  pendingDeliveries: 8,
  onlineUsers: 156,
  responseTime: '2.3 min avg',
  satisfaction: '94%'
};

export const demoQuickActions = [
  { id: 'request-delivery', label: 'Request Delivery', icon: 'Package' },
  { id: 'report-issue', label: 'Report Issue', icon: 'AlertTriangle' },
  { id: 'call-supervisor', label: 'Call Supervisor', icon: 'Phone' },
  { id: 'message-command', label: 'Message Command', icon: 'MessageSquare' },
];

export const demoNotifications = [
  {
    id: 1,
    type: 'delivery',
    title: 'Delivery Arrived',
    message: 'Stand 201 delivery completed by AJ',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    read: true
  },
  {
    id: 2,
    type: 'emergency',
    title: 'Medical Alert',
    message: 'Medical assistance requested at Section 115',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    read: false
  },
  {
    id: 3,
    type: 'message',
    title: 'New Message',
    message: 'Mike B. is requesting IT support',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    read: false
  }
];
