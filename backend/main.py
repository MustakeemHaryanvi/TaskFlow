from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status
)

from fastapi.middleware.cors import CORSMiddleware

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session

from jose import jwt, JWTError

from datetime import datetime, timedelta, timezone

import os
import bcrypt

from backend.database import Base, engine, get_db
from backend import models

from backend.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="TaskFlow API",
    description="TaskFlow Task & Project Management API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],

    allow_credentials=False,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# JWT SETTINGS
# =========================================================

SECRET_KEY = os.getenv(
    "TASKFLOW_SECRET_KEY",
    "taskflow-development-secret-change-this"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# SECURITY
# =========================================================

security = HTTPBearer()


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "Welcome to TaskFlow!",
        "status": "API Running"
    }


# =========================================================
# CREATE JWT TOKEN
# =========================================================

def create_access_token(
    user_id: int,
    email: str
):

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        "user_id": user_id,
        "email": email,
        "exp": expire
    }

    access_token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return access_token


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        email = payload.get("email")

        if user_id is None or email is None:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists"
        )

    return user


# =========================================================
# CREATE USER / REGISTER
# =========================================================

@app.post(
    "/users",
    response_model=UserResponse
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    # Check existing email

    existing_user = (
        db.query(models.User)
        .filter(
            models.User.email == user.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    # Password validation

    if len(user.password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )


    # Hash password

    password_bytes = user.password.encode(
        "utf-8"
    )

    hashed_password = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    hashed_password = hashed_password.decode(
        "utf-8"
    )


    # Create user

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user


# =========================================================
# GET ALL USERS
# =========================================================

@app.get(
    "/users",
    response_model=list[UserResponse]
)
def get_users(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    users = (
        db.query(models.User)
        .all()
    )

    return users


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):

    # Find user

    user = (
        db.query(models.User)
        .filter(
            models.User.email == login_data.email
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


    # Check password

    password_bytes = (
        login_data.password.encode("utf-8")
    )

    stored_password = (
        user.password.encode("utf-8")
    )

    password_correct = bcrypt.checkpw(
        password_bytes,
        stored_password
    )

    if not password_correct:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


    # Create JWT

    access_token = create_access_token(
        user_id=user.id,
        email=user.email
    )


    return {

        "message": "Login successful",

        "access_token": access_token,

        "token_type": "bearer",

        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,

        "user": {

            "id": user.id,

            "name": user.name,

            "email": user.email

        }

    }


# =========================================================
# CURRENT USER
# =========================================================

@app.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):

    return {

        "id": current_user.id,

        "name": current_user.name,

        "email": current_user.email

    }


# =========================================================
# CREATE PROJECT
# =========================================================

@app.post(
    "/projects",
    response_model=ProjectResponse
)
def create_project(
    project: ProjectCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Security:
    # Project owner must be logged-in user

    if project.owner_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You can only create projects for yourself"
        )


    new_project = models.Project(

        name=project.name,

        description=project.description,

        owner_id=current_user.id

    )

    db.add(new_project)

    db.commit()

    db.refresh(new_project)

    return new_project


# =========================================================
# GET ALL PROJECTS
# =========================================================

@app.get(
    "/projects",
    response_model=list[ProjectResponse]
)
def get_projects(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    projects = (
        db.query(models.Project)
        .filter(
            models.Project.owner_id == current_user.id
        )
        .all()
    )

    return projects


# =========================================================
# GET SINGLE PROJECT
# =========================================================

@app.get(
    "/projects/{project_id}",
    response_model=ProjectResponse
)
def get_project(
    project_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project


# =========================================================
# UPDATE PROJECT
# =========================================================

@app.put(
    "/projects/{project_id}",
    response_model=ProjectResponse
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )


    if project_data.name is not None:

        project.name = project_data.name


    if project_data.description is not None:

        project.description = (
            project_data.description
        )


    db.commit()

    db.refresh(project)

    return project


# =========================================================
# DELETE PROJECT
# =========================================================

@app.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )


    # Find tasks

    tasks = (
        db.query(models.Task)
        .filter(
            models.Task.project_id == project_id
        )
        .all()
    )


    # Delete tasks

    for task in tasks:

        db.delete(task)


    # Delete project

    db.delete(project)

    db.commit()


    return {

        "message": "Project deleted successfully",

        "project_id": project_id

    }


# =========================================================
# CREATE TASK
# =========================================================

@app.post(
    "/tasks",
    response_model=TaskResponse
)
def create_task(
    task: TaskCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check project belongs to current user

    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == task.project_id,
            models.Project.owner_id == current_user.id
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )


    # Check assigned user

    if task.assigned_user_id is not None:

        user = (
            db.query(models.User)
            .filter(
                models.User.id ==
                task.assigned_user_id
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail="Assigned user not found"
            )


    # Create task

    new_task = models.Task(

        title=task.title,

        description=task.description,

        status=task.status,

        priority=task.priority,

        project_id=task.project_id,

        assigned_user_id=task.assigned_user_id

    )

    db.add(new_task)

    db.commit()

    db.refresh(new_task)

    return new_task


# =========================================================
# GET ALL TASKS
# =========================================================

@app.get(
    "/tasks",
    response_model=list[TaskResponse]
)
def get_tasks(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    tasks = (

        db.query(models.Task)

        .join(
            models.Project,
            models.Task.project_id ==
            models.Project.id
        )

        .filter(
            models.Project.owner_id ==
            current_user.id
        )

        .all()

    )

    return tasks


# =========================================================
# GET SINGLE TASK
# =========================================================

@app.get(
    "/tasks/{task_id}",
    response_model=TaskResponse
)
def get_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    task = (

        db.query(models.Task)

        .join(
            models.Project,
            models.Task.project_id ==
            models.Project.id
        )

        .filter(
            models.Task.id == task_id,
            models.Project.owner_id ==
            current_user.id
        )

        .first()

    )

    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


# =========================================================
# UPDATE TASK
# =========================================================

@app.put(
    "/tasks/{task_id}",
    response_model=TaskResponse
)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    task = (

        db.query(models.Task)

        .join(
            models.Project,
            models.Task.project_id ==
            models.Project.id
        )

        .filter(
            models.Task.id == task_id,
            models.Project.owner_id ==
            current_user.id
        )

        .first()

    )

    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    if task_data.title is not None:

        task.title = task_data.title


    if task_data.description is not None:

        task.description = task_data.description


    if task_data.status is not None:

        task.status = task_data.status


    if task_data.priority is not None:

        task.priority = task_data.priority


    if task_data.project_id is not None:

        project = (

            db.query(models.Project)

            .filter(
                models.Project.id ==
                task_data.project_id,

                models.Project.owner_id ==
                current_user.id
            )

            .first()

        )

        if not project:

            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

        task.project_id = task_data.project_id


    if task_data.assigned_user_id is not None:

        user = (

            db.query(models.User)

            .filter(
                models.User.id ==
                task_data.assigned_user_id
            )

            .first()

        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail="Assigned user not found"
            )

        task.assigned_user_id = (
            task_data.assigned_user_id
        )


    db.commit()

    db.refresh(task)

    return task


# =========================================================
# DELETE TASK
# =========================================================

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):

    task = (

        db.query(models.Task)

        .join(
            models.Project,
            models.Task.project_id ==
            models.Project.id
        )

        .filter(
            models.Task.id == task_id,
            models.Project.owner_id ==
            current_user.id
        )

        .first()

    )

    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    db.delete(task)

    db.commit()


    return {

        "message": "Task deleted successfully",

        "task_id": task_id

    }