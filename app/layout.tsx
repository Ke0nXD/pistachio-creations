import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pistachio & Creations",
  description: "Digital art, custom commissions, cute designs, and finished commissions."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
