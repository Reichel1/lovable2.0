export const metadata = { title: 'Console' };
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import Link from 'next/link';

const client = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <QueryClientProvider client={client}>
          <div className="flex min-h-screen">
            <aside className="w-60 border-r border-slate-800 p-4 space-y-2">
              <div className="text-lg font-semibold">Console</div>
              <nav className="space-y-1 text-sm">
                <Link href="/" className="block px-2 py-1 rounded hover:bg-slate-800">Overview</Link>
                <Link href="/projects" className="block px-2 py-1 rounded hover:bg-slate-800">Projects</Link>
                <Link href="/builds" className="block px-2 py-1 rounded hover:bg-slate-800">Builds</Link>
                <Link href="/domains" className="block px-2 py-1 rounded hover:bg-slate-800">Domains</Link>
                <Link href="/automations" className="block px-2 py-1 rounded hover:bg-slate-800">Automations</Link>
                <Link href="/agents" className="block px-2 py-1 rounded hover:bg-slate-800">Agents</Link>
                <Link href="/analytics" className="block px-2 py-1 rounded hover:bg-slate-800">Analytics</Link>
                <Link href="/integrations" className="block px-2 py-1 rounded hover:bg-slate-800">Integrations</Link>
                <Link href="/database" className="block px-2 py-1 rounded hover:bg-slate-800">Database</Link>
                <Link href="/settings" className="block px-2 py-1 rounded hover:bg-slate-800">Settings</Link>
              </nav>
            </aside>
            <div className="flex-1">
              <header className="h-12 border-b border-slate-800 flex items-center justify-between px-4 text-sm">
                <div className="flex items-center gap-2">
                  <select className="bg-transparent border border-slate-700 rounded px-2 py-1">
                    <option>Project</option>
                  </select>
                  <select className="bg-transparent border border-slate-700 rounded px-2 py-1">
                    <option>preview</option>
                    <option>dev</option>
                    <option>stage</option>
                    <option>prod</option>
                  </select>
                  <input className="bg-transparent border border-slate-700 rounded px-2 py-1 w-64" placeholder="⌘K Search or run" />
                </div>
                <div>
                  <button className="border border-slate-700 rounded px-2 py-1">Account</button>
                </div>
              </header>
              <main>{children}</main>
            </div>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
