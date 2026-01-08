import type { Metadata } from "next";
import { Poppins, Akshar } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const hind = localFont({
  src: [
    {
      path: "../../public/Hind-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/Hind-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Hind-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/Hind-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/Hind-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-hind",
});

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
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
      <body className={`${hind.variable} ${poppins.variable} ${akshar.variable}`}>{children}</body>
    </html>
  );

}
