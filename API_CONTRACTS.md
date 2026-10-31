# Brightloop Subscription Management System — API Contracts & Shared Schema
**Prepared by Fiza (Frontend Lead) for Haaniah (Backend Lead), Iha (Finance), and Fasla (Subscriptions)**

This document defines the REST API endpoints, request bodies, and JSON responses agreed upon between the Frontend (`feature/ui`) and the Backend modules (`feature/backend`, `feature/finance`, `feature/subscriptions`).

Base URL: `/api` (or `http://localhost:8000/api`)

---

## 1. Authentication & Users
Implemented by: **Haaniah** (`feature/backend`)

### `POST /api/auth/register`
**Request Body:**
```json
{
  "name": "Rahul Verma",
  "email": "rahul@acmecorp.in",
  "password": "StrongPassword123!",
  "role": "customer" // "admin" | "internal_staff" | "customer"
}
```
**Validation:**
- Unique email.
- Password > 8 chars, at least 1 uppercase, 1 lowercase, 1 special character.

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Rahul Verma",
    "email": "rahul@acmecorp.in",
    "role": "customer"
  }
}
```

### `POST /api/auth/login`
**Request Body:**
```json
{
  "email": "admin@brightloop.com",
  "password": "AdminPassword123!"
}
```
**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Aarav Sharma",
    "email": "admin@brightloop.com",
    "role": "admin"
  }
}
```

### `GET /api/auth/me`
**Headers:** `Authorization: Bearer <token>`  
**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Aarav Sharma",
  "email": "admin@brightloop.com",
  "role": "admin"
}
```

---

## 2. Customer Management
Implemented by: **Haaniah** (`feature/backend`)

### `GET /api/customers`
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Acme Technologies Ltd",
    "contact_name": "Rahul Verma",
    "email": "rahul@acmecorp.in",
    "phone": "+91 98765 43210",
    "address": "Tower B, Cyber City, Gurugram, Haryana",
    "tax_id": "GSTIN07AABCB1234F1Z5"
  }
]
```

### `POST /api/customers`
**Request Body:** Same fields as customer object above.

---

## 3. Products & Variants
Implemented by: **Fasla** (`feature/subscriptions`)

### `GET /api/products`
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Business Software Suite",
    "type": "software",
    "sales_price": 2000.0,
    "cost_price": 800.0,
    "notes": "Core ERP software",
    "variants": [
      {
        "id": 101,
        "name": "Standard (Standalone)",
        "additional_price": 0.0
      },
      {
        "id": 102,
        "name": "Odoo Integration Pack",
        "additional_price": 560.0
      }
    ]
  }
]
```

### `POST /api/products`
**Request Body:**
```json
{
  "name": "Business Software Suite",
  "type": "software",
  "sales_price": 2000.0,
  "cost_price": 800.0,
  "notes": "Core ERP software",
  "variants": [
    {
      "name": "Odoo Integration Pack",
      "additional_price": 560.0
    }
  ]
}
```

---

## 4. Subscription Plans
Implemented by: **Fasla** (`feature/subscriptions`)

### `GET /api/plans`
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Growth Monthly Plan",
    "price": 3000.0,
    "billing_frequency": "monthly", // "daily" | "weekly" | "monthly" | "yearly"
    "min_quantity": 1,
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "auto_closure": false,
    "early_closure_allowed": true,
    "pause_allowed": true,
    "renewal_allowed": true
  }
]
```

---

## 5. Subscriptions
Implemented by: **Fasla** (`feature/subscriptions`)

