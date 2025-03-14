
import Layout from "@/components/mainContent";
import QueryProvider from "@/components/providers/QueryProvider";
import type { Metadata } from "next";
import "./globals.css";
import "normalize.css";

export const metadata: Metadata = {
  title: "Pokemon Teams Manager",
  description: ":v",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased w-screen h-screen">
        <QueryProvider>
          <Layout> {children}</Layout>
        </QueryProvider>
      </body>
    </html>
  );
}
