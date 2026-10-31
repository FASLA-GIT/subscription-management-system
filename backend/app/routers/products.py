from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import Product, Variant
from app.schemas.subscription import (
    ProductCreate, ProductResponse,
    VariantCreate, VariantResponse
)

router = APIRouter(prefix="/products", tags=["Products & Variants"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    active_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Lists products in the catalog."""
    query = db.query(Product)
    if active_only:
        query = query.filter(Product.is_active == True)
    return query.all()

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    """Creates a new catalog product."""
    product = Product(
        name=payload.name,
        product_type=payload.product_type,
        sales_price=payload.sales_price,
        cost_price=payload.cost_price,
        description=payload.description,
        is_active=payload.is_active
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    """Retrieves product details by ID."""
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product

@router.put("/{id}", response_model=ProductResponse)
def update_product(id: int, payload: ProductCreate, db: Session = Depends(get_db)):
    """Updates a product."""
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    for field, val in payload.dict().items():
        setattr(product, field, val)
    db.commit()
    db.refresh(product)
    return product

@router.post("/{product_id}/variants", response_model=VariantResponse, status_code=status.HTTP_201_CREATED)
def add_product_variant(product_id: int, payload: VariantCreate, db: Session = Depends(get_db)):
    """Adds a variant to a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    variant = Variant(
        product_id=product_id,
        variant_name=payload.variant_name,
        additional_price=payload.additional_price
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant
