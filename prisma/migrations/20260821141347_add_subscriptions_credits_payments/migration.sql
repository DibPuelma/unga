-- AlterTable
ALTER TABLE "users" ADD COLUMN     "extraCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "planCanceledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RegisteredCards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tbkUser" TEXT,
    "oneclickRegistrationEmail" TEXT,
    "registrationToken" TEXT,
    "authorizationCode" TEXT,
    "cardType" TEXT,
    "cardNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegisteredCards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "registeredCardId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "paymentFailureReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "type" TEXT NOT NULL,
    "buyOrder" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "authorizationCode" TEXT,
    "responseCode" INTEGER,
    "creditsGranted" INTEGER,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredCards_registrationToken_key" ON "RegisteredCards"("registrationToken");

-- CreateIndex
CREATE INDEX "RegisteredCards_userId_idx" ON "RegisteredCards"("userId");

-- CreateIndex
CREATE INDEX "Subscriptions_userId_idx" ON "Subscriptions"("userId");

-- CreateIndex
CREATE INDEX "Subscriptions_status_currentPeriodEnd_idx" ON "Subscriptions"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Subscriptions_status_nextRetryAt_idx" ON "Subscriptions"("status", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_buyOrder_key" ON "Payments"("buyOrder");

-- CreateIndex
CREATE INDEX "Payments_userId_idx" ON "Payments"("userId");

-- CreateIndex
CREATE INDEX "CreditTransactions_userId_createdAt_idx" ON "CreditTransactions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransactions_relatedId_reason_key" ON "CreditTransactions"("relatedId", "reason");

-- AddForeignKey
ALTER TABLE "RegisteredCards" ADD CONSTRAINT "RegisteredCards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "Subscriptions_registeredCardId_fkey" FOREIGN KEY ("registeredCardId") REFERENCES "RegisteredCards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransactions" ADD CONSTRAINT "CreditTransactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remap legacy B2C plans to the new single-plan model (clean slate)
UPDATE "users" SET "plan" = 'free' WHERE "plan" IN ('trial', 'individualStart', 'individualGrow', 'individualStandOut');
