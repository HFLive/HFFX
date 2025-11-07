import { promises as fs } from "fs";
import path from "path";

export type SurveyRecord = {
  slug: string;
  title: string;
  description?: string;
  url?: string;
  embedHtml?: string;
  createdAt: string;
  updatedAt: string;
};

const SURVEY_FILE_PATH = path.join(process.cwd(), "data", "survey.json");

function normalizeSurvey(raw: any): SurveyRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const now = new Date().toISOString();
  const slug = typeof raw.slug === "string" ? raw.slug.trim().toLowerCase() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!slug || !title) return null;
  const descriptionValue = typeof raw.description === "string" ? raw.description.trim() : undefined;
  const urlValue = typeof raw.url === "string" ? raw.url.trim() : undefined;
  const embedValue = typeof raw.embedHtml === "string" ? raw.embedHtml.trim() : undefined;
  const description = descriptionValue && descriptionValue.length > 0 ? descriptionValue : undefined;
  const url = urlValue && urlValue.length > 0 ? urlValue : undefined;
  const embedHtml = embedValue && embedValue.length > 0 ? embedValue : undefined;
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : now;
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt;
  return {
    slug,
    title,
    description,
    url,
    embedHtml,
    createdAt,
    updatedAt,
  };
}

export async function readSurveys(): Promise<SurveyRecord[]> {
  try {
    const content = await fs.readFile(SURVEY_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    const normalized: SurveyRecord[] = [];
    for (const item of parsed) {
      const survey = normalizeSurvey(item);
      if (survey) {
        normalized.push(survey);
      }
    }
    return normalized;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function writeSurveys(records: SurveyRecord[]): Promise<void> {
  const serialized = JSON.stringify(records, null, 2);
  await fs.writeFile(SURVEY_FILE_PATH, serialized, "utf-8");
}

