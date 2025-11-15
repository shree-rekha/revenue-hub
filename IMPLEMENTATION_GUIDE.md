# Revenue Pulse - Complete Implementation Guide

## System Overview

You have a **fully functional, production-ready revenue analytics system**. All components are integrated and working correctly.

### What's Implemented ✅

| Component | Status | Details |
|-----------|--------|---------|
| **Backend REST API** | ✅ Ready | 8 endpoints, async MongoDB, FastAPI |
| **CSV Import Service** | ✅ Ready | Flexible column mapping, validation, error handling |
| **Analytics Engine** | ✅ Ready | Revenue trends, product ranking, anomaly detection |
| **Frontend Pages** | ✅ Ready | Timeline, Products, Anomalies with charts |
| **Database Schema** | ✅ Ready | MongoDB transactions collection with indexing |
| **React Query Integration** | ✅ Ready | Data fetching, caching, auto-refresh |
| **Error Handling** | ✅ Ready | User-friendly messages and debug endpoints |

---

## Quick Start (3 Steps)

### Step 1: Start Backend
```bash
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE vX.X.X  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Import CSV Data
1. Open http://localhost:5173 in browser
2. Navigate to **Overview** page
3. Click **"Import CSV"** button
4. Select `sample_transactions.csv` (or your CSV)
5. Review column mapping
6. Click **"Import"**
7. See success message with record count

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ USER CSV FILE (sample_transactions.csv)                     │
│ Columns: order_id, product_id, amount, status, region, ... │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Overview Page                                     │
│ - CSVImport component                                       │
│ - File upload button                                        │
│ - Column mapping preview                                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (FormData with file)
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: POST /api/v1/transactions/import                  │
│ - ImportService receives file                              │
│ - Parses CSV/Excel                                         │
│ - Maps columns flexibly (order_id, order id, etc.)         │
│ - Validates data types and ranges                          │
│ - Transforms to Transaction objects                        │
│ - Skips invalid rows with errors                           │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE: MongoDB transactions collection                   │
│ Stores documents with:                                      │
│ - order_id, user_id, product_id, amount                    │
│ - status (completed/pending/failed/refunded)               │
│ - paid_at (ISO 8601 timestamp)                            │
│ - region, channel, attribution_campaign                    │
│ Total: N documents indexed by paid_at and product_id       │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴────────┬──────────────┬──────────────┐
         │                │              │              │
         ▼                ▼              ▼              ▼
    Timeline         Products        Anomalies      Summary
    Page             Page            Page            Page
    
    ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ useQuery    │  │useQuery  │  │useQuery  │  │useQuery  │
    │key:         │  │key:      │  │key:      │  │key:      │
    │'daily-rev'  │  │'top-prod'│  │'anomalies'  │'summary' │
    └─────────────┘  └──────────┘  └──────────┘  └──────────┘
         │                │              │              │
         ▼                ▼              ▼              ▼
    GET /api/v1/    GET /api/v1/   GET /api/v1/  GET /api/v1/
    insights/       insights/      insights/    insights/
    revenue/daily   revenue/by-    anomalies    revenue/
    (90 days)       product        (90 days)    summary
    
         │                │              │              │
         ▼                ▼              ▼              ▼
    ┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────┐
    │AnalyticsServ │ │Analytics │ │Analytics    │ │Analytics │
    │ get_daily_   │ │ get_top_ │ │detect_      │ │get_      │
    │ revenue()    │ │products()│ │anomalies()  │ │revenue_  │
    │              │ │          │ │             │ │summary() │
    │ Groups by    │ │Groups by │ │Z-score calc │ │Multi-    │
    │ day (90 days)│ │product   │ │Flags |z|>2.5│ │metric    │
    │ Fills gaps   │ │(30 days) │ │Requires 7+  │ │summary   │
    │ Calculates   │ │Returns   │ │days of data │ │All KPIs  │
    │ totals       │ │top 10    │ │             │ │          │
    └──────────────┘ └──────────┘ └─────────────┘ └──────────┘
         │                │              │              │
         ▼                ▼              ▼              ▼
    ┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────┐
    │LineChart     │ │HorizontalBarChart       │ │Summary   │
    │ X: dates     │ │ X: product              │ │cards     │
    │ Y: revenue   │ │ Y: revenue              │ │& list    │
    │ Lines: 3     │ │ Ranked descending       │ │          │
    │  -actual     │ │ Top 10 shown            │ │Shows     │
    │  -7d MA      │ │                         │ │possible  │
    │  -30d MA     │ │Summary cards:           │ │causes    │
    │ Anomalies    │ │ -Total Revenue          │ │(weather, │
    │ marked red   │ │ -Total Orders           │ │seasonal, │
    │              │ │ -Product Count (SKU)    │ │etc)      │
    └──────────────┘ └──────────┘ └─────────────┘ └──────────┘
         │                │              │              │
         └───────────────┬┴──────────────┴──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │RENDERED HTML │
                  │User sees:    │
                  │- Charts      │
                  │- Cards       │
                  │- Lists       │
                  │- Real data   │
                  └──────────────┘
```

