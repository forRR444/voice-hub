import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoiceHub — お客様の声を集めてホームページに自動表示",
  description:
    "フォームURLを送るだけ。集まったお客様の声がウィジェットで自動的にあなたのWebサイトに表示されます。",
  openGraph: {
    title: "VoiceHub — お客様の声を集めてホームページに自動表示",
    description:
      "フォームURLを送るだけ。集まったお客様の声がウィジェットで自動的にあなたのWebサイトに表示されます。",
    type: "website",
    locale: "ja_JP",
    siteName: "VoiceHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceHub — お客様の声を集めてホームページに自動表示",
    description:
      "フォームURLを送るだけ。集まった声がウィジェットで自動的にWebサイトに表示されます。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
