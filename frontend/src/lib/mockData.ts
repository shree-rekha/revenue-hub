// Mock data matching backend schema for development
import type { RevenueSummary, DailyRevenue, Product, Anomaly, Transaction } from '@/types';

export const mockRevenueSummary: RevenueSummary = {
  today: 125847.32,
  mtd: 2847563.21,
  ytd: 18934521.87,
  rhi: 78.5,
  top_products: [
    { product_id: 'PRO-001', name: 'Enterprise Plan', revenue: 458920.50, orders: 127, category: 'Subscription' },
    { product_id: 'PRO-002', name: 'Professional Plan', revenue: 324560.25, orders: 892, category: 'Subscription' },
    { product_id: 'PRO-003', name: 'Premium Add-on', revenue: 198430.75, orders: 543, category: 'Add-on' },
    { product_id: 'PRO-004', name: 'Starter Plan', revenue: 156780.00, orders: 1247, category: 'Subscription' },
    { product_id: 'PRO-005', name: 'API Credits', revenue: 89320.50, orders: 321, category: 'Credits' },
  ],
  anomalies: [
    {
      day: '2025-11-10',
      revenue: 189420.50,
      z: 3.2,
      direction: 'spike',
      possible_causes: ['Black Friday campaign launch', 'Enterprise deal closed', 'Seasonal uptick'],
    },
    {
      day: '2025-11-05',
      revenue: 42180.25,
      z: -2.8,
      direction: 'drop',
      possible_causes: ['Payment gateway downtime', 'Weekend effect', 'Refund spike'],
    },
  ],
  narrative: "Revenue is up 18.3% compared to last month, driven primarily by strong Enterprise Plan performance. Today's revenue of $125.8K is tracking 5% above the 7-day moving average. Two anomalies detected in the past week requiring attention.",
};

export const mockDailyRevenue: DailyRevenue[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (89 - i));
  const baseRevenue = 95000;
  const variance = Math.random() * 40000 - 20000;
  const trend = i * 100;
  const seasonality = Math.sin(i / 7) * 15000;
  
  // Add anomalies
  let anomalyBoost = 0;
  if (i === 85) anomalyBoost = 90000; // Recent spike
  if (i === 80) anomalyBoost = -50000; // Recent drop
  
  return {
    day: date.toISOString().split('T')[0],
    revenue: Math.max(30000, baseRevenue + variance + trend + seasonality + anomalyBoost),
    orders: Math.floor(Math.random() * 500) + 200,
  };
});

export const mockProducts: Product[] = [
  { product_id: 'PRO-001', name: 'Enterprise Plan', revenue: 458920.50, orders: 127, category: 'Subscription' },
  { product_id: 'PRO-002', name: 'Professional Plan', revenue: 324560.25, orders: 892, category: 'Subscription' },
  { product_id: 'PRO-003', name: 'Premium Add-on', revenue: 198430.75, orders: 543, category: 'Add-on' },
  { product_id: 'PRO-004', name: 'Starter Plan', revenue: 156780.00, orders: 1247, category: 'Subscription' },
  { product_id: 'PRO-005', name: 'API Credits', revenue: 89320.50, orders: 321, category: 'Credits' },
  { product_id: 'PRO-006', name: 'Team Plan', revenue: 67540.00, orders: 234, category: 'Subscription' },
  { product_id: 'PRO-007', name: 'Storage Add-on', revenue: 45230.25, orders: 678, category: 'Add-on' },
  { product_id: 'PRO-008', name: 'Basic Plan', revenue: 34120.50, orders: 1543, category: 'Subscription' },
];

export const mockAnomalies: Anomaly[] = [
  {
    day: '2025-11-10',
    revenue: 189420.50,
    z: 3.2,
    direction: 'spike',
    possible_causes: ['Black Friday campaign launch', 'Enterprise deal closed', 'Seasonal uptick'],
  },
  {
    day: '2025-11-05',
    revenue: 42180.25,
    z: -2.8,
    direction: 'drop',
    possible_causes: ['Payment gateway downtime', 'Weekend effect', 'Refund spike'],
  },
  {
    day: '2025-10-28',
    revenue: 178920.00,
    z: 2.9,
    direction: 'spike',
    possible_causes: ['Product launch', 'Marketing campaign success'],
  },
  {
    day: '2025-10-15',
    revenue: 38540.75,
    z: -3.1,
    direction: 'drop',
    possible_causes: ['System maintenance', 'Regional outage'],
  },
];

export const mockTransactions: Transaction[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  order_id: `ORD-${String(i + 1).padStart(6, '0')}`,
  user_id: `USR-${Math.floor(Math.random() * 10000)}`,
  product_id: `PRO-${String(Math.floor(Math.random() * 8) + 1).padStart(3, '0')}`,
  amount: Math.random() * 5000 + 100,
  currency: 'USD',
  status: ['completed', 'pending', 'failed', 'refunded'][Math.floor(Math.random() * 4)] as Transaction['status'],
  channel: ['web', 'mobile', 'api', 'partner'][Math.floor(Math.random() * 4)] as Transaction['channel'],
  created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  paid_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  refunded: Math.random() > 0.9,
  refund_amount: Math.random() > 0.9 ? Math.random() * 1000 : 0,
  region: ['US', 'EU', 'APAC', 'LATAM'][Math.floor(Math.random() * 4)],
  attribution_campaign: Math.random() > 0.5 ? `campaign-${Math.floor(Math.random() * 10)}` : undefined,
}));
