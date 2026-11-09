import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Scan, 
  Wallet, 
  BarChart3, 
  UserCircle, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceGenerator from './pages/InvoiceGenerator';
import ScanInvoice from './pages/ScanInvoice';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Components
import FinFlowLogo from './components/FinFlowLogo';
import { ThemeToggle } from './components/ui/ThemeToggle';

const SidebarItem = ({ icon: Icon, label, to, active, collapsed, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group border ${
      active 
      ? 'bg-indigo-50 text-indigo-650 border-indigo-150/40 dark:bg-indigo-600/10 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold shadow-sm dark:shadow-glow-indigo' 
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-200 border-transparent'
    } ${collapsed ? 'justify-center px-2.5' : ''}`}
    title={collapsed ? label : ''}
  >
    <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-650 dark:group-hover:text-indigo-400'}`} />
    {!collapsed && <span className="text-sm font-medium tracking-tight">{label}</span>}
  </Link>
);

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="w-full"
  >
    {children}
  </motion.div>
);

const ProtectedLayout = ({ children, isAuthenticated, user, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchInputRef = useRef(null);
  const profileRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }


  const handleCollapseToggle = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem('sidebar-collapsed', nextCollapsed.toString());
  };

  const navGroups = [
    {
      title: 'INVOICES',
      items: [
        { icon: FileText, label: 'History', to: '/invoices' },
        { icon: FileText, label: 'Generator', to: '/generate' },
        { icon: Scan, label: 'Scan (AI)', to: '/scan' },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { icon: Wallet, label: 'Expenses', to: '/expenses' },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { icon: BarChart3, label: 'Analytics', to: '/analytics' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { icon: UserCircle, label: 'Profile', to: '/profile' },
        { icon: SettingsIcon, label: 'Settings', to: '/settings' },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground bg-grid-overlay relative overflow-x-hidden transition-colors duration-200">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar Backdrop (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-border transition-all duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        <div className="p-6 flex items-center justify-between border-b border-border">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <FinFlowLogo size="md" showText={!isCollapsed} />
          </Link>
          
          <div className="flex items-center gap-1.5">
            {/* Close button for mobile drawer */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden flex items-center justify-center p-1.5 hover:bg-surface-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            <button 
              onClick={handleCollapseToggle}
              className="hidden lg:flex items-center justify-center p-1.5 hover:bg-surface-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronDown size={16} className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-90'}`} />
            </button>
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            to="/dashboard" 
            active={location.pathname === '/dashboard'} 
            collapsed={isCollapsed} 
            onClick={() => setSidebarOpen(false)}
          />
          
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              {!isCollapsed ? (
                <p className="px-4 text-[9px] font-bold text-muted-foreground tracking-widest mb-2 uppercase">{group.title}</p>
              ) : (
                <div className="border-t border-border my-4" />
              )}
              {group.items.map((item, i) => (
                <SidebarItem 
                  key={i} 
                  {...item} 
                  active={location.pathname === item.to} 
                  collapsed={isCollapsed} 
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={onLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-radius transition-all duration-200 text-destructive hover:bg-destructive/10 w-full ${isCollapsed ? 'justify-center px-2.5' : ''}`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm font-semibold tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 z-10">
        {/* Header */}
        <header className="h-20 bg-surface/80 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 transition-colors">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
            {/* Hamburger Button for Mobile */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-surface-secondary rounded-radius transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search invoices, expenses..." 
                className="w-full bg-surface-secondary border border-border rounded-radius py-2.5 pl-12 pr-4 text-sm outline-none text-foreground focus:ring-2 focus:ring-ring focus:border-primary transition-all placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Theme Toggle (Light / Dark / System) */}
            <ThemeToggle variant="compact" />

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-border group hover:opacity-90 transition-all focus-visible:ring-2 focus-visible:ring-ring rounded-radius"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-none">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{user?.role || 'Standard'} Account</p>
                </div>
                <img 
                  src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=6366F1&color=fff`} 
                  className="w-10 h-10 rounded-radius border border-border shadow-token transition-transform group-hover:scale-105"
                  alt="Profile"
                />
                <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-surface border border-border shadow-token-lg z-[100] overflow-hidden rounded-radius animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 bg-surface-secondary border-b border-border">
                    <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                    <p className="text-xs font-bold text-foreground truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowProfileMenu(false)} 
                      className="flex items-center gap-3 p-3 hover:bg-surface-secondary rounded-radius text-xs font-bold text-foreground hover:text-primary transition-all"
                    >
                      <UserCircle size={18} /> My Profile
                    </Link>
                  </div>
                  <div className="p-2 border-t border-border">
                    <button 
                      onClick={onLogout} 
                      className="flex items-center gap-3 p-3 w-full hover:bg-destructive/10 rounded-radius text-xs font-bold text-destructive transition-all"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Outlet */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-transparent min-w-0">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav 
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2 shadow-token-lg"
      >
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-tight transition-colors ${
            location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link 
          to="/scan" 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-tight transition-colors ${
            location.pathname === '/scan' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Scan size={18} />
          <span>Scan</span>
        </Link>
        <Link 
          to="/invoices" 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-tight transition-colors ${
            location.pathname === '/invoices' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <FileText size={18} />
          <span>Invoices</span>
        </Link>
        <Link 
          to="/expenses" 
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-tight transition-colors ${
            location.pathname === '/expenses' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Wallet size={18} />
          <span>Expenses</span>
        </Link>
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="flex flex-col items-center gap-1 text-[10px] font-bold tracking-tight transition-colors text-muted-foreground"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
};

const AppRoutes = ({ isAuthenticated, user, handleLogin, handleUserUpdate, handleLogout, scanResult, tempPath, handleScanned, handleComplete }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/auth" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <PageWrapper><Auth onLogin={handleLogin} /></PageWrapper>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper><Dashboard /></PageWrapper>
          </ProtectedLayout>
        } />
        <Route path="/generate" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper><InvoiceGenerator /></PageWrapper>
          </ProtectedLayout>
        } />
        <Route path="/scan" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper>
              <ScanInvoice 
                scanResult={scanResult} 
                tempPath={tempPath} 
                onScanned={handleScanned}
                onComplete={handleComplete}
                onCancel={() => handleComplete()}
              />
            </PageWrapper>
          </ProtectedLayout>
        } />
        <Route path="/invoices" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper><Invoices /></PageWrapper>
          </ProtectedLayout>
        } />
        <Route path="/expenses" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper><Expenses /></PageWrapper>
          </ProtectedLayout>
        } />
        <Route path="/analytics" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper><Analytics /></PageWrapper>
          </ProtectedLayout>
        } />
        <Route path="/profile" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper><Profile user={user} onUserUpdate={handleUserUpdate} /></PageWrapper>
          </ProtectedLayout>
        } />
        <Route path="/settings" element={
          <ProtectedLayout isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout}>
            <PageWrapper><Settings /></PageWrapper>
          </ProtectedLayout>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [tempPath, setTempPath] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/v1/auth/me', { withCredentials: true });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleUserUpdate = (updatedUserData) => {
    setUser(updatedUserData);
  };

  const handleLogout = async () => {
    try {
      await axios.get('/api/v1/auth/logout', { withCredentials: true });
    } catch (err) {
      console.error('Logout error', err);
    }
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  };

  const handleScanned = (data, path) => {
    setScanResult(data);
    setTempPath(path);
  };

  const handleComplete = () => {
    setScanResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
        {/* Skeleton Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border p-6 space-y-8 bg-surface">
          <div className="h-10 w-32 bg-muted rounded-radius animate-pulse" />
          <div className="space-y-4 flex-1">
            <div className="h-10 w-full bg-surface-secondary rounded-radius animate-pulse" />
            <div className="h-8 w-2/3 bg-surface-secondary rounded-radius animate-pulse" />
            <div className="h-10 w-full bg-surface-secondary rounded-radius animate-pulse" />
            <div className="h-10 w-full bg-surface-secondary rounded-radius animate-pulse" />
          </div>
        </aside>
        
        {/* Skeleton Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Skeleton Header */}
          <header className="h-20 border-b border-border px-8 flex items-center justify-between bg-surface/80">
            <div className="h-10 w-72 bg-muted rounded-radius animate-pulse" />
            <div className="h-10 w-10 bg-muted rounded-radius animate-pulse" />
          </header>
          
          {/* Skeleton Content */}
          <main className="p-8 space-y-8 flex-1 overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded-radius animate-pulse" />
                <div className="h-4 w-72 bg-surface-secondary rounded-radius animate-pulse" />
              </div>
              <div className="h-10 w-36 bg-muted rounded-radius animate-pulse" />
            </div>
            
            {/* Skeleton Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-28 bg-surface border border-border rounded-radius animate-pulse" />
              <div className="h-28 bg-surface border border-border rounded-radius animate-pulse" />
              <div className="h-28 bg-surface border border-border rounded-radius animate-pulse" />
            </div>
            
            {/* Skeleton Layout Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
              <div className="h-72 bg-surface border border-border rounded-radius animate-pulse" />
              <div className="h-72 bg-surface border border-border rounded-radius animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes 
        isAuthenticated={isAuthenticated}
        user={user}
        handleLogin={handleLogin}
        handleUserUpdate={handleUserUpdate}
        handleLogout={handleLogout}
        scanResult={scanResult}
        tempPath={tempPath}
        handleScanned={handleScanned}
        handleComplete={handleComplete}
      />
    </Router>
  );
};

export default App;
