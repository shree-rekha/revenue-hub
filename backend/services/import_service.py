import pandas as pd
import io
from typing import Dict, Any
from datetime import datetime
import uuid


class ImportService:
    def __init__(self, db):
        self.db = db
        self.collection = db.transactions
    
    async def import_from_file(self, content: bytes, file_ext: str) -> Dict[str, Any]:
        """
        Import transactions from CSV or Excel file.
        """
        try:
            # Read file into DataFrame
            if file_ext == 'csv':
                df = pd.read_csv(io.BytesIO(content))
            else:  # xlsx or xls
                df = pd.read_excel(io.BytesIO(content))
            
            # Validate required columns
            required_columns = [
                'order_id', 'user_id', 'product_id', 'amount',
                'status', 'channel', 'paid_at', 'region'
            ]
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return {
                    "success": False,
                    "error": f"Missing required columns: {', '.join(missing_columns)}",
                    "required_columns": required_columns
                }
            
            # Process and validate data
            transactions = []
            skipped = 0
            
            for idx, row in df.iterrows():
                try:
                    transaction = {
                        "id": str(uuid.uuid4()),
                        "order_id": str(row['order_id']),
                        "user_id": str(row['user_id']),
                        "product_id": str(row['product_id']),
                        "amount": float(row['amount']),
                        "currency": str(row.get('currency', 'USD')),
                        "status": str(row['status']).lower(),
                        "channel": str(row['channel']).lower(),
                        "paid_at": str(row['paid_at']),
                        "refunded": bool(row.get('refunded', False)),
                        "refund_amount": float(row.get('refund_amount', 0.0)),
                        "region": str(row['region']),
                        "attribution_campaign": str(row['attribution_campaign']) if pd.notna(row.get('attribution_campaign')) else None,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    
                    # Validate status and channel
                    if transaction['status'] not in ['completed', 'pending', 'failed', 'refunded']:
                        skipped += 1
                        continue
                    if transaction['channel'] not in ['web', 'mobile', 'api', 'partner']:
                        skipped += 1
                        continue
                    
                    transactions.append(transaction)
                except Exception as e:
                    skipped += 1
                    continue
            
            if not transactions:
                return {
                    "success": False,
                    "error": "No valid transactions found in file",
                    "skipped": skipped
                }
            
            # Insert into database
            result = await self.collection.insert_many(transactions)
            
            return {
                "success": True,
                "imported": len(result.inserted_ids),
                "skipped": skipped,
                "total": len(df)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to process file: {str(e)}"
            }
