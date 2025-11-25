import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Package } from 'lucide-react';

type RawProduct = {
  product_id: string;
  name?: string | null;
  revenue?: number | string | null;
  orders?: number | string | null;
  category?: string | null;
};

type ChartPoint = {
  name: string;
  revenue: number;
  orders: number;
  product_id: string;
};

export default function Products() {
  const { data: productsRaw = [], isLoading, error } = useQuery<RawProduct[]>({
    queryKey: ['top-products'],
    queryFn: () => apiClient.getTopProducts(30),
  });

  // Defensive normalization -> chart-friendly data
  const chartData: ChartPoint[] = (productsRaw || []).map((p) => {
    const revenue = Number((p as any).revenue ?? 0) || 0;
    const orders = Number((p as any).orders ?? 0) || 0;
    const name =
      p.name && p.name.toString().trim().length > 0
        ? p.name.toString()
        : p.product_id ?? 'Unknown';
    const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name;
    return {
      name: shortName,
      revenue,
      orders,
      product_id: p.product_id,
    };
  });

  const totalRevenue = chartData.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalOrders = chartData.reduce((sum, c) => sum + (c.orders || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Performance</h1>
          <p className="text-muted-foreground mt-1">Top performing products by revenue (last 30 days)</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-500">
              Error loading data: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!isLoading && chartData.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Performance</h1>
          <p className="text-muted-foreground mt-1">Top performing products by revenue (last 30 days)</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No product data available. Please import CSV data first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Product Performance</h1>
        <p className="text-muted-foreground mt-1">Top performing products by revenue (last 30 days)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Product Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{totalOrders.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Product SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{chartData.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Product</CardTitle>
          <CardDescription>Top {chartData.length} products ranked by total revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* layout="vertical" renders horizontal bars: numeric X-axis, categorical Y-axis */}
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 16, right: 24, bottom: 16, left: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

                {/* Numeric value axis */}
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => (typeof v === 'number' ? `$${(v / 1000).toFixed(0)}K` : v)}
                />

                {/* Categorical axis for product names */}
                <YAxis
                  type="category"
                  dataKey="name"
                  width={260} // enough space for product names; adjust as needed
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval={0}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  // tooltip formatter shows revenue as currency
                  formatter={(value: number | string) => formatCurrency(Number(value))}
                  // label shows product name (full name if you want)
                  labelFormatter={(label) => label}
                />

                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Complete breakdown of product performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((product, index) => {
              const raw = productsRaw[index];
              return (
                <div
                  key={product.product_id ?? index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{raw?.name ?? product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.product_id} • {raw?.category ?? 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