---

## CSV Import Process

### 1. File Upload
- User selects `.csv`, `.xlsx`, or `.xls` file
- Frontend sends as `multipart/form-data`
- Backend receives via `UploadFile` parameter

### 2. Column Mapping
Backend auto-detects columns (case-insensitive, fuzzy matching):
- `order_id` → recognized as "order_id", "order id", "orderid"
- `user_id` → recognized as "user_id", "user id", etc.
- `product_id` → similar mapping
- Works with various column name formats

### 3. Data Validation
Each transaction must have:
- ✓ Required fields: order_id, user_id, product_id, amount, status, channel, region, paid_at
- ✓ Valid status: `completed`, `pending`, `failed`, or `refunded`
- ✓ Valid channel: `web`, `mobile`, `api`, or `partner`
- ✓ Valid amount: positive numeric value
- ✓ Valid date: ISO 8601 format with timezone (YYYY-MM-DDTHH:MM:SSZ)

### 4. Error Handling
- Invalid rows are skipped (not inserted)
- Error details logged and returned to user
- User sees count of: imported, skipped, errors
- Example: "Imported 1042 / 1050 records (8 errors)"

### 5. Database Storage
- Valid transactions inserted into `db.transactions` collection
- Automatic indexing on: `paid_at`, `product_id`, `region`
- Documents stored with all fields (required + optional)
- Ready for immediate analytics processing

---

## Analytics Services

### Daily Revenue (Timeline Page)
**Endpoint:** `GET /api/v1/insights/revenue/daily`

**What it does:**
- Fetches all transactions from MongoDB
- Filters by date range (default: last 90 days)
- Groups by calendar date (ISO date, YYYY-MM-DD)
- Sums revenue per day
- **Fallback:** If no data in 90-day range, uses all available data

**Output:**
```json
[
  {
    "day": "2025-01-15",
    "revenue": 12450.50,
    "orders": 23
  },
  {
    "day": "2025-01-16",
    "revenue": 14200.00,
    "orders": 31
  }
]
```

**Processing:**
1. Retrieve transactions: `db.transactions.find({})`
2. Convert `paid_at` to date only (YYYY-MM-DD)
3. Group by date, sum amounts
4. Fill missing dates with revenue=0
5. Sort chronologically

### Top Products (Products Page)
**Endpoint:** `GET /api/v1/insights/revenue/by-product?days=30`

**What it does:**
- Fetches transactions from last N days (default: 30)
- Groups by `product_id`
- Ranks by total revenue (descending)
- Returns top 10 products
- **Fallback:** If no products in 30 days, uses all available

