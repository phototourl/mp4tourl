
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TikTok Wrapped: Discover Your Year in Videos",
  description: "Explore your top TikTok moments with TikTok Wrapped. Relive your favorite videos and trends from the past year ,Join the journey of your TikTok memories today!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
          <link rel="canonical" href="https://tiktokwrapped.me/" />
        
      </head>
      
      <body className={`${inter.className} w-screen min-h-screen`}>
        {children}

        
<script defer data-domain="tiktokwrapped.me" src="https://tj.misew.top/js/script.js"></script>

      </body>
    </html>
  );
}
