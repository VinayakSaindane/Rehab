import type { Metadata } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/lib/accessibility-context';
import { AuthProvider } from '@/lib/auth-context';
import TopNavbar from '@/components/TopNavbar';
import AtmosphericBackground from '@/components/AtmosphericBackground';
import { ShieldAlert, HeartHandshake, Sparkles } from 'lucide-react';

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
      <body className="min-h-screen flex flex-col text-slate-800 antialiased selection:bg-blue-600/20 selection:text-blue-950 relative">
        <AtmosphericBackground />
        <AccessibilityProvider>
          <AuthProvider>
            <TopNavbar />
            
            <main className="flex-1">
              {children}
            </main>

            {/* Medical Disclaimer & Safety Floating Glass Footer */}
            <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-16 mb-8">
              <div className="glass-card-strong rounded-[28px] p-6 sm:p-8 border border-white/45 shadow-xl backdrop-blur-3xl text-slate-700">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                      <HeartHandshake className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-900 font-black text-sm tracking-tight">RehabSense</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-blue-800 font-semibold text-xs">Team TechHives (PS 05)</span>
                  </div>
                  <div className="flex items-center gap-2 glass-chip px-3.5 py-1.5 rounded-full border border-blue-200/50 text-blue-900 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>Investigational Clinical Prototype — Supervised Care Protocol</span>
                  </div>
                </div>

                <div className="pt-6 space-y-2 text-[12px] leading-relaxed text-slate-600">
                  <p>
                    <strong className="text-slate-900 font-bold">Safety Notice:</strong> RehabSense is an assistive movement tracking and biofeedback tool designed to support home rehabilitation. It operates under licensed clinician supervision and does not provide unsupervised diagnoses.
                  </p>
                  <p>
                    <strong className="text-slate-900 font-bold">Privacy by Design:</strong> Computer vision pose estimation runs directly in your browser. Raw camera imagery is never recorded or streamed to remote servers. Only structured session biomechanics are preserved.
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