### `GET /api/subscriptions`
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "subscription_number": "SUB-2026-001",
    "customer_id": 1,
    "customer_name": "Acme Technologies Ltd",
    "plan_id": 1,
    "plan_name": "Growth Monthly Plan",
    "status": "active", // "draft" | "quotation" | "confirmed" | "active" | "paused" | "closed"
    "start_date": "2026-10-01",
    "expiry_date": "2027-10-01",
    "next_billing_date": "2026-11-01",
    "payment_terms": "Net 15",
    "quantity": 2,
    "unit_price": 2560.0,
    "taxes": 921.6,
    "total_amount": 6041.6,
    "items": [
      {
        "product_id": 1,
        "product_name": "Business Software Suite",
        "variant_id": 102,
        "variant_name": "Odoo Integration Pack",
        "quantity": 2,
        "unit_price": 2560.0,
        "amount": 5120.0
      }
    ]
  }
]
```

### `POST /api/subscriptions`
**Request Body:**
```json
{
  "customer_id": 1,
  "plan_id": 1,
  "start_date": "2026-10-01",
  "expiry_date": "2027-10-01",
  "next_billing_date": "2026-11-01",
  "payment_terms": "Net 15",
  "status": "draft",
  "items": [
    {
      "product_id": 1,
      "variant_id": 102,
      "quantity": 2,
      "unit_price": 2560.0
    }
  ]
}
```

### `PATCH /api/subscriptions/{id}/status`
**Request Body:** `{"status": "active"}`

---

## 6. Invoices & Automatic Billing
Implemented by: **Iha** (`feature/finance`)

### `POST /api/billing/generate-due`
**Trigger:** Scans active subscriptions where `next_billing_date <= today` or due, creates invoices without duplicates for the same subscription and billing cycle.
**Response (200 OK):**
```json
{
  "success": true,
  "generated_count": 2,
  "message": "Generated 2 new invoices automatically (duplicates prevented).",
  "invoices": [...]
}
```

### `GET /api/invoices`
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "invoice_number": "INV-2026-001",
    "subscription_id": 1,
    "subscription_number": "SUB-2026-001",
    "customer_id": 1,
    "customer_name": "Acme Technologies Ltd",
    "billing_period_start": "2026-10-01",
    "billing_period_end": "2026-10-31",
    "due_date": "2026-10-15",
    "subtotal": 5120.0,
    "tax_amount": 921.6,
    "discount_amount": 0.0,
    "final_amount": 6041.6,
    "paid_amount": 6041.6,
    "outstanding_amount": 0.0,
    "status": "paid", // "draft" | "confirmed" | "paid" | "overdue"
    "items": [
      {
        "description": "Business Software Suite (Odoo Integration Pack) x2",
        "quantity": 2,
        "unit_price": 2560.0,
        "amount": 5120.0
      }
    ]
  }
]
```

---

## 7. Payments
Implemented by: **Iha** (`feature/finance`)

### `GET /api/payments`
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "invoice_id": 1,
    "invoice_number": "INV-2026-001",
    "customer_name": "Acme Technologies Ltd",
    "payment_method": "Bank Transfer (NEFT)",
    "amount": 6041.6,
    "payment_date": "2026-10-12",
    "note": "UTR: SBIN00293817293"
  }
]
```

### `POST /api/payments`
**Request Body:**
```json
{
  "invoice_id": 1,
  "payment_method": "Bank Transfer (NEFT)",
  "amount": 6041.6,
  "payment_date": "2026-10-12",
  "note": "UTR: SBIN00293817293"
}
```

---

## 8. Dashboard
Implemented by: **Iha** (`feature/finance`)

### `GET /api/dashboard/summary`
**Response (200 OK):**
```json
{
  "active_subscriptions": 12,
  "total_revenue": 145000.0,
  "outstanding_amount": 18680.0,
  "overdue_invoices": 1,
  "total_invoices": 24,
  "total_customers": 8
}
```

### `GET /api/dashboard/revenue`
**Response (200 OK):** Array of monthly revenue trend objects:
```json
[
  { "month": "Jun 2026", "revenue": 14500.0, "invoices": 8 },
  { "month": "Jul 2026", "revenue": 22000.0, "invoices": 12 }
]
```

