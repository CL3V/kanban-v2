import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Core Team Kanban",
  description:
    "A powerful Kanban board application for managing projects and tasks for Core Team",
  keywords: ["kanban", "project management", "tasks", "productivity", "agile"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-secondary-50">{children}</div>
      </body>
    </html>
  );
}
