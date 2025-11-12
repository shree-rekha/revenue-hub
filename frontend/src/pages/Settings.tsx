import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Database, Key, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Settings() {
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState(() => {
    const saved = localStorage.getItem('api-settings');
    return saved ? JSON.parse(saved).baseUrl : 'http://localhost:8000/api/v1';
  });
  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem('api-settings');
    return saved ? JSON.parse(saved).apiKey : 'dev_key';
  });
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  const handleSave = () => {
    apiClient.updateSettings(baseUrl, apiKey);
    toast({
      title: 'Settings Saved',
      description: 'API configuration has been updated successfully.',
    });
    setConnectionStatus('unknown');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const success = await apiClient.testConnection();
      if (success) {
        setConnectionStatus('connected');
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to the FastAPI backend.',
        });
      } else {
        setConnectionStatus('failed');
        toast({
          title: 'Connection Failed',
          description: 'Could not connect to the backend. Check your settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to the backend. Check your settings.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your FastAPI backend connection and API authentication
        </p>
      </div>

      {/* Backend Setup Instructions */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertTitle>Backend Setup Required</AlertTitle>
        <AlertDescription>
          This frontend requires a running FastAPI backend. Follow the setup instructions in the 
          backend/ directory to start the server with <code className="font-mono text-xs">uvicorn app.main:app --reload</code>
        </AlertDescription>
      </Alert>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure the connection to your FastAPI backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              type="url"
              placeholder="http://localhost:8000/api/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The base URL of your FastAPI backend (without trailing slash)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="dev_key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key for backend authentication (x-api-key header)
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>

          {connectionStatus === 'connected' && (
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle className="text-success">Connected</AlertTitle>
              <AlertDescription>
                Successfully connected to the FastAPI backend
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'failed' && (
            <Alert variant="destructive">
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>
                Could not connect to the backend. Make sure the server is running and the URL is correct.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Backend Endpoints Reference */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Reference</CardTitle>
          <CardDescription>
            Available endpoints in the FastAPI backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="font-mono text-xs bg-muted p-3 rounded-md space-y-1">
              <p className="text-success">POST /api/v1/transactions</p>
              <p className="text-primary">GET /api/v1/transactions</p>
              <p className="text-primary">GET /api/v1/transactions/{'<order_id>'}</p>
            </div>
            <div className="font-mono text-xs bg-muted p-3 rounded-md space-y-1">
              <p className="text-primary">GET /api/v1/insights/revenue/daily</p>
              <p className="text-primary">GET /api/v1/insights/revenue/summary</p>
              <p className="text-primary">GET /api/v1/insights/revenue/by-product</p>
              <p className="text-primary">GET /api/v1/insights/anomalies</p>
              <p className="text-primary">GET /api/v1/insights/narrative</p>
            </div>
            <div className="font-mono text-xs bg-muted p-3 rounded-md space-y-1">
              <p className="text-primary">GET /api/v1/export/csv</p>
              <p className="text-primary">GET /api/v1/export/pdf</p>
            </div>
            <p className="text-muted-foreground text-xs pt-2">
              All endpoints require <code className="font-mono">x-api-key</code> header for authentication. 
              Visit <code className="font-mono">{baseUrl.replace('/api/v1', '')}/docs</code> for interactive API documentation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Frontend application details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Frontend:</strong> React + Vite + TypeScript</p>
          <p><strong className="text-foreground">UI Framework:</strong> Tailwind CSS + shadcn/ui</p>
          <p><strong className="text-foreground">Charts:</strong> Recharts</p>
          <p><strong className="text-foreground">Data Mode:</strong> Mock data (switch to live data by connecting backend)</p>
        </CardContent>
      </Card>
    </div>
  );
}
