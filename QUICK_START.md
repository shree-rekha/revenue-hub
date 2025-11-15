# Quick Start Guide - Revenue Pulse

## How the System Works

Revenue Pulse analyzes transaction data and displays:
1. **Timeline** - Daily revenue trends with anomaly detection
2. **Products** - Top performing products by revenue
3. **Anomalies** - Statistically significant revenue spikes/drops

### Data Flow

```
Your CSV File
    ↓
Frontend: CSV Import Page (Overview)
    ↓
Backend: ImportService processes & validates
    ↓
MongoDB: Stores transaction data
    ↓
Analytics Service: Processes transactions in Python
    ↓
REST API: Returns aggregated insights
    ↓
Frontend: Timeline, Products, Anomalies display data
```

---

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- fastapi, uvicorn (REST API)
- motor (async MongoDB)
- pandas, numpy (data processing)
- python-multipart (file uploads)

### 2. Start Backend Server

```bash
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started server process
INFO:     Application startup complete
```

### 3. Start Frontend Server

```bash
cd frontend
npm run dev
# or with bun:
bun run dev
```

Expected output:
```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## Using the Application

### Step 1: Prepare Your CSV

Your CSV file should have these columns:
| Column | Type | Example | Required |
|--------|------|---------|----------|
| order_id | string | ORD-000001 | Yes |
| user_id | string | USR-1001 | Yes |
| product_id | string | PRO-001 | Yes |
| amount | float | 1299.99 | Yes |
| currency | string | USD | No (default USD) |
| status | string | completed | Yes |
| channel | string | web | Yes |
| created_at | ISO 8601 | 2025-01-15T10:00:00Z | No |
| paid_at | ISO 8601 | 2025-01-15T10:30:00Z | Yes |
| refunded | boolean | false | No (default false) |
| refund_amount | float | 0.0 | No (default 0) |
| region | string | US | Yes |
| attribution_campaign | string | campaign-1 | No |

**Important:** Dates must be ISO 8601 format with timezone: `YYYY-MM-DDTHH:MM:SSZ`

### Step 2: Import CSV to Backend

1. Open frontend at `http://localhost:5173` (or given port)
2. Navigate to **Overview** page (home)
3. Click **"Import CSV"** button
4. Select your CSV file
5. Review column mapping (system auto-detects)
6. Click **"Import"** to process

**What happens:**
- CSV is parsed and validated
- Invalid rows are skipped with error reporting
- Valid transactions are stored in MongoDB
- System shows count of imported records

### Step 3: View Analytics

#### Timeline Page
- Navigate to **Timeline** (left sidebar)
- Shows daily revenue for last 90 days
- Displays 7-day and 30-day moving averages
- Red markers show detected anomalies

**Requirements:** ≥1 day of transaction data

#### Products Page  
- Navigate to **Products** (left sidebar)
- Shows top 10 products by revenue (last 30 days)
- Horizontal bar chart ranked by revenue
- Summary cards: Total Revenue, Orders, Product Count

**Requirements:** ≥1 product transaction in last 30 days

#### Anomalies Page
- Navigate to **Anomalies** (left sidebar)
- Shows statistically significant revenue spikes/drops
- Uses z-score method (threshold: |z| > 2.5)
- Lists anomaly details and possible causes

**Requirements:** ≥7 days of transaction data
**Note:** No anomalies = normal/stable revenue pattern

---

## Data Processing Rules

### What Counts as Revenue

Transactions are included if:
- ✓ Status = `completed`, `pending`, or `refunded`
- ✓ Has valid `amount` > 0
- ✗ Excludes: `failed` status, negative amounts, missing fields

### Daily Revenue (Timeline)
- Aggregates by date using `paid_at` (or `created_at` if missing)
- Groups all valid transactions by calendar day
- Fills missing days with $0 revenue
- Shows last 90 days by default

### Top Products (Products)
- Ranks by total revenue (all statuses included)
- Filters to last 30 days by default
- Returns top 10 products
- Counts both completed and refunded orders

### Anomaly Detection (Anomalies)
- Requires ≥7 days of data for statistical validity
- Calculates mean and standard deviation of daily revenues
- Z-score formula: `(daily_revenue - mean) / std_dev`
- Flags if `|z_score| > 2.5` (2.5 sigma threshold)
- Classifies as `spike` (positive) or `drop` (negative)

---

## Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'X'`
```bash
cd backend
pip install -r requirements.txt
```

**Error:** `RuntimeError: Form data requires "python-multipart"`
```bash
pip install python-multipart
```

**Error:** `Connection refused / Cannot connect to MongoDB`
- Verify `.env` has correct `MONGO_URL`
- Check MongoDB is running (local or cloud)
- Test connection: `GET /api/v1/debug/data-count`

### CSV Import Fails

**Issue:** "Missing required columns"
- Ensure CSV has: order_id, user_id, product_id, amount, status, channel, region, paid_at
- Check column names match (case-insensitive, flexible synonyms supported)

**Issue:** "No valid transactions found"
- Verify status values are: `completed`, `pending`, `failed`, or `refunded`
- Check channel values are: `web`, `mobile`, `api`, or `partner`
- Ensure amounts are valid positive numbers

**Issue:** Dates show as errors
- Use ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
- Example: `2025-01-15T10:30:00Z`
- Do NOT use: `1/15/2025`, `01-15-2025`, `2025-01-15`

### Timeline Page Shows Empty

**Cause 1:** No data imported
- Go to Overview and import CSV
- Check debug endpoint: `GET /api/v1/debug/data-count`

