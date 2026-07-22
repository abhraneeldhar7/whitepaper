// ── Enums ──

export type WorkspaceType = "personal" | "shared";
export type Plan = "free" | "pro" | "enterprise";
export type WorkspaceStatus = "active" | "locked";
export type SubscriptionPlan = "pro" | "enterprise";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete";
export type EntityType = "workspace" | "project" | "collection" | "paper";
export type MemberRole = "owner" | "admin" | "member" | "viewer";
export type Visibility = "private" | "public";

// ── Clerk ──

export interface ClerkUserRole {
  role: string;
  entityId: string;
  entityType: EntityType;
}

// ── User ──

export interface User {
  userId: string;
  name: string;
  avatarUrl: string | null;
  email: string;
  username: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

// ── Workspace ──

export interface Workspace {
  ownerId: string;
  workspaceId: string;
  workspaceSlug: string | null;
  workspaceType: WorkspaceType;
  workspaceName: string;
  plan: Plan;
  status: WorkspaceStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Subscription ──

export interface Subscription {
  subId: string;
  workspaceId: string;
  plan: SubscriptionPlan;
  razorpaySubscriptionId: string | null;
  razorpayCustomerId: string | null;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string | null;
  lastPaymentAt: string | null;
  nextPaymentAt: string | null;
  createdAt: string;
}

// ── Entity Members ──

export interface EntityMembers {
  workspaceId: string;
  entityId: string;
  userId: string;
  entityType: EntityType;
  role: MemberRole;
  grantedAt: string;
  grantedBySystem: boolean;
  grantedById: string | null;
}

// ── Project ──

export interface Project {
  workspaceId: string;
  projectId: string;
  name: string;
  publicSlug: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

// ── Collection ──

export interface Collection {
  workspaceId: string;
  projectId: string;
  collectionId: string;
  name: string;
  publicSlug: string;
  description: string;
  bannerUrl: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

// ── Paper ──

export interface Paper {
  workspaceId: string;
  projectId: string | null;
  collectionId: string | null;
  paperId: string;
  title: string;
  publicSlug: string;
  thumbnailUrl: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

// ── Paper Content ──

export interface PaperContent {
  paperId: string;
  content: string;
}

// ── Member with User ──

export interface MemberWithUser {
  user: User;
  membership: EntityMembers;
}
