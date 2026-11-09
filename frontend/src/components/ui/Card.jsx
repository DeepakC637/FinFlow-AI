import { forwardRef } from 'react';

export const Card = forwardRef(({
  children,
  className = '',
  variant = 'default',
  hover = false,
  ...props
}, ref) => {
  const variantStyles = {
    default: 'bg-card text-card-foreground border border-border shadow-token',
    elevated: 'bg-surface text-foreground border border-border shadow-token-md',
    subtle: 'bg-surface-secondary text-foreground border border-border/80 shadow-none',
  };

  const hoverStyle = hover ? 'hover:border-primary/30 hover:shadow-token-md hover:-translate-y-0.5' : '';

  return (
    <div
      ref={ref}
      className={`rounded-radius transition-all duration-200 overflow-hidden ${variantStyles[variant] || variantStyles.default} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

export const CardHeader = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`p-6 pb-4 border-b border-border/60 flex flex-col space-y-1.5 ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(({
  children,
  className = '',
  as: Component = 'h3',
  ...props
}, ref) => (
  <Component
    ref={ref}
    className={`text-base sm:text-lg font-bold font-display tracking-tight text-card-foreground ${className}`}
    {...props}
  >
    {children}
  </Component>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <p
    ref={ref}
    className={`text-xs text-muted-foreground font-medium ${className}`}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`p-6 ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`p-6 pt-4 border-t border-border/60 flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = 'CardFooter';

export default Card;
