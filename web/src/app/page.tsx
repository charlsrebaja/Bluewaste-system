"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  BarChart3,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  Leaf,
  TrendingUp,
  Zap,
  ChevronRight,
  Clock,
} from "lucide-react";

const stats = [
  { value: "4,200+", label: "Reports Filed" },
  { value: "38", label: "Barangays Covered" },
  { value: "92%", label: "Cleanup Rate" },
  { value: "< 48h", label: "Avg. Response Time" },
];

const steps = [
  {
    step: "01",
    title: "Pin the Problem",
    description:
      "Citizens report waste issues directly on an interactive map with photos, location, and category.",
    icon: MapPin,
  },
  {
    step: "02",
    title: "LGU Assigns a Team",
    description:
      "The barangay admin reviews the report and dispatches field workers to the location.",
    icon: Users,
  },
  {
    step: "03",
    title: "Cleanup in Action",
    description:
      "Field workers arrive, collect the waste, and submit photo proof of the completed cleanup.",
    icon: Zap,
  },
  {
    step: "04",
    title: "Resolved & Tracked",
    description:
      "The report is closed, analytics are updated, and the citizen gets notified instantly.",
    icon: CheckCircle2,
  },
];

const features = [
  {
    icon: MapPin,
    title: "Interactive Map Reporting",
    description:
      "Pin exact waste locations on a live map. Attach photos and choose from predefined waste categories for faster triage.",
  },
  {
    icon: Users,
    title: "LGU Workforce Dispatch",
    description:
      "Barangay admins assign field workers instantly. Real-time status updates keep everyone in the loop.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Visualize waste hotspots, track resolution rates, and generate reports by barangay, date, or category.",
  },
  {
    icon: Shield,
    title: "Photo-Verified Closure",
    description:
      "Every cleanup is closed with photo evidence — ensuring accountability from report to resolution.",
  },
  {
    icon: TrendingUp,
    title: "Trend Monitoring",
    description:
      "Identify recurring problem areas and seasonal patterns to proactively plan city-wide clean-up drives.",
  },
  {
    icon: Leaf,
    title: "Environmental Impact",
    description:
      "Track your community's contribution — every resolved report is a measurable step toward a cleaner city.",
  },
];

const trustBadges = [
  "Free for all residents",
  "Real-time updates",
  "Verified cleanups",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Navbar ── */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BW</span>
            </div>
            <span className="text-xl font-bold text-primary">BlueWaste</span>
          </div>
          <nav className="hidden md:flex items-center text-sm font-medium text-gray-600">
            <a
              href="#how-it-works"
              className="px-3 py-2 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="px-3 py-2 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Features
            </a>
          </nav>
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-dark hover:bg-primary/5"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute inset-0 pointer-events-none hero-tint" />
        <div className="absolute inset-0 pointer-events-none hero-vignette" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Announcement badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Leaf className="w-3.5 h-3.5 text-blue-500" />
            Now serving all 38 barangays of Panabo City
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Smart Waste Management
            <br />
            <span className="text-primary">for Panabo City</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Report waste problems, track cleanup progress, and help keep our
            city clean. BlueWaste connects citizens with local government for
            faster environmental action.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold gap-2"
              >
                Report Waste Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/map">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base font-semibold"
              >
                View Map
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-400 font-medium">
            {trustBadges.map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl sm:text-4xl font-extrabold text-primary">
                  {value}
                </p>
                <p className="mt-1 text-sm text-gray-500 font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Process
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
              How BlueWaste Works
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto text-base">
              From citizen report to verified cleanup — four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map(({ step, title, description, icon: Icon }, i) => (
              <div key={step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+2.75rem)] w-full h-px bg-gray-200 z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary/40 mb-1 tracking-widest">
                    STEP {step}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Features
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900">
              Everything you need in one platform
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto text-base">
              Built for citizens, barangay field workers, and city
              administrators alike.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 auth-panel-grid opacity-60" />
        <div className="absolute inset-0 pointer-events-none auth-panel-vignette" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Ready to make Panabo City cleaner?
          </h2>
          <p className="mt-4 text-blue-100 text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of residents already reporting waste and tracking
            cleanups across the city — completely free.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base font-semibold gap-2"
              >
                Get Started Free
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-8 text-base font-semibold text-white border border-white/30 hover:bg-white/10 hover:text-white"
              >
                Admin Login
              </Button>
            </Link>
          </div>
          {/* Inline trust row */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-blue-100 font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Average 48h response time
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 92% cleanup success rate
            </span>
            <span className="flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> 38 barangays covered
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">BW</span>
            </div>
            <span className="font-semibold text-gray-700">BlueWaste</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} BlueWaste · Panabo City Smart Waste
            Management Platform
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm border-primary text-primary"
              >
                Login
              </Button>
            </Link>
            <Link
              href="/register"
              className="hover:text-gray-700 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
