// Assuming this file is located in a structure like src/hooks/useTransactions.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as transactionAPI } from '@/api/client';
import { toast } from 'sonner';

// Import types and define TransactionFormData
import type { Transaction } from '@/types'; 
export type TransactionFormData = Omit<Transaction, 'id' | 'created_at'>;


export const useTransactions = () => {
  const queryClient = useQueryClient();

  // Transactions Query
  const { 
    data: transactions = [], 
    isLoading, 
    error 
  } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getTransactions(),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) => transactionAPI.createTransaction(data as any),
    onSuccess: (newTransaction: Transaction) => {
      // 🟢 Enhancement: Optimistically update the list by adding the new transaction
      queryClient.setQueryData<Transaction[]>(['transactions'], (old) => {
        // Return existing data if old is null/undefined, otherwise prepend the new item
        return old ? [newTransaction, ...old] : [newTransaction];
      });
      // Invalidate the full list to fetch fresh data in the background (stale-while-revalidate)
      queryClient.invalidateQueries({ queryKey: ['transactions'], exact: true }); 
      toast.success('Transaction created successfully');
    },
    onError: (error: any) => {
      console.error('Create transaction failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to create transaction');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    // Type definition is correct: { id: number; data: TransactionFormData }
    mutationFn: ({ id, data }: { id: number; data: TransactionFormData }) => 
      transactionAPI.updateTransaction(id, data as any),
    
    // 🟢 Correction/Enhancement: Use the returned data to perform a targeted update in the cache
    onSuccess: (updatedTransaction: Transaction) => {
      // Update the specific item in the 'transactions' list
      queryClient.setQueryData<Transaction[]>(['transactions'], (old) => {
        return old?.map((t) => 
          t.id === updatedTransaction.id ? updatedTransaction : t
        );
      });
      
      // Invalidate the full list to fetch fresh data in the background
      queryClient.invalidateQueries({ queryKey: ['transactions'], exact: true });
      toast.success('Transaction updated successfully');
    },
    onError: (error: any) => {
      console.error('Update transaction failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to update transaction');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionAPI.deleteTransaction(id),
    
    // 🟢 Enhancement: Optimistically remove the item from the list
    onSuccess: (data, deletedId) => {
      queryClient.setQueryData<Transaction[]>(['transactions'], (old) => {
        return old?.filter((t) => t.id !== deletedId);
      });
      // Invalidate the list for stale-while-revalidate
      queryClient.invalidateQueries({ queryKey: ['transactions'], exact: true }); 
      toast.success('Transaction deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete transaction failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete transaction');
    },
  });

  // Import CSV Mutation
  const importCSVMutation = useMutation({
    mutationFn: (file: File) => transactionAPI.importCSV(file), // Added File type for clarity
    onSuccess: (data) => {
      // Invalidate transactions list to show newly imported data
      queryClient.invalidateQueries({ queryKey: ['transactions'], exact: true }); 
      // import_service returns various shapes; try to read 'imported' or 'count'
      const count = (data && (data.imported || data.count)) ?? 0;
      toast.success(`Successfully imported ${count} transactions`);
    },
    onError: (error: any) => {
      console.error('Import CSV failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to import CSV');
    },
  });

  return {
    transactions,
    isLoading,
    error,
    
    // Mutation functions
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    importCSV: importCSVMutation.mutate,
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isImporting: importCSVMutation.isPending,
  };
};