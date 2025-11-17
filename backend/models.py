from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid

class TransactionCreate(BaseModel):
    order_id: str
    user_id: str
    product_id: str
    amount: float
    currency: str = "USD"
    status: Literal['completed', 'pending', 'failed', 'refunded']
    channel: Literal['web', 'mobile', 'api', 'partner']
    # Allow None to accommodate unpaid/cancelled/failed transactions
    paid_at: Optional[str] = None
    refunded: bool = False
    refund_amount: float = 0.0
    region: str
    attribution_campaign: Optional[str] = None

class Transaction(TransactionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class TransactionResponse(Transaction):
    pass

class DailyRevenue(BaseModel):
    day: str
    revenue: float
    orders: int

class Product(BaseModel):
    product_id: str
    name: str
    revenue: float
    orders: int
    category: Optional[str] = None

class Anomaly(BaseModel):
    day: str
    revenue: float
    z: float
    direction: Literal['spike', 'drop']
    possible_causes: list[str]

class RevenueSummary(BaseModel):
    today: float
    mtd: float
    ytd: float
    rhi: float
    top_products: list[Product]
    anomalies: list[Anomaly]
    narrative: str
