import { useRef, useState } from 'react';
import type { Transaction } from '@/types'; // Using the API Transaction type
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { apiClient } from '@/api/client';

interface CSVImportProps {
  transactions: Transaction[];
  onImport: (file: File) => void;
  isImporting?: boolean;
}

export const CSVImport = ({ onImport, isImporting, transactions }: CSVImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);
  const [previewCols, setPreviewCols] = useState<string[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setPreviewLoading(true);
    try {
      const resp = await apiClient.previewImportCSV(file);
      if (!resp || !resp.success) {
        toast.error(resp?.error || 'Failed to parse CSV for preview');
        setPreviewRows(null);
        setPreviewCols(null);
      } else {
        setPreviewRows(resp.preview || []);
        setPreviewCols(Object.keys(resp.mapped_columns || {}));
      }
    } catch (err) {
      console.error('Preview failed', err);
      toast.error('Failed to preview CSV');
      setPreviewRows(null);
      setPreviewCols(null);
    } finally {
      setPreviewLoading(false);
    }
    // Clear the input value so the same file can be selected again later
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      // 🟢 CORRECTION: Map to the e-commerce API fields instead of the simple finance fields
      const dataToExport = transactions.map((t) => ({
        order_id: t.order_id,
        user_id: t.user_id,
        product_id: t.product_id,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        channel: t.channel,
        paid_at: t.paid_at,
        refunded: t.refunded,
        refund_amount: t.refund_amount,
        region: t.region,
        // Ensure optional fields are included or default to an empty string
        attribution_campaign: t.attribution_campaign || '', 
        // Note: 'id' and 'created_at' are typically omitted from exports
      }));

      const csv = Papa.unparse(dataToExport);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Transactions exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export transactions');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import/Export Transactions</CardTitle>
        <CardDescription>
          Import transactions via a CSV file or export your current transaction history.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        {/* Import CSV */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || previewLoading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {previewLoading ? 'Parsing...' : isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
        </div>
        {/* Export CSV */}
        <div className="flex-1">
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full"
            disabled={transactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV ({transactions.length})
          </Button>
        </div>
      </CardContent>
      {/* Preview section */}
      {previewRows && (
        <CardContent>
          <div className="mb-2 font-medium">Preview (first {previewRows.length} rows)</div>
          <div className="overflow-auto max-h-56">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr>
                  {previewCols?.map((c) => (
                    <th key={c} className="text-left pr-4">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/10' : ''}>
                    {previewCols?.map((c) => (
                      <td key={c} className="pr-4">{String(r[c] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => {
                if (!selectedFile) return;
                onImport(selectedFile);
                // clear preview after commit
                setPreviewRows(null);
                setPreviewCols(null);
                setSelectedFile(null);
              }}
              className="bg-primary text-white"
              disabled={isImporting}
            >
              Confirm Import
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewRows(null);
                setPreviewCols(null);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};