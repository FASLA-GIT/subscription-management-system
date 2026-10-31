from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Tuple
from dateutil.relativedelta import relativedelta


VALID_FREQUENCIES = {"daily", "weekly", "monthly", "yearly"}


def round_currency(value: float | Decimal) -> float:
    """Rounds a numeric amount to 2 decimal places using ROUND_HALF_UP."""
    d = Decimal(str(value))
    return float(d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def compute_next_billing_date(from_date: date, frequency: str) -> date:
    """
    Computes the next billing date based on frequency.
    Handles month-end and leap-year boundaries correctly:
    - daily: +1 day
    - weekly: +7 days
    - monthly: +1 month (e.g., Jan 31 -> Feb 28/29)
    - yearly: +1 year (e.g., Feb 29, 2024 -> Feb 28, 2025)
    """
    freq = frequency.strip().lower()
    if freq not in VALID_FREQUENCIES:
        raise ValueError(f"Invalid billing frequency '{frequency}'. Must be one of: {', '.join(sorted(VALID_FREQUENCIES))}")

    if freq == "daily":
        return from_date + timedelta(days=1)
    elif freq == "weekly":
        return from_date + timedelta(weeks=1)
    elif freq == "monthly":
        return from_date + relativedelta(months=1)
    elif freq == "yearly":
        return from_date + relativedelta(years=1)
    else:
        raise ValueError(f"Unsupported frequency: {freq}")


def compute_billing_period(period_start: date, frequency: str) -> Tuple[date, date]:
    """
    Returns (period_start, period_end) where period_end is the day before the next billing date.
    Example for monthly starting 2026-01-01:
    period_start = 2026-01-01, period_end = 2026-01-31
    """
    next_date = compute_next_billing_date(period_start, frequency)
    period_end = next_date - timedelta(days=1)
    return period_start, period_end


def calculate_line_item(unit_price: float, quantity: int) -> float:
    """Calculates subtotal for a single line item with precise 2-decimal rounding."""
    if quantity < 1:
        raise ValueError("Quantity must be at least 1.")
    if unit_price < 0:
        raise ValueError("Unit price cannot be negative.")
    return round_currency(Decimal(str(unit_price)) * Decimal(quantity))


def calculate_subscription_totals(
    items: List[Dict[str, Any]],
    plan_base_price: float = 0.0,
    tax_percentage: float = 18.0,
    discount_amount: float = 0.0
) -> Dict[str, float]:
    """
    Calculates subtotal, tax amount, discount amount, and total amount
    for a subscription or quote.
    """
    items_subtotal = Decimal("0.00")
    for item in items:
        price = Decimal(str(item.get("unit_price", 0.0)))
        qty = Decimal(str(item.get("quantity", 1)))
        items_subtotal += (price * qty)

    # Add plan base recurring fee if any
    plan_fee = Decimal(str(plan_base_price))
    subtotal_dec = items_subtotal + plan_fee

    # Calculate discount
    discount_dec = Decimal(str(discount_amount))
    if discount_dec > subtotal_dec:
        discount_dec = subtotal_dec  # Discount cannot exceed subtotal

    taxable_amount = max(Decimal("0.00"), subtotal_dec - discount_dec)
    tax_pct_dec = Decimal(str(tax_percentage)) / Decimal("100.00")
    tax_dec = (taxable_amount * tax_pct_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    total_dec = (taxable_amount + tax_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "subtotal": float(subtotal_dec.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "discount_amount": float(discount_dec.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "tax_amount": float(tax_dec),
        "total_amount": float(total_dec)
    }
