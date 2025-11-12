// Type definitions matching backend API spec

export interface Transaction {
  id?: number;
  order_id: string;
  user_id: string;
  product_id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  channel: 'web' | 'mobile' | 'api' | 'partner';
  created_at?: string;
  paid_at: string;
  refunded: boolean;
  refund_amount: number;
  region: string;
  attribution_campaign?: string;
}

export interface Product {
  product_id: string;
  name: string;
  revenue: number;
  orders: number;
  category?: string;
}

export interface DailyRevenue {
  day: string;
  revenue: number;
  orders: number;
}

export interface Anomaly {
  day: string;
  revenue: number;
  z: number;
  direction: 'spike' | 'drop';
  possible_causes: string[];
}

export interface RevenueSummary {
  today: number;
  mtd: number;
  ytd: number;
  rhi: number;
  top_products: Product[];
  anomalies: Anomaly[];
  narrative: string;
}

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
}
