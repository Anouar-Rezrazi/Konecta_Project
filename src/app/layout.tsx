import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { PreferencesProvider } from "@/contexts/PreferencesContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Call Center Management System",
  description: "Manage your call center operations efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}
      >
        <PreferencesProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
