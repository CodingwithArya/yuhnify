import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "yuhnify",
  description: "Your fitness data, finally in one place",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}