"use client";

import Link from "next/link";
import { ArrowUpRight, Check, FileAudio2, Languages, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

const waveform = [
  18, 34, 58, 28, 48, 76, 92, 54, 32, 66, 84, 44, 24, 52, 72, 98, 64, 38, 78, 54, 30, 62, 88, 70,
  42, 22, 50, 82, 60, 36, 68, 90, 48, 26, 56, 74, 40, 20, 46, 64,
];

const features = [
  {
    icon: Languages,
    label: "TRANSCRIPT / 逐字稿",
    title: "高準確度逐字稿",
    subtitle: "High-accuracy transcripts",
    description: "由 Gemini 驅動，針對中文與英文內容產出乾淨、易讀的文字，保留你真正想說的話。",
    signal: "ZH · EN",
  },
  {
    icon: Sparkles,
    label: "DELIVERY / 交付",
    title: "三分鐘交付",
    subtitle: "Three-minute turnaround",
    description: "影片在背景自動處理。逐字稿完成時，我們會寄信通知你，不必留在頁面等待。",
    signal: "≈ 03:00",
  },
  {
    icon: FileAudio2,
    label: "LICENSE / 授權",
    title: "可商用授權",
    subtitle: "Commercial-use ready",
    description: "產出內容屬於你。轉成文章、課程筆記或可搜尋的內容資料庫，都由你決定。",
    signal: "YOURS",
  },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function StudioPreview() {
  return (
    <div className="studio-shell" aria-label="聲音波形與逐字稿編輯畫面示意">
      <div className="studio-topbar">
        <div className="studio-file">
          <span className="status-dot" />
          creator_notes_07.mp4
        </div>
        <div className="studio-state">
          <span className="status-pulse" />
          TRANSCRIBING
        </div>
      </div>

      <div className="waveform-panel">
        <div className="time-ruler" aria-hidden="true">
          <span>00:00</span>
          <span>01:20</span>
          <span>02:40</span>
          <span>04:00</span>
        </div>
        <div className="waveform" aria-hidden="true">
          {waveform.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={index < 23 ? "wave-played" : undefined}
              style={{ height: `${height}%`, animationDelay: `${index * -70}ms` }}
            />
          ))}
          <div className="playhead">
            <span>02:18</span>
          </div>
        </div>
        <div className="transport">
          <span>02:18.42</span>
          <button type="button" tabIndex={-1} aria-hidden="true">
            <span className="play-icon" />
          </button>
          <span className="transport-total">/ 04:06.18</span>
        </div>
      </div>

      <div className="transcript-panel">
        <div className="transcript-heading">
          <span>LIVE TRANSCRIPT</span>
          <span className="language-chip">繁體中文</span>
        </div>
        <div className="transcript-lines">
          <p>
            <span className="timestamp">02:12</span>
            創作的重點不是把所有內容塞進去，而是讓觀眾清楚知道——
          </p>
          <p className="active-line">
            <span className="timestamp">02:18</span>
            <span>你真正想傳達的是什麼。</span>
          </p>
          <p>
            <span className="timestamp">02:23</span>當聲音變成文字，下一步就有更多可能。
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
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
      { threshold: 0.12 },
    );
    el.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-nav">
          <Link href="/" className="landing-brand" aria-label="Video Speed Reader 首頁">
            <BrandMark />
            <span>Video Speed Reader</span>
          </Link>
          <div className="nav-status" aria-hidden="true">
            <span /> SYSTEM READY
          </div>
          <Link href="/auth" className="nav-login">
            登入 <span>/</span> Sign in <ArrowUpRight size={15} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="signal-orbit signal-orbit-one" aria-hidden="true" />
          <div className="signal-orbit signal-orbit-two" aria-hidden="true" />
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker fade-up">
                <span>AI TRANSCRIPTION STUDIO</span>
                <span className="kicker-line" />
                <span>01 — 04</span>
              </div>
              <h1 className="fade-up" style={{ animationDelay: "80ms" }}>
                讓每一段聲音
                <br />
                都能被<span className="headline-accent">讀懂。</span>
              </h1>
              <p className="hero-description fade-up" style={{ animationDelay: "160ms" }}>
                上傳影片，三分鐘內拿到逐字稿。
                <span>把說過的話變成乾淨、可編輯的文字，不再反覆倒帶。</span>
              </p>
              <div className="hero-actions fade-up" style={{ animationDelay: "240ms" }}>
                <Link href="/auth" className="primary-cta">
                  開始轉錄
                  <span className="cta-icon">
                    <ArrowUpRight size={18} strokeWidth={1.8} />
                  </span>
                </Link>
                <div className="hero-proof">
                  <Check size={14} />
                  <span>中英文內容</span>
                  <span className="proof-divider" />
                  <span>完成即通知</span>
                </div>
              </div>
            </div>

            <div className="hero-studio fade-up" style={{ animationDelay: "220ms" }}>
              <div className="studio-caption">
                <span>EDITING SURFACE</span>
                <span>VSR / LIVE</span>
              </div>
              <StudioPreview />
            </div>
          </div>
        </section>

        <section className="features-section" aria-labelledby="features-heading">
          <div className="section-intro">
            <div>
              <span className="section-index">02 / SIGNAL CHAIN</span>
              <h2 id="features-heading">從聲音，到可以使用的文字。</h2>
            </div>
            <p>把轉錄中最費時的部分交出去，保留你的時間給真正的內容工作。</p>
          </div>

          <div ref={featuresRef} className="feature-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="feature-card reveal"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="feature-card-top">
                    <span>{feature.label}</span>
                    <span className="feature-number">0{index + 1}</span>
                  </div>
                  <div className="feature-icon">
                    <Icon size={23} strokeWidth={1.5} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p className="feature-subtitle">{feature.subtitle}</p>
                  <p className="feature-description">{feature.description}</p>
                  <div className="feature-signal">
                    <span>{feature.signal}</span>
                    <span className="signal-track">
                      <span />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-wave" aria-hidden="true">
            {waveform.slice(0, 28).map((height, index) => (
              <span
                key={`${height}-closing-${index}`}
                style={{ height: `${Math.max(12, height)}%` }}
              />
            ))}
          </div>
          <p>READY WHEN YOU ARE</p>
          <h2>下一段影片，從這裡開始。</h2>
          <Link href="/auth" className="closing-link">
            建立帳號並開始 <ArrowUpRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link href="/" className="landing-brand">
          <BrandMark />
          <span>Video Speed Reader</span>
        </Link>
        <span>聲音進來，文字出去。</span>
        <span>© 2026 Video Speed Reader</span>
      </footer>
    </div>
  );
}
