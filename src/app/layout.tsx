import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golden Age Quoting",
  description: "Insurance quoting tool for brokers — Medicare & Life Insurance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
