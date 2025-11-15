import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function Timeline() {
  const { data: dailyRevenue = [] } = useQuery({
    queryKey: ['daily-revenue'],
    queryFn: () => apiClient.getDailyRevenue(),
  });

  const { data: anomalies = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => apiClient.getAnomalies(),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate moving averages
  const calculateMA = (data: typeof dailyRevenue, window: number) => {
    return data.map((item, idx) => {
      if (idx < window - 1) return null;
      const sum = data.slice(idx - window + 1, idx + 1).reduce((acc, d) => acc + d.revenue, 0);
      return sum / window;
    });
  };

  const ma7 = calculateMA(dailyRevenue, 7);
  const ma30 = calculateMA(dailyRevenue, 30);

  const chartData = dailyRevenue.map((item, idx) => ({
    ...item,
    ma7: ma7[idx],
    ma30: ma30[idx],
    displayDay: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const anomalySet = new Set(anomalies.map(a => a.day));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Revenue Timeline</h1>
        <p className="text-muted-foreground mt-1">
          Daily revenue trends with moving averages and anomaly detection
        </p>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-chart-1 rounded" />
          <span className="text-sm text-muted-foreground">Daily Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-chart-2 rounded" />
          <span className="text-sm text-muted-foreground">7-Day MA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-chart-3 rounded" />
          <span className="text-sm text-muted-foreground">30-Day MA</span>
        </div>
        <Badge variant="destructive">Anomaly</Badge>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>90-Day Revenue Trend</CardTitle>
          <CardDescription>Daily revenue with 7-day and 30-day moving averages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="displayDay" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(chartData.length / 10)}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="ma7" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="ma30" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
                {anomalies.map((anomaly) => {
                  const dataPoint = chartData.find(d => d.day === anomaly.day);
                  if (!dataPoint) return null;
                  return (
                    <ReferenceDot
                      key={anomaly.day}
                      x={dataPoint.displayDay}
                      y={anomaly.revenue}
                      r={6}
                      fill="hsl(var(--destructive))"
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(dailyRevenue.reduce((sum, d) => sum + d.revenue, 0) / dailyRevenue.length)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders (90d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {dailyRevenue.reduce((sum, d) => sum + d.orders, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{anomalies.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
