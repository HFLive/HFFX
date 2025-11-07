import Hero from "@/components/sections/Hero";
import Countdown from "@/components/sections/Countdown";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-background/80 to-primary/5">
        {/* 统一的背景装饰层 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* 顶部主要光晕 */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[50vh] bg-primary/12 rounded-full blur-3xl opacity-60" />
          {/* 左侧装饰光晕 */}
          <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          {/* 右侧装饰光晕 */}
          <div className="absolute top-[30%] right-[10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          {/* 中部过渡光晕 */}
          <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[100%] h-[35vh] bg-primary/8 blur-3xl opacity-50" />
          {/* 底部光晕 */}
          <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[90%] h-[40vh] bg-secondary/12 blur-3xl opacity-45" />
        </div>
        <div className="relative z-10">
          <Hero />
          <Countdown />
        </div>
      </section>
    </main>
  );
}

