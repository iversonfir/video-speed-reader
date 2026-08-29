import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Video Speed Reader — 上傳影片，三分鐘內拿到逐字稿" },
      {
        name: "description",
        content:
          "Video Speed Reader turns any video into an accurate transcript in three minutes. Upload your video, get a clean transcript — ready for blog posts, course notes, and searchable archives.",
      },
      { property: "og:title", content: "Video Speed Reader" },
      {
        property: "og:description",
        content:
          "Upload your video, get a clean transcript in three minutes. 上傳影片，三分鐘內拿到逐字稿。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    title: "高準確度逐字稿",
    subtitle: "High-accuracy transcripts",
    description:
      "Powered by OpenAI Whisper, with first-class support for both Chinese and English content.",
  },
  {
    title: "三分鐘交付",
    subtitle: "Three-minute turnaround",
    description:
      "Your video is processed in the background — you'll get an email the moment your transcript is ready.",
  },
  {
    title: "可商用授權",
    subtitle: "Commercial-use ready",
    description:
      "You own the output. Repurpose it into blog posts, course notes, or archives — however you like.",
  },
];

function LandingPage() {
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = featuresRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    el.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Video Speed Reader
          </Link>
          <Link
            to="/auth"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in / 登入
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.62 0.21 290 / 18%), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-28 text-center sm:pt-36">
          <h1 className="fade-up text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            上傳影片，三分鐘內拿到逐字稿。
          </h1>
          <p
            className="fade-up mt-6 text-lg text-muted-foreground"
            style={{ animationDelay: "0.15s" }}
          >
            Upload your video, get a clean transcript in three minutes.
          </p>
          <div
            className="fade-up mt-10 flex justify-center"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              to="/auth"
              className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
            >
              Sign in / 登入
            </Link>
          </div>
          <p
            className="fade-up mt-6 text-sm text-muted-foreground"
            style={{ animationDelay: "0.45s" }}
          >
            Built for content creators, educators, and engineers.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60">
        <div
          ref={featuresRef}
          className="mx-auto grid max-w-5xl gap-6 px-6 py-20 sm:grid-cols-3"
        >
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="reveal rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="mt-0.5 text-sm font-medium text-primary">
                {feature.subtitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted-foreground">
          © 2026 Video Speed Reader
        </div>
      </footer>
    </div>
  );
}
