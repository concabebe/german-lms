import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, DM_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "German LMS — User Research Platform",
  description: "User Research Interview Platform for German Language Learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${dmSans.variable} ${dmSerif.variable} ${dmMono.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="bottom-right" duration={4000} />
      </body>
    </html>
  );
}
