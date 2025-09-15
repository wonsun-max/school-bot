// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "마한아 챗봇",
  description: "급식·시간표·행사 안내 - 마한아 GPT 챗봇",
  icons: {
    icon: "/mha-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <img src="/mha-logo.png" alt="MHA Logo" className="site-logo" />
            <div className="site-title">
              <div className="title-main">마한아 챗봇</div>
              <div className="title-sub">급식 · 시간표 · 행사 안내</div>
            </div>
          </div>
        </header>

        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
