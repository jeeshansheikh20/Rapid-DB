import FileUploader from "@/components/upload/file-uploader"
import {
  Zap,
  ArrowRight,
  Clock,
  Database,
  Shield,
  Code2,
  CheckCircle2,
  ExternalLink,
  Store,
  GraduationCap,
  BarChart3,
  Users,
} from "lucide-react"

const FEATURES = [
  {
    icon: Clock,
    title: "30-Second Setup",
    desc: "From file upload to live API endpoint in under a minute — no config, no friction.",
    glow: "rgba(163,184,176,0.12)",
    border: "rgba(163,184,176,0.22)",
  },
  {
    icon: Shield,
    title: "API Key Auth",
    desc: "Separate admin and read-only keys generated automatically for every API.",
    glow: "rgba(74,85,80,0.18)",
    border: "rgba(74,85,80,0.28)",
  },
  {
    icon: Database,
    title: "Auto Schema",
    desc: "Column types (text, number, date, boolean) are inferred automatically from your data.",
    glow: "rgba(163,184,176,0.10)",
    border: "rgba(163,184,176,0.20)",
  },
  {
    icon: Code2,
    title: "Full CRUD",
    desc: "GET, POST, PUT, DELETE — all REST endpoints ready, with filtering and pagination.",
    glow: "rgba(74,85,80,0.15)",
    border: "rgba(74,85,80,0.25)",
  },
]

const USE_CASES = [
  {
    icon: Store,
    label: "Small Business",
    headline: "Product catalog → live API",
    body: "Turn Excel product lists into a Webflow / Shopify data source with zero backend.",
  },
  {
    icon: Users,
    label: "No-Code Builders",
    headline: "Spreadsheet → Bubble / Glide",
    body: "Feed data from Excel into Bubble, Glide, or FlutterFlow without writing any code.",
  },
  {
    icon: GraduationCap,
    label: "Students & Devs",
    headline: "Instant mock API for demos",
    body: "Upload a sample CSV, get a working endpoint in 30 seconds — skip writing a backend.",
  },
  {
    icon: BarChart3,
    label: "Data Teams",
    headline: "Share data without raw files",
    body: "Give teams secure read-only API access to your spreadsheet — keys, not attachments.",
  },
]

const STATS = [
  { value: "~30s", label: "to live API" },
  { value: "4", label: "CRUD endpoints" },
  { value: "100%", label: "no-code" },
  { value: "24h", label: "data TTL" },
]

