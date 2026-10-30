import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-main",
});

export const metadata: Metadata = {
  title: { default: "EduFlow", template: "%s · EduFlow" },
  description: "Учёт студентов, контрактов и оплат",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
