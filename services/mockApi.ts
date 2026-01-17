
import { User, Release, Artist, Label, Notice, RevenueEntry, UserPermissions } from '../types';

const API_URL = 'https://api.digitalsight.in';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  // Auth
  async login(email: string, password?: string, token?: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, token }),
    });
    this.setToken(data.token);
    return data.user;
  }

  async verifyAuth() {
    if (!this.token) return null;
    try {
        const data = await this.request('/auth/verify');
        return data.user;
    } catch (e) {
        this.clearToken();
        return null;
    }
  }

  async logout() {
      this.clearToken();
  }

  async sendPasswordResetEmail(email: string) {
      return this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) });
  }

  async changePassword(oldPass: string, newPass: string) {
      return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPass, newPass }) });
  }

  // Users
  async getUsers(): Promise<User[]> { return this.request('/users'); }
  async getUser(id: string): Promise<User> { return this.request(`/users/${id}`); }
  async updateUser(id: string, data: Partial<User>): Promise<User> {
      return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteUser(id: string): Promise<void> {
      return this.request(`/users/${id}`, { method: 'DELETE' });
  }
  async blockUser(id: string, reason: string) {
      return this.updateUser(id, { isBlocked: true, blockReason: reason } as any);
  }
  async unblockUser(id: string) {
      return this.updateUser(id, { isBlocked: false, blockReason: '' } as any);
  }
  async updateUserPermissions(id: string, permissions: UserPermissions, currentUser: any) {
      return this.updateUser(id, { permissions } as any);
  }

  // Employees
  async getEmployees(currentUser: any): Promise<User[]> {
      const users = await this.getUsers();
      return users.filter(u => u.role === 'Employee');
  }
  async addEmployee(data: Partial<User>): Promise<User> {
      return this.request('/users', { method: 'POST', body: JSON.stringify({ ...data, role: 'Employee' }) });
  }
  async updateEmployee(id: string, data: Partial<User>): Promise<User> {
      return this.updateUser(id, data);
  }
  async deleteEmployee(id: string, currentUser: any): Promise<void> {
      return this.deleteUser(id);
  }

  // Labels
  async getLabels(): Promise<Label[]> { return this.request('/labels'); }
  async getLabel(id: string): Promise<Label> { return this.request(`/labels/${id}`); }
  async getSubLabels(parentId: string): Promise<Label[]> {
      const labels = await this.getLabels();
      return labels.filter(l => l.parentLabelId === parentId);
  }
  async createLabel(label: Partial<Label>): Promise<Label> {
      return this.request('/labels', { method: 'POST', body: JSON.stringify(label) });
  }
  async updateLabel(id: string, data: Partial<Label>): Promise<Label> {
      return this.request(`/labels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteLabel(id: string, currentUser: any): Promise<void> {
      return this.request(`/labels/${id}`, { method: 'DELETE' });
  }
  async getLabelAdmin(labelId: string): Promise<User | null> {
      const users = await this.getUsers();
      return users.find(u => u.labelId === labelId && u.role === 'Label Admin') || null;
  }

  // Artists
  async getAllArtists(): Promise<Artist[]> { return this.request('/artists'); }
  async getArtist(id: string): Promise<Artist> { return this.request(`/artists/${id}`); }
  async getArtistsByLabel(labelId: string): Promise<Artist[]> {
      return this.getAllArtists();
  }
  async addArtist(artist: Partial<Artist>): Promise<Artist> {
      return this.request('/artists', { method: 'POST', body: JSON.stringify(artist) });
  }
  async updateArtist(id: string, data: Partial<Artist>, user: any): Promise<Artist> {
      return this.request(`/artists/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteArtist(id: string, user: any): Promise<void> {
      return this.request(`/artists/${id}`, { method: 'DELETE' });
  }

  // Releases
  async getAllReleases(): Promise<Release[]> { return this.request('/releases'); }
  async getRelease(id: string): Promise<Release> { return this.request(`/releases/${id}`); }
  async getReleasesByLabel(labelId: string): Promise<Release[]> {
      return this.getAllReleases();
  }
  async addRelease(release: Partial<Release>): Promise<Release> {
    return this.request('/releases', { method: 'POST', body: JSON.stringify(release) });
  }
  async updateRelease(id: string, data: Partial<Release>): Promise<Release> {
      return this.request(`/releases/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async updateReleaseStatus(id: string, status: string, note: any) {
      return this.updateRelease(id, { status, notes: note ? [note] : [] } as any);
  }
  async deleteRelease(id: string): Promise<void> {
      return this.request(`/releases/${id}`, { method: 'DELETE' });
  }

  // Notices
  async getNotices(user: any): Promise<Notice[]> { return this.request('/notices'); }
  async addNotice(notice: Partial<Notice>, user: any): Promise<Notice> {
      return this.request('/notices', { method: 'POST', body: JSON.stringify(notice) });
  }
  async updateNotice(id: string, data: Partial<Notice>, user: any): Promise<Notice> {
      return this.request(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  async deleteNotice(id: string, user: any): Promise<void> {
      return this.request(`/notices/${id}`, { method: 'DELETE' });
  }

  // Revenue
  async getRevenueEntries(): Promise<RevenueEntry[]> { return this.request('/revenue'); }

  // Search
  async globalSearch(query: string, user: any) {
      return this.request(`/search?q=${encodeURIComponent(query)}`);
  }
}

export const api = new ApiService();
