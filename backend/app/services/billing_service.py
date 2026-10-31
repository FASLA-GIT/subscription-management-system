from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List, Tuple
import calendar
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.subscription import Subscription, SubscriptionStatus, BillingFrequency
from app.models.finance import Invoice, InvoiceItem, InvoiceStatus, Discount
from app.services.discount_service import DiscountService

class BillingService:
    @staticmethod
    def calculate_period_end(start_date: date, frequency: BillingFrequency) -> date:
        """
        Calculates the end date of a billing cycle based on frequency.
        - daily: same day
        - weekly: 6 days after start
        - monthly: calendar month minus 1 day (e.g. Oct 1 -> Oct 31)
        - yearly: 1 calendar year minus 1 day
        """
        if frequency == BillingFrequency.DAILY:
            return start_date

        elif frequency == BillingFrequency.WEEKLY:
            return start_date + timedelta(days=6)

        elif frequency == BillingFrequency.MONTHLY:
            # Advance by 1 month
            year = start_date.year + (start_date.month // 12)
            month = (start_date.month % 12) + 1
            # Adjust for variable month lengths (e.g. Jan 31 -> Feb 28)
            max_day_next_month = calendar.monthrange(year, month)[1]
            day = min(start_date.day, max_day_next_month)
            next_month_date = date(year, month, day)
            return next_month_date - timedelta(days=1)

        elif frequency == BillingFrequency.YEARLY:
            try:
                next_year_date = date(start_date.year + 1, start_date.month, start_date.day)
            except ValueError:
                # Handle leap year Feb 29 -> Feb 28
                next_year_date = date(start_date.year + 1, start_date.month, start_date.day - 1)
            return next_year_date - timedelta(days=1)

        return start_date + timedelta(days=30)

    @staticmethod
    def calculate_due_date(issue_date: date, payment_terms: str) -> date:
        """Calculates invoice due date based on payment terms."""
        terms = (payment_terms or "").lower().strip()
        if "receipt" in terms or "immediate" in terms or "0" in terms:
            return issue_date
        elif "15" in terms:
            return issue_date + timedelta(days=15)
        elif "30" in terms:
            return issue_date + timedelta(days=30)
        elif "60" in terms:
            return issue_date + timedelta(days=60)
        else:
            # Default standard terms: Net 15
            return issue_date + timedelta(days=15)

    @classmethod
    def generate_invoice_number(cls, db: Session) -> str:
        """Generates a guaranteed unique, sequential invoice number: INV-YYYYMM-XXXX"""
        now = date.today()
        prefix = f"INV-{now.strftime('%Y%m')}-"
        
        # Get count of invoices matching prefix to generate next sequence
        count = db.query(func.count(Invoice.id)).filter(Invoice.invoice_number.like(f"{prefix}%")).scalar() or 0
        seq = count + 1
        return f"{prefix}{seq:04d}"

    @classmethod
    def check_duplicate_invoice(
        cls, db: Session, subscription_id: int, period_start: date, period_end: date
    ) -> Optional[Invoice]:
        """
        Duplicate invoice prevention:
        Checks whether an invoice has already been generated for this subscription and billing period.
        Excludes cancelled invoices.
        """
        return db.query(Invoice).filter(
            Invoice.subscription_id == subscription_id,
            Invoice.billing_period_start == period_start,
            Invoice.billing_period_end == period_end,
            Invoice.status != InvoiceStatus.CANCELLED
        ).first()

    @classmethod
    def generate_invoice_for_subscription(
        cls,
        db: Session,
        subscription: Subscription,
        as_of_date: Optional[date] = None,
        discount_code: Optional[str] = None,
        auto_discount: bool = True
    ) -> Tuple[Optional[Invoice], Optional[str]]:
        """
        Generates an invoice for a specific subscription.
        Returns (Invoice, None) on success, or (None, reason_string) if skipped/ineligible.
        """
        if as_of_date is None:
            as_of_date = date.today()

        # 1. Eligibility verification
        if subscription.status != SubscriptionStatus.ACTIVE:
            return None, f"Subscription {subscription.subscription_number} is in status '{subscription.status.value}', not 'active'."

        if subscription.expiry_date and as_of_date > subscription.expiry_date:
            return None, f"Subscription {subscription.subscription_number} expired on {subscription.expiry_date}."

        # 2. Determine billing period
        period_start = subscription.next_billing_date or subscription.start_date
        frequency = subscription.plan.billing_frequency if subscription.plan else BillingFrequency.MONTHLY
        period_end = cls.calculate_period_end(period_start, frequency)

        # 3. Duplicate invoice prevention
        duplicate = cls.check_duplicate_invoice(db, subscription.id, period_start, period_end)
        if duplicate:
            return None, f"Duplicate prevented: Invoice {duplicate.invoice_number} already covers period {period_start} to {period_end}."

        # 4. Calculate Subtotal from Subscription Items
        invoice_items_data = []
        subtotal = Decimal("0.00")
        total_quantity = 0

        if subscription.items and len(subscription.items) > 0:
            for sub_item in subscription.items:
                product_name = sub_item.product.name if sub_item.product else "Software Subscription"
                variant_name = sub_item.variant.variant_name if sub_item.variant else None
                unit_price = Decimal(str(sub_item.unit_price)) + Decimal(str(sub_item.additional_price))
                qty = sub_item.quantity
                total_quantity += qty
                line_total = (unit_price * Decimal(str(qty))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                subtotal += line_total

                invoice_items_data.append({
                    "product_id": sub_item.product_id,
                    "product_name": product_name,
                    "variant_name": variant_name,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "line_total": line_total
                })
        else:
            # Fallback to subscription plan base price & quantity
            plan_name = subscription.plan.name if subscription.plan else "Subscription Plan"
            unit_price = Decimal(str(subscription.unit_price or (subscription.plan.price if subscription.plan else Decimal("0.00"))))
            qty = subscription.quantity or 1
            total_quantity = qty
            line_total = (unit_price * Decimal(str(qty))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            subtotal = line_total

            invoice_items_data.append({
                "product_id": None,
                "product_name": plan_name,
                "variant_name": None,
                "quantity": qty,
                "unit_price": unit_price,
                "line_total": line_total
            })

        # 5. Discount Calculation
        discount_applied = None
        discount_amount = Decimal("0.00")

        if discount_code:
            disc = db.query(Discount).filter(Discount.code == discount_code.strip().upper()).first()
            if disc:
                eligible, msg = DiscountService.is_discount_eligible(
                    discount=disc,
                    subtotal=subtotal,
                    quantity=total_quantity,
                    target_date=as_of_date,
                    plan_id=subscription.plan_id
                )
                if eligible:
                    discount_applied = disc
                    discount_amount = DiscountService.calculate_discount_amount(disc, subtotal)
        elif auto_discount:
            best_res = DiscountService.find_best_applicable_discount(
                db=db,
                subtotal=subtotal,
                quantity=total_quantity,
                target_date=as_of_date,
                plan_id=subscription.plan_id
            )
            if best_res:
                discount_applied, discount_amount = best_res

        # If discount applied, increment its usage
        if discount_applied and discount_amount > Decimal("0.00"):
            discount_applied.used_count += 1

        # 6. Automatic Tax Calculation (Precise Decimal)
        taxable_amount = max(Decimal("0.00"), subtotal - discount_amount)
        tax_rate = Decimal(str(subscription.tax_rate or Decimal("18.00")))
        tax_amount = (taxable_amount * (tax_rate / Decimal("100.00"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_amount = (taxable_amount + tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # 7. Dates and Payment Terms
        issue_date = as_of_date
        due_date = cls.calculate_due_date(issue_date, subscription.payment_terms)

        # 8. Create Invoice
        invoice_number = cls.generate_invoice_number(db)
        invoice = Invoice(
            invoice_number=invoice_number,
            customer_id=subscription.customer_id,
            subscription_id=subscription.id,
            billing_period_start=period_start,
            billing_period_end=period_end,
            issue_date=issue_date,
            due_date=due_date,
            subtotal=subtotal,
            discount_id=discount_applied.id if discount_applied else None,
            discount_amount=discount_amount,
            taxable_amount=taxable_amount,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            amount_paid=Decimal("0.00"),
            outstanding_amount=total_amount,
            status=InvoiceStatus.CONFIRMED,
            notes=f"Generated automatically for billing period {period_start} to {period_end}."
        )
        db.add(invoice)
        db.flush()  # Flush to populate invoice.id

        # 9. Create Invoice Items
        for item_data in invoice_items_data:
            item = InvoiceItem(
                invoice_id=invoice.id,
                product_id=item_data["product_id"],
                product_name=item_data["product_name"],
                variant_name=item_data["variant_name"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                line_total=item_data["line_total"]
            )
            db.add(item)

        # 10. Advance Subscription's Next Billing Date
        next_billing = period_end + timedelta(days=1)
        subscription.next_billing_date = next_billing

        db.commit()
        db.refresh(invoice)
        return invoice, None

    @classmethod
    def generate_all_due_invoices(
        cls,
        db: Session,
        as_of_date: Optional[date] = None,
        auto_discount: bool = True
    ) -> Tuple[List[Invoice], List[dict], Decimal]:
        """
        Scans all active subscriptions that are due for billing up to as_of_date.
        Prevents duplicates, applies taxes and discounts, generates invoices, and advances billing cycles.
        """
        if as_of_date is None:
            as_of_date = date.today()

        # Find eligible active subscriptions where next_billing_date is null or <= as_of_date
        due_subscriptions = db.query(Subscription).filter(
            Subscription.status == SubscriptionStatus.ACTIVE,
            (Subscription.next_billing_date == None) | (Subscription.next_billing_date <= as_of_date)
        ).all()

        generated_invoices = []
        skipped = []
        total_invoiced = Decimal("0.00")

        for sub in due_subscriptions:
            inv, reason = cls.generate_invoice_for_subscription(
                db=db,
                subscription=sub,
                as_of_date=as_of_date,
                auto_discount=auto_discount
            )
            if inv:
                generated_invoices.append(inv)
                total_invoiced += inv.total_amount
            else:
                skipped.append({
                    "subscription_id": sub.id,
                    "subscription_number": sub.subscription_number,
                    "reason": reason
                })

        return generated_invoices, skipped, total_invoiced
