import type { ReactNode } from 'react';
import '../portal.css';
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="portal-page">
      {children}
    </main>
  );
}
