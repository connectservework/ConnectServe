import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { eventService } from '../services/eventService';
import { EventCard } from '../components/events/EventCard';
import { Button } from '../components/common/Button';
import {
  HeartHandshake,
  Users,
  Award,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

export const Home = () => {
  const { isAuthenticated, isOrganization } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await eventService.getEvents({ limit: 3, sortBy: 'popular' });
        if (res.success && res.data) {
          setFeaturedEvents(res.data.events || []);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="space-y-8 sm:space-y-16 pb-12 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-5 sm:p-10 lg:p-14 shadow-2xl border border-emerald-800/40 w-full">
        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[11px] sm:text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>The Unified Platform for Community Impact</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-tight">
            Connect. Volunteer.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Make Real Impact.
            </span>
          </h1>

          <p className="text-xs sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl">
            ConnectServe seamlessly connects passionate volunteers with verified NGOs. Discover community service drives, track and verify volunteer hours, earn digital certificates, and share social impact stories.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4 w-full">
            <Link to="/events" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" icon={Calendar} className="w-full sm:w-auto sm:min-w-[160px]">
                Explore Drives
              </Button>
            </Link>

            {!isAuthenticated ? (
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" icon={Users} className="w-full sm:w-auto sm:min-w-[160px]">
                  Join Community
                </Button>
              </Link>
            ) : (
              <Link to="/feed" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" icon={Sparkles} className="w-full sm:w-auto sm:min-w-[160px]">
                  Go to Feed
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Decorative ambient gradients (strictly contained) */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
      </section>

      {/* Platform Pillars / Stats Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full">
        {[
          { icon: Users, label: 'Active Volunteers', value: '5,000+', desc: 'Dedicated changemakers' },
          { icon: ShieldCheck, label: 'Verified NGOs', value: '250+', desc: 'Trusted community partners' },
          { icon: Award, label: 'Hours Logged', value: '38,000+', desc: 'Verified social service' },
          { icon: HeartHandshake, label: 'Drives Completed', value: '1,400+', desc: 'Across 10+ causes' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card text-center sm:text-left space-y-1.5 sm:space-y-2 hover:shadow-card-hover transition-all"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                {stat.value}
              </h4>
              <p className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">{stat.label}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-400">{stat.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* How ConnectServe Works */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-card space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            From Social Connection to Community Action
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Everything you need to organize, participate, and celebrate community service in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Discover & Apply',
              desc: 'Browse verified drives by cause, date, or location (in-person or virtual) and register with one click.',
            },
            {
              step: '02',
              title: 'Participate & Serve',
              desc: 'Join fellow volunteers on the ground or remotely to support vital community missions.',
            },
            {
              step: '03',
              title: 'Log Hours & Earn Badges',
              desc: 'Attendance is digitally verified by organizers, instantly updating your lifetime volunteer hours.',
            },
            {
              step: '04',
              title: 'Digital Certificates & Feed',
              desc: 'Receive tamper-proof PDF certificates and share impact photos on your social feed.',
            },
          ].map((item, idx) => (
            <div key={idx} className="relative p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-100 dark:border-slate-800">
              <span className="text-2xl font-black text-emerald-600/30 dark:text-emerald-400/30">
                {item.step}
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Community Drives */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Trending Initiatives
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Featured Community Drives
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:translate-x-1 transition-transform"
          >
            <span>View All Drives</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      </section>

      {/* Dual CTA Banner (For Volunteers & NGOs) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            For Volunteers
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Build your volunteering portfolio, earn recognized digital certificates, compete on the leaderboard, and meet like-minded changemakers.
          </p>
          <Link to="/register" className="inline-block">
            <Button variant="primary" size="sm">
              Sign Up as Volunteer
            </Button>
          </Link>
        </div>

        <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            For Non-Profits & NGOs
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Publish volunteering events, manage rosters, approve applicants, track hours, and auto-issue verified certificates effortlessly.
          </p>
          <Link to="/register" className="inline-block">
            <Button variant="secondary" size="sm">
              Register Organization
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
