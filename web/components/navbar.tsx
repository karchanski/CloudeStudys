import React from 'react';
import { ModernButton } from './modern_button';

export const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-4 flex items-center justify-between backdrop-blur-md bg-black/50 border-b border-white/10">
      <div className="text-2xl font-bold text-white tracking-tighter">STUDIO</div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
        <a href="#" className="hover:text-white transition-colors duration-200">Features</a>
        <a href="#" className="hover:text-white transition-colors duration-200">Solutions</a>
        <a href="#" className="hover:text-white transition-colors duration-200">About</a>
      </div>
      <ModernButton variant="primary" className="text-sm px-5 py-2">Get Started</ModernButton>
    </nav>
  );
};
