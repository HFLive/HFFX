export const dynamic = 'force-dynamic';
export const revalidate = 0;

import TimelineSection from "@/components/sections/Timeline";
import { readTimeline } from "@/lib/timeline";

export default async function TimelinePage() {
  const data = await readTimeline();
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <TimelineSection timeline={data} />
      </div>
    </main>
  );
}
