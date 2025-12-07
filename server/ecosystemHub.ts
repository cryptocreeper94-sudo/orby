import crypto from 'crypto';

export class EcosystemClient {
  private hubUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(hubUrl: string, apiKey: string, apiSecret: string) {
    this.hubUrl = hubUrl;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private generateSignature(timestamp: string, method: string, path: string, body: string): string {
    const message = `${timestamp}${method}${path}${body}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  private async request(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(timestamp, method, endpoint, bodyStr);

    const headers: Record<string, string> = {
      'X-Api-Key': this.apiKey,
      'X-Api-Secret': this.apiSecret,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'Content-Type': 'application/json',
    };

    const url = `${this.hubUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' ? bodyStr : undefined,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hub error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (error) {
      console.error(`[EcosystemHub] Request failed:`, error);
      throw error;
    }
  }

  async syncW2Payroll(year: number, employees: unknown[]) {
    return this.request('POST', '/sync/w2', { year, employees });
  }

  async sync1099Payments(year: number, contractors: unknown[]) {
    return this.request('POST', '/sync/1099', { year, contractors });
  }

  async syncWorkers(workers: unknown[]) {
    return this.request('POST', '/sync/workers', { workers });
  }

  async syncContractors(contractors: unknown[]) {
    return this.request('POST', '/sync/contractors', { contractors });
  }

  async syncTimesheets(timesheets: unknown[]) {
    return this.request('POST', '/sync/timesheets', { timesheets });
  }

  async syncCertifications(certifications: unknown[]) {
    return this.request('POST', '/sync/certifications', { certifications });
  }

  async getShopWorkers(filters?: Record<string, string>) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.request('GET', `/shops/workers${params}`);
  }

  async getShopPayroll(filters?: Record<string, string>) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.request('GET', `/shops/payroll${params}`);
  }

  async getStatus() {
    return this.request('GET', '/status');
  }

  async getLogs(limit = 50, offset = 0) {
    return this.request('GET', `/logs?limit=${limit}&offset=${offset}`);
  }

  async pushSnippet(title: string, code: string, language: string, category: string) {
    return this.request('POST', '/snippets', {
      title,
      code,
      language,
      category,
    });
  }

  async getSnippets() {
    return this.request('GET', '/snippets');
  }

  async logActivity(action: string, details: unknown) {
    return this.request('POST', '/logs', { action, details });
  }
}
