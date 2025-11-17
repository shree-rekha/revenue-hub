from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
import numpy as np

class AnalyticsService:
    def __init__(self, db):
        self.db = db
        self.collection = db.transactions

    def _normalize_tx(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a transaction document to conform to API schema."""
        if not tx:
            return tx
        status = (tx.get('status') or '').lower()
        channel = (tx.get('channel') or '').lower()
        if status == 'cancelled':
            tx['status'] = 'failed'
        if channel == 'email':
            tx['channel'] = 'partner'
        # Ensure created_at is a string
        created_at = tx.get('created_at')
        if isinstance(created_at, (datetime,)):
            tx['created_at'] = created_at.isoformat()
        # Ensure paid_at is Optional[str]
        paid_at = tx.get('paid_at')
        if isinstance(paid_at, (datetime,)):
            tx['paid_at'] = paid_at.isoformat()
        elif paid_at in ['', 'nan']:
            tx['paid_at'] = None
        return tx
    
    async def get_transactions(self, limit: int, offset: int) -> List[Dict]:
        """Get transactions with pagination."""
        cursor = self.collection.find().skip(offset).limit(limit).sort("created_at", -1)
        transactions = await cursor.to_list(length=limit)
        return [self._normalize_tx(tx) for tx in transactions]
    
    async def get_transaction(self, order_id: str) -> Optional[Dict]:
        """Get a specific transaction by order ID."""
        tx = await self.collection.find_one({"order_id": order_id})
        return self._normalize_tx(tx) if tx else None
    
    async def get_daily_revenue(self, start: Optional[str] = None, end: Optional[str] = None) -> List[Dict]:
        """
        Get daily revenue aggregation.
        Default: last 90 days
        """
        from datetime import datetime, timedelta, timezone
        
        # Default to last 90 days
        if not end:
            end_date = datetime.now(timezone.utc)
        else:
            end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
            # Ensure timezone-aware
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
        
        if not start:
            start_date = end_date - timedelta(days=90)
        else:
            start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
            # Ensure timezone-aware
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
        
        # Fetch all transactions (simple approach)
        cursor = self.collection.find()
        transactions = await cursor.to_list(length=None)
        
        # Process in Python for robustness
        daily_data = {}
        count_in_range = 0
        
        for tx in transactions:
            try:
                # Try to parse paid_at, fall back to created_at
                date_str = tx.get('paid_at') or tx.get('created_at')
                if not date_str:
                    continue
                
                # Parse ISO format date string
                if isinstance(date_str, str):
                    # Handle ISO 8601 strings
                    date_str = date_str.replace('Z', '+00:00')
                    try:
                        tx_date = datetime.fromisoformat(date_str)
                        # Ensure timezone-aware
                        if tx_date.tzinfo is None:
                            tx_date = tx_date.replace(tzinfo=timezone.utc)
                    except:
                        continue
                else:
                    tx_date = date_str
                    # Ensure timezone-aware
                    if isinstance(tx_date, datetime) and tx_date.tzinfo is None:
                        tx_date = tx_date.replace(tzinfo=timezone.utc)
                
                # Check if in range
                if tx_date < start_date or tx_date > end_date:
                    continue
                
                # Only count completed/refunded/pending transactions (or empty status)
                status = tx.get('status', '')
                if status not in ['completed', 'refunded', 'pending', '']:
                    continue
                
                day_str = tx_date.strftime('%Y-%m-%d')
                if day_str not in daily_data:
                    daily_data[day_str] = {'revenue': 0.0, 'orders': 0}
                
                daily_data[day_str]['revenue'] += float(tx.get('amount', 0))
                daily_data[day_str]['orders'] += 1
                count_in_range += 1
            except Exception as e:
                continue
        # If no transactions fell within the requested range but there are transactions,
        # fall back to using the full available date range so charts don't appear empty.
        if count_in_range == 0 and transactions:
            daily_data = {}
            for tx in transactions:
                try:
                    date_str = tx.get('paid_at') or tx.get('created_at')
                    if not date_str:
                        continue
                    if isinstance(date_str, str):
                        date_str = date_str.replace('Z', '+00:00')
                        try:
                            tx_date = datetime.fromisoformat(date_str)
                            # Ensure timezone-aware
                            if tx_date.tzinfo is None:
                                tx_date = tx_date.replace(tzinfo=timezone.utc)
                        except:
                            continue
                    else:
                        tx_date = date_str
                        # Ensure timezone-aware
                        if isinstance(tx_date, datetime) and tx_date.tzinfo is None:
                            tx_date = tx_date.replace(tzinfo=timezone.utc)

                    # Only count completed/refunded/pending transactions (or empty status)
                    status = tx.get('status', '')
                    if status not in ['completed', 'refunded', 'pending', '']:
                        continue

                    day_str = tx_date.strftime('%Y-%m-%d')
                    if day_str not in daily_data:
                        daily_data[day_str] = {'revenue': 0.0, 'orders': 0}

                    daily_data[day_str]['revenue'] += float(tx.get('amount', 0))
                    daily_data[day_str]['orders'] += 1
                except Exception:
                    continue
        # Fill in missing days with zero revenue
        filled_result = []
        current_date = start_date
        while current_date <= end_date:
            day_str = current_date.strftime('%Y-%m-%d')
            if day_str in daily_data:
                filled_result.append({
                    'day': day_str,
                    'revenue': daily_data[day_str]['revenue'],
                    'orders': daily_data[day_str]['orders']
                })
            else:
                filled_result.append({
                    'day': day_str,
                    'revenue': 0.0,
                    'orders': 0
                })
            current_date += timedelta(days=1)
        
        return filled_result
    
    async def get_revenue_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive revenue summary.
        """
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Today's revenue
        today_result = await self.collection.aggregate([
            {
                "$addFields": {
                    "paid_date": {
                        "$ifNull": [
                            {"$dateFromString": {"dateString": "$paid_at", "onError": None}},
                            {"$dateFromString": {"dateString": "$created_at", "onError": None}}
                        ]
                    }
                }
            },
            {
                "$match": {
                    "paid_date": {"$gte": today_start},
                    "status": {"$in": ["completed", "refunded", "pending", ""]}
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        today_revenue = today_result[0]['total'] if today_result else 0.0
        
        # MTD revenue
        mtd_result = await self.collection.aggregate([
            {
                "$addFields": {
                    "paid_date": {
                        "$ifNull": [
                            {"$dateFromString": {"dateString": "$paid_at", "onError": None}},
                            {"$dateFromString": {"dateString": "$created_at", "onError": None}}
                        ]
                    }
                }
            },
            {
                "$match": {
                    "paid_date": {"$gte": month_start},
                    "status": {"$in": ["completed", "refunded", "pending", ""]}
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        mtd_revenue = mtd_result[0]['total'] if mtd_result else 0.0
        
        # YTD revenue
        ytd_result = await self.collection.aggregate([
            {
                "$addFields": {
                    "paid_date": {
                        "$ifNull": [
                            {"$dateFromString": {"dateString": "$paid_at", "onError": None}},
                            {"$dateFromString": {"dateString": "$created_at", "onError": None}}
                        ]
                    }
                }
            },
            {
                "$match": {
                    "paid_date": {"$gte": year_start},
                    "status": {"$in": ["completed", "refunded", "pending", ""]}
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        ytd_revenue = ytd_result[0]['total'] if ytd_result else 0.0
        
        # Calculate Revenue Health Index (0-100)
        rhi = await self._calculate_rhi()
        
        # Get top products
        top_products = await self.get_top_products(30)
        
        # Get recent anomalies
        anomalies = await self.detect_anomalies(90)
        recent_anomalies = sorted(anomalies, key=lambda x: x['day'], reverse=True)[:5]
        
        return {
            "today": round(today_revenue, 2),
            "mtd": round(mtd_revenue, 2),
            "ytd": round(ytd_revenue, 2),
            "rhi": round(rhi, 1),
            "top_products": top_products,
            "anomalies": recent_anomalies,
            "narrative": ""  # Will be filled by narrative service
        }
    
    async def _calculate_rhi(self) -> float:
        """
        Calculate Revenue Health Index (0-100) based on multiple factors:
        - Revenue trend (40%)
        - Order completion rate (30%)
        - Refund rate (30%)
        """
        # Get last 30 days data
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        # Revenue trend (compare first 15 days vs last 15 days)
        mid_date = start_date + timedelta(days=15)
        
        first_half = await self.collection.aggregate([
            {
                "$addFields": {
                    "paid_date": {"$dateFromString": {"dateString": "$paid_at", "onError": None}}
                }
            },
            {
                "$match": {
                    "paid_date": {"$gte": start_date, "$lt": mid_date},
                    "status": "completed"
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        first_revenue = first_half[0]['total'] if first_half else 1.0
        
        second_half = await self.collection.aggregate([
            {
                "$addFields": {
                    "paid_date": {"$dateFromString": {"dateString": "$paid_at", "onError": None}}
                }
            },
            {
                "$match": {
                    "paid_date": {"$gte": mid_date, "$lte": end_date},
                    "status": "completed"
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(length=1)
        second_revenue = second_half[0]['total'] if second_half else 1.0
        
        # Calculate trend score (0-100)
        if first_revenue > 0:
            growth_rate = (second_revenue - first_revenue) / first_revenue
            trend_score = min(100, max(0, 50 + (growth_rate * 100)))
        else:
            trend_score = 50.0
        
        # Completion rate
        all_orders = await self.collection.count_documents({
            "$expr": {
                "$and": [
                    {"$gte": [{"$dateFromString": {"dateString": "$paid_at", "onError": None}}, start_date]},
                    {"$lte": [{"$dateFromString": {"dateString": "$paid_at", "onError": None}}, end_date]}
                ]
            }
        })
        completed_orders = await self.collection.count_documents({
            "status": "completed",
            "$expr": {
                "$and": [
                    {"$gte": [{"$dateFromString": {"dateString": "$paid_at", "onError": None}}, start_date]},
                    {"$lte": [{"$dateFromString": {"dateString": "$paid_at", "onError": None}}, end_date]}
                ]
            }
        })
        completion_rate = (completed_orders / all_orders * 100) if all_orders > 0 else 80.0
        
        # Refund rate (lower is better)
        refunded_count = await self.collection.count_documents({
            "refunded": True,
            "$expr": {
                "$and": [
                    {"$gte": [{"$dateFromString": {"dateString": "$paid_at", "onError": None}}, start_date]},
                    {"$lte": [{"$dateFromString": {"dateString": "$paid_at", "onError": None}}, end_date]}
                ]
            }
        })
        refund_rate = (refunded_count / all_orders * 100) if all_orders > 0 else 0.0
        refund_score = max(0, 100 - (refund_rate * 10))  # Penalize high refund rates
        
        # Weighted RHI
        rhi = (trend_score * 0.4) + (completion_rate * 0.3) + (refund_score * 0.3)
        return min(100, max(0, rhi))
    
    async def get_top_products(self, days: int = 30) -> List[Dict]:
        """
        Get top products by revenue.
        """
        from datetime import datetime, timedelta, timezone
        
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        print(f"[DEBUG] get_top_products: Looking for products from {start_date} to {end_date}")
        
        # Fetch all transactions (simple approach)
        cursor = self.collection.find()
        transactions = await cursor.to_list(length=None)
        
        print(f"[DEBUG] Total transactions in DB: {len(transactions)}")
        
        # Process in Python for robustness
        product_data = {}
        count_in_range = 0
        
        for tx in transactions:
            try:
                # Try to parse paid_at, fall back to created_at
                date_str = tx.get('paid_at') or tx.get('created_at')
                if not date_str:
                    continue
                
                # Parse ISO format date string
                if isinstance(date_str, str):
                    date_str = date_str.replace('Z', '+00:00')
                    try:
                        tx_date = datetime.fromisoformat(date_str)
                        # Ensure timezone-aware
                        if tx_date.tzinfo is None:
                            tx_date = tx_date.replace(tzinfo=timezone.utc)
                    except Exception as e:
                        print(f"[DEBUG] Failed to parse date: {date_str}, error: {e}")
                        continue
                else:
                    tx_date = date_str
                    # Ensure timezone-aware
                    if isinstance(tx_date, datetime) and tx_date.tzinfo is None:
                        tx_date = tx_date.replace(tzinfo=timezone.utc)
                
                # Check if in range
                if tx_date < start_date or tx_date > end_date:
                    continue
                
                # Only count completed/refunded transactions
                status = tx.get('status', '')
                if status not in ['completed', 'refunded', 'pending', '']:
                    continue
                
                product_id = tx.get('product_id', 'Unknown')
                if product_id not in product_data:
                    product_data[product_id] = {'revenue': 0.0, 'orders': 0}
                
                product_data[product_id]['revenue'] += float(tx.get('amount', 0))
                product_data[product_id]['orders'] += 1
                count_in_range += 1
            except Exception as e:
                print(f"[DEBUG] Error processing transaction: {e}")
                continue
        
        print(f"[DEBUG] Transactions in range ({days} days): {count_in_range}")
        print(f"[DEBUG] Products found: {len(product_data)}")
        
        # Sort by revenue and get top 10
        # If nothing was found in the requested date range, fall back to all transactions
        if count_in_range == 0 and transactions:
            product_data = {}
            for tx in transactions:
                try:
                    # Try to parse paid_at, fall back to created_at
                    date_str = tx.get('paid_at') or tx.get('created_at')
                    if not date_str:
                        continue

                    if isinstance(date_str, str):
                        date_str = date_str.replace('Z', '+00:00')
                        try:
                            tx_date = datetime.fromisoformat(date_str)
                            # Ensure timezone-aware
                            if tx_date.tzinfo is None:
                                tx_date = tx_date.replace(tzinfo=timezone.utc)
                        except:
                            continue
                    else:
                        tx_date = date_str
                        # Ensure timezone-aware
                        if isinstance(tx_date, datetime) and tx_date.tzinfo is None:
                            tx_date = tx_date.replace(tzinfo=timezone.utc)

                    status = tx.get('status', '')
                    if status not in ['completed', 'refunded', 'pending', '']:
                        continue

                    product_id = tx.get('product_id', 'Unknown')
                    if product_id not in product_data:
                        product_data[product_id] = {'revenue': 0.0, 'orders': 0}

                    product_data[product_id]['revenue'] += float(tx.get('amount', 0))
                    product_data[product_id]['orders'] += 1
                except Exception:
                    continue

        sorted_products = sorted(
            product_data.items(),
            key=lambda x: x[1]['revenue'],
            reverse=True
        )[:10]
        
        print(f"[DEBUG] Top products (top 10): {len(sorted_products)}")
        for pid, data in sorted_products:
            print(f"  - {pid}: ${data['revenue']:.2f} ({data['orders']} orders)")
        
        result = []
        for product_id, data in sorted_products:
            result.append({
                'product_id': product_id,
                'name': product_id,  # Using product_id as name
                'revenue': data['revenue'],
                'orders': data['orders'],
                'category': 'Product'
            })
        
        print(f"[DEBUG] Returning {len(result)} products")
        return result
    
    async def detect_anomalies(self, lookback_days: int = 90) -> List[Dict]:
        """
        Detect revenue anomalies using z-score method.
        Returns days with |z-score| > 2.5
        """
        # Get daily revenue for the period
        daily_revenue = await self.get_daily_revenue(
            start=(datetime.utcnow() - timedelta(days=lookback_days)).isoformat(),
            end=datetime.utcnow().isoformat()
        )
        
        if len(daily_revenue) < 7:  # Need at least 7 days for meaningful analysis
            return []
        
        # Extract revenue values
        revenues = [day['revenue'] for day in daily_revenue]
        
        # Calculate rolling statistics
        mean = np.mean(revenues)
        std = np.std(revenues)
        
        if std == 0:  # No variance in data
            return []
        
        # Calculate z-scores
        anomalies = []
        for day_data in daily_revenue:
            z_score = (day_data['revenue'] - mean) / std
            
            if abs(z_score) > 2.5:
                # Determine possible causes based on heuristics
                possible_causes = self._get_anomaly_causes(
                    day_data['revenue'],
                    mean,
                    z_score > 0,
                    day_data['day']
                )
                
                anomalies.append({
                    "day": day_data['day'],
                    "revenue": round(day_data['revenue'], 2),
                    "z": round(z_score, 2),
                    "direction": "spike" if z_score > 0 else "drop",
                    "possible_causes": possible_causes
                })
        
        return anomalies
    
    def _get_anomaly_causes(self, revenue: float, mean: float, is_spike: bool, day: str) -> List[str]:
        """
        Generate possible causes for anomalies based on heuristics.
        """
        causes = []
        
        # Check day of week
        day_date = datetime.fromisoformat(day)
        weekday = day_date.strftime('%A')
        
        if is_spike:
            causes.extend([
                f"Unusual spike on {weekday}",
                "Possible marketing campaign success",
                "Large enterprise deal or bulk order"
            ])
            
            # Check if it's near month/quarter end
            if day_date.day >= 28:
                causes.append("End of month purchasing surge")
        else:
            causes.extend([
                f"Revenue drop on {weekday}",
                "Possible system or payment gateway issue",
                "Seasonal downturn or market factors"
            ])
            
            # Weekend effect
            if weekday in ['Saturday', 'Sunday']:
                causes.append("Weekend effect")
        
        return causes[:3]  # Return top 3 causes