**Output:**
```json
[
  {
    "product_id": "PRO-001",
    "name": "Premium Widget",
    "revenue": 125000.00,
    "orders": 250,
    "category": "electronics"
  },
  {
    "product_id": "PRO-002",
    "name": "Standard Widget",
    "revenue": 98500.00,
    "orders": 180,
    "category": "electronics"
  }
]
```

**Processing:**
1. Retrieve transactions from last 30 days
2. Group by product_id
3. Sum revenue and count orders per product
4. Sort by revenue descending
5. Return top 10

### Anomaly Detection (Anomalies Page)
**Endpoint:** `GET /api/v1/insights/anomalies?lookback_days=90`

**What it does:**
- Requires minimum 7 days of data for statistical validity
- Calculates daily revenue (using get_daily_revenue)
- Computes mean and standard deviation
- Calculates z-score for each day: `z = (revenue - mean) / std_dev`
- Flags anomalies where `|z| > 2.5` (2.5 sigma threshold)
- Classifies as `spike` (positive z) or `drop` (negative z)

**Output:**
```json
[
  {
    "day": "2025-01-20",
    "revenue": 35000.00,
    "z_score": 3.2,
    "direction": "spike",
    "possible_causes": [
      "seasonal_event",
      "marketing_campaign",
      "product_launch"
    ]
  },
  {
    "day": "2025-01-05",
    "revenue": 2000.00,
    "z_score": -2.8,
    "direction": "drop",
    "possible_causes": [
      "weekend",
      "holiday",
      "system_outage"
    ]
  }
]
```

**Processing:**
1. Get daily revenue for last 90 days
2. If < 7 days available, return empty array
3. Calculate mean(revenue) and std_dev(revenue)
4. For each day, compute z-score
5. If |z| > 2.5, add to results
6. Classify as spike (z>0) or drop (z<0)
7. Suggest possible causes

**Z-Score Interpretation:**
- `|z| < 1.0`: Normal variation
- `1.0 ≤ |z| < 2.5`: Unusual but not flagged
- `|z| ≥ 2.5`: Anomaly detected ⚠️

---

## Frontend Integration

### React Query Setup

**Timeline Component:**
```typescript
const { data: dailyRevenue } = useQuery({
  queryKey: ['daily-revenue'],
  queryFn: () => apiClient.getDailyRevenue(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

const { data: anomalies } = useQuery({
  queryKey: ['anomalies'],
  queryFn: () => apiClient.getAnomalies(90),
  staleTime: 5 * 60 * 1000,
});
```

**Products Component:**
```typescript
const { data: topProducts } = useQuery({
  queryKey: ['top-products'],
  queryFn: () => apiClient.getTopProducts(30),
  staleTime: 5 * 60 * 1000,
});
```

**Anomalies Component:**
```typescript
const { data: anomalies } = useQuery({
  queryKey: ['anomalies'],
  queryFn: () => apiClient.getAnomalies(90),
  staleTime: 5 * 60 * 1000,
});
```

### CSV Import Mutation

```typescript
const importMutation = useMutation({
  mutationFn: (file: File) => apiClient.importCSV(file),
  onSuccess: () => {
    // Invalidate all affected queries
    queryClient.invalidateQueries({ queryKey: ['daily-revenue'] });
    queryClient.invalidateQueries({ queryKey: ['top-products'] });
    queryClient.invalidateQueries({ queryKey: ['anomalies'] });
    // UI automatically re-fetches and re-renders
  },
});
```

---

## API Endpoints Reference

### Debug & Health
```
GET /api/v1/
  Response: {"message": "Revenue Analytics API", "version": "1.0.0"}

GET /api/v1/debug/data-count
  Response: {
    "transaction_count": 1042,
    "has_data": true,
    "sample_transaction": {...}
  }
```

### Import
```
POST /api/v1/transactions/import
  Headers: Content-Type: multipart/form-data
  Body: file (CSV/Excel)
  Response: {"message": "...", "imported": 1042, "skipped": 8}

GET /api/v1/transactions/import?preview=true
  (Same as above but doesn't insert to DB)
```

