import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { RootLayout } from '@/components/layout/RootLayout';
import { SocketProvider } from '@/components/providers/SocketProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Energy Lens — Smart Home Energy Dashboard',
  description: 'Monitor, analyze, and optimize your home energy consumption in real time.',
  keywords: ['energy monitoring', 'smart home', 'electricity', 'dashboard'],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans bg-zinc-950 text-zinc-100 antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SocketProvider>
            <RootLayout>{children}</RootLayout>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
