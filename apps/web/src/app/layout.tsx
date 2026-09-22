import type { Metadata } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/lib/accessibility-context';
import { AuthProvider } from '@/lib/auth-context';
import TopNavbar from '@/components/TopNavbar';
import { ShieldAlert, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'RehabSense — Camera-Assisted Home Rehabilitation Coach',
  description: 'Camera-assisted rehabilitation platform that empowers patients to practice prescribed exercises at home with confidence-gated computer vision while keeping clinicians in control.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        <AccessibilityProvider>
          <AuthProvider>
            <TopNavbar />
            
            <main className="flex-1">
              {children}
            </main>

            {/* Medical Disclaimer & Safety Footer */}
            <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-sky-400" />
                    <span className="text-white font-bold text-sm tracking-tight">RehabSense</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400 font-medium">Team TechHives (PS 05)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/40">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Investigational Clinical Prototype — Not for Unsupervised Medical Diagnosis</span>
                  </div>
                </div>

                <div className="pt-6 space-y-2 text-[11px] leading-relaxed text-slate-400">
                  <p>
                    <strong className="text-slate-300">Safety Notice:</strong> RehabSense is an assistive movement tracking and feedback tool designed to support home rehabilitation. It does not provide medical diagnoses, treatment prescriptions, or replace licensed physiotherapists.
                  </p>
                  <p>
                    <strong className="text-slate-300">Clinician Guidance:</strong> Exercise targets and range-of-motion limits are configured directly by your care team. Always discontinue exercise immediately if you experience pain or discomfort, and consult your treating physiotherapist.
                  </p>
                  <p className="text-slate-500 pt-2">
                    Privacy by Design: Computer vision pose estimation runs directly in your browser. Raw camera imagery is never recorded or streamed to remote servers. Only structured session performance metrics are preserved.
                  </p>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
