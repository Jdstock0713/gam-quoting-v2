import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golden Age Quoting",
  description: "Insurance quoting tool for brokers — Medicare & Life Insurance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
