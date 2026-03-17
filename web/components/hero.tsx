import React from 'react';
import { ModernButton } from './modern_button';

const HeroSection: React.FC = () => (
  <section className="relative pt-32 pb-24 px-8 overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--red-primary)] rounded-full blur-[128px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-[128px]" />
    </div>
    
    <div className="max-w-5xl mx-auto text-center relative z-10">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm mb-8 animate-rise">
        <span className="w-2 h-2 rounded-full bg-[var(--red-primary)] animate-pulse" />
        New Era of Digital Innovation
      </div>
      <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tighter">
        Transform Your <span className="text-[var(--red-primary)]">Digital Experience</span>
      </h1>
      <p className="text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto">
        A premium interface design that combines modern minimalism with powerful performance. Elevate your presence today.
      </p>
      <div className="flex gap-4 justify-center">
        <ModernButton variant="primary">Get Started</ModernButton>
        <ModernButton variant="secondary">Learn More</ModernButton>
      </div>
    </div>
  </section>
);

export default HeroSection;
