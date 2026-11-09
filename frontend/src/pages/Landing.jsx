import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import FinFlowLogo from '../components/FinFlowLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  Scan, 
  FileText, 
  Wallet, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ChevronDown, 
  LayoutDashboard, 
  Terminal, 
  Mail, 
  Layers, 
  Cpu, 
  FileCheck2,
  ExternalLink
} from 'lucide-react';

const PLAYGROUND_PRESETS = [
  {
    id: 'aws',
    name: 'AWS Cloud Services',
    category: 'Infrastructure',
    vendor: 'Amazon Web Services, Inc.',
    address: '410 Terry Ave N, Seattle, WA',
    date: '12 Oct 2026',
    invoiceNumber: 'INV-2026-90412',
    currency: '₹',
    items: [
      { name: 'EC2 Elastic Compute Cloud', qty: 1, price: 8420 },
      { name: 'RDS PostgreSQL Multi-AZ', qty: 1, price: 4150 },
      { name: 'S3 Standard Object Storage', qty: 1, price: 1230 }
    ],
    subtotal: 13800,
    tax: 2484,
    total: 16284,
    json: {
      vendor: {
        name: 'Amazon Web Services, Inc.',
        address: '410 Terry Ave N, Seattle, WA',
        tax_id: 'US-45-938201'
      },
      invoice_metadata: {
        invoice_number: 'INV-2026-90412',
        date: '2026-10-12',
        currency: 'INR'
      },
      line_items: [
        { description: 'EC2 Elastic Compute Cloud', quantity: 1, unit_price: 8420.00, total: 8420.00 },
        { description: 'RDS PostgreSQL Multi-AZ', quantity: 1, unit_price: 4150.00, total: 4150.00 },
        { description: 'S3 Standard Object Storage', quantity: 1, unit_price: 1230.00, total: 1230.00 }
      ],
      financial_summary: {
        subtotal: 13800.00,
        tax: 2484.00,
        total_amount: 16284.00
      }
    }
  },
  {
    id: 'stationery',
    name: 'Office Supplies Ltd',
    category: 'Workplace & Ops',
    vendor: 'Stationery Hub India',
    address: '12 Business District, Mumbai, MH',
    date: '18 Oct 2026',
    invoiceNumber: 'INV-SH-8842',
    currency: '₹',
    items: [
      { name: 'Ergonomic Mesh Task Chairs', qty: 2, price: 9000 },
      { name: 'Magnetic Dry-Erase Whiteboards', qty: 1, price: 2500 },
      { name: 'Precision Desk Accessories', qty: 3, price: 500 }
    ],
    subtotal: 22000,
    tax: 3960,
    total: 25960,
    json: {
      vendor: {
        name: 'Stationery Hub India',
        address: '12 Business District, Mumbai, MH',
        tax_id: 'IN-27AABC9402L'
      },
      invoice_metadata: {
        invoice_number: 'INV-SH-8842',
        date: '2026-10-18',
        currency: 'INR'
      },
      line_items: [
        { description: 'Ergonomic Mesh Task Chairs', quantity: 2, unit_price: 9000.00, total: 18000.00 },
        { description: 'Magnetic Dry-Erase Whiteboards', quantity: 1, unit_price: 2500.00, total: 2500.00 },
        { description: 'Precision Desk Accessories', quantity: 3, unit_price: 500.00, total: 1500.00 }
      ],
      financial_summary: {
        subtotal: 22000.00,
        tax: 3960.00,
        total_amount: 25960.00
      }
    }
  },
  {
    id: 'dining',
    name: 'Client Dining & Meals',
    category: 'Client Relations',
    vendor: 'The Green Bistro Corp',
    address: '45 Gourmet Boulevard, Bangalore, KA',
    date: '21 Oct 2026',
    invoiceNumber: 'REC-GB-9902',
    currency: '₹',
    items: [
      { name: 'Executive Team Luncheon', qty: 4, price: 800 },
      { name: 'Organic Cold Press Beverages', qty: 6, price: 200 },
      { name: 'Artisan Confectionery Platter', qty: 3, price: 300 }
    ],
    subtotal: 5300,
    tax: 265,
    total: 5565,
    json: {
      vendor: {
        name: 'The Green Bistro Corp',
        address: '45 Gourmet Boulevard, Bangalore, KA',
        tax_id: 'IN-29AAATG5520K'
      },
      invoice_metadata: {
        invoice_number: 'REC-GB-9902',
        date: '2026-10-21',
        currency: 'INR'
      },
      line_items: [
        { description: 'Executive Team Luncheon', quantity: 4, unit_price: 800.00, total: 3200.00 },
        { description: 'Organic Cold Press Beverages', quantity: 6, unit_price: 200.00, total: 1200.00 },
        { description: 'Artisan Confectionery Platter', quantity: 3, unit_price: 300.00, total: 900.00 }
      ],
      financial_summary: {
        subtotal: 5300.00,
        tax: 265.00,
        total_amount: 5565.00
      }
    }
  }
];

