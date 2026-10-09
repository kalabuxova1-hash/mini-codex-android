import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Мини Codex — телефон",
  description: "Личный агент для управления телефоном и сжатой памяти задач.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
