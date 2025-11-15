import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Anomalies() {
  const { data: anomalies = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => apiClient.getAnomalies(90),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const spikes = anomalies.filter(a => a.direction === 'spike');
  const drops = anomalies.filter(a => a.direction === 'drop');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Anomaly Detection</h1>
        <p className="text-muted-foreground mt-1">
          Statistical anomalies detected in revenue patterns (90-day lookback)
        </p>
      </div>

      {/* Alert if anomalies exist */}
      {anomalies.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Anomalies Detected</AlertTitle>
          <AlertDescription>
            {anomalies.length} unusual revenue patterns detected in the last 90 days. 
            Review the details below to understand potential causes.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{anomalies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue Spikes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{spikes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Revenue Drops</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{drops.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly List */}
      <div className="space-y-4">
        {anomalies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No Anomalies Detected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Revenue patterns are within normal statistical ranges
              </p>
            </CardContent>
          </Card>
        ) : (
          anomalies.map((anomaly) => (
            <Card key={anomaly.day} className={
              anomaly.direction === 'spike' 
                ? 'border-success/50 bg-success/5' 
                : 'border-destructive/50 bg-destructive/5'
            }>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {anomaly.direction === 'spike' ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {anomaly.direction === 'spike' ? 'Revenue Spike' : 'Revenue Drop'}
                      </CardTitle>
                      <CardDescription>
                        {new Date(anomaly.day).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={anomaly.direction === 'spike' ? 'default' : 'destructive'}>
                    z-score: {anomaly.z.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(anomaly.revenue)}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Possible Causes:</p>
                  <div className="flex flex-wrap gap-2">
                    {anomaly.possible_causes.map((cause, idx) => (
                      <Badge key={idx} variant="outline">
                        {cause}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong>Z-Score Interpretation:</strong> The z-score of {anomaly.z.toFixed(2)} indicates 
                    this day's revenue was {Math.abs(anomaly.z).toFixed(1)} standard deviations {anomaly.direction === 'spike' ? 'above' : 'below'} the 
                    90-day rolling average, which is statistically significant (threshold: ±2.5).
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Methodology</CardTitle>
          <CardDescription>How anomalies are identified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Algorithm:</strong> Rolling z-score calculation with 90-day lookback window
          </p>
          <p>
            <strong className="text-foreground">Threshold:</strong> |z-score| {'>'} 2.5 (approximately 1.2% probability under normal distribution)
          </p>
          <p>
            <strong className="text-foreground">Heuristics:</strong> Possible causes are generated based on contextual analysis including 
            refund rates, channel performance, and campaign attribution
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
