-- Profile: per-profile AI provider/model
ALTER TABLE "profiles"
  ADD COLUMN "ai_provider" TEXT,
  ADD COLUMN "ai_model" TEXT;

-- ResumeTemplate: switch from htmlTemplate/cssStyles to a single config JSON.
-- Step 1: add `config` as nullable so we can backfill in place.
ALTER TABLE "resume_templates" ADD COLUMN "config" JSONB;

-- Step 2: backfill every existing template with the default block config.
-- Existing generations keep their FK to these templates; only the rendering changes.
UPDATE "resume_templates"
SET "config" = '{
  "blocks": [
    {"kind":"header","enabled":true,"order":0},
    {"kind":"summary","enabled":true,"order":1},
    {"kind":"skills","enabled":true,"order":2},
    {"kind":"experience","enabled":true,"order":3},
    {"kind":"projects","enabled":true,"order":4},
    {"kind":"education","enabled":true,"order":5},
    {"kind":"certifications","enabled":true,"order":6}
  ],
  "theme": {
    "fontFamily": "Inter",
    "accentColor": "#2563eb",
    "baseFontSize": 11,
    "density": "normal",
    "layout": "one-col"
  }
}'::jsonb
WHERE "config" IS NULL;

-- Step 3: enforce NOT NULL and drop legacy columns.
ALTER TABLE "resume_templates" ALTER COLUMN "config" SET NOT NULL;
ALTER TABLE "resume_templates" DROP COLUMN "html_template";
ALTER TABLE "resume_templates" DROP COLUMN "css_styles";