export default function Home() {
  return (
    <div
      className="min-h-screen text-white antialiased"
      style={{ background: "#09090b" }}
    >
      {/* ─── Background orbs ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full blur-[120px] opacity-25"
          style={{ background: "radial-gradient(circle, #A3B8B0 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-60 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20"
          style={{ background: "radial-gradient(circle, #4A5550 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10"
          style={{ background: "radial-gradient(circle, #A3B8B0 0%, transparent 70%)" }}
        />
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40" />
      </div>

      {/* ─── Navbar ──────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: "rgba(9,9,11,0.8)", borderColor: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #4A5550, #A3B8B0)" }}
            >
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">API Generator</span>
          </div>

          {/* Right links */}
          <div className="flex items-center gap-5">
            <a
              href="#upload"
              className="hidden sm:block text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Upload
            </a>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              API Docs <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="#upload"
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: "linear-gradient(135deg, #4A5550, #A3B8B0)", boxShadow: "0 0 20px rgba(163,184,176,0.25)" }}
            >
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8"
            style={{ background: "rgba(163,184,176,0.12)", border: "1px solid rgba(163,184,176,0.25)", color: "#A3B8B0" }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#A3B8B0" }} />
            Instant REST API from any spreadsheet
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.04] mb-6">
            <span className="text-white">Your spreadsheet,</span>
            <br />
            <span
              className="text-gradient"
              style={{ backgroundImage: "linear-gradient(135deg, #A3B8B0 0%, #c8d8d2 60%, #A3B8B0 100%)" }}
            >
              now a live API.
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Upload a CSV or Excel file and get a fully-functional REST API with CRUD endpoints in seconds.
            No backend. No database. No code.
          </p>

          {/* CTA row */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-12">
            <a
              href="#upload"
              className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-xl transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #4A5550, #A3B8B0)",
                boxShadow: "0 0 30px rgba(163,184,176,0.3), 0 0 60px rgba(163,184,176,0.1)",
              }}
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              View API docs <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-white/35">
            {["No credit card", "Works with .csv & .xlsx", "API keys included"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#A3B8B0" }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─────────────────────────────────── */}
      <section
        className="relative border-y"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)" }}
      >
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p
                  className="text-3xl font-black tracking-tight text-gradient"
                  style={{ backgroundImage: "linear-gradient(135deg, #A3B8B0, #c8d8d2)" }}
                >
                  {value}
                </p>
                <p className="text-xs text-white/40 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Upload wizard ───────────────────────────────── */}
      <section id="upload" className="relative py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          {/* Section label */}
          <div className="text-center mb-10">
            <p
              className="inline-block text-xs font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full mb-4"
              style={{ color: "#A3B8B0", background: "rgba(163,184,176,0.1)", border: "1px solid rgba(163,184,176,0.2)" }}
            >
              Upload & Generate
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
              Three steps to your API
            </h2>
            <p className="text-white/40 text-sm mt-2">Upload → Preview → Live endpoint</p>
          </div>

          {/* Glass card wrapper */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 60px rgba(163,184,176,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <FileUploader />
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section className="relative py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <p
              className="inline-block text-xs font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full mb-4"
              style={{ color: "#A3B8B0", background: "rgba(163,184,176,0.08)", border: "1px solid rgba(163,184,176,0.18)" }}
            >
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
              Everything you need
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, glow, border }) => (
              <div
                key={title}
                className="rounded-2xl p-5 space-y-3 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: `radial-gradient(circle at top left, ${glow}, rgba(255,255,255,0.02))`,
                  border: `1px solid ${border}`,
                  boxShadow: `0 0 30px ${glow}`,
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: glow, border: `1px solid ${border}` }}
                >
                  <Icon className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="font-bold text-sm text-white">{title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Use cases ───────────────────────────────────── */}
      <section
        className="relative py-20 border-t"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
      >
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <p
              className="inline-block text-xs font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full mb-4"
              style={{ color: "#A3B8B0", background: "rgba(163,184,176,0.08)", border: "1px solid rgba(163,184,176,0.18)" }}
            >
              Who is this for?
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
              Built for everyone with data
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {USE_CASES.map(({ icon: Icon, label, headline, body }) => (
              <div
                key={label}
                className="rounded-2xl p-5 space-y-3 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                    style={{ background: "rgba(163,184,176,0.12)", border: "1px solid rgba(163,184,176,0.22)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#A3B8B0" }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(163,184,176,0.7)" }}>{label}</span>
                </div>
                <p className="font-semibold text-sm text-white leading-snug">{headline}</p>
                <p className="text-xs text-white/40 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────── */}
      <section className="relative py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <div
            className="rounded-3xl p-10 sm:p-14 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(163,184,176,0.12), rgba(74,85,80,0.12))",
              border: "1px solid rgba(163,184,176,0.2)",
              boxShadow: "0 0 80px rgba(163,184,176,0.08)",
            }}
          >
            {/* Glow inside card */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 0%, rgba(163,184,176,0.15) 0%, transparent 60%)" }}
            />
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-white relative mb-4">
              Ready to build your API?
            </h2>
            <p className="text-white/50 text-base mb-8 relative">
              Upload your spreadsheet and get a live API in under a minute. Completely free.
            </p>
            <a
              href="#upload"
              className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3.5 rounded-xl relative transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #4A5550, #A3B8B0)",
                boxShadow: "0 0 30px rgba(163,184,176,0.35)",
              }}
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer
        className="border-t py-8"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between flex-wrap gap-4 text-xs text-white/25">
          <div className="flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{ background: "linear-gradient(135deg, #4A5550, #A3B8B0)" }}
            >
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-white/50">API Generator</span>
          </div>
          <div className="flex items-center gap-5">
            <span>Data expires after 24 hours</span>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors underline underline-offset-2"
            >
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
