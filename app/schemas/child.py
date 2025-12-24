"""Child profile request/response schemas."""
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class ChildCreate(BaseModel):
    """Create child profile request."""
    name: str = Field(min_length=1, max_length=255)
    date_of_birth: date
    gender: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class ChildUpdate(BaseModel):
    """Update child profile request."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class ChildResponse(BaseModel):
    """Child profile response."""
    id: int
    name: str
    date_of_birth: date
    gender: Optional[str]
    notes: Optional[str]
    age_years: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
