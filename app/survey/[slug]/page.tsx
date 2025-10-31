import surveyList from '@/data/survey.json';
import { notFound } from 'next/navigation';

export default function SurveyDynamicPage({ params }: { params: { slug: string } }) {
  const survey = Array.isArray(surveyList)
    ? surveyList.find(q => q.slug === params.slug)
    : null;

  if (!survey) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-2xl text-foreground-light mb-4">未找到对应问卷</div>
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">{survey.title}</h1>
          <p className="text-center text-foreground-light mb-8">{survey.description}</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary/10">
            {survey.embedHtml ? (
              <div
                className="w-full min-h-[600px]"
                dangerouslySetInnerHTML={{ __html: survey.embedHtml }}
              />
            ) : (
              <iframe
                src={survey.url}
                className="w-full min-h-[800px] border-0"
                title="问卷内嵌"
                loading="lazy"
                referrerPolicy="no-referrer"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
