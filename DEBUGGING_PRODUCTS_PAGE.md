# 🔧 Products Page - Debugging Guide

## Problem
The Products page graph is empty - not displaying data from imported CSV.

## Root Causes (in order of likelihood)

1. **CSV data not imported** - No transactions in MongoDB
2. **Data outside 30-day window** - Products page only shows last 30 days
3. **Invalid date format** - Dates not parsing correctly
4. **Empty or all-failed import** - CSV has errors, all rows skipped

## Solution - Step by Step

### Step 1: Verify Backend is Running

Check Terminal 1 (Backend):
```powershell
# You should see:
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

If backend crashed or stopped, restart it:
```powershell
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Check Database Status

Open browser and go to:
```
http://localhost:8000/api/v1/debug/data-count
```

**Look for:**
- `"transaction_count"`: Should be > 0
- `"product_count"`: Should be > 0
- `"status_breakdown"`: Should have counts for each status

**Example Response (Good):**
```json
{
  "transaction_count": 20,
  "has_data": true,
  "status_breakdown": {
    "completed": 18,
    "pending": 1,
    "failed": 0,
    "refunded": 1
  },
  "product_count": 8,
  "products": [
    {"product_id": "PRO-001", "count": 5},
    {"product_id": "PRO-002", "count": 3}
  ],
  "sample_transaction": {...}
}
```

**Example Response (Bad):**
```json
{
  "transaction_count": 0,
  "has_data": false,
  "status_breakdown": {...},
  "product_count": 0,
  "products": [],
  "sample_transaction": null
}
```

---

### Step 3: If transaction_count = 0 (No Data)

**Problem:** Data was not imported

**Solutions:**

**A) Check if import ran:**
1. Go to Overview page
2. Click "Import CSV"
3. Select your CSV file
4. You should see a preview
5. Click "Confirm Import"
6. Look for success toast message

**B) Check import status in logs:**
1. Look at Backend Terminal (Terminal 1)
2. Find lines like: `[DEBUG IMPORT] Inserting X transactions`
3. If you don't see these, import never ran

**C) Check the CSV file itself:**
- Make sure it has these columns:
  - order_id
  - user_id
  - product_id
  - amount
  - status
  - channel
  - region
  - paid_at

- Make sure date format is correct (ISO 8601 with Z):
  - ✅ `2025-11-15T10:30:00Z`
  - ❌ `11/15/2025`
  - ❌ `2025-11-15`
  - ❌ `2025-11-15T10:30:00`

- Make sure status values are valid:
  - ✅ `completed`, `pending`, `failed`, `refunded`
  - ❌ `success`, `done`, `error`

- Make sure channel values are valid:
  - ✅ `web`, `mobile`, `api`, `partner`
  - ❌ `website`, `app`, `rest`

---

### Step 4: If transaction_count > 0 but Products Page Empty

**Problem:** Data is in database but Products page shows nothing

**Check the date range:**

1. Open browser developer console: Press **F12**
2. Go to Network tab
3. Go to Products page
4. Look for request: `GET /api/v1/insights/revenue/by-product?days=30`
5. Check the response - should have products array

**If response is empty `[]`:**
- All transactions may be outside the 30-day window
- **Products page shows: LAST 30 DAYS ONLY**
- If your imported data is older than 30 days, it won't show

**Solution:**
- Import data with recent dates (within last 30 days from today)
- Or import data from current date: `2025-11-15T...Z`

---

### Step 5: Check Backend Logs for Errors

Look at Backend Terminal (Terminal 1) for debug messages:

```
[DEBUG] Total transactions in DB: 20
[DEBUG] get_top_products: Looking for products from 2025-10-16 to 2025-11-15
[DEBUG] Transactions in range (30 days): 15
[DEBUG] Products found: 8
[DEBUG] Top products (top 10): 8
  - PRO-001: $5000.00 (5 orders)
  - PRO-002: $1500.00 (3 orders)
[DEBUG] Returning 8 products
```

