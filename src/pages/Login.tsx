import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Lock, Mail, Eye, Building2, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';




export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, token, refreshUser, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Forgot password dialog state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotDevCode, setForgotDevCode] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [showForgotPwd, setShowForgotPwd] = useState(false);

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter your registered email.', variant: 'destructive' });
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await authAPI.forgotPassword(forgotEmail.trim());
      setForgotResetToken(res.reset_token || '');
      setForgotDevCode(res.dev_code || null);
      if (res.dev_code) {
        setForgotCode(res.dev_code);
      }
      setForgotStep(2);
      toast({
        title: 'Verification Code Sent',
        description: res.message || 'Please check your email for the 6-digit code.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.data?.error || err.message || 'No account found with this email.',
        variant: 'destructive',
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter the 6-digit verification code.', variant: 'destructive' });
      return;
    }
    if (forgotNewPassword.length < 6) {
      toast({ title: 'Validation Error', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast({ title: 'Validation Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await authAPI.resetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        reset_token: forgotResetToken,
        new_password: forgotNewPassword,
      });

      toast({
        title: 'Password Reset Successful',
        description: res.message || 'You can now sign in with your new password.',
      });

      // Pre-fill email in login form
      setEmail(forgotEmail.trim());
      setPassword('');
      setIsForgotOpen(false);
      setForgotStep(1);
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotDevCode(null);
    } catch (err: any) {
      toast({
        title: 'Reset Failed',
        description: err.data?.error || err.message || 'Invalid or expired verification code.',
        variant: 'destructive',
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  useEffect(() => {
    // If user is already logged in and does not need a password change, redirect to dashboard
    if (user && !user.force_password_change) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      // Fetch user from localStorage to verify if force_password_change is true
      const stored = localStorage.getItem('campusspend_user');
      const parsedUser = stored ? JSON.parse(stored) : null;

      if (parsedUser && parsedUser.force_password_change) {
        toast({
          title: 'Authentication Verified',
          description: 'Please set your permanent password to continue.',
        });
      } else {
        toast({
          title: 'Welcome!',
          description: 'Logged in successfully',
        });
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Validation Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: 'Validation Error', description: 'Password must be at least 8 characters long.', variant: 'destructive' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const activeToken = token || localStorage.getItem('campusspend_token');
      const data = await authAPI.changePasswordFirstLogin({ new_password: newPassword }, activeToken || undefined);

      localStorage.setItem('campusspend_user', JSON.stringify(data.user));
      toast({ title: 'Success', description: 'Password updated successfully. Access granted.' });
      await refreshUser(activeToken || undefined);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({ title: 'Error', description: err.data?.error || err.message || 'Failed to update password', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F0F4F8]">
      {/* Left Side - 50% Enterprise Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center items-center p-16 xl:p-20 select-none bg-[#004299]">
        {/* Rich linear gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#004B9E] via-[#003B82] to-[#001D4A] z-0" />

        {/* Top-Left Abstract Rings */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.03] z-0 pointer-events-none" />
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-white/[0.02] z-0 pointer-events-none" />
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full bg-white/[0.015] z-0 pointer-events-none" />

        {/* Bottom-Right Abstract Rings */}
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[500px] h-[500px] rounded-full bg-[#001030]/[0.15] z-0 pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[800px] h-[800px] rounded-full bg-[#001030]/[0.1] z-0 pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[1100px] h-[1100px] rounded-full bg-[#001030]/[0.05] z-0 pointer-events-none" />

        {/* Skyline Silhouette at the bottom */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-48 text-[#00183F] fill-current opacity-80 z-0 pointer-events-none"
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,200 L0,150 L20,150 L20,110 L40,110 L40,165 L60,165 L60,100 L80,100 L80,170 L100,170 L100,85 L120,85 L120,65 L130,65 L130,85 L140,85 L140,175 L160,175 L160,125 L180,125 L180,95 L200,95 L200,155 L220,155 L220,75 L240,75 L240,55 L250,55 L250,75 L260,75 L260,165 L280,165 L280,115 L300,115 L300,85 L320,85 L320,145 L340,145 L340,105 L360,105 L360,55 L380,55 L380,175 L400,175 L400,125 L420,125 L420,95 L440,95 L440,155 L460,155 L460,65 L480,65 L480,45 L490,45 L490,65 L500,65 L500,165 L520,165 L520,105 L540,105 L540,75 L560,75 L560,135 L580,135 L580,95 L600,95 L600,175 L620,175 L620,115 L640,115 L640,85 L660,85 L660,155 L680,155 L680,65 L700,65 L700,35 L710,35 L710,65 L720,65 L720,165 L740,165 L740,105 L760,105 L760,75 L780,75 L780,145 L800,145 L800,85 L820,85 L820,55 L830,55 L830,85 L840,85 L840,175 L860,175 L860,125 L880,125 L880,95 L900,95 L900,155 L920,155 L920,75 L940,75 L940,165 L960,165 L960,115 L980,115 L980,190 L1000,190 L1000,200 Z" />
        </svg>

        {/* Center Content Wrapper - Strict Flexbox Alignment */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white w-full max-w-lg mx-auto gap-6 m-0 p-0">

          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-[38px] font-extrabold font-sans leading-none m-0 p-0 text-center w-full">
              First International Financial Center
            </h1>
          </div>

          {/* Fading gradient horizontal line */}
          <div className="w-[300px] h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto" />


          <h2 className="text-[18px] font-bold text-white font-sans leading-none m-0 p-0 text-center w-full">
            Procurement & Facility Operational Tool
          </h2>

          {/* Solid short horizontal line */}
          <div className="w-12 h-[1px] bg-white/40 mx-auto" />

          <p className="text-[14px] text-white/90 leading-relaxed max-w-sm font-sans m-0 p-0 text-center w-full">
            Manage procurement, vendors,<br />inventory and approvals.
          </p>
        </div>
      </div>

      {/* Right Side - 50% Login Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F4F7F9] lg:p-12 relative">
        {/* Mobile Logo Header */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-8 select-none">
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-[#004B87] uppercase font-sans">FIFC</h1>
            <p className="text-xs text-slate-500 font-semibold font-sans">Procurement & Facility Operational Tool</p>
          </div>
        </div>

        {/* Card exact spacing and styling as the reference image */}
        {user?.force_password_change ? (
          <Card className="w-full max-w-[460px] border-2 border-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white rounded-2xl p-10 font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
            <div className="space-y-2 text-center pb-6">
              <h2 className="text-3xl font-extrabold text-[#0D1B2A] tracking-tight">Update Password</h2>
              <p className="text-sm text-slate-500 font-medium">A password change is required on your first login.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="font-bold text-[11px] text-slate-500 uppercase tracking-widest block mb-1.5">NEW PASSWORD</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-11 pr-4 font-medium text-sm h-[48px] bg-[#F0F4F8] border-slate-200 focus-visible:ring-[#003366] rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-bold text-[11px] text-slate-500 uppercase tracking-widest block mb-1.5">CONFIRM PASSWORD</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 pr-4 font-medium text-sm h-[48px] bg-[#F0F4F8] border-slate-200 focus-visible:ring-[#003366] rounded-lg"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-[48px] font-bold text-[15px] bg-[#002D62] hover:bg-[#001D3D] text-white transition-colors mt-4 rounded-lg shadow-sm" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating...' : 'Change Password'}
              </Button>

              <Button type="button" variant="ghost" className="w-full h-[48px] font-semibold text-sm mt-1 text-slate-500 hover:text-slate-800 rounded-lg" onClick={logout}>
                Cancel & Sign Out
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="w-full max-w-[460px] border-2 border-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white rounded-2xl p-10 font-sans relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
            <div className="space-y-2 text-center pb-8">
              <h2 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight">Welcome back</h2>
              <p className="text-[14px] text-slate-500 font-medium">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-[11px] text-slate-500 uppercase tracking-widest block mb-1.5">EMAIL</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 pr-4 font-medium text-[14px] h-[48px] bg-[#F0F4F8] border-slate-200 focus-visible:ring-[#003366] rounded-lg text-slate-800 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-[11px] text-slate-500 uppercase tracking-widest block mb-1.5">PASSWORD</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-10 font-medium text-[14px] h-[48px] bg-[#F0F4F8] border-slate-200 focus-visible:ring-[#003366] rounded-lg text-slate-800 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[13px] text-slate-600 mt-5 mb-5">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors font-medium">
                  <input type="checkbox" className="rounded border-slate-300 text-[#002D62] focus:ring-[#002D62] h-4 w-4" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setForgotStep(1);
                    setForgotCode('');
                    setForgotNewPassword('');
                    setForgotConfirmPassword('');
                    setForgotDevCode(null);
                    setIsForgotOpen(true);
                  }}
                  className="text-[#004B87] hover:underline transition-colors font-bold text-[13px] bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full h-[48px] font-bold text-[15px] bg-[#002D62] hover:bg-[#001D3D] text-white transition-colors rounded-lg shadow-sm" disabled={isLoading}>
                {isLoading ? 'Sign in...' : 'Sign in'}
              </Button>

              {/* Property Info Block exactly matched to the bottom of the reference card */}
              <div className="bg-[#F4F7F9] border-none rounded-xl p-5 mt-8 text-center space-y-2.5 select-none">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PROPERTY INFO</p>
                <div className="flex items-center justify-center gap-2 text-slate-800 font-extrabold text-[15px]">
                  <Building2 className="h-5 w-5 text-slate-600" />
                  <span>FIFC</span>
                </div>
                <div className="text-[12px] text-slate-500 leading-relaxed max-w-[260px] mx-auto">
                  <p>Plot No. C54 & 55, Block 'G' • BKC, Bandra (E),</p>
                  <p>Mumbai - 400098</p>
                </div>
              </div>
            </form>
          </Card>
        )}
      </div>
    
      {/* Forgot Password Dialog */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 bg-white rounded-xl shadow-2xl border border-slate-100">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#003366] flex items-center justify-center mb-1">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {forgotStep === 1 ? 'Forgot Password' : 'Reset Your Password'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {forgotStep === 1
                ? 'Enter your registered email address and we will generate a 6-digit verification code to reset your password.'
                : `Enter the 6-digit verification code sent to ${forgotEmail} and set your new password.`}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === 1 ? (
            <form onSubmit={handleSendResetCode} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Registered Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#003366]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotOpen(false)}
                  disabled={isForgotLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#002D62] hover:bg-[#001D3D] text-white"
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
              {forgotDevCode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                  <span>Verification Code: <strong>{forgotDevCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setForgotCode(forgotDevCode)}
                    className="text-[11px] font-bold text-blue-700 underline"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="forgot-code" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  6-Digit Verification Code
                </Label>
                <Input
                  id="forgot-code"
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                  className="h-11 tracking-widest text-center text-lg font-bold bg-slate-50 border-slate-200 focus-visible:ring-[#003366]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgot-new-pwd" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgot-new-pwd"
                    type={showForgotPwd ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#003366]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPwd(!showForgotPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgot-confirm-pwd" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgot-confirm-pwd"
                    type={showForgotPwd ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-[#003366]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForgotStep(1)}
                  disabled={isForgotLoading}
                  className="text-xs text-slate-500"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-[#002D62] hover:bg-[#001D3D] text-white"
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
