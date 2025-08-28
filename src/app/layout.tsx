import "@/app/globals.css";
import { Inter } from 'next/font/google';
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body 
        className={cn(
          "min-h-screen flex flex-col antialiased bg-gray-50",
          inter.className
        )}
        suppressHydrationWarning
      >
        <div id="__next">
          {children}
        </div>
      </body>
    </html>
  );
}