### Analytics
```
GET /api/v1/insights/revenue/daily[?start=...&end=...]
  Response: [{day, revenue, orders}, ...]

GET /api/v1/insights/revenue/by-product[?days=30]
  Response: [{product_id, name, revenue, orders, category}, ...]

GET /api/v1/insights/anomalies[?lookback_days=90]
  Response: [{day, revenue, z_score, direction, possible_causes}, ...]

GET /api/v1/insights/revenue/summary
  Response: {today, mtd, ytd, rhi, top_products, anomalies, narrative}

GET /api/v1/insights/narrative[?start=...&end=...]
  Response: {"narrative": "AI-generated text summary..."}
```

### Export
```
GET /api/v1/export/csv[?limit=5000]
  Response: File download (transactions.csv)
```

---

## CSV Format Guide

### Required Columns (Always Include)

```csv
order_id,user_id,product_id,amount,status,channel,region,paid_at
ORD-001,USR-100,PRO-A,199.99,completed,web,US,2025-01-15T10:30:00Z
ORD-002,USR-101,PRO-B,299.99,completed,mobile,EU,2025-01-15T11:45:00Z
ORD-003,USR-102,PRO-A,199.99,failed,api,APAC,2025-01-15T12:00:00Z
```

### Optional Columns (Can Include)

```csv
order_id,...,currency,created_at,refunded,refund_amount,attribution_campaign
ORD-001,...,USD,2025-01-15T10:00:00Z,false,0.0,campaign-1
ORD-002,...,EUR,2025-01-15T11:00:00Z,false,0.0,campaign-2
ORD-003,...,USD,2025-01-15T11:30:00Z,true,199.99,organic
```

### Data Validation Rules

| Field | Valid Values | Example | Notes |
|-------|--------------|---------|-------|
| `order_id` | Any string | ORD-001 | Must be unique |
| `user_id` | Any string | USR-100 | Can repeat (multiple orders) |
| `product_id` | Any string | PRO-A | Groups for top products |
| `amount` | Positive number | 199.99 | Must be > 0 |
| `currency` | ISO 4217 | USD, EUR | Default: USD if omitted |
| `status` | completed, pending, failed, refunded | completed | Must match exactly |
| `channel` | web, mobile, api, partner | web | Must match exactly |
| `region` | Any string | US, EU, APAC | Used for filtering |
| `paid_at` | ISO 8601 with Z | 2025-01-15T10:30:00Z | REQUIRED timezone |
| `created_at` | ISO 8601 with Z | 2025-01-15T10:00:00Z | Auto-generated if missing |
| `refunded` | true, false | true | Default: false if omitted |
| `refund_amount` | Non-negative number | 199.99 | Default: 0 if omitted |
| `attribution_campaign` | Any string | campaign-1 | Optional, for marketing analysis |

### Date Format (CRITICAL ⚠️)

**✅ CORRECT:**
```
2025-01-15T10:30:00Z
2024-12-25T23:59:59Z
2025-06-15T12:00:00Z
```

**❌ WRONG:**
```
1/15/2025
01-15-2025
2025-01-15
2025-01-15 10:30:00
2025-01-15T10:30:00    (missing Z)
```

---

## Troubleshooting Guide

### Issue: "Cannot connect to backend"

**Check:**
1. Backend is running: `python -m uvicorn server:app --reload`
2. Port 8000 is accessible: `http://localhost:8000/api/v1/`
3. MongoDB connection: Check `.env` file for `MONGO_URL`
4. Network: Frontend and backend on same machine or network

**Debug:**
```bash
# Test backend health
curl http://localhost:8000/api/v1/
# Should return: {"message": "Revenue Analytics API", "version": "1.0.0"}
```

### Issue: "CSV import appears to fail silently"

**Check Database:**
```
GET http://localhost:8000/api/v1/debug/data-count
```

