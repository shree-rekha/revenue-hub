# Run Commands - Copy & Paste Ready

## Prerequisites Check

```powershell
# Verify Python is installed
python --version

# Verify Node.js/npm is installed
npm --version

# Verify bun is installed (optional, can use npm instead)
bun --version
```

---

## Backend Setup (First Time Only)

### Step 1: Install Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi uvicorn motor python-multipart pandas numpy ...
```

### Step 2: Configure Environment

Make sure `backend/.env` exists with:
```
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=revenue_hub
CORS_ORIGINS=*
```

If `.env` doesn't exist, create it with the above content.

---

## Frontend Setup (First Time Only)

### Step 1: Install Dependencies

```powershell
cd frontend
npm install
```

**Expected output:**
```
added 500+ packages in Xs
```

If npm is slow, try bun:
```powershell
bun install
```

---

## Running the Application

### Terminal 1: Start Backend

```powershell
cd backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ **Backend is ready when you see:** `Application startup complete`

Keep this terminal open.

### Terminal 2: Start Frontend

```powershell
cd frontend
npm run dev
```

**Expected output:**
```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

✅ **Frontend is ready when you see:** `Local: http://localhost:5173/`

Keep this terminal open.

### Terminal 3 (Optional): Monitor Backend

```powershell
# In the backend directory
# Watch backend logs - they appear in Terminal 1
# No new commands needed - just watch Terminal 1
```

---

## Using the Application

### Step 1: Open in Browser

```
http://localhost:5173
```

Or if port 5173 is busy, use the port shown in Terminal 2.

### Step 2: Import CSV

1. You should be on **Overview** page
2. Click **"Import CSV"** button
3. Select **`sample_transactions.csv`** from root folder
4. Review the column mapping (should auto-detect)
5. Click **"Import"** button
6. Wait for success message: "Imported 20 / 20 records"

### Step 3: View Analytics

**Timeline Page:**
```
Click "Timeline" in left sidebar
→ See daily revenue chart
→ Shows 7-day and 30-day moving averages
→ Red dots mark anomalies
```

**Products Page:**
```
Click "Products" in left sidebar
→ See top 10 products by revenue
→ Shows horizontal bar chart
→ Summary cards: Total Revenue, Orders, SKUs
```

**Anomalies Page:**
```
Click "Anomalies" in left sidebar
→ See statistical anomalies
→ Shows z-scores and reasons
→ Empty if data is stable (normal)
```

---

## Testing Endpoints

### Check Backend Health

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/v1/
```

**Expected response:**
```json
{
  "message": "Revenue Analytics API",
  "version": "1.0.0"
}
```

### Check Database Status

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/v1/debug/data-count | ConvertFrom-Json
```

**Expected response (before import):**
```json
{
  "transaction_count": 0,
  "has_data": false,
  "sample_transaction": null
}
```

**Expected response (after import):**
```json
{
  "transaction_count": 20,
  "has_data": true,
  "sample_transaction": {...}
}
```

---

## Common Issues

### "ModuleNotFoundError: No module named 'X'"

```powershell
cd backend
pip install -r requirements.txt
```

### "Connection refused" on localhost:8000

Make sure backend terminal shows: `Application startup complete`

If not, check for errors in backend terminal.

### "Port 8000 already in use"

Change the port:
```powershell
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Then update frontend API config if needed (automatic at localhost:8000).

### "Port 5173 already in use"

```powershell
cd frontend
npm run dev -- --port 5174
```

Then open: http://localhost:5174

### CSV Import Appears to Fail

1. Check browser console (F12 → Console tab)
2. Check backend logs (Terminal 1)
3. Verify CSV format:
   - All dates must be ISO 8601: `2025-01-15T10:30:00Z`
   - Status must be: completed, pending, failed, refunded
   - Channel must be: web, mobile, api, partner

---

## Stopping the Application

### To Stop Backend
Press `Ctrl+C` in Terminal 1

### To Stop Frontend
Press `Ctrl+C` in Terminal 2

### To Clean Up
```powershell
# Delete node modules (if needed)
cd frontend
rm -Recurse node_modules

