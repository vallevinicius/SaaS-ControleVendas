import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingPricing } from './LandingPricing';
import { LandingFooter } from './LandingFooter';

/** Página institucional mostrada em "/" pra quem não tem sessão (ver
 * RotaProtegida em App.tsx) — apresenta o produto antes do login. */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-900">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingPricing />
      </main>
      <LandingFooter />
    </div>
  );
}
