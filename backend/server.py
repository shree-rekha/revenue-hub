from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import Optional
import io

from models import (
    Transaction, TransactionCreate, TransactionResponse,
    DailyRevenue, RevenueSummary, Product, Anomaly
)
from services.import_service import ImportService
from services.analytics_service import AnalyticsService
from services.export_service import ExportService
from services.narrative_service import NarrativeService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Revenue Analytics API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize services
import_service = ImportService(db)
analytics_service = AnalyticsService(db)
export_service = ExportService(db)
narrative_service = NarrativeService()

# Health check
@api_router.get("/")
async def root():
    return {"message": "Revenue Analytics API", "version": "1.0.0"}

# ============ Transaction Endpoints ============

@api_router.post("/v1/transactions/import")
async def import_transactions(file: UploadFile = File(...)):
    """
    Import transactions from CSV or Excel file.
    Accepts .csv, .xlsx, and .xls files.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = file.filename.lower().split('.')[-1]
    if file_ext not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only CSV and Excel files are supported."
        )
    
    content = await file.read()
    result = await import_service.import_from_file(content, file_ext)
    return result

@api_router.get("/v1/transactions", response_model=list[TransactionResponse])
async def get_transactions(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Get list of transactions with pagination.
    """
    transactions = await analytics_service.get_transactions(limit, offset)
    return transactions

@api_router.get("/v1/transactions/{order_id}", response_model=TransactionResponse)
async def get_transaction(order_id: str):
    """
    Get a specific transaction by order ID.
    """
    transaction = await analytics_service.get_transaction(order_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

# ============ Insights Endpoints ============

@api_router.get("/v1/insights/revenue/daily", response_model=list[DailyRevenue])
async def get_daily_revenue(
    start: Optional[str] = None,
    end: Optional[str] = None
):
    """
    Get daily revenue aggregation.
    Returns last 90 days by default.
    """
    return await analytics_service.get_daily_revenue(start, end)

@api_router.get("/v1/insights/revenue/summary", response_model=RevenueSummary)
async def get_revenue_summary():
    """
    Get comprehensive revenue summary including:
    - Today's revenue
    - Month-to-date revenue
    - Year-to-date revenue
    - Revenue Health Index
    - Top products
    - Recent anomalies
    - AI-generated narrative
    """
    summary = await analytics_service.get_revenue_summary()
    
    # Generate AI narrative
    narrative = await narrative_service.generate_narrative(
        today=summary['today'],
        mtd=summary['mtd'],
        ytd=summary['ytd'],
        rhi=summary['rhi'],
        top_products=summary['top_products'],
        anomalies=summary['anomalies']
    )
    summary['narrative'] = narrative
    
    return summary

@api_router.get("/v1/insights/revenue/by-product", response_model=list[Product])
async def get_top_products(days: int = Query(30, ge=1, le=365)):
    """
    Get top products by revenue for the specified period.
    """
    return await analytics_service.get_top_products(days)

@api_router.get("/v1/insights/anomalies", response_model=list[Anomaly])
async def get_anomalies(lookback_days: int = Query(90, ge=7, le=365)):
    """
    Detect revenue anomalies using statistical analysis (z-score method).
    Returns days with |z-score| > 2.5
    """
    return await analytics_service.detect_anomalies(lookback_days)

@api_router.get("/v1/insights/narrative")
async def get_narrative(
    start: Optional[str] = None,
    end: Optional[str] = None
):
    """
    Get AI-generated narrative for a specific period.
    """
    summary = await analytics_service.get_revenue_summary()
    narrative = await narrative_service.generate_narrative(
        today=summary['today'],
        mtd=summary['mtd'],
        ytd=summary['ytd'],
        rhi=summary['rhi'],
        top_products=summary['top_products'],
        anomalies=summary['anomalies']
    )
    return {"narrative": narrative}

# ============ Export Endpoints ============

@api_router.get("/v1/export/csv")
async def export_csv(limit: int = Query(5000, ge=1, le=10000)):
    """
    Export transactions to CSV format.
    """
    csv_content = await export_service.export_to_csv(limit)
    
    return StreamingResponse(
        io.BytesIO(csv_content.encode('utf-8')),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=transactions_export.csv"
        }
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
