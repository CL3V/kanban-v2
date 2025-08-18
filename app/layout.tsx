import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Core Team Kanban",
  description:
    "A powerful Kanban board application for managing projects and tasks for Core Team",
  keywords: ["kanban", "project management", "tasks", "productivity", "agile"],
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    images: ["/images/logo.png"],
  },
  twitter: {
    images: ["/images/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <div className="min-h-screen bg-secondary-50">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
