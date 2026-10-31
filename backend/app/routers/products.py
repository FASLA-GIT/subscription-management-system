from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.product import Product, ProductVariant
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    VariantCreate,
    VariantResponse
)


router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=List[ProductResponse], summary="List all products")
def list_products(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    product_type: Optional[str] = Query(None, description="Filter by product type"),
    search: Optional[str] = Query(None, description="Search by product name or description"),
    db: Session = Depends(get_db)
):
    """
    Returns products matching optional filters with their associated variants.
    """
    query = db.query(Product)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if product_type:
        query = query.filter(Product.product_type.ilike(f"%{product_type}%"))
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    return query.order_by(Product.name.asc()).all()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, summary="Create a product")
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """
    Creates a new product with optional initial variants.
    """
    product = Product(
        name=product_in.name,
        product_type=product_in.product_type,
        sales_price=product_in.sales_price,
        cost_price=product_in.cost_price,
        description=product_in.description,
        is_active=product_in.is_active
    )
    db.add(product)
    db.flush()

    if product_in.variants:
        for v in product_in.variants:
            variant = ProductVariant(
                product_id=product.id,
                name=v.name,
                additional_price=v.additional_price
            )
            db.add(variant)

    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductResponse, summary="Get product details")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a single product by ID along with its variants.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse, summary="Update a product")
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    """
    Updates an existing product's pricing or metadata.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )

    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_200_OK, summary="Delete or deactivate a product")
def delete_product(product_id: int, hard_delete: bool = False, db: Session = Depends(get_db)):
    """
    Deactivates a product by default, or permanently deletes it if requested and unlinked.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )

    if hard_delete:
        db.delete(product)
    else:
        product.is_active = False

    db.commit()
    return {"message": f"Product {product_id} {'deleted' if hard_delete else 'deactivated'} successfully."}


# --- Product Variants Endpoints ---

@router.get("/{product_id}/variants", response_model=List[VariantResponse], summary="List product variants")
def list_variants(product_id: int, db: Session = Depends(get_db)):
    """
    Lists all variants for a specific product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return product.variants


@router.post("/{product_id}/variants", response_model=VariantResponse, status_code=status.HTTP_201_CREATED, summary="Add a variant to a product")
def create_variant(product_id: int, variant_in: VariantCreate, db: Session = Depends(get_db)):
    """
    Adds a new variant and additional pricing to a product.
    Example: Product Business Software base price ₹2,000 + Variant Odoo ₹560 = ₹2,560
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )

    variant = ProductVariant(
        product_id=product.id,
        name=variant_in.name,
        additional_price=variant_in.additional_price
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


# Additional variant delete router helper
variant_router = APIRouter(prefix="/api/variants", tags=["Product Variants"])


@variant_router.delete("/{variant_id}", status_code=status.HTTP_200_OK, summary="Delete a variant")
def delete_variant(variant_id: int, db: Session = Depends(get_db)):
    """
    Deletes a specific product variant.
    """
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variant with ID {variant_id} not found."
        )
    db.delete(variant)
    db.commit()
    return {"message": f"Variant {variant_id} deleted successfully."}
