'use client';

import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      default: 'bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-lg backdrop-blur-sm border border-white/30',
      destructive: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
      outline: 'border border-white/20 bg-white/10 backdrop-blur-xl text-foreground hover:bg-white/20 hover:text-primary',
      secondary: 'bg-muted text-muted-foreground hover:bg-muted/80',
      ghost: 'hover:bg-white/10 hover:text-primary backdrop-blur-sm',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-lg px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };