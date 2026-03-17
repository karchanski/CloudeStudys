import React from 'react';
import { Navbar } from '../components/navbar';
import HeroSection from '../components/hero';
import { FeatureSection } from '../components/features';

const LandingPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[var(--bg-dark)]">
      <Navbar />
      <HeroSection />
      <FeatureSection />
    </main>
  );
};

export default LandingPage;
