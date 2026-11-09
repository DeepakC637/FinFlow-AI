import { useState } from 'react';
import { Shield, Eye, Globe, Zap, MessageSquare, ListTodo, Star, Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Badge } from '../components/ui/Badge';

const SettingsOption = ({ icon: Icon, title, desc, active, onToggle }) => (
  <div className="p-5 flex items-center justify-between hover:bg-slate-100/40 dark:hover:bg-slate-900/10 transition-all cursor-pointer group">
    <div className="flex items-center gap-5">
      <div className="p-3 bg-surface-secondary border border-border rounded-radius text-muted-foreground group-hover:text-primary group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
        {Icon && <Icon size={18} />}
      </div>
      <div>
        <h4 className="font-bold text-foreground text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </div>
    </div>
    <div 
      onClick={onToggle}
      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${active ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-800'}`}
      role="switch"
      aria-checked={active}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${active ? 'left-6' : 'left-1'}`} />
    </div>
  </div>
);

const Settings = () => {
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  const themeOptions = [
    {
      id: 'light',
      label: 'Light',
      description: 'Soft neutral surfaces and high clarity',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Deep navy charcoal and reduced glare',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System',
      description: 'Automatically aligns with OS settings',
      icon: Laptop,
    },
  ];

  const upcomingFeatures = [
    { title: "Smart Sync", status: "Coming Soon", icon: <Globe size={13} /> },
    { title: "Auto-Reconcile AI", status: "In Progress", icon: <Zap size={13} /> },
    { title: "Multi-Currency Rates", status: "Planned", icon: <Shield size={13} /> }
  ];

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h2 className="section-title">System Settings</h2>
        <p className="section-subtitle">Configure security layers, adaptive theme preferences, and ledger suggestions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Security Controls */}
          <div className="glass-card divide-y divide-border overflow-hidden">
            <div className="px-6 py-4 bg-surface-secondary border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 font-display">
                <Shield size={14} className="text-primary" /> Security Controls
              </h3>
            </div>
            <SettingsOption 
              icon={Shield} 
              title="Two-Factor Authentication" 
              desc="Add an extra layer of biometric security to database edits." 
              active={twoFactor}
              onToggle={() => setTwoFactor(!twoFactor)}
            />
            <SettingsOption 
              icon={Shield} 
              title="Automatic Session Timeout" 
              desc="Log out active windows after 30 minutes of inactivity." 
              active={sessionTimeout}
              onToggle={() => setSessionTimeout(!sessionTimeout)}
            />
          </div>

          {/* Theme & Display Configuration */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 bg-surface-secondary border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 font-display">
                <Eye size={14} className="text-primary" /> Appearance & Theme Mode
              </h3>
              <Badge variant={theme === 'system' ? 'primary' : 'secondary'} className="text-[10px]">
                {theme === 'system' ? `System (${resolvedTheme.toUpperCase()})` : theme.toUpperCase()}
              </Badge>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="font-bold text-foreground text-sm font-display">Select Workspace Mode</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose your preferred visual presentation or let FinFlow adapt automatically to your operating system.
                </p>
              </div>

              {/* 3-Way Mode Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {themeOptions.map(({ id, label, description, icon: Icon }) => {
                  const isSelected = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheme(id)}
                      className={`relative flex flex-col items-start p-4 rounded-radius border text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-surface hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-2.5 rounded-lg ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-surface-secondary text-muted-foreground'
                        }`}>
                          <Icon size={18} />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-foreground text-sm">{label}</span>
                      <span className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 bg-surface-secondary border border-border/80 rounded-radius flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Current Active Rendering:</span>
                <span className="font-bold text-foreground capitalize flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${resolvedTheme === 'dark' ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                  {resolvedTheme} Theme ({theme === 'system' ? 'System synced' : 'Explicit mode'})
                </span>
              </div>
            </div>
          </div>

          {/* Suggestion Form */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 bg-surface-secondary border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 font-display">
                <Star size={14} className="text-primary" /> AI Feature Suggestions
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-radius flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm font-display">Request specialized vision parameters</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">Help us prioritize custom OCR templates (e.g. specific vendor receipts or bank checks).</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  className="w-full bg-surface border border-input rounded-radius p-4 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-primary min-h-[100px] resize-none transition-all placeholder:text-muted-foreground"
                  placeholder="Example: I need bulk invoice exporting to PDF, or integration with Tally..."
                ></textarea>
                <button className="btn-primary py-2.5 text-xs">
                  Submit Suggestion
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Sidebar Roadmaps */}
        <div className="space-y-6">
          
          <div className="glass-card p-6">
            <h4 className="font-bold text-foreground text-sm mb-6 flex items-center gap-2 font-display">
              <ListTodo size={16} className="text-primary" /> Platform Roadmap
            </h4>
            <div className="space-y-3">
              {upcomingFeatures.map((f, i) => (
                <div key={i} className="p-3.5 bg-surface-secondary rounded-radius border border-border group hover:border-primary/20 transition-all text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{f.status}</span>
                    <div className="text-primary opacity-60">
                      {f.icon}
                    </div>
                  </div>
                  <h5 className="font-bold text-foreground">{f.title}</h5>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground font-bold mt-6 text-center italic">Updated based on developer logs</p>
          </div>

          <div className="glass-card p-6 divide-y divide-border space-y-4">
            <div className="pb-4">
              <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2 font-display">
                <Globe size={15} className="text-primary" /> Regional & Language
              </h4>
              <select className="w-full bg-surface border border-input rounded-radius px-3 py-2 text-xs text-foreground outline-none font-semibold">
                <option>English (US)</option>
                <option>Hindi (IN)</option>
              </select>
            </div>
            <div className="pt-4">
              <h4 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2 font-display">
                <Eye size={15} className="text-primary" /> Quick Theme Switch
              </h4>
              <p className="text-[11px] text-muted-foreground mb-3">Cycle theme mode instantly across views.</p>
              <div className="flex gap-1.5 p-1 bg-surface-secondary border border-border rounded-radius">
                {['light', 'dark', 'system'].map((mode) => (
                  <button 
                    key={mode}
                    type="button"
                    onClick={() => setTheme(mode)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                      theme === mode 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;
