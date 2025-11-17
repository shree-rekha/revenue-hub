import pandas as pd
import io
from typing import Dict, Any, List
from datetime import datetime
import uuid
from dateutil import parser
import logging
from decimal import Decimal, InvalidOperation

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

ALLOWED_EXTS = {"csv", "xlsx", "xls"}
MAX_ROWS_SOFT_LIMIT = 200_000


class ImportService:
    def __init__(self, db):
        self.db = db
        self.collection = db.transactions

    async def import_from_file(self, content: bytes, file_ext: str, preview: bool = False) -> Dict[str, Any]:
        """Import transactions from CSV or Excel file."""
        file_ext = (file_ext or '').lower().strip().lstrip('.')
        if file_ext not in ALLOWED_EXTS:
            return {
                'success': False,
                'error': f'Unsupported file type: {file_ext}. Allowed: {", ".join(sorted(ALLOWED_EXTS))}'
            }
        
        total_rows = 0
        
        try:
            # Read file
            if file_ext == 'csv':
                df = pd.read_csv(io.BytesIO(content), dtype=str, low_memory=False)
            else:
                df = pd.read_excel(io.BytesIO(content), dtype=str)
            
            total_rows = len(df)
            if total_rows > MAX_ROWS_SOFT_LIMIT and not preview:
                return {
                    'success': False,
                    'error': f'File too large: {total_rows} rows exceeds soft limit of {MAX_ROWS_SOFT_LIMIT}. Split the file and try again.'
                }
            
            original_columns = list(df.columns)
            logging.info(f"CSV columns: {original_columns}")

            # Simple column mapping - just use lowercase matching
            def find_column(df_cols, keywords):
                """Find a column by keywords"""
                for keyword in keywords:
                    for col in df_cols:
                        if col.lower().strip() == keyword.lower().strip():
                            return col
                return None

            order_id_col = find_column(original_columns, ['order_id', 'order id', 'id', 'orderid'])
            user_id_col = find_column(original_columns, ['user_id', 'user id', 'userid'])
            product_id_col = find_column(original_columns, ['product_id', 'product id', 'sku', 'productid'])
            amount_col = find_column(original_columns, ['amount', 'amt', 'value', 'price'])
            currency_col = find_column(original_columns, ['currency', 'curr'])
            status_col = find_column(original_columns, ['status', 'state'])
            channel_col = find_column(original_columns, ['channel', 'source', 'platform'])
            created_at_col = find_column(original_columns, ['created_at', 'created at', 'createdat', 'date_created'])
            paid_at_col = find_column(original_columns, ['paid_at', 'paid at', 'paidat', 'timestamp', 'date'])
            region_col = find_column(original_columns, ['region', 'country', 'locale'])
            refunded_col = find_column(original_columns, ['refunded', 'is_refunded'])
            refund_amount_col = find_column(original_columns, ['refund_amount', 'refund amount', 'refund'])
            campaign_col = find_column(original_columns, ['attribution_campaign', 'campaign', 'utm_campaign'])

            logging.info(f"Mapped: order_id={order_id_col}, amount={amount_col}, status={status_col}")

            # Preview mode
            if preview:
                preview_rows = []
                for _, row in df.head(10).iterrows():
                    preview_row = {}
                    # Include all mapped columns in preview
                    if order_id_col:
                        preview_row['order_id'] = str(row.get(order_id_col, '')).strip()
                    if user_id_col:
                        preview_row['user_id'] = str(row.get(user_id_col, '')).strip()
                    if product_id_col:
                        preview_row['product_id'] = str(row.get(product_id_col, '')).strip()
                    if amount_col:
                        preview_row['amount'] = str(row.get(amount_col, '')).strip()
                    if currency_col:
                        preview_row['currency'] = str(row.get(currency_col, '')).strip()
                    if status_col:
                        preview_row['status'] = str(row.get(status_col, '')).strip()
                    if channel_col:
                        preview_row['channel'] = str(row.get(channel_col, '')).strip()
                    if created_at_col:
                        preview_row['created_at'] = str(row.get(created_at_col, '')).strip()
                    if paid_at_col:
                        preview_row['paid_at'] = str(row.get(paid_at_col, '')).strip()
                    if region_col:
                        preview_row['region'] = str(row.get(region_col, '')).strip()
                    if refunded_col:
                        preview_row['refunded'] = str(row.get(refunded_col, '')).strip()
                    if refund_amount_col:
                        preview_row['refund_amount'] = str(row.get(refund_amount_col, '')).strip()
                    if campaign_col:
                        preview_row['attribution_campaign'] = str(row.get(campaign_col, '')).strip()
                    
                    preview_rows.append(preview_row)
                
                mapped_columns_dict = {}
                if order_id_col:
                    mapped_columns_dict['order_id'] = order_id_col
                if user_id_col:
                    mapped_columns_dict['user_id'] = user_id_col
                if product_id_col:
                    mapped_columns_dict['product_id'] = product_id_col
                if amount_col:
                    mapped_columns_dict['amount'] = amount_col
                if currency_col:
                    mapped_columns_dict['currency'] = currency_col
                if status_col:
                    mapped_columns_dict['status'] = status_col
                if channel_col:
                    mapped_columns_dict['channel'] = channel_col
                if created_at_col:
                    mapped_columns_dict['created_at'] = created_at_col
                if paid_at_col:
                    mapped_columns_dict['paid_at'] = paid_at_col
                if region_col:
                    mapped_columns_dict['region'] = region_col
                if refunded_col:
                    mapped_columns_dict['refunded'] = refunded_col
                if refund_amount_col:
                    mapped_columns_dict['refund_amount'] = refund_amount_col
                if campaign_col:
                    mapped_columns_dict['attribution_campaign'] = campaign_col
                
                logging.info(f"Preview: {len(preview_rows)} rows, columns: {list(mapped_columns_dict.keys())}")
                
                return {
                    'success': True,
                    'preview': preview_rows,
                    'mapped_columns': mapped_columns_dict,
                    'total': total_rows,
                }

            # Process all rows - NO SKIPPING
            transactions = []

            for index, row in df.iterrows():
                try:
                    # Get values with defaults
                    order_id = str(row.get(order_id_col, '')).strip() if order_id_col else ''
                    if not order_id:
                        order_id = f"AUTO-{uuid.uuid4().hex[:8]}"
                    
                    user_id = str(row.get(user_id_col, '')).strip() if user_id_col else ''
                    product_id = str(row.get(product_id_col, '')).strip() if product_id_col else ''
                    
                    amount_str = str(row.get(amount_col, '0')).strip() if amount_col else '0'
                    try:
                        amount = float(amount_str.replace(',', '').replace('$', ''))
                    except:
                        amount = 0.0
                    
                    currency = str(row.get(currency_col, 'USD')).strip().upper() if currency_col else 'USD'
                    status = str(row.get(status_col, '')).strip().lower() if status_col else ''
                    channel = str(row.get(channel_col, '')).strip().lower() if channel_col else ''

                    # Normalize values to match API schema
                    if status == 'cancelled':
                        status = 'failed'
                    if channel == 'email':
                        channel = 'partner'
                    
                    created_at_str = str(row.get(created_at_col, '')).strip() if created_at_col else ''
                    try:
                        created_at = parser.parse(created_at_str).isoformat() if created_at_str else datetime.utcnow().isoformat()
                    except:
                        created_at = datetime.utcnow().isoformat()
                    
                    paid_at_str = str(row.get(paid_at_col, '')).strip() if paid_at_col else ''
                    try:
                        paid_at = parser.parse(paid_at_str).isoformat() if paid_at_str else None
                    except:
                        paid_at = None
                    # If status indicates completion but paid_at missing, allow None; model supports Optional[str]
                    
                    refunded_str = str(row.get(refunded_col, 'false')).strip().lower() if refunded_col else 'false'
                    refunded = refunded_str in ['true', 'yes', '1']
                    
                    refund_amount_str = str(row.get(refund_amount_col, '0')).strip() if refund_amount_col else '0'
                    try:
                        refund_amount = float(refund_amount_str.replace(',', '').replace('$', ''))
                    except:
                        refund_amount = 0.0
                    
                    region = str(row.get(region_col, '')).strip() if region_col else ''
                    campaign = str(row.get(campaign_col, '')).strip() if campaign_col else ''

                    tx = {
                        'id': str(uuid.uuid4()),
                        'order_id': order_id,
                        'user_id': user_id,
                        'product_id': product_id,
                        'amount': amount,
                        'currency': currency,
                        'status': status,
                        'channel': channel,
                        'created_at': created_at,
                        'paid_at': paid_at,
                        'refunded': refunded,
                        'refund_amount': refund_amount,
                        'region': region,
                        'attribution_campaign': campaign,
                    }

                    transactions.append(tx)
                    logging.info(f"Row {index + 2}: order_id={order_id}, amount={amount}")

                except Exception as e:
                    logging.error(f"Row {index + 2} error: {str(e)}", exc_info=True)
                    # Still add the row with defaults
                    tx = {
                        'id': str(uuid.uuid4()),
                        'order_id': f"AUTO-{uuid.uuid4().hex[:8]}",
                        'user_id': '',
                        'product_id': '',
                        'amount': 0.0,
                        'currency': 'USD',
                        'status': '',
                        'channel': '',
                        'created_at': datetime.utcnow().isoformat(),
                        'paid_at': None,
                        'refunded': False,
                        'refund_amount': 0.0,
                        'region': '',
                        'attribution_campaign': '',
                    }
                    transactions.append(tx)

            logging.info(f"Total transactions to insert: {len(transactions)}")

            if not transactions:
                return {
                    'success': False,
                    'error': 'No transactions to import',
                    'total': total_rows,
                }

            # Insert into DB
            try:
                logging.info(f"About to insert {len(transactions)} transactions")
                logging.info(f"First transaction: {transactions[0] if transactions else 'NONE'}")
                
                result = await self.collection.insert_many(transactions)
                inserted = len(result.inserted_ids)
                
                logging.info(f"Successfully inserted {inserted} records")
                logging.info(f"Inserted IDs: {result.inserted_ids[:5]}")
                
                # Verify insertion
                count_after = await self.collection.count_documents({})
                logging.info(f"Total transactions in DB after insert: {count_after}")
                
            except Exception as e:
                logging.error(f"DB insert error: {str(e)}", exc_info=True)
                inserted = 0

            return {
                'success': True,
                'imported': inserted,
                'skipped': 0,
                'total': total_rows,
            }

        except Exception as e:
            logging.error(f'Failed to process file: {str(e)}', exc_info=True)
            return {
                'success': False,
                'error': 'A critical error occurred during file processing.',
                'detail': str(e),
                'total': total_rows,
            }
