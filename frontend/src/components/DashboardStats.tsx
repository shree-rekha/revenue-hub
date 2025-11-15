import type { Transaction } from '@/types'; // Ensure the correct API Transaction type is imported
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

interface DashboardStatsProps {
  transactions: Transaction[];
}

export const DashboardStats = ({ transactions }: DashboardStatsProps) => {
  
  // 🟢 Recalculate KPIs based on API fields (status, refunded, amount, refund_amount)
  
  // 1. Total Revenue: Sum of 'amount' for completed, non-refunded transactions.
  // Note: We use the full 'amount' here, assuming 'amount' is the gross sale value.
  const totalRevenue = transactions
    .filter((t) => t.status === 'completed' && !t.refunded)
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Total Refunds: Sum of 'refund_amount' for refunded transactions.
  const totalRefunds = transactions
    .filter((t) => t.refunded)
    .reduce((sum, t) => sum + t.refund_amount, 0);

  // 3. Net Revenue: Total Revenue minus Total Refunds.
  const netRevenue = totalRevenue - totalRefunds;

  const formatCurrency = (amount: number, currency = 'USD') => {
    // 🟢 Use the first currency found or default to USD for consistency
    const safeCurrency = transactions[0]?.currency || currency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      
      {/* 1. Total Revenue (Income equivalent) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Completed, non-refunded sales.
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Refunds (Expense equivalent) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
          <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalRefunds)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monies returned to customers.
          </p>
        </CardContent>
      </Card>

      {/* 3. Net Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
          <DollarSign className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              netRevenue >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(netRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Revenue minus refunds.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};