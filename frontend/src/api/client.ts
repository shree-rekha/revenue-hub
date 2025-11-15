// API client ready for FastAPI backend integration
import axios, { AxiosInstance } from 'axios';
import type { Transaction, RevenueSummary, DailyRevenue, Product, Anomaly } from '@/types';

// Define the structure for API settings stored in localStorage
interface ApiSettings {
  baseUrl: string;
  apiKey: string;
}

class ApiClient {
  private client!: AxiosInstance; // '!' is used because it's initialized in loadSettings/constructor helper
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const settings = this.loadSettings();
    this.baseUrl = settings.baseUrl;
    this.apiKey = settings.apiKey;
    this.initializeClient(); // Call the initialization helper
  }

  private loadSettings(): ApiSettings {
    const saved = localStorage.getItem('api-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      baseUrl: 'http://localhost:8000/api/v1',
      apiKey: 'dev_key',
    };
  }
  
  // 🟢 Improvement: Encapsulate client creation logic
  private initializeClient(): void {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
      },
    });
  }

  updateSettings(baseUrl: string, apiKey: string): void {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    localStorage.setItem('api-settings', JSON.stringify({ baseUrl, apiKey }));
    
    // 🟢 Improvement: Reuse the helper to reset the client instance
    this.initializeClient();
  }

  // --- Transactions ---
  
  // The create method is used by the hook 'create' mutation
  async createTransaction(data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    const response = await this.client.post<Transaction>('/transactions', data);
    return response.data;
  }

  // The get method is used by the hook 'getAll' query
  async getTransactions(limit = 100, offset = 0): Promise<Transaction[]> {
    const response = await this.client.get<Transaction[]>('/transactions', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getTransaction(orderId: string): Promise<Transaction> {
    const response = await this.client.get<Transaction>(`/transactions/${orderId}`);
    return response.data;
  }

  // Used by the hook 'update' mutation
  async updateTransaction(id: number, data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    // Assuming PUT for full replacement of the resource state
    const response = await this.client.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  }

  // Used by the hook 'delete' mutation
  async deleteTransaction(id: number): Promise<void> {
    await this.client.delete(`/transactions/${id}`);
  }

  // --- Insights ---

  async getDailyRevenue(start?: string, end?: string): Promise<DailyRevenue[]> {
    const response = await this.client.get<DailyRevenue[]>('/insights/revenue/daily', {
      params: { start, end },
    });
    return response.data;
  }

  async getRevenueSummary(): Promise<RevenueSummary> {
    const response = await this.client.get<RevenueSummary>('/insights/revenue/summary');
    return response.data;
  }

  async getTopProducts(days = 30): Promise<Product[]> {
    const response = await this.client.get<Product[]>('/insights/revenue/by-product', {
      params: { days },
    });
    return response.data;
  }

  async getAnomalies(lookbackDays = 90): Promise<Anomaly[]> {
    const response = await this.client.get<Anomaly[]>('/insights/anomalies', {
      params: { lookback_days: lookbackDays },
    });
    return response.data;
  }

  async getNarrative(start?: string, end?: string): Promise<string> {
    const response = await this.client.get<{ narrative: string }>('/insights/narrative', {
      params: { start, end },
    });
    return response.data.narrative;
  }
  
  // Used by the hook 'importCSV' mutation
  async importCSV(file: File): Promise<{ success: boolean; imported: number; skipped: number; total: number; message?: string; error?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/transactions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Preview import without inserting (server supports ?preview=true)
  async previewImportCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/transactions/import', formData, {
      params: { preview: true },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  async exportCSV(): Promise<Blob> {
    const response = await this.client.get('/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  }
  
  async testConnection(): Promise<boolean> {
    try {
      // Use a lightweight endpoint for testing
      await this.client.get('/insights/revenue/summary');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const apiClient = new ApiClient();