**If transaction_count = 0:**
- Import never executed
- Check browser console for errors
- Check backend logs for error messages
- Verify CSV format (especially date format: YYYY-MM-DDTHH:MM:SSZ)

**If transaction_count > 0:**
- Data is in DB
- Issue is on frontend side
- Navigate to Timeline page
- Check browser console for React Query errors

### Issue: Timeline page shows empty after import

**Likely Cause 1: No valid transactions**
```
GET http://localhost:8000/api/v1/debug/data-count
```
Check `transaction_count` value. If 0, import failed.

**Likely Cause 2: Dates are outside 90-day window**
- Timeline shows last 90 days only
- If all transactions are >90 days old, nothing shows
- Import more recent data

**Likely Cause 3: Invalid status or channel values**
- Status must be: `completed`, `pending`, `failed`, `refunded`
- Channel must be: `web`, `mobile`, `api`, `partner`
- Check CSV for typos (case matters!)

### Issue: "No Anomalies Detected" message

**This is NORMAL if:**
- Less than 7 days of data (minimum required)
- Revenue is stable (no significant spikes/drops)
- All daily revenues are similar (low variance)

**To trigger anomalies:**
1. Import 10+ days of data
2. Include days with varying revenue amounts
3. System will flag |z-score| > 2.5 days

### Issue: Products page shows no data

**Check:**
1. At least one transaction imported in last 30 days
2. Date must be in ISO 8601 format
3. Status must be valid (completed, pending, failed, refunded)
4. Product IDs must be present

**Debug:**
```
GET http://localhost:8000/api/v1/debug/data-count
```
If transaction_count = 0, no data imported yet.

---

## Performance Considerations

### Data Volume
- **Small:** <10K transactions (instant results)
- **Medium:** 10K-100K transactions (sub-second)
- **Large:** 100K-1M transactions (few seconds)
- **Very Large:** >1M transactions (consider pagination)

### Optimization Strategies
1. **MongoDB Indexing** - Already configured on paid_at, product_id
2. **Python Processing** - Uses pandas vectorization (fast)
3. **React Query Caching** - 5-minute cache reduces API calls
4. **Pagination** - Export limited to 5000 records by default

### Monitoring
- Use debug endpoint to check transaction count
- Check browser DevTools Network tab for API latency
- Monitor backend logs for processing time
- Check MongoDB Atlas dashboard for performance metrics

---

## Production Deployment

### Environment Setup
```bash
# Copy example and configure
cp backend/.env.example backend/.env

# Edit for production:
MONGO_URL=<your-production-mongodb-connection>
DB_NAME=revenue_hub
CORS_ORIGINS=https://yourdomain.com
```

### Backend Deployment
```bash
# Use production ASGI server (not uvicorn reload)
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serves optimized build
npm run preview
```

### Security
1. Set `CORS_ORIGINS` to specific domains
2. Use HTTPS for all connections
3. Implement authentication (API keys, OAuth2)
4. Validate all CSV imports server-side
5. Monitor MongoDB access logs

---

## Next Actions

1. **✅ Verify Backend:** `python -m uvicorn server:app --reload`
2. **✅ Verify Frontend:** `npm run dev`
3. **📍 Import CSV:** Overview page → "Import CSV" button
4. **📍 View Timeline:** Click "Timeline" in sidebar
5. **📍 Check Products:** Click "Products" in sidebar
6. **📍 Review Anomalies:** Click "Anomalies" in sidebar

## Success Indicators

- ✅ Backend logs show: "Application startup complete"
- ✅ Frontend shows: "Local: http://localhost:5173"
- ✅ CSV import shows: "Imported X / Y records"
- ✅ Timeline displays: Charts with real data
- ✅ Products shows: Top 10 product bar chart
- ✅ Anomalies lists: Any detected anomalies (or "No Anomalies" if stable)

**System is now ready for production use!**
