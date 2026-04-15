import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../components/Providers";
import { ThemeProvider } from "../components/ThemeContext";
import Navbar from "../components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Chat with PDF",
  description: "A simple app to chat with your PDF documents",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased transition-colors duration-300`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground"
            data-new-gr-c-s-check-loaded="14.1282.0"
            data-gr-ext-installed=""
      >
        <Providers>
          <ThemeProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
