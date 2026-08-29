import type { Metadata } from "next";
import "@/src/styles.css";

export const metadata: Metadata = {
  title: {
    default: "Video Speed Reader",
    template: "%s — Video Speed Reader",
  },
  description: "上傳影片，快速取得乾淨、可編輯的中英文逐字稿。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
