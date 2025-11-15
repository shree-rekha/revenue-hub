# Revenue Pulse - System Status

**Last Updated:** Current Session  
**Status:** ✅ READY FOR USE

---

## What You Have

A complete, production-ready revenue analytics system with:

### ✅ Backend (FastAPI + MongoDB)
- **REST API** with 8 endpoints (ready to use)
- **CSV Import** service with flexible column mapping
- **Analytics** engine (revenue trends, top products, anomalies)
- **Data Export** capability
- **Debug endpoint** for diagnostics
- **Auto-scaled analysis** - works with any dataset size

### ✅ Frontend (React + Vite)
- **3 Analytics Pages** (Timeline, Products, Anomalies)
- **CSV Import UI** on Overview page
- **Real-time Data** using React Query
- **Interactive Charts** using Recharts
- **Professional UI** with Tailwind + Radix components
- **Responsive Design** for all screen sizes

### ✅ Database (MongoDB)
- Cloud or local MongoDB compatible
- Configured for async operations
- Ready to store imported transaction data

---

## How to Use

### 1. Start Services

**Backend (from `backend/` folder):**
```bash
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (from `frontend/` folder):**
```bash
npm run dev
```
or
```bash
bun run dev
```

### 2. Import Your Data

1. Open frontend → **Overview page**
2. Click **"Import CSV"** button
3. Select your CSV file
4. Review column mapping
5. Click **"Import"**

✅ Data is now in MongoDB

### 3. View Analytics

**Timeline** - Revenue trends over time
- Daily revenue, 7-day & 30-day moving averages
- Anomalies marked in red

**Products** - Top performing products
- Top 10 by revenue (last 30 days)
- Summary cards: Total Revenue, Orders, Products

**Anomalies** - Unusual revenue patterns
- Statistical detection (z-score > 2.5)
- Requires 7+ days of data
- Shows spikes and drops with possible causes

---

## CSV Requirements

**Required Columns:**
- `order_id` - Unique order identifier
- `user_id` - Customer identifier  
- `product_id` - Product identifier
- `amount` - Transaction amount (numeric)
- `status` - One of: completed, pending, failed, refunded
- `channel` - One of: web, mobile, api, partner
- `region` - Geographic region
- `paid_at` - Payment date (ISO 8601: YYYY-MM-DDTHH:MM:SSZ)

**Optional Columns:**
- `currency` - Default: USD
- `created_at` - Creation date (auto-generated if missing)
- `refunded` - Boolean, default: false
- `refund_amount` - Numeric, default: 0
- `attribution_campaign` - Marketing campaign name

**Important:** Dates must use ISO 8601 format with timezone (Z suffix required):
- ✅ Correct: `2025-01-15T10:30:00Z`
- ❌ Wrong: `1/15/2025` or `01-15-2025`

---

## Key Features

### Smart Column Mapping
- Auto-detects columns (case-insensitive)
- Accepts synonyms: "order_id", "order id", "orderid"
- Shows preview before import
- Skips invalid rows with detailed error reporting

### Analytics Features
- **Daily Revenue** - 90-day trailing window
- **Top Products** - 30-day analysis window
- **Anomaly Detection** - Z-score based (2.5σ threshold)
- **Fallback Logic** - Uses all available data if range is empty

### Data Quality
- Validates all transaction fields
- Handles NaN/infinity safely
- Logs import statistics
- Checks data type consistency

---

## Debug Endpoint

Check database status:
```
GET http://localhost:8000/api/v1/debug/data-count
```

Response:
```json
{
  "transaction_count": 42,
  "has_data": true,
  "sample_transaction": {...}
}
```

Use this if:
- CSV import seems to fail
- Pages show empty after import
- Need to verify data was stored

---

## What If Pages Are Empty?

**Likely Causes:**

1. **No CSV imported yet**
   - Go to Overview page
   - Click "Import CSV"
   - Select your file and import

2. **Import failed silently**
   - Check browser console for errors
   - Check backend logs
   - Use debug endpoint to verify: `GET /api/v1/debug/data-count`

3. **Data is outside time windows**
   - Timeline shows last 90 days
   - Products shows last 30 days
   - Import more recent data

4. **Anomalies page shows "No Anomalies"**
   - Need at least 7 days of data
   - Normal if revenue is stable
   - Detected if |z-score| > 2.5 for any day

---

## Architecture

```
CSV File
   ↓
Frontend Import UI (Overview)
   ↓
POST /api/v1/transactions/import
   ↓
ImportService (validate → map → transform)
   ↓
MongoDB transactions collection
   ↓
AnalyticsService (Python processing)
   ↓
GET /api/v1/insights/revenue/daily
GET /api/v1/insights/revenue/by-product
GET /api/v1/insights/anomalies
   ↓
Frontend useQuery hooks re-fetch
   ↓
Timeline/Products/Anomalies render
```

---

## REST API Reference

### Debug
- `GET /api/v1/debug/data-count` - Check DB status

### Import
- `POST /api/v1/transactions/import` - Import CSV/Excel

### Analytics
- `GET /api/v1/insights/revenue/daily` - Daily revenue (90 days)
- `GET /api/v1/insights/revenue/by-product` - Top products (30 days)
- `GET /api/v1/insights/anomalies` - Anomalies (90 days)
- `GET /api/v1/insights/revenue/summary` - Complete summary with narrative
- `GET /api/v1/insights/narrative` - AI-generated insight narrative

### Export
- `GET /api/v1/export/csv` - Download transactions as CSV

---

## Sample Data

Use the included `sample_transactions.csv` to test:
1. Import via Overview CSV Import button
2. View Timeline to see daily revenue
3. View Products to see top sellers
4. View Anomalies if 7+ days available

---

## Technology Stack

**Backend:**
- FastAPI (lightweight, async REST API)
- Motor (async MongoDB driver)
- Pandas (data analysis)
- NumPy (statistical functions)

**Frontend:**
- React 18 + TypeScript
- Vite (fast build tool)
- TanStack React Query (data fetching/caching)
- Tailwind CSS (styling)
- Radix UI (accessible components)
- Recharts (interactive charts)

**Database:**
- MongoDB (flexible document store)

---

## Next Steps

1. ✅ Ensure backend is running: `python -m uvicorn server:app --reload`
2. ✅ Ensure frontend is running: `npm run dev`
3. 📍 Import your CSV via Overview page
4. 📍 Wait for import to complete
5. 📍 Navigate to Timeline to see results
6. 📍 Check Products and Anomalies pages

If any step fails, use the debug endpoint to verify data was stored.

---

**System:** Ready to analyze your transaction data  
**Wait For:** User CSV import to populate MongoDB  
**Result:** Real-time analytics across Timeline, Products, and Anomalies pages
