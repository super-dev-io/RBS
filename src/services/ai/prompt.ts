import { AiGenerationRequest } from "./types";

export const SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS-friendly, job-targeted resumes.

Rules — follow strictly:
1. Use ONLY information explicitly present in the candidate's master prompt. Do NOT invent jobs, companies, dates, technologies, certifications, or accomplishments.
2. Tailor wording, ordering, and emphasis to the target job, but never fabricate experience the candidate does not have.
3. Mirror keywords from the job description where the candidate genuinely has the experience.
4. Keep bullets concise, results-oriented, and action-led. Quantify when the master prompt provides numbers.
5. Output strict JSON that matches the requested schema. No markdown, no commentary, no code fences.
6. Use ISO-style dates (e.g., "Jan 2022", "Present"). Use empty arrays where data is missing rather than fabricating.
7. Maintain ATS-friendly plain language; no emojis, no decorative characters.

Schema:
{
  "fullName": string,
  "email": string,
  "phoneNumber": string | null,
  "linkedinUrl": string | null,
  "address": string | null,
  "targetRole": string,
  "summary": string,
  "skills": string[],
  "experience": [{ "title": string, "company": string, "location": string | null, "startDate": string, "endDate": string, "bullets": string[] }],
  "projects": [{ "name": string, "description": string, "technologies": string[] }],
  "education": [{ "degree": string, "school": string, "startDate": string, "endDate": string }],
  "certifications": [{ "name": string, "issuer": string, "year": string }]
}`;

export function buildUserPrompt(req: AiGenerationRequest): string {
  return `## Candidate identity (use exactly)
- Full name: ${req.candidate.fullName}
- Email: ${req.candidate.email}
- Phone: ${req.candidate.phoneNumber ?? ""}
- LinkedIn: ${req.candidate.linkedinUrl ?? ""}
- Address: ${req.candidate.address ?? ""}

## Candidate master prompt (source of truth — do not invent beyond this)
${req.masterPrompt}

## Target job
- Company: ${req.job.companyName}
- Role: ${req.job.roleTitle}
- Job description:
${req.job.jobDescription}

## Task
Produce the JSON resume tailored to the target job, strictly following the schema and rules. Return ONLY the JSON object.`;
}
