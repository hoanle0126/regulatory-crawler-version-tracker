const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4101/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('regtracker_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('regtracker_token', token);
      } else {
        localStorage.removeItem('regtracker_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('regtracker_token');
    }
    return this.token;
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && typeof window !== 'undefined') {
      if (!window.location.pathname.startsWith('/login')) {
        this.setToken(null);
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const data = await response.json();
        errorMsg = data.message || data.error || errorMsg;
      } catch {
        // Fall back to status text
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; name: string; role: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(res.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('regtracker_user', JSON.stringify(res.user));
    }
    return res;
  }

  logout() {
    this.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('regtracker_user');
      window.location.href = '/login';
    }
  }

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('regtracker_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // Sources
  async getSources() {
    return this.request<any[]>('/sources');
  }

  async getSource(id: string) {
    return this.request<any>(`/sources/${id}`);
  }

  async createSource(data: any) {
    return this.request<any>('/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSource(id: string, data: any) {
    return this.request<any>(`/sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSource(id: string) {
    return this.request<{ success: boolean }>(`/sources/${id}`, {
      method: 'DELETE',
    });
  }

  async testSource(id: string) {
    return this.request<any>(`/sources/${id}/test`, {
      method: 'POST',
    });
  }

  async testAdHocSource(data: { url: string; adapterType?: string; allowedDomains?: string[] }) {
    return this.request<any>('/sources/test', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async triggerCrawl(id: string) {
    return this.request<any>(`/sources/${id}/crawl`, {
      method: 'POST',
    });
  }

  // Crawls
  async getCrawls(params?: { page?: number; pageSize?: number; sourceId?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.sourceId) q.set('sourceId', params.sourceId);
    return this.request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/crawls?${q.toString()}`
    );
  }

  async getCrawl(id: string) {
    return this.request<any>(`/crawls/${id}`);
  }

  async retryCrawl(id: string) {
    return this.request<any>(`/crawls/${id}/retry`, {
      method: 'POST',
    });
  }

  // Documents
  async getDocuments(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sourceId?: string;
    status?: string;
    documentType?: string;
    issuingAuthority?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    if (params?.sourceId) q.set('sourceId', params.sourceId);
    if (params?.status) q.set('status', params.status);
    if (params?.documentType) q.set('documentType', params.documentType);
    if (params?.issuingAuthority) q.set('issuingAuthority', params.issuingAuthority);
    return this.request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/documents?${q.toString()}`
    );
  }

  async getDocument(id: string) {
    return this.request<any>(`/documents/${id}`);
  }

  async getDocumentVersions(id: string) {
    return this.request<any[]>(`/documents/${id}/versions`);
  }

  async getDocumentRelationships(id: string) {
    return this.request<{ outgoing: any[]; incoming: any[] }>(`/documents/${id}/relationships`);
  }

  async addDocumentRelationship(id: string, data: { targetDocumentId: string; relationshipType: string; notes?: string }) {
    return this.request<any>(`/documents/${id}/relationships`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Versions
  async getVersion(id: string) {
    return this.request<any>(`/versions/${id}`);
  }

  async getVersionStructure(id: string) {
    return this.request<any[]>(`/versions/${id}/structure`);
  }

  // Diff
  async compareVersions(documentId: string, fromVersionId: string, toVersionId: string) {
    return this.request<any>(
      `/documents/${documentId}/diff?from=${encodeURIComponent(fromVersionId)}&to=${encodeURIComponent(toVersionId)}`
    );
  }

  // Changes
  async getChanges(params?: { page?: number; pageSize?: number; status?: string; documentId?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.status) q.set('status', params.status);
    if (params?.documentId) q.set('documentId', params.documentId);
    if (params?.search) q.set('search', params.search);
    return this.request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/changes?${q.toString()}`
    );
  }

  async getChange(id: string) {
    return this.request<any>(`/changes/${id}`);
  }

  async updateChangeStatus(id: string, status: string, notes?: string) {
    return this.request<any>(`/changes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Webhooks
  async getWebhooks() {
    return this.request<any[]>('/webhooks');
  }

  async createWebhook(data: any) {
    return this.request<any>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebhook(id: string, data: any) {
    return this.request<any>(`/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string) {
    return this.request<{ success: boolean }>(`/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  async pingWebhook(id: string) {
    return this.request<any>(`/webhooks/${id}/ping`, {
      method: 'POST',
    });
  }

  // Audit Logs
  async getAuditLogs(params?: { page?: number; pageSize?: number; search?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    if (params?.search) q.set('search', params.search);
    return this.request<{ items: any[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/audit-logs?${q.toString()}`
    );
  }

  // Health
  async getHealth() {
    return this.request<{ status: string; uptime: number; timestamp: string }>('/health');
  }

  async getReadiness() {
    return this.request<{ status: string; database: boolean; redis: boolean; timestamp: string }>('/readiness');
  }
}

export const api = new ApiClient();
