import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export const ModernButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50";
  const variants: Record<'primary' | 'secondary', string> = {
    primary: "bg-[var(--red-primary)] text-white hover:bg-[var(--red-hover)] shadow-lg shadow-[var(--red-primary)]/20 hover:shadow-[var(--red-primary)]/40",
    secondary: "bg-white/5 border border-white/10 text-white hover:bg-white/10"
  };

  const selectedVariant = variant === 'secondary' ? variants.secondary : variants.primary;

  return (
    <button className={`${baseStyle} ${selectedVariant} ${className}`} {...props}>
      {children}
    </button>
  );
};
