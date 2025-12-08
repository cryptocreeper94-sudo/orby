export class EcosystemClient {
  private hubUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(hubUrl: string, apiKey: string, apiSecret: string) {
    this.hubUrl = hubUrl;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    const url = `${this.hubUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
          'X-Api-Secret': this.apiSecret,
        },
        body: body ? JSON.stringify(body) : undefined,
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

  async getStatus() {
    return this.request('GET', '/status');
  }

  async syncWorkers(workers: unknown[]) {
    return this.request('POST', '/sync/workers', { workers });
  }

  async syncContractors(contractors: unknown[]) {
    return this.request('POST', '/sync/contractors', { contractors });
  }

  async sync1099Payments(year: number, payments: unknown[]) {
    return this.request('POST', '/sync/1099', { year, payments });
  }

  async syncW2Payroll(year: number, employees: unknown[]) {
    return this.request('POST', '/sync/w2', { year, employees });
  }

  async syncTimesheets(timesheets: unknown[]) {
    return this.request('POST', '/sync/timesheets', { timesheets });
  }

  async syncCertifications(certifications: unknown[]) {
    return this.request('POST', '/sync/certifications', { certifications });
  }

  async pushSnippet(
    name: string,
    code: string,
    language: string,
    category: string,
    description?: string,
    tags?: string[],
    isPublic?: boolean
  ) {
    return this.request('POST', '/snippets', {
      name,
      code,
      language,
      category,
      description,
      tags,
      isPublic,
    });
  }

  async getSnippets() {
    return this.request('GET', '/snippets');
  }

  async getPublicSnippets() {
    return this.request('GET', '/snippets/public');
  }

  async logActivity(action: string, details?: unknown) {
    return this.request('POST', '/logs', { action, details });
  }

  async getLogs(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (offset) params.set('offset', offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request('GET', `/logs${query}`);
  }

  async getShopWorkers(filters?: Record<string, string>) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.request('GET', `/shops/workers${params}`);
  }

  async getShopPayroll(filters?: Record<string, string>) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return this.request('GET', `/shops/payroll${params}`);
  }
}
