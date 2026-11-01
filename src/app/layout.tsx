import type { Metadata, Viewport } from "next";
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

/** viewport-fit=cover — чтобы нижняя панель учитывала «чёлку» и полоску жестов на iPhone */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0e13",
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
