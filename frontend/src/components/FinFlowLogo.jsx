import { Waves } from 'lucide-react';

const FinFlowLogo = ({ size = 'md', className = '', showText = true }) => {
  const containerClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${containerClasses[size]} bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 flex-shrink-0 transition-all duration-300 hover:scale-105`}>
        <Waves size={iconSizes[size]} className="stroke-[2.5]" />
      </div>
      {showText && (
        <span className={`font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-indigo-400 transition-colors duration-300 ${
          size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl'
        }`}>
          FinFlow
        </span>
      )}
    </div>
  );
};

export default FinFlowLogo;
