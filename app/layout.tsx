import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/themeprovider";
import Footer from "@/components/Footer";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Webkitter - Your Personal Web3 Wallet",
  description: "A secure and modern Web3 wallet to generate, import, and manage crypto wallets with ease.",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      url: "/logo.png",
    },
  ],
  openGraph: {
    title: "Webkitter - Your Personal Web3 Wallet",
    description: "Generate, import, and manage crypto wallets with security and simplicity.",
    url: "https://webkitter.vercel.app", // replace with your deployed URL
    siteName: "Webkitter",
    images: [
      {
        url: "/ogg.png", 
        width: 1200,
        height: 630,
        alt: "Webkitter - Your Personal Web3 Wallet",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Webkitter - Your Personal Web3 Wallet",
    description: "Generate, import, and manage crypto wallets with security and simplicity.",
    images: ["/ogg.png"], 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