**If you see:**
```
[DEBUG] Transactions in range (30 days): 0
```

This means **all your data is outside the 30-day window**. Either:
- Import newer data
- Or check your date format

---

### Step 6: Test with Sample CSV

Use the provided updated `sample_transactions.csv` which has November 2025 dates:

1. Go to Overview page
2. Click "Import CSV"
3. Select `sample_transactions.csv` from root folder
4. Confirm import
5. Go to Products page - should now show 8 products

---

### Step 7: Check Products Page Component

If data exists but Products page still empty:

**Check browser console (F12 → Console):**
```javascript
// You should see:
Products data: Array(8)
Products length: 8
// OR if error:
Products error: [error details]
```

**If you see empty array:**
```javascript
Products data: Array(0)
Products length: 0
```

This means API returned no products, go back to Step 4.

---

## Quick Troubleshooting Checklist

- [ ] Backend running? (Check Terminal 1)
- [ ] Frontend running? (Check Terminal 2)
- [ ] `/api/v1/debug/data-count` shows `transaction_count > 0`?
- [ ] `/api/v1/debug/data-count` shows `product_count > 0`?
- [ ] CSV dates are ISO 8601 with Z? (2025-11-15T10:30:00Z)
- [ ] CSV dates are within last 30 days?
- [ ] CSV has required columns? (order_id, product_id, amount, etc.)
- [ ] CSV status values valid? (completed, pending, failed, refunded)
- [ ] CSV channel values valid? (web, mobile, api, partner)
- [ ] Import showed success message?
- [ ] Refreshed Products page (F5)?
- [ ] Cleared browser cache (Ctrl+Shift+Delete)?

---

## Clear Data & Restart

If something went wrong during import:

### Option 1: Just Delete MongoDB Data
```powershell
# Connect to MongoDB and delete old data
# Then re-import fresh CSV
```

### Option 2: Restart Everything
```powershell
# Terminal 1: Stop backend
Ctrl+C

# Terminal 2: Stop frontend  
Ctrl+C

# Terminal 1: Restart backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Restart frontend
npm run dev

# Then re-import CSV
```

---

## What Should Work After Fix

✅ Import CSV on Overview page  
✅ Get success message with record count  
✅ Navigate to Products page  
✅ See bar chart with products  
✅ See summary cards (Total Revenue, Orders, SKUs)  
✅ See product details list  
✅ All data from imported CSV only (no sample data)  

---

## Example: Successful Flow

```
1. CSV File
   → order_id, product_id, amount, paid_at: 2025-11-15T10:30:00Z, status: completed, ...

2. Click Import CSV
   → Select file
   → See preview
   → Confirm import

3. Success Toast
   → "Successfully imported 20 records"

4. Backend Logs
   → [DEBUG IMPORT] Inserting 20 transactions
   → [DEBUG IMPORT] Successfully inserted 20 records

5. Check Debug Endpoint
   → GET /api/v1/debug/data-count
   → "transaction_count": 20
   → "product_count": 8

6. Products Page
   → Shows bar chart with 8 products
   → Shows summary cards with totals
   → Shows product list

7. Timeline Page  
   → Shows daily revenue with 1+ data points

8. Anomalies Page
   → Shows "No Anomalies" or detected anomalies (if 7+ days data)
```

---

## Still Not Working?

1. **Check all backend logs** - Look for [DEBUG] messages
2. **Check all browser logs** - F12 → Console
3. **Test debug endpoint** - Verify data exists
4. **Verify CSV format** - Check dates, status, channel values
5. **Clear cache** - Ctrl+Shift+Delete in browser
6. **Restart services** - Stop and restart both backend and frontend
7. **Try sample CSV** - Test with provided sample_transactions.csv

---

**Debug endpoint URL for quick testing:**
```
http://localhost:8000/api/v1/debug/data-count
```

This shows exactly what's in the database and helps identify the issue.