**Cause 2:** Data is outside last 90 days
- Timeline shows last 90 days only
- Import more recent data

**Cause 3:** No valid transactions
- Verify status includes: completed, pending, or refunded
- Check amounts are > 0

### Products Page Shows Empty

**Cause:** No transactions in last 30 days
- Import more recent CSV data
- Or check filters (status, date range)

### Anomalies Page Shows "No Anomalies Detected"

**This is normal if:**
- Less than 7 days of data (need minimum)
- Revenue is stable (no spikes detected)
- Variance is low (all days have similar revenue)

**To trigger anomalies:**
- Import data with significant day-to-day variance
- Include at least 7-10 days of data
- Have at least one day with unusual (>2.5σ) revenue

---

## Debug Endpoints

Check database status:
```
GET http://localhost:8000/api/v1/debug/data-count
```

Response shows:
- `transaction_count` - Total records in MongoDB
- `has_data` - Boolean, true if count > 0
- `sample_transaction` - First record for inspection

---

## Sample CSV File

Use `sample_transactions.csv` in root directory:
```csv
order_id,user_id,product_id,amount,currency,status,channel,created_at,paid_at,refunded,refund_amount,region,attribution_campaign
ORD-000001,USR-1001,PRO-001,1299.99,USD,completed,web,2025-01-15T10:00:00Z,2025-01-15T10:30:00Z,false,0.0,US,campaign-1
ORD-000002,USR-1002,PRO-002,499.99,USD,completed,mobile,2025-01-15T11:15:00Z,2025-01-15T11:45:00Z,false,0.0,EU,campaign-2
...
```

Import via frontend Overview page CSV import button.

---

## Technology Stack

**Backend:**
- FastAPI (REST API)
- Motor (async MongoDB)
- Pandas (data analysis)
- NumPy (statistics)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack React Query (data fetching)
- Tailwind CSS + Radix UI
- Recharts (charting)

**Database:**
- MongoDB (Atlas cloud or local)

---

**Version:** 1.0  
**Last Updated:** November 15, 2025

### Step 3: Start Frontend
```bash
cd frontend
npm run dev  # or bun run dev
```

### Step 4: Import Sample Data
1. Navigate to http://localhost:3001 (or 5173)
2. Go to Overview page
3. Click "Import CSV"
4. Select `sample_transactions.csv`
5. Click "Preview" to see headers/data
6. Click "Import" to populate database

### Step 5: View Analytics
- **Timeline**: http://localhost:3001/timeline
- **Products**: http://localhost:3001/products
- **Anomalies**: http://localhost:3001/anomalies

---

## Sample Data Summary

**20 Transactions | Jan 15-21, 2025**

### Daily Revenue
```
Jan 15: $2,699.48 (3 orders)
Jan 16: $2,099.97 (3 orders)
Jan 17: $2,399.48 (3 orders)
Jan 18: $2,098.97 (3 orders)
Jan 19: $2,249.48 (3 orders)
Jan 20: $2,299.97 (3 orders)
Jan 21: $1,299.99 (1 order)
```

### Top Products
```
1. PRO-001: $7,799.94 (6 orders) ← Best seller
2. PRO-002: $1,999.96 (4 orders)
3. PRO-003: $1,799.00 (2 orders)
```

### Anomalies
- **Count**: 0 (stable data)
- All days within normal statistical range
- No spikes or drops detected

---

## Troubleshooting

### Backend won't start
```
# Missing dependency error? Install missing package
pip install python-multipart pandas numpy

# Python path issue?
which python  # or where python (Windows)
python --version  # Should be 3.9+
```

### Pages show empty
```
1. Check browser console for API errors (F12)
2. Verify backend is running: curl http://localhost:8000/api
3. Make sure CSV was imported: Check Overview page shows count
4. Check MongoDB: Verify transactions were saved
```

### MongoDB connection error
```
# Check .env file has valid MONGO_URL
cat backend/.env

# If using local MongoDB:
# Start MongoDB: mongod (on Windows: services or MongoDB Compass)
# Update MONGO_URL in .env to: mongodb://localhost:27017
```

### Different port needed
```
# Backend on different port
uvicorn server:app --port 9000

# Frontend on different port
npm run dev -- --port 3002
```

---

## Architecture Overview

```
User Browser
    ↓
React Components (Timeline, Products, Anomalies)
    ↓
apiClient.ts (axios HTTP calls)
    ↓
FastAPI Backend (Port 8000)
    ├─ GET /api/v1/insights/revenue/daily
    ├─ GET /api/v1/insights/revenue/by-product
    └─ GET /api/v1/insights/anomalies
    ↓
AnalyticsService (Python data processing)
    ↓
MongoDB (Transactions collection)
    ↑
CSV Import (sample_transactions.csv)
```

---

## Key Files Modified

### Data Quality Fixes
- ✓ `sample_transactions.csv` - Fixed ISO 8601 date formats
- ✓ `backend/services/narrative_service.py` - Made google-generativeai optional
- ✓ `backend/services/analytics_service.py` - Python-based data processing

### Documentation
- ✓ `DATA_FLOW_ARCHITECTURE.md` - Complete architecture guide
- ✓ This file - Quick start guide

---

## Success Indicators

✓ You'll know it's working when:
1. Backend starts with "Application startup complete"
2. Frontend loads at http://localhost:3001
3. CSV import shows count of transactions
4. Timeline page displays revenue chart
5. Products page shows bar chart with products
6. Anomalies page shows status message (anomalies or "none detected")

---

**All data is properly linked!** No broken connections between CSV → MongoDB → Analytics → API → Frontend
