import pandas as pd
import io
from typing import Dict, Any, List
from datetime import datetime
import uuid
from dateutil import parser # 💡 NEW: For robust date parsing
import logging # 💡 NEW: For internal logging

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class ImportService:
    def __init__(self, db):
        self.db = db
        self.collection = db.transactions

    async def import_from_file(self, content: bytes, file_ext: str, preview: bool = False) -> Dict[str, Any]:
        """
        Import transactions from CSV or Excel file.

        If preview=True, parse and return a small preview of rows and detected/missing columns
        without inserting into the DB.
        """
        skipped_details: List[Dict[str, Any]] = [] # 💡 NEW: To track reasons for skipping
        total_rows = 0 
        
        try:
            # Read file into DataFrame
            if file_ext == 'csv':
                df = pd.read_csv(io.BytesIO(content))
            else:  # xlsx or xls
                df = pd.read_excel(io.BytesIO(content))
            
            total_rows = len(df)
            
            # Normalize column names (strip + lower)
            original_columns = list(df.columns)
            lowered_keys = [c.strip().lower() for c in original_columns]

            # Define canonical fields and common synonyms
            canonical_map = {
                'order_id': ['order_id', 'order id', 'id', 'orderid'],
                'user_id': ['user_id', 'user id', 'userid'],
                'product_id': ['product_id', 'product id', 'sku', 'productid'],
                'amount': ['amount', 'amt', 'value', 'price'],
                'currency': ['currency', 'curr'],
                'status': ['status', 'state'],
                'channel': ['channel', 'source', 'platform'],
                'created_at': ['created_at', 'created at', 'createdat', 'date_created'],
                'paid_at': ['paid_at', 'paid at', 'paidat', 'timestamp', 'date'],
                'region': ['region', 'country', 'locale'],
                'refunded': ['refunded', 'is_refunded'],
                'refund_amount': ['refund_amount', 'refund amount', 'refund'],
                'attribution_campaign': ['attribution_campaign', 'campaign', 'utm_campaign'],
            }

            # Map dataframe columns to canonical names
            mapped_columns: Dict[str, str] = {}
            missing_required: List[str] = []
            
            # --- Column Mapping Logic (Unchanged and correct) ---
            for canon, synonyms in canonical_map.items():
                found = None
                for syn in synonyms:
                    syn = syn.strip().lower()
                    for orig in original_columns:
                        if orig.strip().lower() == syn:
                            found = orig
                            break
                    if found:
                        break
                if found:
                    mapped_columns[canon] = found
                else:
                    if canon in ['order_id', 'user_id', 'product_id', 'amount', 'status', 'channel', 'region']:
                        missing_required.append(canon)
            # ---------------------------------------------------

            # Helper to sanitize preview values (convert NaN/inf to safe values)
            def sanitize_value(val):
                if val is None or pd.isna(val):
                    return None
                if isinstance(val, (int, float)):
                    # Check for NaN or infinity
                    if isinstance(val, float) and not (-1e308 < val < 1e308):
                        return None
                    return val
                if hasattr(val, 'item'):  # pandas scalar
                    return val.item()
                return val

            if total_rows > 0 and preview:
                preview_rows: List[Dict[str, Any]] = []
                for _, row in df.head(10).iterrows():
                    mapped_row = {}
                    for canon, orig_col in mapped_columns.items():
                        raw_val = row.get(orig_col, None)
                        mapped_row[canon] = sanitize_value(raw_val)
                    preview_rows.append(mapped_row)

            if preview:
                return {
                    'success': True,
                    'preview': preview_rows,
                    'mapped_columns': mapped_columns,
                    'missing_required': missing_required,
                    'total': total_rows,
                }

            # For actual import, fail if required columns missing
            if missing_required:
                return {
                    'success': False,
                    'error': f"Missing required columns: {', '.join(missing_required)}. Cannot proceed with import.",
                    'mapped_columns': mapped_columns,
                }

            # Process and validate data
            transactions = []
            skipped = 0

            # 💡 NEW HELPER FUNCTION: Robust date parsing
            def safe_date_parse(val, default=None):
                if val is None or pd.isna(val):
                    return default
                try:
                    # dateutil.parser handles a wide variety of formats
                    dt = parser.parse(str(val)) 
                    # Convert to ISO 8601 string for DB storage
                    return dt.isoformat() 
                except (parser.ParserError, TypeError, ValueError):
                    return default
            
            # Helper to convert bool strings ('false', 'true', 'yes', 'no') (Unchanged)
            def to_bool(val):
                if isinstance(val, bool):
                    return val
                if isinstance(val, (int, float)):
                    return bool(val)
                if isinstance(val, str):
                    return val.lower() in ['true', 'yes', '1']
                return False

            # Helper to safely convert to float, avoiding NaN/inf (Unchanged)
            def safe_float(val, default=0.0):
                try:
                    if val is None or pd.isna(val):
                        return default
                    f = float(val)
                    if not (-1e308 < f < 1e308):
                        return default
                    return f
                except (ValueError, TypeError):
                    return default
            
            # --- Main Processing Loop ---
            for index, row in df.iterrows():
                try:
                    def get_val(key):
                        col = mapped_columns.get(key)
                        return row.get(col) if col is not None else None

                    raw_status = get_val('status')
                    status = str(raw_status).lower() if raw_status is not None else ''
                    channel_raw = get_val('channel')
                    channel = str(channel_raw).lower() if channel_raw is not None else ''
                    
                    # 💡 ENHANCED: Use safe_date_parse
                    created_at_str = safe_date_parse(get_val('created_at'), default=datetime.utcnow().isoformat())
                    paid_at_str = safe_date_parse(get_val('paid_at'))

                    tx = {
                        'id': str(uuid.uuid4()),
                        # Basic cleaning and null checks for strings
                        'order_id': str(get_val('order_id')).strip() if get_val('order_id') is not None else None,
                        'user_id': str(get_val('user_id')).strip() if get_val('user_id') is not None else None,
                        'product_id': str(get_val('product_id')).strip() if get_val('product_id') is not None else None,
                        'amount': safe_float(get_val('amount'), 0.0),
                        'currency': str(get_val('currency')).strip().upper() if get_val('currency') is not None else 'USD',
                        'status': status,
                        'channel': channel,
                        'created_at': created_at_str,
                        'paid_at': paid_at_str,
                        'refunded': to_bool(get_val('refunded')),
                        'refund_amount': safe_float(get_val('refund_amount'), 0.0),
                        'region': str(get_val('region')).strip() if get_val('region') is not None else None,
                        'attribution_campaign': str(get_val('attribution_campaign')).strip() if get_val('attribution_campaign') is not None else None,
                    }

                    reason = None # Reset reason for current row

                    # 1. Validate status and channel
                    if tx['status'] not in ['completed', 'pending', 'failed', 'refunded']:
                        reason = f"Invalid status: {tx['status']}"
                    elif tx['channel'] not in ['web', 'mobile', 'api', 'partner']:
                        reason = f"Invalid channel: {tx['channel']}"
                    
                    # 2. Ensure required fields are present and non-null
                    elif not tx['order_id'] or not tx['user_id'] or not tx['product_id'] or not tx['region']:
                        reason = "Missing required identifier (Order ID, User ID, Product ID, or Region)"
                        
                    # 3. Ensure amount is valid
                    elif tx['amount'] < 0:
                        reason = "Amount is negative"

                    if reason:
                        skipped += 1
                        # 💡 NEW: Log and record skipped row details
                        skipped_details.append({
                            'index': index + 2, # +2 to account for 0-index and header row
                            'reason': reason,
                            'order_id': tx['order_id'] or 'N/A'
                        })
                        continue

                    transactions.append(tx)
                except Exception as e:
                    # Catch and report unexpected row-level errors
                    skipped += 1
                    skipped_details.append({
                        'index': index + 2,
                        'reason': f"Unexpected processing error: {str(e)}",
                        'order_id': str(row.get(mapped_columns.get('order_id', 'N/A'), 'N/A'))
                    })
                    logging.warning(f"Error processing row {index + 2}: {e}")
                    continue

            if not transactions:
                return {
                    'success': False,
                    'error': 'No valid transactions found in file',
                    'skipped': skipped,
                    'total': total_rows,
                    'skipped_details': skipped_details # 💡 NEW: Return detailed skips
                }

            logging.info(f"Inserting {len(transactions)} transactions into MongoDB")
            
            # Insert into database
            result = await self.collection.insert_many(transactions)
            
            logging.info(f"Successfully inserted {len(result.inserted_ids)} records")

            return {
                'success': True,
                'imported': len(result.inserted_ids),
                'skipped': skipped,
                'total': total_rows,
                'skipped_details': skipped_details # 💡 NEW: Return detailed skips
            }

        except Exception as e:
            # Catch top-level file reading or structural errors
            error_msg = f'Failed to process file: {str(e)}'
            logging.error(error_msg, exc_info=True) # Use logging for better error handling
            return {
                'success': False,
                'error': 'A critical error occurred during file processing (check file format or encoding).',
                'detail': str(e),
                'total': total_rows,
            }