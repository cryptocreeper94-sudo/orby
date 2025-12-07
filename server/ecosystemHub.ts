interface EcosystemClientConfig {
  hubUrl: string;
  apiKey: string;
  apiSecret: string;
  appName: string;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  [key: string]: unknown;
}

interface Contractor {
  id: string;
  name: string;
  email: string;
  taxId?: string;
  status: string;
  [key: string]: unknown;
}

interface Payment {
  contractorId: string;
  amount: number;
  date: string;
  description?: string;
  [key: string]: unknown;
}

interface Timesheet {
  workerId: string;
  date: string;
  hoursWorked: number;
  project?: string;
  [key: string]: unknown;
}

interface Certification {
  workerId: string;
  certName: string;
  issueDate: string;
  expiryDate?: string;
  [key: string]: unknown;
}

interface Snippet {
  name: string;
  code: string;
  language: string;
  category: string;
}

export class EcosystemClient {
  private hubUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private appName: string;

  constructor(config: EcosystemClientConfig) {
    this.hubUrl = config.hubUrl;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.appName = config.appName;
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: unknown) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
      'X-App-Name': this.appName
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.hubUrl}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`Hub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[EcosystemHub] Request failed:`, error);
      throw error;
    }
  }

  async checkConnection(): Promise<{ connected: boolean; hubVersion?: string; appRegistered?: boolean }> {
    try {
      const result = await this.makeRequest('/api/v1/status');
      return {
        connected: true,
        hubVersion: result.version,
        appRegistered: result.appRegistered
      };
    } catch (error) {
      return {
        connected: false
      };
    }
  }

  async pushSnippet(snippet: Snippet): Promise<{ id: string; created: boolean }> {
    return await this.makeRequest('/api/v1/snippets', 'POST', {
      ...snippet,
      source: this.appName,
      timestamp: new Date().toISOString()
    });
  }

  async syncWorkers(workers: Worker[]): Promise<{ synced: number; errors: string[] }> {
    return await this.makeRequest('/api/v1/workers/sync', 'POST', {
      workers,
      source: this.appName,
      timestamp: new Date().toISOString()
    });
  }

  async syncContractors(contractors: Contractor[]): Promise<{ synced: number; errors: string[] }> {
    return await this.makeRequest('/api/v1/contractors/sync', 'POST', {
      contractors,
      source: this.appName,
      timestamp: new Date().toISOString()
    });
  }

  async sync1099Data(year: number, payments: Payment[]): Promise<{ synced: number; totalAmount: number }> {
    return await this.makeRequest('/api/v1/1099/sync', 'POST', {
      year,
      payments,
      source: this.appName,
      timestamp: new Date().toISOString()
    });
  }

  async syncTimesheets(timesheets: Timesheet[]): Promise<{ synced: number; totalHours: number }> {
    return await this.makeRequest('/api/v1/timesheets/sync', 'POST', {
      timesheets,
      source: this.appName,
      timestamp: new Date().toISOString()
    });
  }

  async syncCertifications(certifications: Certification[]): Promise<{ synced: number; expiringSoon: number }> {
    return await this.makeRequest('/api/v1/certifications/sync', 'POST', {
      certifications,
      source: this.appName,
      timestamp: new Date().toISOString()
    });
  }

  async getActivityLogs(limit: number = 100): Promise<{ logs: unknown[]; total: number }> {
    return await this.makeRequest(`/api/v1/logs?limit=${limit}&app=${encodeURIComponent(this.appName)}`);
  }

  async logActivity(action: string, details: Record<string, unknown>): Promise<{ logged: boolean; id: string }> {
    return await this.makeRequest('/api/v1/logs', 'POST', {
      action,
      details,
      source: this.appName,
      timestamp: new Date().toISOString()
    });
  }
}
