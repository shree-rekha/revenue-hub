import { DollarSign, TrendingUp, Calendar, Activity, Download, FileText } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { CSVImport } from '@/components/CSVImport';
import { TransactionList } from '@/components/TransactionList';
import { DashboardStats } from '@/components/DashboardStats';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Overview() {
  const queryClient = useQueryClient();

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery({
    queryKey: ['revenue-summary'],
    queryFn: () => apiClient.getRevenueSummary(),
    retry: 1,
  });

  const { data: transactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient.getTransactions(100, 0),
    retry: 1,
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => apiClient.importCSV(file),
    onSuccess: (data) => {
      // Show success message
      if (data.success) {
        const { imported, skipped, total } = data;
        const message = skipped > 0 
          ? `Imported ${imported}/${total} records (${skipped} skipped)`
          : `Successfully imported ${imported} records`;
        
        toast.success(message);
      } else {
        toast.error(data.error || 'Import failed');
      }
      
      // Invalidate all queries to refresh with new imported data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['revenue-summary'] });
      queryClient.invalidateQueries({ queryKey: ['daily-revenue'] });
      queryClient.invalidateQueries({ queryKey: ['top-products'] });
      queryClient.invalidateQueries({ queryKey: ['anomalies'] });
      
      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['transactions'] });
        queryClient.refetchQueries({ queryKey: ['revenue-summary'] });
      }, 500);
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : 'Import failed';
      toast.error(`Import Error: ${errorMsg}`);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Safe defaults for summary
  const safeSummary = summary || {
    today: 0,
    mtd: 0,
    ytd: 0,
    rhi: 0,
    top_products: [],
    anomalies: [],
    narrative: 'Loading insights...',
  };

  const handleExportCSV = async () => {
    try {
      const blob = await apiClient.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleExportPDF = () => {
    window.alert('PDF export not available');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Revenue Overview</h1>
        <p className="text-muted-foreground mt-1">
          Real-time revenue insights and key performance indicators
        </p>
      </div>

      {/* Loading state */}
      {(isSummaryLoading || isTxLoading) && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 rounded">
          Loading data...
        </div>
      )}

      {/* Error state */}
      {summaryError && (
        <div className="p-4 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 rounded">
          Error loading summary: {String(summaryError)}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(safeSummary.today)}
          icon={DollarSign}
          trend={{ value: 5.2, label: 'vs 7-day avg' }}
          variant="success"
        />
        <StatCard
          title="Month to Date"
          value={formatCurrency(safeSummary.mtd)}
          icon={Calendar}
          trend={{ value: 18.3, label: 'vs last month' }}
        />
        <StatCard
          title="Year to Date"
          value={formatCurrency(safeSummary.ytd)}
          icon={TrendingUp}
          trend={{ value: 24.7, label: 'vs last year' }}
        />
        <StatCard
          title="Revenue Health Index"
          value={`${safeSummary.rhi}%`}
          icon={Activity}
          variant={safeSummary.rhi >= 70 ? 'success' : safeSummary.rhi >= 50 ? 'warning' : 'destructive'}
        />
      </div>

      {/* Narrative Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Narrative Insights</CardTitle>
          <CardDescription>Plain-English summary of your revenue performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{safeSummary.narrative}</p>
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
            {safeSummary.top_products && safeSummary.top_products.length > 0 ? (
              safeSummary.top_products.slice(0, 5).map((product, index) => (
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
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No products data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Anomalies</CardTitle>
            <CardDescription>Detected unusual patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!safeSummary.anomalies || safeSummary.anomalies.length === 0 ? (
              <p className="text-muted-foreground text-sm">No anomalies detected</p>
            ) : (
              safeSummary.anomalies.map((anomaly) => (
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

      {/* Import/Export and CSV Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <CSVImport
            transactions={transactions}
            onImport={(file: File) => importMutation.mutate(file)}
            isImporting={importMutation.isPending}
          />
        </div>
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

      {/* Stats and transaction list */}
      <div className="mt-6">
        <DashboardStats transactions={transactions} />
      </div>
      <div className="mt-6">
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}
