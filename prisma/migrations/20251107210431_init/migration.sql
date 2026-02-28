-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "country" TEXT,
    "role" TEXT,
    "plan" TEXT,
    "kidsbookId" TEXT,
    "reference" TEXT,
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "paymentStartedAt" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "selectedFreeTrialPlan" TEXT,
    "seenActivities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "classrooms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "code" TEXT,
    "junjiCode" TEXT,
    "mobilePhone" TEXT,
    "email" TEXT,
    "webpage" TEXT,
    "logo" TEXT,
    "country" TEXT,
    "kidsbookId" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "configuration" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kidsbookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER,
    "type" TEXT,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classes" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "kidsbookId" TEXT,
    "levelId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "mainTeacherId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Students" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "rut" TEXT,
    "birthDate" TIMESTAMP(3),
    "kidsbookId" TEXT,
    "profilePicture" TEXT,
    "classId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "deactivatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objectives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER,
    "coreId" TEXT NOT NULL,
    "curricularObjectiveId" TEXT,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT,

    CONSTRAINT "Objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubObjectives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER,
    "objectiveId" TEXT NOT NULL,
    "coreId" TEXT NOT NULL,
    "curricularObjectiveId" TEXT,
    "institutionId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubObjectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurricularObjectives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "methodology" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurricularObjectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsequentialCurricularObjectives" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "curricularObjectiveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsequentialCurricularObjectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelsOfAchievement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "description" TEXT,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelsOfAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ideaOrigin" TEXT,
    "ideaOriginDetails" TEXT,
    "familyParticipation" TEXT,
    "adultRole" TEXT,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "materials" JSONB NOT NULL DEFAULT '[]',
    "assets" JSONB NOT NULL DEFAULT '{}',
    "fromSuggestion" BOOLEAN DEFAULT false,
    "openToCommunity" BOOLEAN DEFAULT false,
    "sponsorInstitutionId" TEXT,
    "originalSponsorInstitutionId" TEXT,
    "creatorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "themeId" TEXT,

    CONSTRAINT "Activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitiesThemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivitiesThemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedActivities" (
    "id" TEXT NOT NULL,
    "position" INTEGER,
    "activityId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "plannedDate" DATE NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "levelId" TEXT,

    CONSTRAINT "PlannedActivities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observations" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "assets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "institutionId" TEXT,
    "coreId" TEXT,
    "plannedActivityId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activityId" TEXT,

    CONSTRAINT "Observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluations" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "coreId" TEXT NOT NULL,
    "oldLevelOfAchievementId" TEXT NOT NULL,
    "levelOfAchievementId" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubObjectivesEvaluations" (
    "id" TEXT NOT NULL,
    "subObjectiveId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "coreId" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "oldLevelOfAchievementId" TEXT NOT NULL,
    "levelOfAchievementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubObjectivesEvaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedActivitiesEvaluations" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "plannedActivityId" TEXT NOT NULL,
    "activityPlannedDate" DATE NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "subObjectiveId" TEXT,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "coreId" TEXT NOT NULL,
    "oldLevelOfAchievementId" TEXT NOT NULL,
    "levelOfAchievementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedActivitiesEvaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "summary" TEXT,
    "descriptionByScope" JSONB DEFAULT '{}',
    "generalCommentPosition" TEXT,
    "observationsByCore" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportsOptions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "extraObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiddenObjectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT,

    CONSTRAINT "ReportsOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomReportConfiguration" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "configuration" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "ClassroomReportConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendances" (
    "id" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "attendanceType" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teacherId" TEXT,

    CONSTRAINT "Attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountToPay" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMFAnswers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dissapointment" INTEGER,
    "why" TEXT,
    "improvements" TEXT,
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "askAgainDate" DATE NOT NULL,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMFAnswers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutorials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutorials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReviews" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityReviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenAIApiCalls" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT,
    "response" TEXT,
    "model" TEXT,
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenAIApiCalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadedStudentsReports" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "downloadedById" TEXT,
    "reportData" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DownloadedStudentsReports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyTeachersStats" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "plannedActivities" INTEGER NOT NULL DEFAULT 0,
    "activities" INTEGER NOT NULL DEFAULT 0,
    "observations" INTEGER NOT NULL DEFAULT 0,
    "evaluations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyTeachersStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ObjectiveLevels" (
    "objectiveId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SubObjectiveLevels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ObjectiveClassrooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SubObjectiveClassrooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CurricularObjectiveLevels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivityRecommendedLevels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivityCores" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivityObjectives" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivitySubObjectives" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivityCurricularObjectives" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ActivityConsequentialCurricularObjectives" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ObservationStudents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ReportObservations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_UpdatedBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_kidsbookId_key" ON "users"("kidsbookId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_kidsbookId_idx" ON "users"("kidsbookId");

-- CreateIndex
CREATE INDEX "users_institutionId_idx" ON "users"("institutionId");

-- CreateIndex
CREATE INDEX "users_role_institutionId_idx" ON "users"("role", "institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Institutions_kidsbookId_key" ON "Institutions"("kidsbookId");

-- CreateIndex
CREATE INDEX "Institutions_kidsbookId_idx" ON "Institutions"("kidsbookId");

-- CreateIndex
CREATE INDEX "Institutions_deletedAt_idx" ON "Institutions"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Levels_kidsbookId_key" ON "Levels"("kidsbookId");

-- CreateIndex
CREATE INDEX "Levels_kidsbookId_idx" ON "Levels"("kidsbookId");

-- CreateIndex
CREATE INDEX "Cores_institutionId_idx" ON "Cores"("institutionId");

-- CreateIndex
CREATE INDEX "Classes_kidsbookId_levelId_idx" ON "Classes"("kidsbookId", "levelId");

-- CreateIndex
CREATE INDEX "Classes_institutionId_idx" ON "Classes"("institutionId");

-- CreateIndex
CREATE INDEX "Classes_deletedAt_idx" ON "Classes"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Students_kidsbookId_key" ON "Students"("kidsbookId");

-- CreateIndex
CREATE INDEX "Students_kidsbookId_idx" ON "Students"("kidsbookId");

-- CreateIndex
CREATE INDEX "Students_classId_idx" ON "Students"("classId");

-- CreateIndex
CREATE INDEX "Students_institutionId_idx" ON "Students"("institutionId");

-- CreateIndex
CREATE INDEX "Students_deletedAt_idx" ON "Students"("deletedAt");

-- CreateIndex
CREATE INDEX "Students_deactivatedAt_idx" ON "Students"("deactivatedAt");

-- CreateIndex
CREATE INDEX "Objectives_coreId_deletedAt_idx" ON "Objectives"("coreId", "deletedAt");

-- CreateIndex
CREATE INDEX "Objectives_coreId_idx" ON "Objectives"("coreId");

-- CreateIndex
CREATE INDEX "Objectives_deletedAt_idx" ON "Objectives"("deletedAt");

-- CreateIndex
CREATE INDEX "SubObjectives_objectiveId_idx" ON "SubObjectives"("objectiveId");

-- CreateIndex
CREATE INDEX "SubObjectives_institutionId_deletedAt_idx" ON "SubObjectives"("institutionId", "deletedAt");

-- CreateIndex
CREATE INDEX "SubObjectives_deletedAt_idx" ON "SubObjectives"("deletedAt");

-- CreateIndex
CREATE INDEX "CurricularObjectives_country_idx" ON "CurricularObjectives"("country");

-- CreateIndex
CREATE INDEX "CurricularObjectives_methodology_idx" ON "CurricularObjectives"("methodology");

-- CreateIndex
CREATE INDEX "LevelsOfAchievement_value_institutionId_idx" ON "LevelsOfAchievement"("value", "institutionId");

-- CreateIndex
CREATE INDEX "LevelsOfAchievement_institutionId_idx" ON "LevelsOfAchievement"("institutionId");

-- CreateIndex
CREATE INDEX "Activities_sponsorInstitutionId_idx" ON "Activities"("sponsorInstitutionId");

-- CreateIndex
CREATE INDEX "Activities_deletedAt_idx" ON "Activities"("deletedAt");

-- CreateIndex
CREATE INDEX "Activities_creatorId_idx" ON "Activities"("creatorId");

-- CreateIndex
CREATE INDEX "PlannedActivities_classroomId_idx" ON "PlannedActivities"("classroomId");

-- CreateIndex
CREATE INDEX "PlannedActivities_teacherId_idx" ON "PlannedActivities"("teacherId");

-- CreateIndex
CREATE INDEX "PlannedActivities_plannedDate_deletedAt_idx" ON "PlannedActivities"("plannedDate", "deletedAt");

-- CreateIndex
CREATE INDEX "PlannedActivities_deletedAt_idx" ON "PlannedActivities"("deletedAt");

-- CreateIndex
CREATE INDEX "PlannedActivities_createdAt_idx" ON "PlannedActivities"("createdAt");

-- CreateIndex
CREATE INDEX "Observations_classroomId_idx" ON "Observations"("classroomId");

-- CreateIndex
CREATE INDEX "Observations_teacherId_idx" ON "Observations"("teacherId");

-- CreateIndex
CREATE INDEX "Observations_institutionId_idx" ON "Observations"("institutionId");

-- CreateIndex
CREATE INDEX "Observations_coreId_idx" ON "Observations"("coreId");

-- CreateIndex
CREATE INDEX "Observations_plannedActivityId_idx" ON "Observations"("plannedActivityId");

-- CreateIndex
CREATE INDEX "Observations_deletedAt_idx" ON "Observations"("deletedAt");

-- CreateIndex
CREATE INDEX "Evaluations_updatedById_idx" ON "Evaluations"("updatedById");

-- CreateIndex
CREATE INDEX "Evaluations_objectiveId_studentId_createdAt_idx" ON "Evaluations"("objectiveId", "studentId", "createdAt");

-- CreateIndex
CREATE INDEX "Evaluations_studentId_idx" ON "Evaluations"("studentId");

-- CreateIndex
CREATE INDEX "Evaluations_institutionId_idx" ON "Evaluations"("institutionId");

-- CreateIndex
CREATE INDEX "Evaluations_createdAt_idx" ON "Evaluations"("createdAt");

-- CreateIndex
CREATE INDEX "SubObjectivesEvaluations_subObjectiveId_studentId_createdAt_idx" ON "SubObjectivesEvaluations"("subObjectiveId", "studentId", "createdAt");

-- CreateIndex
CREATE INDEX "SubObjectivesEvaluations_studentId_idx" ON "SubObjectivesEvaluations"("studentId");

-- CreateIndex
CREATE INDEX "SubObjectivesEvaluations_institutionId_idx" ON "SubObjectivesEvaluations"("institutionId");

-- CreateIndex
CREATE INDEX "SubObjectivesEvaluations_createdAt_idx" ON "SubObjectivesEvaluations"("createdAt");

-- CreateIndex
CREATE INDEX "Reports_studentId_classroomId_idx" ON "Reports"("studentId", "classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "Reports_studentId_classroomId_key" ON "Reports"("studentId", "classroomId");

-- CreateIndex
CREATE INDEX "ReportsOptions_studentId_classroomId_idx" ON "ReportsOptions"("studentId", "classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportsOptions_studentId_classroomId_key" ON "ReportsOptions"("studentId", "classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomReportConfiguration_classroomId_key" ON "ClassroomReportConfiguration"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomReportConfiguration_classroomId_idx" ON "ClassroomReportConfiguration"("classroomId");

-- CreateIndex
CREATE INDEX "Attendances_studentId_attendanceDate_idx" ON "Attendances"("studentId", "attendanceDate");

-- CreateIndex
CREATE INDEX "Attendances_classroomId_attendanceDate_idx" ON "Attendances"("classroomId", "attendanceDate");

-- CreateIndex
CREATE INDEX "Referrals_referrerId_idx" ON "Referrals"("referrerId");

-- CreateIndex
CREATE INDEX "Referrals_referredId_idx" ON "Referrals"("referredId");

-- CreateIndex
CREATE INDEX "PMFAnswers_userId_createdAt_idx" ON "PMFAnswers"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityReviews_activityId_idx" ON "ActivityReviews"("activityId");

-- CreateIndex
CREATE INDEX "OpenAIApiCalls_userId_idx" ON "OpenAIApiCalls"("userId");

-- CreateIndex
CREATE INDEX "DownloadedStudentsReports_institutionId_idx" ON "DownloadedStudentsReports"("institutionId");

-- CreateIndex
CREATE INDEX "WeeklyTeachersStats_teacherId_idx" ON "WeeklyTeachersStats"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectiveLevels_AB_unique" ON "_ObjectiveLevels"("objectiveId", "levelId");

-- CreateIndex
CREATE INDEX "_ObjectiveLevels_B_index" ON "_ObjectiveLevels"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "_SubObjectiveLevels_AB_unique" ON "_SubObjectiveLevels"("A", "B");

-- CreateIndex
CREATE INDEX "_SubObjectiveLevels_B_index" ON "_SubObjectiveLevels"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectiveClassrooms_AB_unique" ON "_ObjectiveClassrooms"("A", "B");

-- CreateIndex
CREATE INDEX "_ObjectiveClassrooms_B_index" ON "_ObjectiveClassrooms"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SubObjectiveClassrooms_AB_unique" ON "_SubObjectiveClassrooms"("A", "B");

-- CreateIndex
CREATE INDEX "_SubObjectiveClassrooms_B_index" ON "_SubObjectiveClassrooms"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CurricularObjectiveLevels_AB_unique" ON "_CurricularObjectiveLevels"("A", "B");

-- CreateIndex
CREATE INDEX "_CurricularObjectiveLevels_B_index" ON "_CurricularObjectiveLevels"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityRecommendedLevels_AB_unique" ON "_ActivityRecommendedLevels"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityRecommendedLevels_B_index" ON "_ActivityRecommendedLevels"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityCores_AB_unique" ON "_ActivityCores"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityCores_B_index" ON "_ActivityCores"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityObjectives_AB_unique" ON "_ActivityObjectives"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityObjectives_B_index" ON "_ActivityObjectives"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivitySubObjectives_AB_unique" ON "_ActivitySubObjectives"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivitySubObjectives_B_index" ON "_ActivitySubObjectives"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityCurricularObjectives_AB_unique" ON "_ActivityCurricularObjectives"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityCurricularObjectives_B_index" ON "_ActivityCurricularObjectives"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ActivityConsequentialCurricularObjectives_AB_unique" ON "_ActivityConsequentialCurricularObjectives"("A", "B");

-- CreateIndex
CREATE INDEX "_ActivityConsequentialCurricularObjectives_B_index" ON "_ActivityConsequentialCurricularObjectives"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObservationStudents_AB_unique" ON "_ObservationStudents"("A", "B");

-- CreateIndex
CREATE INDEX "_ObservationStudents_B_index" ON "_ObservationStudents"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReportObservations_AB_unique" ON "_ReportObservations"("A", "B");

-- CreateIndex
CREATE INDEX "_ReportObservations_B_index" ON "_ReportObservations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UpdatedBy_AB_unique" ON "_UpdatedBy"("A", "B");

-- CreateIndex
CREATE INDEX "_UpdatedBy_B_index" ON "_UpdatedBy"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cores" ADD CONSTRAINT "Cores_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classes" ADD CONSTRAINT "Classes_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classes" ADD CONSTRAINT "Classes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classes" ADD CONSTRAINT "Classes_mainTeacherId_fkey" FOREIGN KEY ("mainTeacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students" ADD CONSTRAINT "Students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students" ADD CONSTRAINT "Students_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objectives" ADD CONSTRAINT "Objectives_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Cores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objectives" ADD CONSTRAINT "Objectives_curricularObjectiveId_fkey" FOREIGN KEY ("curricularObjectiveId") REFERENCES "CurricularObjectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objectives" ADD CONSTRAINT "Objectives_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objectives" ADD CONSTRAINT "Objectives_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectives" ADD CONSTRAINT "SubObjectives_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectives" ADD CONSTRAINT "SubObjectives_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Cores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectives" ADD CONSTRAINT "SubObjectives_curricularObjectiveId_fkey" FOREIGN KEY ("curricularObjectiveId") REFERENCES "CurricularObjectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectives" ADD CONSTRAINT "SubObjectives_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectives" ADD CONSTRAINT "SubObjectives_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsequentialCurricularObjectives" ADD CONSTRAINT "ConsequentialCurricularObjectives_curricularObjectiveId_fkey" FOREIGN KEY ("curricularObjectiveId") REFERENCES "CurricularObjectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelsOfAchievement" ADD CONSTRAINT "LevelsOfAchievement_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_sponsorInstitutionId_fkey" FOREIGN KEY ("sponsorInstitutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_originalSponsorInstitutionId_fkey" FOREIGN KEY ("originalSponsorInstitutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activities" ADD CONSTRAINT "Activities_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ActivitiesThemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivities" ADD CONSTRAINT "PlannedActivities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivities" ADD CONSTRAINT "PlannedActivities_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivities" ADD CONSTRAINT "PlannedActivities_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivities" ADD CONSTRAINT "PlannedActivities_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivities" ADD CONSTRAINT "PlannedActivities_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivities" ADD CONSTRAINT "PlannedActivities_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observations" ADD CONSTRAINT "Observations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observations" ADD CONSTRAINT "Observations_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observations" ADD CONSTRAINT "Observations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observations" ADD CONSTRAINT "Observations_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Cores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observations" ADD CONSTRAINT "Observations_plannedActivityId_fkey" FOREIGN KEY ("plannedActivityId") REFERENCES "PlannedActivities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observations" ADD CONSTRAINT "Observations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Cores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_oldLevelOfAchievementId_fkey" FOREIGN KEY ("oldLevelOfAchievementId") REFERENCES "LevelsOfAchievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_levelOfAchievementId_fkey" FOREIGN KEY ("levelOfAchievementId") REFERENCES "LevelsOfAchievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluations" ADD CONSTRAINT "Evaluations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_subObjectiveId_fkey" FOREIGN KEY ("subObjectiveId") REFERENCES "SubObjectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Cores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_oldLevelOfAchievementId_fkey" FOREIGN KEY ("oldLevelOfAchievementId") REFERENCES "LevelsOfAchievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubObjectivesEvaluations" ADD CONSTRAINT "SubObjectivesEvaluations_levelOfAchievementId_fkey" FOREIGN KEY ("levelOfAchievementId") REFERENCES "LevelsOfAchievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_plannedActivityId_fkey" FOREIGN KEY ("plannedActivityId") REFERENCES "PlannedActivities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_subObjectiveId_fkey" FOREIGN KEY ("subObjectiveId") REFERENCES "SubObjectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Cores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_oldLevelOfAchievementId_fkey" FOREIGN KEY ("oldLevelOfAchievementId") REFERENCES "LevelsOfAchievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedActivitiesEvaluations" ADD CONSTRAINT "PlannedActivitiesEvaluations_levelOfAchievementId_fkey" FOREIGN KEY ("levelOfAchievementId") REFERENCES "LevelsOfAchievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportsOptions" ADD CONSTRAINT "ReportsOptions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportsOptions" ADD CONSTRAINT "ReportsOptions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportsOptions" ADD CONSTRAINT "ReportsOptions_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportsOptions" ADD CONSTRAINT "ReportsOptions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomReportConfiguration" ADD CONSTRAINT "ClassroomReportConfiguration_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomReportConfiguration" ADD CONSTRAINT "ClassroomReportConfiguration_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendances" ADD CONSTRAINT "Attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendances" ADD CONSTRAINT "Attendances_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendances" ADD CONSTRAINT "Attendances_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referrals" ADD CONSTRAINT "Referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referrals" ADD CONSTRAINT "Referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMFAnswers" ADD CONSTRAINT "PMFAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReviews" ADD CONSTRAINT "ActivityReviews_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpenAIApiCalls" ADD CONSTRAINT "OpenAIApiCalls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadedStudentsReports" ADD CONSTRAINT "DownloadedStudentsReports_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadedStudentsReports" ADD CONSTRAINT "DownloadedStudentsReports_downloadedById_fkey" FOREIGN KEY ("downloadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectiveLevels" ADD CONSTRAINT "_ObjectiveLevels_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectiveLevels" ADD CONSTRAINT "_ObjectiveLevels_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubObjectiveLevels" ADD CONSTRAINT "_SubObjectiveLevels_A_fkey" FOREIGN KEY ("A") REFERENCES "Levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubObjectiveLevels" ADD CONSTRAINT "_SubObjectiveLevels_B_fkey" FOREIGN KEY ("B") REFERENCES "SubObjectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectiveClassrooms" ADD CONSTRAINT "_ObjectiveClassrooms_A_fkey" FOREIGN KEY ("A") REFERENCES "Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectiveClassrooms" ADD CONSTRAINT "_ObjectiveClassrooms_B_fkey" FOREIGN KEY ("B") REFERENCES "Objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubObjectiveClassrooms" ADD CONSTRAINT "_SubObjectiveClassrooms_A_fkey" FOREIGN KEY ("A") REFERENCES "Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubObjectiveClassrooms" ADD CONSTRAINT "_SubObjectiveClassrooms_B_fkey" FOREIGN KEY ("B") REFERENCES "SubObjectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurricularObjectiveLevels" ADD CONSTRAINT "_CurricularObjectiveLevels_A_fkey" FOREIGN KEY ("A") REFERENCES "CurricularObjectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CurricularObjectiveLevels" ADD CONSTRAINT "_CurricularObjectiveLevels_B_fkey" FOREIGN KEY ("B") REFERENCES "Levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityRecommendedLevels" ADD CONSTRAINT "_ActivityRecommendedLevels_A_fkey" FOREIGN KEY ("A") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityRecommendedLevels" ADD CONSTRAINT "_ActivityRecommendedLevels_B_fkey" FOREIGN KEY ("B") REFERENCES "Levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityCores" ADD CONSTRAINT "_ActivityCores_A_fkey" FOREIGN KEY ("A") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityCores" ADD CONSTRAINT "_ActivityCores_B_fkey" FOREIGN KEY ("B") REFERENCES "Cores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityObjectives" ADD CONSTRAINT "_ActivityObjectives_A_fkey" FOREIGN KEY ("A") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityObjectives" ADD CONSTRAINT "_ActivityObjectives_B_fkey" FOREIGN KEY ("B") REFERENCES "Objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivitySubObjectives" ADD CONSTRAINT "_ActivitySubObjectives_A_fkey" FOREIGN KEY ("A") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivitySubObjectives" ADD CONSTRAINT "_ActivitySubObjectives_B_fkey" FOREIGN KEY ("B") REFERENCES "SubObjectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityCurricularObjectives" ADD CONSTRAINT "_ActivityCurricularObjectives_A_fkey" FOREIGN KEY ("A") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityCurricularObjectives" ADD CONSTRAINT "_ActivityCurricularObjectives_B_fkey" FOREIGN KEY ("B") REFERENCES "CurricularObjectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityConsequentialCurricularObjectives" ADD CONSTRAINT "_ActivityConsequentialCurricularObjectives_A_fkey" FOREIGN KEY ("A") REFERENCES "Activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityConsequentialCurricularObjectives" ADD CONSTRAINT "_ActivityConsequentialCurricularObjectives_B_fkey" FOREIGN KEY ("B") REFERENCES "ConsequentialCurricularObjectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObservationStudents" ADD CONSTRAINT "_ObservationStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "Observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObservationStudents" ADD CONSTRAINT "_ObservationStudents_B_fkey" FOREIGN KEY ("B") REFERENCES "Students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReportObservations" ADD CONSTRAINT "_ReportObservations_A_fkey" FOREIGN KEY ("A") REFERENCES "Observations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReportObservations" ADD CONSTRAINT "_ReportObservations_B_fkey" FOREIGN KEY ("B") REFERENCES "Reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UpdatedBy" ADD CONSTRAINT "_UpdatedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "Reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UpdatedBy" ADD CONSTRAINT "_UpdatedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
