from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.finance import Discount, DiscountType

class DiscountService:
    @staticmethod
    def is_discount_eligible(
        discount: Discount,
        subtotal: Decimal,
        quantity: int,
        target_date: Optional[date] = None,
        product_id: Optional[int] = None,
        plan_id: Optional[int] = None
    ) -> Tuple[bool, str]:
        """
        Validates if a discount rule can be applied based on:
        - Active status
        - Usage limits (max_uses vs used_count)
        - Date range validity (start_date, end_date)
        - Minimum purchase amount
        - Minimum quantity
        - Product / Plan scope
        """
        if target_date is None:
            target_date = date.today()

        if not discount.is_active:
            return False, f"Discount code '{discount.code}' is inactive."

        if discount.max_uses is not None and discount.used_count >= discount.max_uses:
            return False, f"Discount code '{discount.code}' has reached its maximum usage limit."

        if discount.start_date and target_date < discount.start_date:
            return False, f"Discount code '{discount.code}' is not valid until {discount.start_date}."

        if discount.end_date and target_date > discount.end_date:
            return False, f"Discount code '{discount.code}' expired on {discount.end_date}."

        if discount.min_purchase_amount and subtotal < discount.min_purchase_amount:
            return False, f"Minimum purchase amount of ₹{discount.min_purchase_amount} required (current: ₹{subtotal})."

        if discount.min_quantity and quantity < discount.min_quantity:
            return False, f"Minimum quantity of {discount.min_quantity} required (current: {quantity})."

        if discount.applicable_product_id and product_id and discount.applicable_product_id != product_id:
            return False, "Discount is not applicable to the specified product."

        if discount.applicable_plan_id and plan_id and discount.applicable_plan_id != plan_id:
            return False, "Discount is not applicable to the specified plan."

        return True, "Eligible"

    @classmethod
    def calculate_discount_amount(cls, discount: Discount, subtotal: Decimal) -> Decimal:
        """
        Calculates the discount amount using Decimal precision.
        Never exceeds the subtotal.
        """
        if subtotal <= Decimal("0.00"):
            return Decimal("0.00")

        if discount.discount_type == DiscountType.PERCENTAGE:
            pct = Decimal(str(discount.discount_value))
            amt = (subtotal * (pct / Decimal("100.00"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            return min(amt, subtotal)
        else:
            # Fixed amount discount
            fixed_val = Decimal(str(discount.discount_value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            return min(fixed_val, subtotal)

    @classmethod
    def find_best_applicable_discount(
        cls,
        db: Session,
        subtotal: Decimal,
        quantity: int,
        target_date: Optional[date] = None,
        product_id: Optional[int] = None,
        plan_id: Optional[int] = None
    ) -> Optional[Tuple[Discount, Decimal]]:
        """
        Scans all active discounts and picks the one offering the highest savings.
        """
        active_discounts = db.query(Discount).filter(Discount.is_active == True).all()
        best_discount = None
        best_savings = Decimal("0.00")

        for disc in active_discounts:
            eligible, _ = cls.is_discount_eligible(
                discount=disc,
                subtotal=subtotal,
                quantity=quantity,
                target_date=target_date,
                product_id=product_id,
                plan_id=plan_id
            )
            if eligible:
                savings = cls.calculate_discount_amount(disc, subtotal)
                if savings > best_savings:
                    best_savings = savings
                    best_discount = disc

        if best_discount and best_savings > Decimal("0.00"):
            return best_discount, best_savings
        return None
