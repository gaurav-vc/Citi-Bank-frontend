import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/api/auth';
import { toast } from '@/hooks/use-toast';
import { User, Lock, Loader2, Mail, Building2, Briefcase, Pencil } from 'lucide-react';
import { RoleLabels } from '@/types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    department: '',
    phone_number: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security state
  const [securityData, setSecurityData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserData();
      setIsEditing(false);
      setActiveTab('profile');
    }
  }, [user, isOpen]);

  const fetchUserData = async () => {
    try {
      const res = await authAPI.me();
      if (res) {
        setProfileData({
          name: res.name || '',
          department: res.department || '',
          phone_number: res.profile?.phone_number || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data', error);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await authAPI.updateUser(user.id, {
        name: profileData.name,
        department: profileData.department,
        phone_number: profileData.phone_number,
      });
      toast({
        title: 'Profile Updated',
        description: 'Your account details have been saved successfully.',
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.new_password !== securityData.confirm_password) {
      toast({
        title: 'Passwords Mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await authAPI.changePasswordFirstLogin({
        current_password: securityData.current_password,
        new_password: securityData.new_password,
      });
      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully.',
      });
      setSecurityData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      toast({
        title: 'Password Change Failed',
        description: error.response?.data?.error || 'Failed to change password. Please verify your current password.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[750px] p-0 overflow-hidden bg-[#FAFAFA] border-none rounded-2xl gap-0">
        <div className="flex min-h-[500px]">
          {/* Left Sidebar */}
          <div className="w-[200px] bg-[#F7F8FA] border-r border-slate-100 flex flex-col p-6">
            <h2 className="text-xl font-bold text-[#0D1B2A] mb-6">Settings</h2>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-[#EAF1FF] text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'security' 
                    ? 'bg-[#EAF1FF] text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-100/50'
                }`}
              >
                <Lock className="h-4 w-4" />
                Security
              </button>
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 relative bg-[#FAFAFA] overflow-y-auto pt-10">
            {activeTab === 'profile' && (
              <div className="px-10 pb-10">
                {!isEditing ? (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-[#EAF1FF] flex items-center justify-center text-blue-600 text-3xl font-bold">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-[#0D1B2A]">{user.name}</h3>
                          <p className="text-slate-500 font-medium mt-1">{RoleLabels[user.role] || user.role}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="icon" className="rounded-xl border-slate-200" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      {/* Contact Info Card */}
                      <div className="bg-[#F8F9FB] border border-slate-100 rounded-2xl p-5">
                        <h4 className="text-xs font-bold tracking-wider text-slate-600 uppercase mb-4">Contact Info</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-slate-700">
                            <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                            <span className="text-sm font-medium truncate" title={user.email}>{user.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Organization Card */}
                      <div className="bg-[#F8F9FB] border border-slate-100 rounded-2xl p-5">
                        <h4 className="text-xs font-bold tracking-wider text-slate-600 uppercase mb-4">Organization</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-slate-700">
                            <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
                            <span className="text-sm font-medium truncate">Campus Procurement</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-700">
                            <Briefcase className="h-4 w-4 text-slate-500 shrink-0" />
                            <span className="text-sm font-medium truncate">Department: {profileData.department || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={onProfileSubmit} className="space-y-6 max-w-xl animate-in fade-in duration-300">
                    <div>
                      <h3 className="text-xl font-bold text-[#0D1B2A] mb-1">Edit Profile</h3>
                      <p className="text-sm text-slate-500">Update your personal information.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={profileData.name} 
                          onChange={handleProfileChange} 
                          required 
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input 
                          id="department" 
                          name="department" 
                          value={profileData.department} 
                          onChange={handleProfileChange} 
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input 
                          id="phone_number" 
                          name="phone_number" 
                          value={profileData.phone_number} 
                          onChange={handleProfileChange} 
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="bg-white">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isUpdatingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="px-10 pb-10 animate-in fade-in duration-300">
                <form onSubmit={onSecuritySubmit} className="space-y-6 max-w-xl">
                  <div>
                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-1">Security Settings</h3>
                    <p className="text-sm text-slate-500">Manage your password and security preferences.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input 
                        id="current_password" 
                        name="current_password" 
                        type="password" 
                        value={securityData.current_password} 
                        onChange={handleSecurityChange} 
                        required 
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <Input 
                        id="new_password" 
                        name="new_password" 
                        type="password" 
                        value={securityData.new_password} 
                        onChange={handleSecurityChange} 
                        required 
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input 
                        id="confirm_password" 
                        name="confirm_password" 
                        type="password" 
                        value={securityData.confirm_password} 
                        onChange={handleSecurityChange} 
                        required 
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={isUpdatingPassword} className="bg-blue-600 hover:bg-blue-700 text-white">
                      {isUpdatingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
