export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { Metadata } from "next";
import SurveyEmbed from "@/components/survey/SurveyEmbed";
import SurveyHero from "@/components/survey/SurveyHero";
import { readSurveys } from "@/lib/survey";

export const metadata: Metadata = {
  title: "华附返校2025",
  description: "参与华附返校2025问卷调查，分享您的意见和建议",
};

export default async function SurveyPage() {
  const surveys = await readSurveys();
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <SurveyHero />
          <SurveyEmbed surveys={surveys} />
        </div>
      </div>
    </main>
  );
}

