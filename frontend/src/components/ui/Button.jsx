import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm active:scale-95 focus-visible:ring-primary',
  secondary: 'bg-surface text-foreground border border-border hover:bg-surface-secondary shadow-sm active:scale-95 focus-visible:ring-ring',
  outline: 'bg-transparent text-foreground border border-border hover:bg-surface-secondary active:scale-95 focus-visible:ring-ring',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface-secondary active:scale-95 focus-visible:ring-ring',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive/20 active:scale-95 focus-visible:ring-destructive',
  accent: 'bg-accent text-accent-foreground hover:opacity-90 active:scale-95 focus-visible:ring-accent',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-radius gap-2',
  lg: 'px-6 py-3 text-base rounded-radius gap-2.5',
  icon: 'p-2 rounded-radius justify-center',
};

export const Button = forwardRef(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled = false,
  type = 'button',
  ...props
}, ref) => {
  const selectedVariant = variantClasses[variant] || variantClasses.primary;
  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />
      ) : LeftIcon ? (
        <LeftIcon size={size === 'sm' ? 14 : 16} />
      ) : null}
      
      {children}
      
      {!isLoading && RightIcon ? (
        <RightIcon size={size === 'sm' ? 14 : 16} />
      ) : null}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
