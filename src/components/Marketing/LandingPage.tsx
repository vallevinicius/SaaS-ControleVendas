import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingShowcase } from './LandingShowcase';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingPricing } from './LandingPricing';
import { LandingFAQ } from './LandingFAQ';
import { LandingContato } from './LandingContato';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';
import { SparklesCore } from '@/components/ui/sparkles';

/** Página institucional mostrada em "/" pra quem não tem sessão (ver
 * RotaProtegida em App.tsx) — apresenta o produto antes do login. */
export function LandingPage() {
  // Quem pediu menos animação no sistema não recebe o fundo de partículas.
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="relative isolate min-h-screen bg-ink-900">
      {/* Fundo de partículas fixo, atrás de toda a página — "isolate" no
       * container garante que o z-index negativo fique contido aqui dentro
       * (sem isso, ele escapa e renderiza atrás do body inteiro, sumindo). */}
      {!reduzirMovimento && (
        <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
          <SparklesCore background="transparent" minSize={0.4} maxSize={1.2} particleDensity={70} speed={0.8} particleColor="#10B981" className="h-full w-full" />
        </div>
      )}

      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingShowcase />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFAQ />
        <LandingContato />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
