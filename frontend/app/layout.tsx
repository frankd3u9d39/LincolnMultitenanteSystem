import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lincoln SMTS",
  description: "Lincoln College of Science Management & Technology - SMTS Portal",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
