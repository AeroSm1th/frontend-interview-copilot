import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frontend Interview Copilot",
  description: "一个小而美的前端面试陪练项目。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
