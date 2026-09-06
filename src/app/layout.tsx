import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academy",
  description: "Official platform of the football academy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
