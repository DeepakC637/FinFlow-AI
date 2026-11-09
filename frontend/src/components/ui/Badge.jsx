const badgeVariants = {
  default: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/25',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  destructive: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
  secondary: 'bg-surface-secondary text-foreground border-border',
  outline: 'bg-transparent text-foreground border-border',
};

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  icon: Icon,
  ...props
}) => {
  const selectedVariant = badgeVariants[variant] || badgeVariants.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${selectedVariant} ${className}`}
      {...props}
    >
      {Icon && <Icon size={12} className="flex-shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;
