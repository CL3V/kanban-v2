import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Juke",
  description:
    "A powerful Kanban board application for managing projects and tasks",
  keywords: ["kanban", "project management", "tasks", "productivity", "agile"],
  icons: {
    icon: "/images/juke-logo.svg",
    shortcut: "/images/juke-logo.svg",
    apple: "/images/juke-logo.svg",
  },
  openGraph: {
    images: ["/images/juke-logo.svg"],
  },
  twitter: {
    images: ["/images/juke-logo.svg"],
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
