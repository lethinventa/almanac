import type { Metadata } from 'next';
import './globals.css';
import './atlas.css';
import './wizard-produto.css';
import { AuthProvider } from '@/contexts/auth-context';
import { AppShell } from '@/components/shell/app-shell';

export const metadata: Metadata = {
  title: 'Almanac — Papelaria criativa',
  description: 'Gestão de insumos, produtos, encomendas e financeiro',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('almanac_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