const FAQ_ITEMS = [
  {
    q: "How does FinFlow's AI Vision OCR extract receipt and invoice data?",
    a: "FinFlow uses advanced vision-capable AI models that analyze document structure contextually rather than relying on brittle coordinates. It extracts vendor details, invoice numbers, line items, taxes, and totals in seconds with automated validation checks."
  },
  {
    q: "How is my business financial data kept private and secure?",
    a: "All user sessions use encrypted HTTP-only JWT cookies with strict same-site guards. Passwords are encrypted with Bcrypt salt rounds, and all invoice data is strictly isolated to your authenticated account."
  },
  {
    q: "Can I generate and print professional invoices with FinFlow?",
    a: "Yes. FinFlow includes a built-in Invoice Generator supporting customized line items, GST calculations, client metadata, print-ready document previews, and exports in PDF, Excel, and CSV formats."
  },
  {
    q: "What expense management features are supported?",
    a: "FinFlow tracks company expenses against configurable category budget limits. Visual utilization gauges warn you when expenses approach or exceed budget thresholds in real-time."
  },
  {
    q: "How do the financial analytics dashboards work?",
    a: "The Analytics workspace automatically aggregates your confirmed invoices and expense records into revenue trends, net margin graphs, and category breakdowns with selectable 7-day, 30-day, and quarterly date filters."
  }
];

