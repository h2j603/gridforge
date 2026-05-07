import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GridForge",
  description: "Web ↔ Print bidirectional grid design tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
