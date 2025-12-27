"""Child profile API endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildUpdate, ChildResponse
from app.dependencies import get_current_user

router = APIRouter()


@router.post("", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child(
    child_data: ChildCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new child profile.

    Args:
        child_data: Child profile data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created child profile
    """
    child = Child(
        parent_id=current_user.id,
        name=child_data.name,
        date_of_birth=child_data.date_of_birth,
        gender=child_data.gender,
        notes=child_data.notes
    )

    db.add(child)
    await db.commit()
    await db.refresh(child)

    return ChildResponse(
        id=child.id,
        name=child.name,
        date_of_birth=child.date_of_birth,
        gender=child.gender,
        notes=child.notes,
        age_years=child.age_years,
        created_at=child.created_at.isoformat(),
        updated_at=child.updated_at.isoformat()
    )


@router.get("", response_model=List[ChildResponse])
async def list_children(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all children for the current user.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of child profiles
    """
    result = await db.execute(
        select(Child).where(Child.parent_id == current_user.id)
    )
    children = result.scalars().all()

    return [
        ChildResponse(
            id=child.id,
            name=child.name,
            date_of_birth=child.date_of_birth,
            gender=child.gender,
            notes=child.notes,
            age_years=child.age_years,
            created_at=child.created_at.isoformat(),
            updated_at=child.updated_at.isoformat()
        )
        for child in children
    ]


@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific child profile.

    Args:
        child_id: Child ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Child profile

    Raises:
        HTTPException: If child not found or not owned by user
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this child profile"
        )

    return ChildResponse(
        id=child.id,
        name=child.name,
        date_of_birth=child.date_of_birth,
        gender=child.gender,
        notes=child.notes,
        age_years=child.age_years,
        created_at=child.created_at.isoformat(),
        updated_at=child.updated_at.isoformat()
    )


@router.put("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: int,
    child_data: ChildUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a child profile.

    Args:
        child_id: Child ID
        child_data: Updated child data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated child profile

    Raises:
        HTTPException: If child not found or not owned by user
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this child profile"
        )

    # Update fields if provided
    if child_data.name is not None:
        child.name = child_data.name
    if child_data.date_of_birth is not None:
        child.date_of_birth = child_data.date_of_birth
    if child_data.gender is not None:
        child.gender = child_data.gender
    if child_data.notes is not None:
        child.notes = child_data.notes

    await db.commit()
    await db.refresh(child)

    return ChildResponse(
        id=child.id,
        name=child.name,
        date_of_birth=child.date_of_birth,
        gender=child.gender,
        notes=child.notes,
        age_years=child.age_years,
        created_at=child.created_at.isoformat(),
        updated_at=child.updated_at.isoformat()
    )


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a child profile (GDPR compliance).

    Args:
        child_id: Child ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If child not found or not owned by user
    """
    result = await db.execute(
        select(Child).where(Child.id == child_id)
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this child profile"
        )

    db.delete(child)
    await db.commit()

    return None
