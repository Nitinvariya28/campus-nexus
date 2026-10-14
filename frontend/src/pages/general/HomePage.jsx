import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  Users,
  TrendingUp,
  PieChart,
  Briefcase,
  GraduationCap,
  Building2,
  ShieldCheck,
  UserPlus,
  FileText,
  Compass,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="py-4 space-y-16">
      
      
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-blue-50/90 border border-blue-200/70 rounded-full text-xs sm:text-sm font-semibold text-blue-700">
            <span>Nirma University Alumni & Placement Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-slate-900 tracking-tight leading-[1.15]">
            Bridging Students, Alumni and Opportunities
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
            AlumiBridge is a unified platform for Nirma University students, alumni and the placement cell. Connect, share experiences, explore career opportunities and grow together.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            {isAuthenticated ? (
              <Link
                to="/community"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5"
              >
                <span>Go to Community Feed</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3 rounded-xl border border-slate-300/80 shadow-xs transition-all"
                >
                  <span>Learn More</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Campus Image */}
        <div className="lg:col-span-5">
          <div className="relative group">
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl shadow-md border border-slate-200/80 bg-white">
              <img
                src="/homepage.jpg"
                alt="Nirma University Campus"
                className="w-full h-[280px] sm:h-[360px] lg:h-[400px] object-cover transition-transform duration-500 group-hover:scale-102"
              />
            </div>
            {/* Subtle floating badge */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-lg shadow-sm border border-slate-200/70 flex items-center space-x-2 text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Official Campus Nexus</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WHAT YOU CAN DO ON ALUMIBRIDGE (4-Card Grid)
         ========================================================================= */}
      <section id="features" className="space-y-8 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            What You Can Do on AlumiBridge
          </h2>
          <p className="text-sm sm:text-base text-slate-500">
            Everything you need to build your career and stay connected.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Community & Networking */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Community & Networking</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect with peers, alumni and industry professionals. Share ideas, ask questions and grow your network.
              </p>
            </div>
            <div className="pt-4 mt-2">
              <Link
                to="/community"
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 group"
              >
                <span>Explore Community</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 2: Career Insights */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Career Insights</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Learn from real experiences, get interview tips and discover career paths from successful alumni.
              </p>
            </div>
            <div className="pt-4 mt-2">
              <Link
                to="/community"
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 group"
              >
                <span>Explore Insights</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 3: Analytics & Trends */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Analytics & Trends</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Explore industry trends, popular skills, job roles and placement patterns with data-driven insights.
              </p>
            </div>
            <div className="pt-4 mt-2">
              <Link
                to="/analytics"
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 group"
              >
                <span>Explore Analytics</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Card 4: Placement Cell */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Placement Cell</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Stay updated with placement drives, internships, training programs and official announcements.
              </p>
            </div>
            <div className="pt-4 mt-2">
              <Link
                to="/community"
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-amber-600 hover:text-amber-700 group"
              >
                <span>View Updates</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: BUILT FOR EVERYONE (Persona Columns)
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xs">
        {/* Left Side: Pitch */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for Everyone
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            AlumiBridge serves the entire Nirma University community, each with unique goals and benefits.
          </p>
          <div className="pt-2">
            <Link
              to="/about"
              className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-300 shadow-xs transition-colors"
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Right Side: 3 Persona Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Persona 1: Students */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Students</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Discover career paths, learn from alumni and find opportunities.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/register"
                className="inline-flex items-center space-x-1 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                <span>For Students</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Persona 2: Alumni */}
          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Alumni</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Share your experiences, mentor students and stay connected.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/register"
                className="inline-flex items-center space-x-1 text-xs sm:text-sm font-semibold text-purple-700 hover:text-purple-800"
              >
                <span>For Alumni</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Persona 3: Placement Cell */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Placement Cell</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Publish updates, manage resources and support campus hiring.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center space-x-1 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <span>For Placement Cell</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    
      <section className="space-y-10 pt-2">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-slate-500">
            Get started in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Step 1 */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm relative">
              <UserPlus className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-blue-700 text-xs font-bold border border-blue-200 flex items-center justify-center">
                1
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Create Account</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
              Register with your Nirma University email and basic details.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm relative">
              <ShieldCheck className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-blue-700 text-xs font-bold border border-blue-200 flex items-center justify-center">
                2
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Verify Identity</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
              Complete email verification and identity check.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm relative">
              <FileText className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-blue-700 text-xs font-bold border border-blue-200 flex items-center justify-center">
                3
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Complete Profile</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
              Add your education, skills and professional details.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm relative">
              <Compass className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-blue-700 text-xs font-bold border border-blue-200 flex items-center justify-center">
                4
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Explore Platform</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
              Connect, discover opportunities and access resources.
            </p>
          </div>
        </div>
      </section>

   
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          
          {/* Stat 1 */}
          <div className="flex items-center space-x-3.5 sm:border-r border-slate-100 sm:pr-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">1000+</div>
              <div className="text-xs text-slate-500 font-medium">Students</div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center space-x-3.5 lg:border-r border-slate-100 lg:pr-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">500+</div>
              <div className="text-xs text-slate-500 font-medium">Alumni</div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center space-x-3.5 lg:border-r border-slate-100 lg:pr-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">50+</div>
              <div className="text-xs text-slate-500 font-medium">Recruiters</div>
            </div>
          </div>

          {/* Stylized Handwritten Tagline */}
          <div className="text-center lg:text-right">
            <span className="font-serif italic text-lg sm:text-xl text-blue-700 font-bold tracking-wide">
              Together for a stronger tomorrow
            </span>
          </div>

        </div>
      </section>

   
      <section className="bg-[#0B3954] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Info */}
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-1">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Your Nirma network starts here.
              </h2>
              <p className="text-sm sm:text-base text-blue-100/80 mt-1.5 max-w-xl">
                Join AlumiBridge and be a part of a growing community of learners, leaders and changemakers.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <Link
              to="/register"
              className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 py-3 rounded-xl shadow-xs transition-colors text-sm"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="bg-transparent hover:bg-white/10 text-white border border-white/30 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
