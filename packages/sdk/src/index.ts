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
}
