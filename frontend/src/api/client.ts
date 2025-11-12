// API client ready for FastAPI backend integration
import axios, { AxiosInstance } from 'axios';
import type { Transaction, RevenueSummary, DailyRevenue, Product, Anomaly } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Load from localStorage or use defaults
    const settings = this.loadSettings();
    this.baseUrl = settings.baseUrl;
    this.apiKey = settings.apiKey;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    });
  }

  private loadSettings() {
    const saved = localStorage.getItem('api-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      baseUrl: 'http://localhost:8000/api/v1',
      apiKey: 'dev_key',
    };
  }

  updateSettings(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    localStorage.setItem('api-settings', JSON.stringify({ baseUrl, apiKey }));
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
    });
  }

  // Transactions
  async createTransaction(data: Omit<Transaction, 'id' | 'created_at'>) {
    const response = await this.client.post<Transaction>('/transactions', data);
    return response.data;
  }

  async getTransactions(limit = 100, offset = 0) {
    const response = await this.client.get<Transaction[]>('/transactions', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getTransaction(orderId: string) {
    const response = await this.client.get<Transaction>(`/transactions/${orderId}`);
    return response.data;
  }

  // Insights
  async getDailyRevenue(start?: string, end?: string) {
    const response = await this.client.get<DailyRevenue[]>('/insights/revenue/daily', {
      params: { start, end },
    });
    return response.data;
  }

  async getRevenueSummary() {
    const response = await this.client.get<RevenueSummary>('/insights/revenue/summary');
    return response.data;
  }

  async getTopProducts(days = 30) {
    const response = await this.client.get<Product[]>('/insights/revenue/by-product', {
      params: { days },
    });
    return response.data;
  }

  async getAnomalies(lookbackDays = 90) {
    const response = await this.client.get<Anomaly[]>('/insights/anomalies', {
      params: { lookback_days: lookbackDays },
    });
    return response.data;
  }

  async getNarrative(start?: string, end?: string) {
    const response = await this.client.get<{ narrative: string }>('/insights/narrative', {
      params: { start, end },
    });
    return response.data.narrative;
  }

  // Exports
  getExportCsvUrl(limit = 5000) {
    return `${this.baseUrl}/export/csv?limit=${limit}`;
  }

  getExportPdfUrl() {
    return `${this.baseUrl}/export/pdf`;
  }

  // Test connection
  async testConnection() {
    try {
      await this.client.get('/insights/revenue/summary');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const apiClient = new ApiClient();
