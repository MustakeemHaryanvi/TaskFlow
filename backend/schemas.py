from pydantic import BaseModel, EmailStr
from typing import Optional


# =========================================================
# USER SCHEMAS
# =========================================================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


# =========================================================
# LOGIN SCHEMA
# =========================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# =========================================================
# PROJECT SCHEMAS
# =========================================================

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: int


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int

    class Config:
        from_attributes = True


# =========================================================
# TASK SCHEMAS
# =========================================================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "Pending"
    priority: str = "Medium"
    project_id: int
    assigned_user_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project_id: Optional[int] = None
    assigned_user_id: Optional[int] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    project_id: int
    assigned_user_id: Optional[int]

    class Config:
        from_attributes = True