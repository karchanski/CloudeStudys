import React from 'react';

interface Feature {
  title: string;
  description: string;
}

interface FeatureCardProps {
  feature: Feature;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => (
  <div className="p-8 rounded-3xl bg-[var(--panel-bg)] border border-[var(--border-subtle)] hover:border-[var(--red-primary)]/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
    <div className="w-12 h-12 rounded-xl bg-[var(--red-primary)]/20 mb-6 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full bg-[var(--red-primary)]" />
    </div>
    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
    <p className="text-[var(--text-muted)] leading-relaxed">{feature.description}</p>
  </div>
);

const features: Feature[] = [
  { title: "Fast Performance", description: "Built for speed with modern technologies." },
  { title: "Secure Data", description: "Your data is protected with high-end encryption." },
  { title: "Responsive UI", description: "Looks great on all devices and screen sizes." }
];

export const FeatureSection: React.FC = () => (
  <section className="py-24 px-8">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">Powerful Features</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <FeatureCard key={i} feature={feature} />
        ))}
      </div>
    </div>
  </section>
);
