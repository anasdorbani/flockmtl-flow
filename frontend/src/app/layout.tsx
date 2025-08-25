import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from "antd";

const quicksand = Quicksand({
  variable: "--quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlockMTL Flow",
  description: "FlockMTL Flow is a tool for generating pipelines for natural language processing tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.variable} antialiased`}
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#FF9129',
            },
          }}
        >
          <AntdRegistry>{children}</AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
