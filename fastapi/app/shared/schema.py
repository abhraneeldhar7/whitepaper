from datetime import datetime
from enum import StrEnum
from typing import Optional

from sqlalchemy import VARCHAR
from sqlmodel import Field, SQLModel


# ── User ──

class User(SQLModel, table=True):
    __tablename__ = "users"

    userId: str = Field(primary_key=True)
    name: str
    avatarUrl: Optional[str] = None
    email: str
    username: str = Field(unique=True)
    bio: str
    createdAt: datetime
    updatedAt: datetime


# ── Clerk custom claims (NOT a table) ──

class ClerkUserRole(SQLModel):
    role: str
    entityId: str
    entityType: str


# ── Workspace ──

class WorkspaceType(StrEnum):
    personal = "personal"
    shared = "shared"


class Plan(StrEnum):
    free = "free"
    pro = "pro"
    enterprise = "enterprise"


class WorkspaceStatus(StrEnum):
    active = "active"
    locked = "locked"


class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"

    ownerId: str
    workspaceId: str = Field(primary_key=True)
    workspaceSlug: Optional[str] = Field(default=None, unique=True)
    workspaceType: WorkspaceType = Field(sa_type=VARCHAR(20))
    workspaceName: str
    plan: Plan = Field(sa_type=VARCHAR(20))
    status: WorkspaceStatus = Field(sa_type=VARCHAR(20))
    createdAt: datetime
    updatedAt: datetime


# ── Subscription ──

class SubscriptionPlan(StrEnum):
    pro = "pro"
    enterprise = "enterprise"


class SubscriptionStatus(StrEnum):
    active = "active"
    past_due = "past_due"
    canceled = "canceled"
    incomplete = "incomplete"


class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"

    subId: str = Field(primary_key=True)
    workspaceId: str
    plan: SubscriptionPlan = Field(sa_type=VARCHAR(20))
    razorpaySubscriptionId: Optional[str] = None
    razorpayCustomerId: Optional[str] = None
    status: SubscriptionStatus = Field(sa_type=VARCHAR(20))
    startsAt: datetime
    endsAt: Optional[datetime] = None
    lastPaymentAt: Optional[datetime] = None
    nextPaymentAt: Optional[datetime] = None
    createdAt: datetime


# ── Entity Members ──

class EntityType(StrEnum):
    workspace = "workspace"
    project = "project"
    collection = "collection"
    paper = "paper"


class MemberRole(StrEnum):
    owner = "owner"
    admin = "admin"
    member = "member"
    viewer = "viewer"


class EntityMembers(SQLModel, table=True):
    __tablename__ = "entity_members"

    workspaceId: str = Field(primary_key=True)
    entityId: str = Field(primary_key=True)
    userId: str = Field(primary_key=True)
    entityType: EntityType = Field(sa_type=VARCHAR(20))
    role: MemberRole = Field(sa_type=VARCHAR(20))
    grantedAt: datetime
    grantedBySystem: bool
    grantedById: Optional[str] = None


# ── Project ──

class Visibility(StrEnum):
    private = "private"
    public = "public"


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    workspaceId: str
    projectId: str = Field(primary_key=True)
    name: str
    publicSlug: str
    description: str
    logoUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    visibility: Visibility = Field(sa_type=VARCHAR(20))
    createdAt: datetime
    updatedAt: datetime


# ── Collection ──

class Collection(SQLModel, table=True):
    __tablename__ = "collections"

    workspaceId: str
    projectId: str
    collectionId: str = Field(primary_key=True)
    name: str
    publicSlug: str
    description: str
    bannerUrl: Optional[str] = None
    visibility: Visibility = Field(sa_type=VARCHAR(20))
    createdAt: datetime
    updatedAt: datetime


# ── Paper ──

class Paper(SQLModel, table=True):
    __tablename__ = "papers"

    workspaceId: str
    projectId: Optional[str] = None
    collectionId: Optional[str] = None
    paperId: str = Field(primary_key=True)
    title: str
    publicSlug: str
    thumbnailUrl: Optional[str] = None
    visibility: Visibility = Field(sa_type=VARCHAR(20))
    createdAt: datetime
    updatedAt: datetime


# ── Paper Content ──

class PaperContent(SQLModel, table=True):
    __tablename__ = "paper_contents"

    paperId: str = Field(primary_key=True, foreign_key="papers.paperId")
    content: str
