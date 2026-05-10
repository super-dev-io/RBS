export interface ResumeContent {
  fullName: string;
  email: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  address?: string;
  targetRole: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

export interface AiGenerationRequest {
  masterPrompt: string;
  candidate: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    linkedinUrl?: string;
    address?: string;
  };
  job: {
    companyName: string;
    roleTitle: string;
    jobDescription: string;
  };
}

export interface AiGenerationResult {
  content: ResumeContent;
  provider: string;
  model: string;
}

export interface AiProvider {
  generate(req: AiGenerationRequest): Promise<AiGenerationResult>;
}
