import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "ร้านสุภาพบุรุษ (Supapburut Toys & Card Games) - ร้านการ์ดเกมระดับพรีเมียม",
  description:
    "ศูนย์รวมการ์ดเกมแท้ Bushiroad, Cardfight!! Vanguard, Future Card Buddyfight, Yu-Gi-Oh!, Battle Spirits และอุปกรณ์เสริมพรีเมียม ครบวงจร บริการด้วยความซื่อสัตย์และจริงใจ",
  keywords: [
    "ร้านสุภาพบุรุษ",
    "Supapburut",
    "Cardfight Vanguard",
    "Buddyfight",
    "Yu-Gi-Oh",
    "Battle Spirits",
    "ร้านการ์ด",
    "ซื้อการ์ดแท้",
    "บ็อกซ์การ์ด",
    "ซองใส่การ์ด",
  ],
  icons: {
    icon: "/logos/sp-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className={`${promptFont.variable} font-sans antialiased text-slate-100 bg-[#090d16]`}>
        {children}
      </body>
    </html>
  );
}
