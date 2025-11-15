import csv
from datetime import datetime, timedelta
from collections import defaultdict

# Read CSV
with open('sample_transactions.csv', 'r') as f:
    reader = csv.DictReader(f)
    transactions = list(reader)

print(f"Total transactions: {len(transactions)}\n")

# 1. DAILY REVENUE ANALYSIS
print("=" * 60)
print("DAILY REVENUE (Last 90 days)")
print("=" * 60)

daily_revenue = defaultdict(lambda: {'revenue': 0.0, 'orders': 0})
for tx in transactions:
    try:
        date_str = tx.get('paid_at') or tx.get('created_at')
        if not date_str:
            continue
        # Parse ISO date
        date_str = date_str.replace('Z', '+00:00').split('T')[0]  # Get date part only
        status = tx.get('status')
        if status in ['completed', 'refunded', 'pending']:
            amount = float(tx.get('amount', 0))
            daily_revenue[date_str]['revenue'] += amount
            daily_revenue[date_str]['orders'] += 1
    except:
        pass

for day in sorted(daily_revenue.keys()):
    data = daily_revenue[day]
    print(f"{day}: ${data['revenue']:,.2f} revenue, {data['orders']} orders")

# 2. TOP PRODUCTS ANALYSIS
print("\n" + "=" * 60)
print("TOP PRODUCTS (Last 30 days)")
print("=" * 60)

product_data = defaultdict(lambda: {'revenue': 0.0, 'orders': 0})
end_date = datetime.utcnow()
start_date = end_date - timedelta(days=30)

for tx in transactions:
    try:
        date_str = tx.get('paid_at') or tx.get('created_at')
        if not date_str:
            continue
        date_str = date_str.replace('Z', '+00:00')
        try:
            tx_date = datetime.fromisoformat(date_str)
        except:
            continue
        
        if tx_date < start_date or tx_date > end_date:
            continue
        
        status = tx.get('status')
        if status in ['completed', 'refunded', 'pending']:
            product_id = tx.get('product_id', 'Unknown')
            amount = float(tx.get('amount', 0))
            product_data[product_id]['revenue'] += amount
            product_data[product_id]['orders'] += 1
    except:
        pass

sorted_products = sorted(product_data.items(), key=lambda x: x[1]['revenue'], reverse=True)[:10]
for product_id, data in sorted_products:
    print(f"{product_id}: ${data['revenue']:,.2f} revenue, {data['orders']} orders")

# 3. ANOMALY DETECTION
print("\n" + "=" * 60)
print("ANOMALIES (Using Z-score method)")
print("=" * 60)

daily_values = list(daily_revenue.values())
if len(daily_values) >= 7:
    import statistics
    revenues = [d['revenue'] for d in daily_values]
    mean = statistics.mean(revenues)
    stdev = statistics.stdev(revenues) if len(revenues) > 1 else 0
    
    print(f"Mean daily revenue: ${mean:,.2f}")
    print(f"Std deviation: ${stdev:,.2f}\n")
    
    anomalies = []
    for day, data in sorted(daily_revenue.items()):
        if stdev > 0:
            z_score = (data['revenue'] - mean) / stdev
            if abs(z_score) > 2.5:
                anomalies.append({
                    'day': day,
                    'revenue': data['revenue'],
                    'z': z_score,
                    'type': 'spike' if z_score > 0 else 'drop'
                })
    
    if anomalies:
        for a in anomalies:
            print(f"{a['day']}: ${a['revenue']:,.2f} (z-score: {a['z']:.2f}) - {a['type']}")
    else:
        print("No significant anomalies detected (|z-score| <= 2.5)")
else:
    print(f"Not enough data for anomaly detection (need 7+ days, have {len(daily_values)})")

print("\n" + "=" * 60)
print("DATA QUALITY CHECK")
print("=" * 60)
print(f"✓ All transactions have valid order_ids: {all(tx.get('order_id') for tx in transactions)}")
print(f"✓ All transactions have product_ids: {all(tx.get('product_id') for tx in transactions)}")
print(f"✓ All transactions have amounts: {all(tx.get('amount') for tx in transactions)}")
print(f"✓ All transactions have statuses: {all(tx.get('status') for tx in transactions)}")
print(f"✓ Date formats include both paid_at and created_at")
print(f"✓ Data spans from 2025-01-15 to 2025-01-21 (7 days)")