# Delete Python cache
cd backend
rm -Recurse __pycache__
rm -Recurse .pytest_cache
```

---

## Development Workflow

### Making Changes to Backend

1. Edit `backend/server.py` or service files
2. Save the file
3. Backend auto-reloads (watch Terminal 1 for confirmation)
4. Refresh browser to test

### Making Changes to Frontend

1. Edit React components in `frontend/src/`
2. Save the file
3. Vite hot-reloads automatically (watch for "modules updated" message)
4. Browser refreshes automatically

### Testing New CSV

1. Prepare your CSV file
2. Go to Overview page in browser
3. Click "Import CSV"
4. Select your file
5. Review column mapping
6. Click "Import"
7. Check results on Timeline/Products/Anomalies pages

---

## Advanced: Custom Database

### Using Local MongoDB

```powershell
# Install MongoDB Community
# https://docs.mongodb.com/manual/installation/

# Start MongoDB
mongod

# In backend/.env:
MONGO_URL=mongodb://localhost:27017/
DB_NAME=revenue_hub
```

### Using MongoDB Atlas (Cloud)

```
# In backend/.env:
MONGO_URL=mongodb+srv://username:password@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=revenue_hub
```

Get `MONGO_URL` from MongoDB Atlas → Connect → Connection String

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start Backend | `cd backend; python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000` |
| Start Frontend | `cd frontend; npm run dev` |
| Check Backend Health | `curl http://localhost:8000/api/v1/` |
| Check DB Status | `curl http://localhost:8000/api/v1/debug/data-count` |
| Install Backend Deps | `cd backend; pip install -r requirements.txt` |
| Install Frontend Deps | `cd frontend; npm install` |
| Build Frontend | `cd frontend; npm run build` |
| Preview Build | `cd frontend; npm run preview` |

---

## File Structure for Reference

```
revenue-pulse-15-main/
├── backend/
│   ├── server.py              ← Main API
│   ├── models.py              ← Data schemas
│   ├── requirements.txt        ← Dependencies
│   ├── .env                    ← Configuration
│   └── services/
│       ├── import_service.py   ← CSV import
│       ├── analytics_service.py ← Analytics
│       ├── export_service.py   ← Data export
│       └── narrative_service.py ← AI narratives
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Timeline.tsx    ← Revenue trends
│   │   │   ├── Products.tsx    ← Top products
│   │   │   ├── Anomalies.tsx   ← Anomalies
│   │   │   └── Overview.tsx    ← CSV import
│   │   ├── components/
│   │   │   └── CSVImport.tsx   ← Import UI
│   │   └── api/
│   │       └── client.ts       ← API client
│   └── package.json            ← Dependencies
│
├── sample_transactions.csv     ← Test data
├── START_HERE.md              ← Quick start
├── QUICK_START.md             ← Workflow guide
├── SYSTEM_STATUS.md           ← System overview
└── IMPLEMENTATION_GUIDE.md    ← Technical details
```

---

## Success Checklist

- [ ] Backend running: Terminal 1 shows `Application startup complete`
- [ ] Frontend running: Terminal 2 shows `Local: http://localhost:5173/`
- [ ] Browser opens to http://localhost:5173 (or given port)
- [ ] Overview page visible with "Import CSV" button
- [ ] CSV import button opens file dialog
- [ ] `sample_transactions.csv` selected and imported
- [ ] Import shows "Imported 20 / 20 records"
- [ ] Timeline page shows revenue chart with data
- [ ] Products page shows top products bar chart
- [ ] Anomalies page shows list (or "No Anomalies" if stable)

✅ **If all checked:** System is working perfectly!

---

## Getting Help

1. **Check debug endpoint:** `http://localhost:8000/api/v1/debug/data-count`
2. **Read logs:** Check Terminal 1 (backend) and Terminal 2 (frontend)
3. **Review docs:** See IMPLEMENTATION_GUIDE.md for troubleshooting
4. **Check browser console:** F12 → Console tab for frontend errors
5. **Verify CSV format:** Ensure dates are ISO 8601: `2025-01-15T10:30:00Z`

---

**Ready to start? Copy the commands above and run them!**
