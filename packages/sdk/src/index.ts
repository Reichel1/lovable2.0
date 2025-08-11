import { z } from 'zod';
import fetch from 'cross-fetch';

export interface ClientOptions {
  baseUrl: string;
  token?: string;
}

export class PlatformClient {
  private baseUrl: string;
  private token?: string;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  }

  health(): Promise<{ status: 'ok' }> {
    return this.request('/health');
  }

  // Console-web helpers (assumes same-origin proxy)
  getProjects(): Promise<any[]> {
    return this.request('/projects');
  }
  createProject(body: { name: string; orgId: string; runtimeType: 'static'|'edge'|'container'; region: string }): Promise<any> {
    return this.request('/projects', { method: 'POST', body: JSON.stringify(body) });
  }
  getProjectBuilds(projectId: string): Promise<any[]> {
    return this.request(`/projects/${projectId}/builds`);
  }
  getDeployments(): Promise<any[]> {
    return this.request('/deployments');
  }
  startBuild(body: { projectId: string; projectSlug: string; repoSlug: string; gitRef: string }): Promise<any> {
    return this.request('/builds:start', { method: 'POST', body: JSON.stringify(body) });
  }
  listDomains(projectId: string): Promise<any[]> {
    return this.request(`/projects/${projectId}/domains`);
  }
  verifyDomain(id: string): Promise<any> {
    return this.request(`/domains/${id}/verify`);
  }
}
