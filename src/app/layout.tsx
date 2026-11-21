import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-main",
});

export const metadata: Metadata = {
  title: { default: "EduFlow", template: "%s · EduFlow" },
  description: "Учёт студентов, контрактов и оплат",
};

/** viewport-fit=cover — чтобы нижняя панель учитывала «чёлку» и полоску жестов на iPhone */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6fbcf0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
