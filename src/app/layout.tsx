import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/layout/nav-bar';

export const metadata: Metadata = {
  title: 'Value Chain Assessment & Simulation',
  description: 'Multi-agent AI system for supply chain maturity assessment, peer benchmarking, and roadmap generation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
