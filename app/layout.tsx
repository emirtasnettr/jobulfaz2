import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { OneSignalScripts } from "@/components/onesignal/OneSignalScripts";
import { OneSignalSubscribePrompt } from "@/components/onesignal/OneSignalSubscribePrompt";

const montserrat = Montserrat({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "JobulAI",
    template: "%s • JobulAI",
  },
  description:
    "JobulAI; müşteri, danışman ve aday akışlarını tek panelde yöneten işe alım ve operasyon platformudur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${montserrat.variable} antialiased`}
        suppressHydrationWarning
      >
        <OneSignalScripts />
        {children}
        <OneSignalSubscribePrompt />
      </body>
    </html>
  );
}
