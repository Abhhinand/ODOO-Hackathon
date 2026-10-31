# BRIGHTLOOP — Revenue in Motion
### Subscription Management & Billing Operations System (Hackathon MVP)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg?style=flat-square&logo=sqlite)](https://sqlite.org)
[![Design](https://img.shields.io/badge/UI_Style-Swiss_Editorial-C5F36A.svg?style=flat-square)](https://github.com/Abhhinand/ODOO-Hackathon)

---

## 1. Project Overview

**Brightloop** is a web-based Subscription Management System designed to simplify the management of customers, products, subscription plans, subscriptions, invoices, and payments.

The platform provides a centralized operational cockpit through which administrators and staff can manage recurring billing cycles while customers can access their own dedicated self-service portal to view active agreements, invoices, and payment receipts.

### 1.1 Project Vision: **Revenue in Motion**
Brightloop connects customer management, subscription lifecycles, precision invoice calculations (including tax and promotional discounts), and cash settlement into one cohesive system.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | Modular, lightning-fast component interface |
| **Styling** | Custom Editorial CSS | Distinctive Swiss-inspired typographic design system |
| **Icons** | Lucide React | Minimalist and expressive icon set |
| **Routing** | React Router v6 | Role-protected client navigation |
| **Charts** | Recharts | Revenue Pulse & billing telemetry visualizations |
| **API Client** | Axios | REST communication with JWT interceptors |
| **Backend** | Python FastAPI | High-performance asynchronous REST API |
| **ORM** | SQLAlchemy 2.0 | Type-safe relational database operations |
| **Database** | SQLite | Serverless zero-config relational storage |
| **Authentication** | JWT + bcrypt | Secure bearer tokens and hashed credentials |

---

## 3. UI/UX Design Direction: Editorial / Swiss-Inspired

Brightloop departs from generic, uninspired dashboard templates in favor of a distinctive Swiss editorial interface:
- **Typography:** Large, expressive display headings (`Space Grotesk`), clean body text (`Plus Jakarta Sans`), and sharp financial figures in monospace (`JetBrains Mono`).
- **Color Palette:**
  - `Midnight Ink (#111A27)`: Sidebar, dark sections and primary visual anchors.
  - `Warm Ivory (#F4F2EA)`: Main canvas background for comfortable contrast.
  - `Electric Lime (#C5F36A)`: Action highlights, brand identity, and active indicators.
  - `Cobalt Blue (#5376E5)`: Secondary visual anchors and contract states.
  - `Amber (#E8A45D)`: Pending items and warning callouts.
  - `Alert Red (#E65B54)`: Overdue balances and critical exceptions.

---

## 4. User Roles & Access Control

| Role | Permissions & Access Scope |
|---|---|
| **Administrator** | Access to full executive dashboard, staff user management, product/plan catalogue, customer ledger, subscriptions, invoices, payments, and promotional discount configuration. |
| **Staff** | Operational dashboard, customer registration, subscription creation, status progression, invoice generation, and payment recording. |
| **Customer** | Restricted Customer Portal with strict backend data isolation. Can only inspect their own active subscriptions, invoice statements, and payment receipts. |

---

## 5. Functional Modules

### 5.1 Authentication & RBAC
- JSON Web Token (JWT) based authentication with bcrypt password hashing.
- Role-based route guards on both frontend and backend.
- Quick-login demo buttons for instant evaluation of Admin, Staff, and Customer personas.

### 5.2 Product Management
- Create, view, edit, and archive products.
- Fields: Name, type (`Software`, `Service`, `Digital`, `Physical`), sales price, cost price, margins, and notes.

### 5.3 Subscription Plans
- Configure recurring pricing tiers linked to products.
- Monthly and annual billing intervals.
- Live tracking of active subscribers per plan.

### 5.4 Customer Management
- Register customers with contact details, company information, and billing addresses.
- Auto-generate customer self-service portal login credentials.
- Customer 360 profile modal displaying all associated contracts and invoice history.

### 5.5 Subscription Lifecycle Management
- Full lifecycle workflow: `Draft → Confirmed → Active → Closed`.
- Automatic calculation of `next_billing_date` based on the plan cadence.
- 1-click **Generate Invoice** trigger directly from subscription records.

### 5.6 Invoice Management & Billing Calculations
- Generates invoices directly from subscriptions or manual ad-hoc creation.
- Computes Subtotal, Promotional Discounts (`fixed` or `percentage`), and Tax rate.
- **Duplicate Prevention:** Prevents creating multiple invoices for the same subscription and billing cycle.
- Printable, clean editorial invoice receipt modal.

### 5.7 Payment Management
- Records payments applied to invoices (partial or full payments).
- Auto-computes balance due; automatically updates invoice status to `PAID` when balance reaches zero.
- Supports multiple payment rails: Credit Card, Wire/Bank Transfer, UPI, Cash.

### 5.8 Promotional Discount Management
- Fixed dollar credits (e.g. `$50.00 Founder credit`) and percentage discounts (e.g. `20% Launch Promo`).
- Selectable during invoice generation.

### 5.9 Executive Dashboard
- **Revenue in Motion** telemetry:
  - Estimated MRR (Monthly Recurring Revenue).
  - Active subscriptions count.
  - Total lifetime cash settled.
- **4 Financial Summary Indicators:** Active subscriptions, collected this month, outstanding amount, pending invoices.
- **Revenue Pulse Chart:** Visual trend of monthly collected revenue vs. total invoiced.
- **Subscription Breakdown:** Visual distribution of active, confirmed, draft, and closed contracts.
- **Needs Attention:** Real-time exceptions feed highlighting overdue invoices, high-balance receivables, and renewals due within 14 days.

### 5.10 Dedicated Customer Portal
- Self-service dashboard for authenticated customers showing their active subscription plans, next renewal dates, itemized invoices, and payment receipts.

---

## 6. Pre-Seeded Demonstration Accounts

When the application boots for the first time, SQLite is automatically initialized with demonstration data:

| Persona | Email | Password | Role / Details |
|---|---|---|---|
| **Administrator** | `admin@brightloop.com` | `admin123` | Full administrative control |
| **Staff Member** | `staff@brightloop.com` | `staff123` | Operational access |
| **Customer (Acme)** | `acme@brightloop.com` | `customer123` | Customer Portal (Acme Cloud Corp) |

---

## 7. Quick Start & Setup Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.13)
- Node.js 18+ (Tested on Node.js 24)
- npm

### Automatic Startup (Windows)
Double-click `run_dev.bat` in the project root:
```cmd
run_dev.bat
```
This opens two terminal windows:
1. Backend on `http://localhost:8000` (Interactive API docs at `http://localhost:8000/docs`)
2. Frontend on `http://localhost:3000`

---

### Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. 10-Step Hackathon Demonstration Scenario

To evaluate the complete subscription and billing lifecycle:

1. **Sign In as Administrator:** Click `Admin Demo` (`admin@brightloop.com` / `admin123`).
2. **Review Executive Dashboard:** Inspect real-time MRR, 4 KPI cards, Revenue Pulse chart, and Needs Attention exceptions.
3. **Create a Product:** Go to **Products** → Click **Add Product** (e.g. `Cyber Threat Monitor`, Sales `$199`, Cost `$30`).
4. **Create a Subscription Plan:** Go to **Plans** → Click **Create Plan** linked to the new product (e.g. `Cyber Monitor Monthly`, `$199/mo`).
5. **Register a Customer:** Go to **Customers** → Click **Register Customer** (e.g. `Nexus Robotics`, email `nexus@robotics.io`).
6. **Create a Subscription:** Go to **Subscriptions** → Click **New Subscription** → Select `Nexus Robotics` and `Cyber Monitor Monthly` (Status starts as `Draft`).
7. **Advance Subscription Status:** Click **Confirm** (`Draft → Confirmed`), then click **Activate** (`Confirmed → Active`).
8. **Generate an Invoice:** On the subscription row, click **Invoice** → Select 10% tax and optional `LAUNCH20` discount → Click **Generate & Confirm Invoice**. Notice duplicate prevention blocks generating a second invoice for the same cycle!
9. **Record a Payment:** Go to **Invoices** (or **Payments**) → Click **Record Pay** on the invoice → Post a payment of the full balance. Notice the invoice status immediately flips to `PAID`.
10. **Verify Financials & Customer Portal:**
    - Return to **Overview**: See MRR, collected revenue, and KPIs updated in real time.
    - Sign out and click `Customer Demo` (`acme@brightloop.com` / `customer123`): Inspect the restricted customer portal with their contracts, statements, and receipts.

---

## 9. API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `POST` | `/api/auth/register` | Register new account |
| `GET` | `/api/auth/me` | Fetch current session profile |
| `GET` | `/api/dashboard/summary` | Executive dashboard financial metrics & charts |
| `GET`, `POST` | `/api/products` | List & create products |
| `PUT`, `DELETE` | `/api/products/{id}` | Update & delete product |
| `GET`, `POST` | `/api/plans` | List & create subscription plans |
| `GET`, `POST` | `/api/customers` | List & register customers |
| `GET` | `/api/customers/{id}` | Get customer profile with contracts & invoices |
| `GET`, `POST` | `/api/subscriptions` | List & create subscriptions |
| `PUT` | `/api/subscriptions/{id}/status` | Update subscription lifecycle status |
| `GET`, `POST` | `/api/invoices` | List & create manual invoices |
| `POST` | `/api/invoices/generate` | Generate invoice from subscription with duplicate check |
| `GET` | `/api/invoices/{id}` | Detailed itemized invoice with receipt data |
| `GET`, `POST` | `/api/payments` | List & record invoice payments |
| `GET`, `POST` | `/api/discounts` | List & create discount coupons |
| `GET`, `POST` | `/api/users` | List & create administrative staff users |

---

**BRIGHTLOOP — REVENUE IN MOTION.**  
*Built for the 8-Hour Hackathon.*
