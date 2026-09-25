import type { AuthTokens, UserProfile } from '../types';

export class TokenStorageService {
  private readonly prefix: string;
  private memoryStore: Map<string, string> = new Map();

  constructor(prefix: string = 'centaur_auth_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__test_storage__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem(key: string): string | null {
    const fullKey = this.getKey(key);
    if (this.isLocalStorageAvailable()) {
      return window.localStorage.getItem(fullKey);
    }
    return this.memoryStore.get(fullKey) || null;
  }

  public setItem(key: string, value: string): void {
    const fullKey = this.getKey(key);
    if (this.isLocalStorageAvailable()) {
      window.localStorage.setItem(fullKey, value);
    } else {
      this.memoryStore.set(fullKey, value);
    }
  }

  public removeItem(key: string): void {
    const fullKey = this.getKey(key);
    if (this.isLocalStorageAvailable()) {
      window.localStorage.removeItem(fullKey);
    } else {
      this.memoryStore.delete(fullKey);
    }
  }

  public getAccessToken(): string | null {
    return this.getItem('access_token');
  }

  public setAccessToken(token: string): void {
    this.setItem('access_token', token);
  }

  public getRefreshToken(): string | null {
    return this.getItem('refresh_token');
  }

  public setRefreshToken(token: string): void {
    this.setItem('refresh_token', token);
  }

  public setTokens(tokens: AuthTokens): void {
    this.setAccessToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);
  }

  public getUser(): UserProfile | null {
    const raw = this.getItem('user_profile');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  public setUser(user: UserProfile): void {
    this.setItem('user_profile', JSON.stringify(user));
  }

  public clearAll(): void {
    this.removeItem('access_token');
    this.removeItem('refresh_token');
    this.removeItem('user_profile');
    this.memoryStore.clear();
  }
}

export const defaultStorage = new TokenStorageService();
