import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Lock, Mail, Eye, Building2 } from 'lucide-react';
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
              FIFC
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
                <a href="#" className="text-[#004B87] hover:underline transition-colors font-bold">
                  Forgot password?
                </a>
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
    </div>
  );
}
