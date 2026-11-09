import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = ({ variant = 'compact', className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop },
  ];

  if (variant === 'segmented') {
    return (
      <div
        className={`flex p-1 bg-surface-secondary border border-border rounded-radius gap-1 ${className}`}
        role="radiogroup"
        aria-label="Theme mode selector"
      >
        {options.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface/60'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact variant for navigation headers
  const CurrentIcon = theme === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-10 h-10 rounded-radius bg-surface text-foreground border border-border hover:bg-surface-secondary shadow-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${resolvedTheme})`}
        aria-label="Toggle theme"
        aria-expanded={open}
      >
        <CurrentIcon size={18} className="text-foreground transition-transform duration-200 hover:rotate-12" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-surface border border-border rounded-radius shadow-token-md p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Theme Mode
          </div>
          {options.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                  <span>{label}</span>
                </div>
                {isActive && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
