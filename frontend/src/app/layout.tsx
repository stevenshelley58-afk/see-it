import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "See It In Your Home",
  description: "Visualize products inside your space in seconds.",
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
