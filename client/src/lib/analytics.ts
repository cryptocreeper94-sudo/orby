const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('orby_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('orby_session_id', sessionId);
  }
  return sessionId;
};

const getCurrentTenant = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('nissan') || hostname.includes('stadium')) {
      return 'nissan_beta';
    }
  }
  return 'demo';
};

export const trackPageVisit = async (route: string, userId?: string | null): Promise<void> => {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route,
        tenantId: getCurrentTenant(),
        sessionId: getSessionId(),
        userId: userId || null,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null
      })
    });
  } catch (err) {
    console.debug('Analytics tracking failed:', err);
  }
};

export const trackSeoEdit = async (tagType: string, oldValue?: string, newValue?: string, editedBy?: string): Promise<void> => {
  try {
    await fetch('/api/analytics/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: getCurrentTenant(),
        tagType,
        oldValue,
        newValue,
        editedBy
      })
    });
  } catch (err) {
    console.debug('SEO tracking failed:', err);
  }
};
