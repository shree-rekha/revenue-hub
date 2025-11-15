import { useState } from 'react';
// 🟢 Using the e-commerce API Transaction type definitions
import type { Transaction } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Type alias for form data, omitting backend-generated fields
export type TransactionFormData = Omit<Transaction, 'id' | 'created_at'>;

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: TransactionFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// --- Constants for Select Dropdowns ---
const STATUS_OPTIONS: Array<Transaction['status']> = ['completed', 'pending', 'failed', 'refunded'];
const CHANNEL_OPTIONS: Array<Transaction['channel']> = ['web', 'mobile', 'api', 'partner'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'INR']; // Assuming common currencies

// Helper function to format date to 'YYYY-MM-DDTHH:mm' for datetime-local input
const formatDateTimeLocal = (isoString?: string): string => {
  if (!isoString) return new Date().toISOString().slice(0, 16);
  // Ensure we use the 'paid_at' field for the date input
  return new Date(isoString).toISOString().slice(0, 16);
};

export const TransactionForm = ({
  transaction,
  onSubmit,
  onCancel,
  isSubmitting,
}: TransactionFormProps) => {
  // 🟢 Initial state matches the full TransactionFormData structure
  const [formData, setFormData] = useState<TransactionFormData>({
    order_id: transaction?.order_id || '',
    user_id: transaction?.user_id || '',
    product_id: transaction?.product_id || '',
    amount: transaction?.amount || 0,
    currency: transaction?.currency || CURRENCY_OPTIONS[0],
    status: transaction?.status || 'pending',
    channel: transaction?.channel || 'web',
    paid_at: transaction?.paid_at || new Date().toISOString(), // Use ISO string
    refunded: transaction?.refunded || false,
    refund_amount: transaction?.refund_amount || 0,
    region: transaction?.region || '',
    attribution_campaign: transaction?.attribution_campaign || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Final check for non-optional fields before submitting
    if (formData.order_id && formData.user_id && formData.product_id) {
        onSubmit(formData);
    }
  };
  
  // Helper to handle input changes for string/number fields
  const handleInputChange = (field: keyof TransactionFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{transaction ? 'Edit Transaction' : 'Create New Transaction'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Order ID & User ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_id">Order ID</Label>
              <Input
                id="order_id"
                value={formData.order_id}
                onChange={(e) => handleInputChange('order_id', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_id">User ID</Label>
              <Input
                id="user_id"
                value={formData.user_id}
                onChange={(e) => handleInputChange('user_id', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Product ID & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Product ID</Label>
              <Input
                id="product_id"
                value={formData.product_id}
                onChange={(e) => handleInputChange('product_id', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                required
              />
            </div>
          </div>
          
          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status & Channel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select
                value={formData.channel}
                onValueChange={(value) => handleInputChange('channel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Paid At Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="paid_at">Paid At (Date/Time)</Label>
            <Input
              id="paid_at"
              type="datetime-local"
              value={formatDateTimeLocal(formData.paid_at)}
              onChange={(e) => {
                // Convert datetime-local input back to ISO string for API compatibility
                const date = new Date(e.target.value);
                handleInputChange('paid_at', date.toISOString());
              }}
              required
            />
          </div>
          
          {/* Refund Amount & Attribution Campaign (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refund_amount">Refund Amount</Label>
              <Input
                id="refund_amount"
                type="number"
                step="0.01"
                value={formData.refund_amount}
                onChange={(e) => handleInputChange('refund_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="attribution_campaign">Attribution Campaign</Label>
              <Input
                id="attribution_campaign"
                value={formData.attribution_campaign}
                onChange={(e) => handleInputChange('attribution_campaign', e.target.value)}
                placeholder="Optional campaign name"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : transaction ? 'Update Transaction' : 'Create Transaction'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};