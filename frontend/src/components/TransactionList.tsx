import type { Transaction } from '@/types'; // Ensure the correct API Transaction type is imported
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  // onDelete takes the transaction ID, which is 'id' (number) in the API type
  onDelete: (id: number) => void; 
  isDeleting?: boolean;
}

// Helper to determine badge variant based on transaction status
const getStatusVariant = (status: Transaction['status']) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const TransactionList = ({
  transactions,
  onEdit,
  onDelete,
  isDeleting,
}: TransactionListProps) => {
  // 🟢 Correction 1: Use the transaction's currency for formatting
  const formatCurrency = (amount: number, currency: string) => {
    // Handle cases where currency might be undefined or an empty string, defaulting to USD
    const safeCurrency = currency || 'USD'; 
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency,
    }).format(amount);
  };

  // 🟢 Correction 2: Use paid_at for the date display (or created_at if paid_at is null/not used)
  const formatDate = (dateString: string) => {
    // Check for a valid date string before formatting
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-muted-foreground">No transactions found. Start by creating or importing transactions!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Product ID</TableHead>
                <TableHead>Date Paid</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.order_id}</TableCell>
                  <TableCell>{transaction.product_id}</TableCell>
                  {/* Display Paid At date */}
                  <TableCell>{formatDate(transaction.paid_at)}</TableCell>
                  <TableCell>{transaction.channel}</TableCell>
                  {/* Status Badge */}
                  <TableCell>
                    <Badge variant={getStatusVariant(transaction.status)}>
                      {transaction.status.toUpperCase()}
                      {transaction.refunded && ' (Refunded)'}
                    </Badge>
                  </TableCell>
                  {/* Amount Cell */}
                  <TableCell
                    className={`text-right font-semibold ${
                      transaction.status === 'completed' && !transaction.refunded
                        ? 'text-green-600 dark:text-green-400'
                        : transaction.status === 'failed'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    {/* Format using amount and currency */}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        // 🟢 Ensure transaction.id exists before calling onDelete
                        onClick={() => { if (transaction.id) onDelete(transaction.id); }}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};