const Landing = () => {
  // Playground state
  const [selectedPreset, setSelectedPreset] = useState(PLAYGROUND_PRESETS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(100);
  const [playgroundTab, setPlaygroundTab] = useState('ledger');

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Preset switch animation
  const handleSelectPreset = (preset) => {
    if (isScanning || selectedPreset.id === preset.id) return;
    setIsScanning(true);
    setScanProgress(0);
    setSelectedPreset(preset);
  };

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            return 100;
          }
          return prev + 20;
        });
      }, 60);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const toggleFaq = (index) => {
    setExpandedFaq((prev) => (prev === index ? null : index));
  };

  const coreFeatures = [
    {
      icon: Scan,
      title: "AI Receipt & Bill Scanner",
      desc: "Upload physical receipts, invoice photos, or PDF documents. Vision models extract vendor, dates, line items, and totals directly into your ledger.",
      badge: "Vision OCR",
      badgeVariant: "primary"
    },
    {
      icon: FileText,
      title: "Invoice Generation Engine",
      desc: "Draft professional business invoices with dynamic line items, automated GST/tax computations, browser print preview, and PDF/CSV exports.",
      badge: "Invoicing",
      badgeVariant: "success"
    },
    {
      icon: Wallet,
      title: "Expense & Budget Management",
      desc: "Categorize expenditures, track budget utilization percentages, and identify cost anomalies before they impact your net operating margins.",
      badge: "Ledger",
      badgeVariant: "warning"
    },
    {
      icon: BarChart3,
      title: "Real-Time Cash Flow Analytics",
      desc: "Monitor financial performance with interactive revenue charts, net margins, category spending distributions, and flexible date-range filters.",
      badge: "Analytics",
      badgeVariant: "primary"
    },
    {
      icon: ShieldCheck,
      title: "Encrypted Session Security",
      desc: "Enterprise-grade protection with HTTP-only session cookies, Bcrypt password hashing, and zero local credential storage.",
      badge: "Security",
      badgeVariant: "neutral"
    },
    {
      icon: Layers,
      title: "Multi-Format File Exports",
      desc: "Export ledger statements, invoice lists, and financial summaries as structured CSV, Excel, or PDF files compatible with all accounting workflows.",
      badge: "Productivity",
      badgeVariant: "success"
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Capture or Generate",
      desc: "Drop an invoice photo or PDF into the AI Scanner, or create a brand-new GST invoice with the Invoice Generator."
    },
    {
      step: "02",
      title: "AI Extraction & Validation",
      desc: "Multi-modal vision models analyze document geometry, verify math accuracy, and map items into standard accounting fields."
    },
    {
      step: "03",
      title: "Analyze & Reconcile",
      desc: "View real-time cash flow summaries, reconcile invoice statuses, and monitor expense allocations from your central dashboard."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ================= NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-surface/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
            <FinFlowLogo size="md" />
          </Link>

          {/* Center Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Product Preview</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#support" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="compact" />
            <Link to="/auth?mode=login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs font-bold">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button variant="primary" size="sm" className="text-xs font-bold shadow-sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section id="home" className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Soft Background Radial Gradient */}
        <div 
          aria-hidden="true" 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl pointer-events-none -z-10" 
        />

        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Top Pill Announcement */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
              <Sparkles size={13} className="animate-pulse" />
              <span>FinFlow 2.0 • Intelligent Financial SaaS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-foreground leading-[1.15]">
              AI-Powered Ledger <br className="hidden sm:inline" />
              <span className="text-primary bg-gradient-to-r from-primary via-indigo-600 to-primary bg-clip-text text-transparent">
                Accounting & Invoicing.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
              Eliminate manual data entry. Capture receipts with vision-capable OCR, generate verified invoices, monitor category budgets, and analyze live cash flow.
            </p>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/auth?mode=register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" rightIcon={ArrowRight} className="w-full sm:w-auto font-bold shadow-token-md">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/auth?mode=login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span>Zero Manual Keying</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>HTTP-Only JWT Security</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck2 size={15} className="text-emerald-500" />
                <span>GST-Compliant Invoices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE PRODUCT PREVIEW / PLAYGROUND ================= */}
      <section id="preview" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-y border-border/60 bg-surface-secondary/40">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
            <Badge variant="primary" className="px-3 py-1 text-xs">
              <Cpu size={12} className="mr-1.5" /> Interactive Extraction Preview
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-foreground">
              See FinFlow AI Extraction in Action
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select a billing document preset below to simulate real-time layout analysis, line-item parsing, and structured JSON ledger conversion.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
            {PLAYGROUND_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isScanning}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-surface text-muted-foreground hover:text-foreground border-border hover:border-slate-400'
                  } ${isScanning ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Preview Sandbox Grid */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Left: Visual Document Card */}
            <Card variant="elevated" className="p-5 sm:p-6 flex flex-col justify-between border-border/80 relative overflow-hidden bg-card">
              {/* Scan Progress Overlay */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3 p-4"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <span className="text-xs font-bold text-primary">
                      Parsing Document Geometry... {scanProgress}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Simulated Paper Invoice Document */}
              <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm text-foreground select-none">
                {/* Invoice Header */}
                <div className="flex justify-between items-start pb-4 border-b border-border/80 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {selectedPreset.vendor}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPreset.address}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="primary" className="text-[10px] uppercase font-bold">
                      {selectedPreset.category}
                    </Badge>
                    <p className="text-xs font-bold text-foreground mt-1.5">{selectedPreset.invoiceNumber}</p>
                    <p className="text-[10px] text-muted-foreground">{selectedPreset.date}</p>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between border-b border-border/60 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Description</span>
                    <div className="flex gap-8 sm:gap-12 text-right">
                      <span>Qty</span>
                      <span className="w-16">Total</span>
                    </div>
                  </div>
                  {selectedPreset.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-foreground font-medium py-1 hover:bg-surface-secondary/50 rounded px-1 -mx-1 transition-colors">
                      <span className="truncate max-w-[180px] sm:max-w-xs">{item.name}</span>
                      <div className="flex gap-8 sm:gap-12 text-right">
                        <span className="text-muted-foreground">{item.qty}</span>
                        <span className="font-bold w-16">{selectedPreset.currency}{item.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations Breakdown */}
                <div className="border-t border-border/80 pt-3 flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
                  <div className="flex gap-8">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-foreground">{selectedPreset.currency}{selectedPreset.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex gap-8">
                    <span>Tax (GST 18%):</span>
                    <span className="font-semibold text-foreground">{selectedPreset.currency}{selectedPreset.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex gap-8 text-sm font-extrabold text-foreground border-t border-border pt-2 mt-1">
                    <span>Total Amount:</span>
                    <span className="text-primary">{selectedPreset.currency}{selectedPreset.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Vision Parser Active
                </span>
                <span className="font-semibold text-foreground">
                  {selectedPreset.items.length} line items detected
                </span>
              </div>
            </Card>

            {/* Right: Extracted Ledger / JSON View */}
            <Card variant="elevated" className="p-5 sm:p-6 flex flex-col border-border/80 bg-card">
              {/* Sub-Tabs: Ledger vs JSON */}
              <div className="flex border-b border-border mb-6">
                <button
                  type="button"
                  onClick={() => setPlaygroundTab('ledger')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                    playgroundTab === 'ledger'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutDashboard size={14} /> Structured Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setPlaygroundTab('json')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                    playgroundTab === 'json'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Terminal size={14} /> Extracted JSON
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 flex flex-col justify-between">
                {playgroundTab === 'ledger' ? (
                  <div className="space-y-4">
                    {/* Summary Box */}
                    <div className="p-4 bg-surface-secondary border border-border rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vendor Account</span>
                          <h4 className="text-base font-bold text-foreground mt-0.5">{selectedPreset.vendor}</h4>
                        </div>
                        <Badge variant="primary">{selectedPreset.category}</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Billing Date</span>
                          <span className="font-semibold text-foreground mt-0.5 block">{selectedPreset.date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Invoice Ref</span>
                          <span className="font-semibold text-foreground mt-0.5 block">{selectedPreset.invoiceNumber}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-muted-foreground block">Confirmed Amount</span>
                          <span className="font-bold text-primary mt-0.5 block">{selectedPreset.currency}{selectedPreset.total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown items */}
                    <div>
                      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Ledger Record Breakdown
                      </h5>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {selectedPreset.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 bg-surface border border-border rounded-lg text-xs">
                            <span className="font-medium text-foreground truncate max-w-[200px]">{item.name}</span>
                            <span className="font-bold text-foreground">{selectedPreset.currency}{(item.qty * item.price).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-secondary rounded-xl p-4 border border-border font-mono text-[11px] leading-relaxed text-foreground max-h-72 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedPreset.json, null, 2)}</pre>
                  </div>
                )}

                {/* Bottom Card Action */}
                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    OCR Confidence 99.4%
                  </span>
                  <Link to="/auth?mode=register" className="inline-flex items-center gap-1 text-primary font-bold hover:underline">
                    Save to ledger <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ================= CORE FEATURES SECTION ================= */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <Badge variant="primary" className="px-3 py-1 text-xs">Core Capabilities</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-foreground">
              Built for Complete Financial Control
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every tool your business needs to generate revenue documents, capture physical bills, enforce category spending limits, and track cash flow.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} variant="elevated" hover className="p-6 flex flex-col justify-between border-border/80">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                        <Icon size={22} />
                      </div>
                      <Badge variant={f.badgeVariant} className="text-[10px]">
                        {f.badge}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold font-display text-card-foreground">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60">
                    <Link to="/auth?mode=register" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                      Explore feature <ArrowRight size={12} />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= WORKFLOW / HOW IT WORKS SECTION ================= */}
      <section id="workflow" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-surface-secondary/40 border-y border-border/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <Badge variant="primary" className="px-3 py-1 text-xs">Seamless Workflow</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-foreground">
              How FinFlow Powers Your Business
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Three streamlined steps from physical receipt capture to financial analytics and reporting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {workflowSteps.map((s, idx) => (
              <div key={idx} className="relative flex flex-col space-y-3 p-6 bg-card border border-border/80 rounded-2xl shadow-token">
                <span className="text-3xl font-black text-primary/30 font-display">
                  {s.step}
                </span>
                <h3 className="text-lg font-bold font-display text-foreground">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <Badge variant="primary" className="px-3 py-1 text-xs">Knowledge Base</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Technical details regarding AI vision extraction, session security, exports, and accounting features.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="border border-border/80 rounded-xl overflow-hidden bg-card transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  >
                    <span className="font-bold text-foreground text-sm tracking-tight pr-4">
                      {item.q}
                    </span>
                    <span className={`p-1.5 rounded-lg bg-surface-secondary border border-border text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}>
                      <ChevronDown size={15} />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SUPPORT & CONTACT SECTION ================= */}
      <section id="support" className="py-16 px-4 sm:px-6 lg:px-8 bg-surface-secondary/40 border-t border-border/60">
        <div className="max-w-5xl mx-auto">
          <Card variant="elevated" className="p-6 sm:p-10 border-border/80 text-center flex flex-col items-center space-y-4 bg-card">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Mail size={24} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              Questions or Support Inquiries?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Our engineering team is available to assist with onboarding, enterprise setup, and AI model compatibility. Reach out directly at our verified support channel.
            </p>
            <div className="pt-2">
              <a 
                href="mailto:support@finflow.ai"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-token hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Mail size={16} /> support@finflow.ai <ExternalLink size={14} className="ml-0.5" />
              </a>
            </div>
          </Card>
        </div>
      </section>

      {/* ================= CLOSING CTA BAND ================= */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-border/60 bg-surface">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Ready to take control of your financial flows?
            </h2>
            <p className="text-sm text-muted-foreground">
              Join teams managing real-time billing, automated expense tracking, and OCR ledgers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Link to="/auth?mode=register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" rightIcon={ArrowRight} className="w-full sm:w-auto font-bold shadow-token-md">
                Get Started Free
              </Button>
            </Link>
            <Link to="/auth?mode=login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 border-t border-border/80 bg-surface px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <FinFlowLogo size="sm" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Product Preview</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="mailto:support@finflow.ai" className="hover:text-foreground transition-colors">Support</a>
            <Link to="/auth?mode=login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/auth?mode=register" className="hover:text-foreground transition-colors">Register</Link>
          </div>

          <div>
            <span>&copy; {new Date().getFullYear()} FinFlow Financial Technologies Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
