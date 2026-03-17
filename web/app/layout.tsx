import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth';

const font = Space_Grotesk({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SMART EDU JOURNAL Admin',
  description: 'Admin dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
