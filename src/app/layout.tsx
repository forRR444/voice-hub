import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "./posthog-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://voicehub.jp"),
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
    images: [
      {
        url: "/VoiceHub.png",
        width: 1200,
        height: 630,
        alt: "VoiceHub — お客様の声を集めてホームページに自動表示",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VoiceHub — お客様の声を集めてホームページに自動表示",
    description:
      "フォームURLを送るだけ。集まった声がウィジェットで自動的にWebサイトに表示されます。",
    images: ["/VoiceHub.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FPLVYNYHCD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FPLVYNYHCD');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} antialiased`}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
