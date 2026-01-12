import type { Metadata } from "next";
import { Poppins, Akshar } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins"
});

const akshar = Akshar({
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-akshar"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://mmvoters.in'),
  title: "Pollchit Demo",
  description: "Voting Demo App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mr" suppressHydrationWarning>
      <body className={`${poppins.variable} ${akshar.variable}`} suppressHydrationWarning>{children}</body>
    </html>
  );

}
