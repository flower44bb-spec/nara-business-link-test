import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Header } from "@/components/header";
import { PageViewTracker } from "@/components/page-view-tracker";

export const metadata: Metadata = {
  title: "NARA BUSINESS LINK",
  description: "奈良県商工会青年部員のためのビジネスマッチングサイト",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Header />
          <PageViewTracker />
          {children}
          <footer className="site-footer">
            <div>
              <strong>NARA BUSINESS LINK</strong>
              <p>つながる。動き出す。奈良の商い。</p>
            </div>
            <p>奈良県商工会青年部 ビジネスマッチングサイト</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
