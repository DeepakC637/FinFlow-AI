import { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  helperText,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  id,
  disabled = false,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-foreground font-display tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
            <LeftIcon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-sm outline-none transition-all duration-200 disabled:opacity-50 disabled:bg-muted ${
            LeftIcon ? 'pl-10' : ''
          } ${
            RightIcon ? 'pr-10' : ''
          } ${
            error
              ? 'border-destructive focus:ring-2 focus:ring-destructive/20 focus:border-destructive'
              : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
          } ${className}`}
          {...props}
        />

        {RightIcon && (
          <div className="absolute right-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
            <RightIcon size={16} />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-semibold text-destructive mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted-foreground mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
