import csv
import io
from typing import List, Dict

class ExportService:
    def __init__(self, db):
        self.db = db
        self.collection = db.transactions
    
    async def export_to_csv(self, limit: int = 5000) -> str:
        """
        Export transactions to CSV format.
        """
        # Get transactions
        cursor = self.collection.find().limit(limit).sort("created_at", -1)
        transactions = await cursor.to_list(length=limit)
        
        if not transactions:
            return "No transactions to export"
        
        # Create CSV in memory
        output = io.StringIO()
        fieldnames = [
            'id', 'order_id', 'user_id', 'product_id', 'amount', 'currency',
            'status', 'channel', 'created_at', 'paid_at', 'refunded',
            'refund_amount', 'region', 'attribution_campaign'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for transaction in transactions:
            row = {field: transaction.get(field, '') for field in fieldnames}
            writer.writerow(row)
        
        return output.getvalue()
