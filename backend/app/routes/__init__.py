from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.customers import router as customers_router
from app.routes.products import router as products_router
from app.routes.plans import router as plans_router
from app.routes.discounts import router as discounts_router
from app.routes.subscriptions import router as subscriptions_router
from app.routes.invoices import router as invoices_router
from app.routes.payments import router as payments_router
from app.routes.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "users_router",
    "customers_router",
    "products_router",
    "plans_router",
    "discounts_router",
    "subscriptions_router",
    "invoices_router",
    "payments_router",
    "dashboard_router"
]
