# Orby Analytics Implementation Guide

## Overview
The Orby Analytics system provides tenant-aware tracking for page visits, user sessions, and SEO changes across the platform.

## Database Schema

### analytics_visits
Tracks each page visit with session and user context.
```sql
CREATE TABLE analytics_visits (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL DEFAULT 'demo',
  route TEXT NOT NULL,
  user_id VARCHAR(36),
  session_id VARCHAR(64) NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  is_unique_visitor BOOLEAN DEFAULT false,
  is_unique_user BOOLEAN DEFAULT false,
  occurred_at TIMESTAMP DEFAULT NOW()
);
```

### seo_tag_edits
Tracks SEO meta tag changes for audit purposes.
```sql
CREATE TABLE seo_tag_edits (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(50) NOT NULL DEFAULT 'demo',
  tag_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  edited_by VARCHAR(36),
  edited_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Track Page Visit
```
POST /api/analytics/track
Body: { route, tenantId, sessionId, userId?, userAgent?, referrer? }
Response: { success: true, visitId: string }
```

### Get Analytics Summary
```
GET /api/analytics/summary?tenant=demo&days=30
Response: {
  totalVisits: number,
  uniqueVisitors: number,
  uniqueUsers: number,
  visitsToday: number,
  visitsThisWeek: number,
  topRoutes: [{ route: string, count: number }]
}
```

### Get Daily Visit Counts
```
GET /api/analytics/daily?tenant=demo&days=14
Response: [{ date: string, count: number }]
```

### Track SEO Edit
```
POST /api/analytics/seo
Body: { tenantId, tagType, oldValue?, newValue?, editedBy? }
Response: SeoTagEdit object
```

### Get SEO Edits
```
GET /api/analytics/seo?tenant=demo&limit=20
Response: SeoTagEdit[]
```

### Get Tenant List
```
GET /api/analytics/tenants
Response: ['demo', 'nissan_beta']
```

## Frontend Integration

### Automatic Page Tracking
```typescript
// client/src/lib/analytics.ts
import { trackPageVisit } from '@/lib/analytics';

// Called automatically on route changes via PageTracker component
trackPageVisit(location, currentUser?.id);
```

### Session Management
- Session ID generated via `crypto.randomUUID()` and stored in sessionStorage
- Persists across page refreshes within same browser session
- New session created on browser close/reopen

### Tenant Detection
- Hostname-based detection for production environments
- Default to 'demo' for development
- Manual override available via tenant toggle in DevDashboard

## Visualization Components

### AnalyticsSection
Located in `client/src/components/AnalyticsSection.tsx`

Features:
- Metrics cards: Total Visits, Unique Visitors, Unique Users, Today, This Week
- Line chart: Daily visits over 14 days (Recharts)
- Bar chart: Top 6 visited routes (Recharts)
- Tenant toggle dropdown
- Refresh button with loading state
- SEO edits history panel

## Security Considerations

1. **Input Validation**: All inputs sanitized and length-limited
2. **Tenant Isolation**: Queries always filter by tenantId
3. **Valid Tenants Only**: tenantId validated against whitelist ['demo', 'nissan_beta']
4. **Route Sanitization**: Special characters stripped from route tracking

## Best Practices

1. Track meaningful routes only (skip static assets)
2. Use consistent route naming (lowercase, hyphenated)
3. Include userId when authenticated for user-level analytics
4. Review topRoutes regularly to identify popular features
5. Monitor visitsToday for real-time usage patterns
