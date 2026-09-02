export type Category = {
  id: string;
  title: string;
  enTitle: string;
  description: string;
  cover: string;
  orientation: 'landscape' | 'portrait';
};

export type Project = {
  id: string;
  categoryId: string;
  title: string;
  enTitle: string;
  type: string;
  year: string;
  duration: string;
  description: string;
  role: string;
  software: string;
  plugins: string;
  cover: string;
  video: string;
  screenshots: string[];
};

export type ResumeRole = 'information-flow' | 'editing-assistant' | 'video-editor';

export type ResumeRoleLabel = { label: string; shortLabel: string };

export type ResumeCopy = {
  eyebrow: string;
  summary: string;
  highlights: string[];
  skills: { label: string; value: string }[];
  selfEvaluation: string;
};

export type ResumeEducation = {
  period: string;
  school: string;
  major: string;
};

export type ResumeCampus = {
  title: string;
  period: string;
  organization: string;
  role: string;
  bullets: string[];
};

export type ResumeProject = {
  id: string;
  title: string;
  type: string;
  year: string;
  description: string;
  role: string;
  software: string;
};

export type ResumePersonalCategory = {
  categoryId: string;
  title: string;
  description: string;
};

export type ResumeContent = {
  name: string;
  phone: string;
  email: string;
  portfolioUrl: string;
  portfolioLabel: string;
  updatedLabel: string;
  roleLabels: Record<ResumeRole, ResumeRoleLabel>;
  roleCopies: Record<ResumeRole, ResumeCopy>;
  education: ResumeEducation;
  campus: ResumeCampus;
  projects: ResumeProject[];
  personalCategories: ResumePersonalCategory[];
};

export type PortfolioContent = {
  categories: Category[];
  projects: Project[];
  resume: ResumeContent;
  updatedAt: string;
};
