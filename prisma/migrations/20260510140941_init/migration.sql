-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BIDDER');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "admin_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "linkedin_url" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "address" TEXT,
    "master_prompt" TEXT NOT NULL,
    "default_pdf_template_id" UUID,
    "created_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_assignments" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "bidder_id" UUID NOT NULL,
    "assigned_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html_template" TEXT NOT NULL,
    "css_styles" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "created_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_generations" (
    "id" UUID NOT NULL,
    "bidder_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "job_description" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "ai_provider" TEXT,
    "ai_model" TEXT,
    "generated_content" JSONB,
    "pdf_path" TEXT,
    "pdf_url" TEXT,
    "error_message" TEXT,
    "job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_logs" (
    "id" UUID NOT NULL,
    "bidder_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "generation_status" "GenerationStatus" NOT NULL,
    "generated_resume_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_admin_id_idx" ON "users"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "profiles_created_by_admin_id_idx" ON "profiles"("created_by_admin_id");

-- CreateIndex
CREATE INDEX "profile_assignments_bidder_id_idx" ON "profile_assignments"("bidder_id");

-- CreateIndex
CREATE INDEX "profile_assignments_profile_id_idx" ON "profile_assignments"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_assignments_profile_id_bidder_id_key" ON "profile_assignments"("profile_id", "bidder_id");

-- CreateIndex
CREATE INDEX "resume_templates_created_by_admin_id_idx" ON "resume_templates"("created_by_admin_id");

-- CreateIndex
CREATE INDEX "resume_generations_bidder_id_idx" ON "resume_generations"("bidder_id");

-- CreateIndex
CREATE INDEX "resume_generations_profile_id_idx" ON "resume_generations"("profile_id");

-- CreateIndex
CREATE INDEX "resume_generations_status_idx" ON "resume_generations"("status");

-- CreateIndex
CREATE INDEX "resume_generations_created_at_idx" ON "resume_generations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "work_logs_generated_resume_id_key" ON "work_logs"("generated_resume_id");

-- CreateIndex
CREATE INDEX "work_logs_bidder_id_created_at_idx" ON "work_logs"("bidder_id", "created_at");

-- CreateIndex
CREATE INDEX "work_logs_profile_id_idx" ON "work_logs"("profile_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_default_pdf_template_id_fkey" FOREIGN KEY ("default_pdf_template_id") REFERENCES "resume_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_assignments" ADD CONSTRAINT "profile_assignments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_assignments" ADD CONSTRAINT "profile_assignments_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_assignments" ADD CONSTRAINT "profile_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_templates" ADD CONSTRAINT "resume_templates_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_generations" ADD CONSTRAINT "resume_generations_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_generations" ADD CONSTRAINT "resume_generations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_generations" ADD CONSTRAINT "resume_generations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "resume_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_bidder_id_fkey" FOREIGN KEY ("bidder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_generated_resume_id_fkey" FOREIGN KEY ("generated_resume_id") REFERENCES "resume_generations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
