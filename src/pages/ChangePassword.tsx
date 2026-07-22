import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, token, refreshUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'New password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const activeToken = token || localStorage.getItem('campusspend_token');
      const data = await authAPI.changePasswordFirstLogin({
          current_password: currentPassword,
          new_password: newPassword,
        }, activeToken || undefined);

      localStorage.setItem('campusspend_user', JSON.stringify(data.user));
      toast({
        title: 'Success',
        description: 'Password updated successfully. Access granted.',
      });
      await refreshUser(activeToken || undefined);
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.data?.error || err.message || 'Failed to update password',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] lg:bg-[#091E3A] p-4 relative overflow-hidden">
      {/* Background patterns similar to login for high aesthetic style */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020B1A] via-[#05142E] to-[#0A2540] hidden lg:block z-0" />
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-[#E53935]/5 rounded-full filter blur-[130px] pointer-events-none hidden lg:block z-0" />
      <div className="absolute bottom-1/4 -right-20 w-[550px] h-[550px] bg-[#185BCE]/10 rounded-full filter blur-[150px] pointer-events-none hidden lg:block z-0" />

      <Card className="w-full max-w-[420px] border border-border/80 shadow-2xl bg-card rounded-2xl p-8 lg:p-10 font-inter relative z-10">
        <div className="flex flex-col items-center gap-2 text-center pb-6 border-b mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Change Password</h2>
          <p className="text-sm font-medium text-muted-foreground">
            A password update is required for first-time login security.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 font-medium text-sm h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 font-medium text-sm h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 font-medium text-sm h-11"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-bold text-sm tracking-wide bg-[#0B5CBE] hover:bg-[#084898] text-white transition-colors mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-bold text-sm"
            onClick={logout}
          >
            Cancel & Sign Out
          </Button>
        </form>
      </Card>
    </div>
  );
}
