import { useEffect } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingHero from '../components/landing/LandingHero';
import LandingDomains from '../components/landing/LandingDomains';
import LandingLevels from '../components/landing/LandingLevels';
import LandingVisualEngine from '../components/landing/LandingVisualEngine';
import LandingMathematics from '../components/landing/LandingMathematics';
import LandingConceptUniverse from '../components/landing/LandingConceptUniverse';
import LandingDebugging from '../components/landing/LandingDebugging';
import LandingMissions from '../components/landing/LandingMissions';
import LandingProgress from '../components/landing/LandingProgress';
import LandingCTA from '../components/landing/LandingCTA';
import LandingFooter from '../components/landing/LandingFooter';
import AuthModal from '../components/auth/AuthModal';
import './LandingPage.css';

export default function LandingPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      {/* Sticky Premium Navbar */}
      <LandingNavbar />

      {/* Main Sections Hierarchy */}
      <main className="landing-page__main">
        {/* Section 2: Cinematic Hero */}
        <LandingHero />

        {/* Section 3: Choose Your Learning Domain */}
        <LandingDomains />

        {/* Section 4: Learn at Your Own Level */}
        <LandingLevels />

        {/* Section 5: The Visual Learning Engine */}
        <LandingVisualEngine />

        {/* Section 6: Mathematics Behind AI */}
        <LandingMathematics />

        {/* Section 7: Concept Universe */}
        <LandingConceptUniverse />

        {/* Section 8: Break It, Debug It, Understand It */}
        <LandingDebugging />

        {/* Section 9: AI Missions — Learn by Building */}
        <LandingMissions />

        {/* Section 10: Personal Learning Journey */}
        <LandingProgress />

        {/* Section 11: Final Call to Action */}
        <LandingCTA />
      </main>

      {/* Footer Sitemap */}
      <LandingFooter />

      {/* Global Auth / Guest Upgrade Modal */}
      <AuthModal />
    </div>
  );
}
