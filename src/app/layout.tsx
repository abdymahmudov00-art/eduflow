import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-main",
});

/** Ставит сохранённую тему до первой отрисовки, чтобы страница не мигала тёмным */
const themeScript = `try{var t=localStorage.getItem("eduflow-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: { default: "EduFlow", template: "%s · EduFlow" },
  description: "Учёт студентов, контрактов и оплат",
};

/** viewport-fit=cover — чтобы нижняя панель учитывала «чёлку» и полоску жестов на iPhone */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#15171b" },
    { media: "(prefers-color-scheme: light)", color: "#eceef1" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
