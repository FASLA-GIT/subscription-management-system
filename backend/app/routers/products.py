from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user, require_admin
from app.models.product import Product, Variant
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    VariantCreate,
    VariantResponse,
)

router = APIRouter(prefix="/products", tags=["Products & Variants"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    is_active: Optional[bool] = Query(None),
    product_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List products with variants. Available to all authenticated users."""
    query = db.query(Product)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if product_type:
        query = query.filter(Product.product_type == product_type)

    return query.order_by(Product.name.asc()).all()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin endpoint to create a new product and optional variants."""
    product = Product(
        name=payload.name,
        product_type=payload.product_type,
        sales_price=payload.sales_price,
        cost_price=payload.cost_price,
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(product)
    db.flush()

    if payload.variants:
        for v in payload.variants:
            variant = Variant(
                product_id=product.id,
                variant_name=v.variant_name,
                additional_price=v.additional_price,
                sku=v.sku,
                is_active=v.is_active,
            )
            db.add(variant)

    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single product with variants by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin endpoint to update product details."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)
    return product


@router.post("/{product_id}/variants", response_model=VariantResponse, status_code=status.HTTP_201_CREATED)
def add_product_variant(
    product_id: int,
    payload: VariantCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin endpoint to add a variant to an existing product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    variant = Variant(
        product_id=product.id,
        variant_name=payload.variant_name,
        additional_price=payload.additional_price,
        sku=payload.sku,
        is_active=payload.is_active,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant
