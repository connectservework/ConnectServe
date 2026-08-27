import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../common/Avatar';
import {
  Home,
  Calendar,
  PlusCircle,
  MessageSquare,
  User,
  X,
  Compass,
  Trophy,
  Award,
  LayoutDashboard,
  Shield,
  Bell,
  LogOut,
} from 'lucide-react';

export const MobileNav = ({
  isOpen,
  onClose,
  onOpenCreatePost,
}) => {
  const { user, isAuthenticated, isOrganization, isAdmin, logout } = useAuth();

  const mobileLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center py-1.5 px-0.5 text-[10px] sm:text-xs font-medium transition-colors min-h-[44px] min-w-0 flex-1 truncate ${
      isActive
        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  const drawerLinkClass = ({ isActive }) =>
    `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors min-h-[44px] ${
      isActive
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <>
      {/* 1. Mobile Bottom Bar (visible on < lg screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-1 py-1 shadow-lg pb-safe w-full max-w-full">
        <NavLink to="/feed" className={mobileLinkClass}>
          <Home className="w-5 h-5 mb-0.5" />
          <span className="truncate">Feed</span>
        </NavLink>

        <NavLink to="/events" className={mobileLinkClass}>
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="truncate">Events</span>
        </NavLink>

        {isAuthenticated && (
          <button
            onClick={() => {
              if (isOrganization) {
                window.location.href = '/org/create-event';
              } else {
                onOpenCreatePost();
              }
            }}
            className="flex flex-col items-center justify-center p-0.5 text-emerald-600 dark:text-emerald-400 min-h-[44px] min-w-0 flex-1"
            aria-label="Create Post"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </button>
        )}

        <NavLink to="/chat" className={mobileLinkClass}>
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="truncate">Chat</span>
        </NavLink>

        <NavLink
          to={isAuthenticated ? `/profile/${user?.username || user?._id}` : '/login'}
          className={mobileLinkClass}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="truncate">Profile</span>
        </NavLink>
      </div>

      {/* 2. Mobile Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slideRight">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    CS
                  </div>
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                    ConnectServe
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* User overview if authenticated */}
              {isAuthenticated && user && (
                <div className="py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Avatar src={user.avatar} size="md" isOrg={user.role === 'organization'} />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      @{user.username || 'user'}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation list */}
              <nav className="py-4 space-y-1.5" onClick={onClose}>
                <NavLink to="/feed" className={drawerLinkClass}>
                  <Home className="w-5 h-5" />
                  <span>Home Feed</span>
                </NavLink>

                <NavLink to="/events" className={drawerLinkClass}>
                  <Calendar className="w-5 h-5" />
                  <span>Events Directory</span>
                </NavLink>

                <NavLink to="/explore" className={drawerLinkClass}>
                  <Compass className="w-5 h-5" />
                  <span>Explore Causes</span>
                </NavLink>

                <NavLink to="/leaderboard" className={drawerLinkClass}>
                  <Trophy className="w-5 h-5" />
                  <span>Volunteer Leaderboard</span>
                </NavLink>

                {isAuthenticated && user?.role === 'user' && (
                  <NavLink to="/certificates" className={drawerLinkClass}>
                    <Award className="w-5 h-5" />
                    <span>My Certificates</span>
                  </NavLink>
                )}

                {isAuthenticated && isOrganization && (
                  <NavLink to="/org/dashboard" className={drawerLinkClass}>
                    <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                    <span>Org Dashboard</span>
                  </NavLink>
                )}

                {isAuthenticated && isAdmin && (
                  <NavLink to="/admin" className={drawerLinkClass}>
                    <Shield className="w-5 h-5 text-purple-500" />
                    <span>Admin Center</span>
                  </NavLink>
                )}

                {isAuthenticated && (
                  <>
                    <NavLink to="/chat" className={drawerLinkClass}>
                      <MessageSquare className="w-5 h-5" />
                      <span>Direct Messages</span>
                    </NavLink>

                    <NavLink to="/notifications" className={drawerLinkClass}>
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </NavLink>
                  </>
                )}
              </nav>
            </div>

            {/* Bottom Actions */}
            {isAuthenticated ? (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-semibold transition-colors min-h-[44px]"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="block text-center py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 min-h-[44px] flex items-center justify-center"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="block text-center py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold min-h-[44px] flex items-center justify-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
