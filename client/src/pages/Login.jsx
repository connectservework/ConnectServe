import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Mail, Lock, Sparkles, User, Building2, Shield, ArrowRight, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/feed';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter code & new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Please fill in both email/mobile number and password.');
      return;
    }

    setIsLoading(true);
    const result = await login({ identifier, password });
    setIsLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleQuickDemo = async (roleType) => {
    setDemoLoading(roleType);
    const result = await loginAsDemo(roleType);
    setDemoLoading(null);
    if (result.success) {
      if (roleType === 'admin') navigate('/admin');
      else if (roleType === 'ngo') navigate('/org/dashboard');
      else navigate('/feed');
    }
  };

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email address.');
      return;
    }
    setIsSendingCode(true);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      if (res.success) {
        toast.success(res.message || 'Reset code sent to your email!');
        setForgotStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      toast.error('Please provide both the reset code and a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    setIsResetting(true);
    try {
      const res = await authService.resetPassword({
        email: forgotEmail,
        resetCode,
        newPassword,
      });
      if (res.success) {
        toast.success('Password reset successfully! Please log in.');
        setShowForgotModal(false);
        setForgotStep(1);
        setIdentifier(forgotEmail);
        setPassword('');
        setForgotEmail('');
        setResetCode('');
        setNewPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Log in to manage community drives, post updates, and track volunteer hours.
          </p>
        </div>

        {/* Demo Quick-Fill Box */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Instant Demo Quick-Login:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('volunteer')}
              disabled={demoLoading !== null}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors min-h-[44px]"
            >
              <User className="w-4 h-4 text-emerald-600 mb-0.5" />
              <span>Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('ngo')}
              disabled={demoLoading !== null}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors min-h-[44px]"
            >
              <Building2 className="w-4 h-4 text-blue-600 mb-0.5" />
              <span>NGO Org</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={demoLoading !== null}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors min-h-[44px]"
            >
              <Shield className="w-4 h-4 text-purple-600 mb-0.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="name@example.com or +91 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(identifier.includes('@') ? identifier : '');
                  setForgotStep(1);
                  setShowForgotModal(true);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            icon={ArrowRight}
          >
            Sign In
          </Button>
        </form>

        {/* Footer link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-emerald-600 hover:underline">
            Register now
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Password"
        size="md"
      >
        {forgotStep === 1 ? (
          <form onSubmit={handleSendResetCode} className="space-y-4">
            <p className="text-xs text-slate-500">
              Enter the email address associated with your account. We will send you a 6-digit verification code to reset your password.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForgotModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSendingCode}>
                Send Reset Code
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              A 6-digit code has been sent to <strong>{forgotEmail}</strong>. Enter the code and your new password below.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest"
                />
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setForgotStep(1)}
                className="text-xs text-slate-500 hover:underline"
              >
                ← Back to email
              </button>
              <Button type="submit" variant="primary" size="sm" isLoading={isResetting}>
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
