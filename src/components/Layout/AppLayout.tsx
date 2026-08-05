import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}

export function AppLayout({ titulo, subtitulo, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header titulo={titulo} subtitulo={subtitulo} />
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
