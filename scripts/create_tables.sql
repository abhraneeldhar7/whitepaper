-- ── Users ──
CREATE TABLE IF NOT EXISTS "users" (
    "userId" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "avatarUrl" VARCHAR(500),
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "bio" TEXT NOT NULL DEFAULT '',
    "createdAt" DATE NOT NULL,
    "updatedAt" DATE NOT NULL
);

-- ── Workspaces ──
CREATE TABLE IF NOT EXISTS "workspaces" (
    "ownerId" VARCHAR(255) NOT NULL REFERENCES "users"("userId") ON DELETE CASCADE,
    "workspaceId" VARCHAR(32) PRIMARY KEY,
    "workspaceSlug" VARCHAR(255),
    "workspaceType" VARCHAR(20) NOT NULL,
    "workspaceName" VARCHAR(255) NOT NULL,
    "plan" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "createdAt" DATE NOT NULL,
    "updatedAt" DATE NOT NULL
);

-- ── Entity Members ──
CREATE TABLE IF NOT EXISTS "entity_members" (
    "workspaceId" VARCHAR(32) NOT NULL REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE,
    "entityId" VARCHAR(32) NOT NULL,
    "userId" VARCHAR(255) NOT NULL REFERENCES "users"("userId") ON DELETE CASCADE,
    "entityType" VARCHAR(20) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "grantedAt" DATE NOT NULL,
    "grantedBySystem" BOOLEAN NOT NULL,
    "grantedById" VARCHAR(255) REFERENCES "users"("userId") ON DELETE SET NULL,
    PRIMARY KEY ("workspaceId", "entityId", "userId")
);

-- ── Projects ──
CREATE TABLE IF NOT EXISTS "projects" (
    "workspaceId" VARCHAR(32) NOT NULL REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE,
    "projectId" VARCHAR(32) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "publicSlug" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" VARCHAR(500),
    "bannerUrl" VARCHAR(500),
    "visibility" VARCHAR(20) NOT NULL,
    "createdAt" DATE NOT NULL,
    "updatedAt" DATE NOT NULL
);

-- ── Collections ──
CREATE TABLE IF NOT EXISTS "collections" (
    "workspaceId" VARCHAR(32) NOT NULL REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE,
    "projectId" VARCHAR(32) NOT NULL REFERENCES "projects"("projectId") ON DELETE CASCADE,
    "collectionId" VARCHAR(32) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "publicSlug" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "bannerUrl" VARCHAR(500),
    "visibility" VARCHAR(20) NOT NULL,
    "createdAt" DATE NOT NULL,
    "updatedAt" DATE NOT NULL
);

-- ── Papers ──
CREATE TABLE IF NOT EXISTS "papers" (
    "workspaceId" VARCHAR(32) NOT NULL REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE,
    "projectId" VARCHAR(32) REFERENCES "projects"("projectId") ON DELETE SET NULL,
    "collectionId" VARCHAR(32) REFERENCES "collections"("collectionId") ON DELETE SET NULL,
    "paperId" VARCHAR(32) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "publicSlug" VARCHAR(255) NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    "visibility" VARCHAR(20) NOT NULL,
    "createdAt" DATE NOT NULL,
    "updatedAt" DATE NOT NULL
);

-- ── Paper Content ──
CREATE TABLE IF NOT EXISTS "paper_contents" (
    "paperId" VARCHAR(32) PRIMARY KEY REFERENCES "papers"("paperId") ON DELETE CASCADE,
    "content" TEXT NOT NULL
);

-- ── Subscriptions ──
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "subId" VARCHAR(255) PRIMARY KEY,
    "workspaceId" VARCHAR(32) NOT NULL REFERENCES "workspaces"("workspaceId") ON DELETE CASCADE,
    "plan" VARCHAR(20) NOT NULL,
    "razorpaySubscriptionId" VARCHAR(255),
    "razorpayCustomerId" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "startsAt" TIMESTAMP NOT NULL,
    "endsAt" TIMESTAMP,
    "lastPaymentAt" TIMESTAMP,
    "nextPaymentAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL
);
