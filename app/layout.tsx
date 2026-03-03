import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doc-to-Microsite | Rappler",
  description: "Convert an annotated Google Doc into a production-grade microsite.",
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
