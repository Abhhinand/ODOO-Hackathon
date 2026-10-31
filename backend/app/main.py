from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import Base, engine, SessionLocal
from app.services.seed_service import seed_database
from app.routes import (
    auth_router,
    users_router,
    customers_router,
    products_router,
    plans_router,
    discounts_router,
    subscriptions_router,
    invoices_router,
    payments_router,
    dashboard_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    Base.metadata.create_all(bind=engine)
    # Seed initial demonstration data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="Brightloop API — Revenue in Motion",
    description="Subscription & Billing Operations Management System",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(plans_router, prefix="/api")
app.include_router(discounts_router, prefix="/api")
app.include_router(subscriptions_router, prefix="/api")
app.include_router(invoices_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "Brightloop — Revenue in Motion",
        "tagline": "Subscription Management System",
        "docs_url": "/docs",
        "status": "online"
    }
