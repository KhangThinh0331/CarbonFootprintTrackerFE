import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import { ToastProvider } from "@/src/context/toastContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";

const notoClassName = Noto_Sans({
  subsets: ['vietnamese'],
  weight: ['400', '500', '600', '700'], // Chọn các weight bạn cần
  variable: '--font-noto-sans', 
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Carbon Footprint Tracker",
  description: "Website theo dõi dấu chân carbon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  return (
    <html
      lang="vi"
      className={`${notoClassName.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <GoogleOAuthProvider clientId={clientId}>
            {children}
          </GoogleOAuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
