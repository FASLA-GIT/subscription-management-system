from datetime import date, timedelta
from decimal import Decimal
from app.models.finance import Discount, DiscountType
from app.services.discount_service import DiscountService

def test_percentage_discount_calculation():
    discount = Discount(
        code="SAVE10",
        name="10% Off",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10.00"),
        is_active=True
    )
    # 10% of 2560 = 256.00
    savings = DiscountService.calculate_discount_amount(discount, Decimal("2560.00"))
    assert savings == Decimal("256.00")

def test_fixed_discount_calculation():
    discount = Discount(
        code="FLAT500",
        name="Flat 500 Off",
        discount_type=DiscountType.FIXED,
        discount_value=Decimal("500.00"),
        is_active=True
    )
    savings = DiscountService.calculate_discount_amount(discount, Decimal("2560.00"))
    assert savings == Decimal("500.00")

def test_fixed_discount_capped_at_subtotal():
    discount = Discount(
        code="MEGA500",
        name="500 Off",
        discount_type=DiscountType.FIXED,
        discount_value=Decimal("500.00"),
        is_active=True
    )
    # Subtotal is only 300; discount cannot exceed 300
    savings = DiscountService.calculate_discount_amount(discount, Decimal("300.00"))
    assert savings == Decimal("300.00")

def test_discount_minimum_purchase_threshold():
    discount = Discount(
        code="MIN2000",
        name="Min 2000 Required",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("15.00"),
        min_purchase_amount=Decimal("2000.00"),
        is_active=True
    )
    # Eligible with 2500
    eligible, _ = DiscountService.is_discount_eligible(discount, Decimal("2500.00"), 1)
    assert eligible is True

    # Ineligible with 1500
    eligible, msg = DiscountService.is_discount_eligible(discount, Decimal("1500.00"), 1)
    assert eligible is False
    assert "Minimum purchase amount" in msg

def test_discount_expiry_date():
    yesterday = date.today() - timedelta(days=1)
    discount = Discount(
        code="EXPIRED",
        name="Expired discount",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10.00"),
        end_date=yesterday,
        is_active=True
    )
    eligible, msg = DiscountService.is_discount_eligible(discount, Decimal("2000.00"), 1)
    assert eligible is False
    assert "expired" in msg

def test_discount_max_uses_limit():
    discount = Discount(
        code="LIMITED",
        name="Limited to 5 uses",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10.00"),
        max_uses=5,
        used_count=5,
        is_active=True
    )
    eligible, msg = DiscountService.is_discount_eligible(discount, Decimal("2000.00"), 1)
    assert eligible is False
    assert "maximum usage limit" in msg
