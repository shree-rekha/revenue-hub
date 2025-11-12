import { DollarSign, TrendingUp, Calendar, Activity, Download, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { mockRevenueSummary } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';

export default function Overview() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['revenue-summary'],
    queryFn: () => apiClient.getRevenueSummary(),
    initialData: mockRevenueSummary,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExportCSV = () => {
    window.open(apiClient.getExportCsvUrl(), '_blank');
  };

  const handleExportPDF = () => {
    window.open(apiClient.getExportPdfUrl(), '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Revenue Overview</h1>
        <p className="text-muted-foreground mt-1">
          Real-time revenue insights and key performance indicators
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(summary.today)}
          icon={DollarSign}
          trend={{ value: 5.2, label: 'vs 7-day avg' }}
          variant="success"
        />
        <StatCard
          title="Month to Date"
          value={formatCurrency(summary.mtd)}
          icon={Calendar}
          trend={{ value: 18.3, label: 'vs last month' }}
        />
        <StatCard
          title="Year to Date"
          value={formatCurrency(summary.ytd)}
          icon={TrendingUp}
          trend={{ value: 24.7, label: 'vs last year' }}
        />
        <StatCard
          title="Revenue Health Index"
          value={`${summary.rhi}%`}
          icon={Activity}
          variant={summary.rhi >= 70 ? 'success' : summary.rhi >= 50 ? 'warning' : 'destructive'}
        />
      </div>

      {/* Narrative Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Narrative Insights</CardTitle>
          <CardDescription>Plain-English summary of your revenue performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{summary.narrative}</p>
        </CardContent>
      </Card>

      {/* Top Products & Anomalies */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.top_products.slice(0, 5).map((product, index) => (
              <div key={product.product_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.orders} orders</p>
                  </div>
                </div>
                <p className="font-semibold text-foreground">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Anomalies</CardTitle>
            <CardDescription>Detected unusual patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.anomalies.length === 0 ? (
              <p className="text-muted-foreground text-sm">No anomalies detected</p>
            ) : (
              summary.anomalies.map((anomaly) => (
                <div key={anomaly.day} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={anomaly.direction === 'spike' ? 'default' : 'destructive'}>
                        {anomaly.direction === 'spike' ? '↑' : '↓'} {anomaly.direction}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{anomaly.day}</span>
                    </div>
                    <p className="font-medium text-foreground">{formatCurrency(anomaly.revenue)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    z-score: {anomaly.z.toFixed(2)} | {anomaly.possible_causes.join(', ')}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download revenue data and reports</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
