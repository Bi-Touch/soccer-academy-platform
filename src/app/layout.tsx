import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Academy",
    template: "%s | Academy",
  },
  description: "Official platform of the football academy — teams, news, fixtures, and the player portal.",
  openGraph: {
    title: "Academy",
    description: "Official platform of the football academy — teams, news, fixtures, and the player portal.",
    type: "website",
    siteName: "Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academy",
    description: "Official platform of the football academy — teams, news, fixtures, and the player portal.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}