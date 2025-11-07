import { prisma } from "./prisma";

export type SurveyRecord = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  url?: string | null;
  embedHtml?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function readSurveys(): Promise<SurveyRecord[]> {
  const surveys = await prisma.survey.findMany({
    orderBy: { createdAt: "asc" },
  });
  
  return surveys.map((survey) => ({
    id: survey.id,
    slug: survey.slug,
    title: survey.title,
    description: survey.description,
    url: survey.url,
    embedHtml: survey.embedHtml,
    createdAt: survey.createdAt.toISOString(),
    updatedAt: survey.updatedAt.toISOString(),
  }));
}

export async function readSurveyBySlug(slug: string): Promise<SurveyRecord | null> {
  const survey = await prisma.survey.findUnique({
    where: { slug },
  });
  
  if (!survey) return null;
  
  return {
    id: survey.id,
    slug: survey.slug,
    title: survey.title,
    description: survey.description,
    url: survey.url,
    embedHtml: survey.embedHtml,
    createdAt: survey.createdAt.toISOString(),
    updatedAt: survey.updatedAt.toISOString(),
  };
}

