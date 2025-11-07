import Hero from "@/components/sections/Hero";
import Countdown from "@/components/sections/Countdown";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background/60 to-primary/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-[-40%] top-[-25%] h-[70vh] bg-primary/15 blur-3xl opacity-55" />
          <div className="absolute inset-x-[-35%] bottom-[-45%] h-[80vh] bg-secondary/15 blur-3xl opacity-45" />
          <div className="absolute left-1/2 -translate-x-1/2 top-[55%] w-[140%] h-[40vh] bg-primary/5 blur-3xl opacity-40" />
        </div>
        <div className="relative z-10">
      <Hero />
      <Countdown />
        </div>
      </section>
    </main>
  );
}

