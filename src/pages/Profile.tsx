import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, Calendar, Lock, Eye, EyeOff, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Password change
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    if (!profileName.trim()) errors.name = 'Name is required';
    else if (profileName.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!profileEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())) errors.email = 'Please enter a valid email address';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSave = async () => {
    if (!validateProfileForm()) return;

    setProfileSaving(true);
    try {
      const updates: { name?: string; email?: string } = {};
      if (profileName.trim() !== user?.name) updates.name = profileName.trim();
      if (profileEmail.trim().toLowerCase() !== user?.email) updates.email = profileEmail.trim();

      if (Object.keys(updates).length === 0) {
        setIsEditingProfile(false);
        return;
      }

      await authApi.updateProfile(updates);
      await refreshUser();
      setIsEditingProfile(false);
      setProfileErrors({});
      toast.success('Profile updated successfully.');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update profile.';
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      errors.newPassword = 'Must include uppercase, lowercase, number, and special character';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordForm()) return;

    setPasswordSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      toast.success('Password changed successfully. You will be logged out shortly.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      // Log out after password change
      setTimeout(() => logout(), 3000);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
    setIsChangingPassword(false);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">View and manage your account information</p>
        </div>

        {/* Profile Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
              </div>
              {!isEditingProfile && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="btn-press">
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              {isEditingProfile ? (
                <div>
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => { setProfileName(e.target.value); setProfileErrors(prev => ({ ...prev, name: '' })); }}
                    placeholder="Enter your name"
                    className={`max-w-sm ${profileErrors.name ? 'border-red-500' : ''}`}
                  />
                  {profileErrors.name && <p className="text-sm text-red-500 mt-1">{profileErrors.name}</p>}
                </div>
              ) : (
                <p className="text-base font-medium">{user?.name || '—'}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              {isEditingProfile ? (
                <div>
                  <Input
                    id="email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => { setProfileEmail(e.target.value); setProfileErrors(prev => ({ ...prev, email: '' })); }}
                    placeholder="Enter your email"
                    className={`max-w-sm ${profileErrors.email ? 'border-red-500' : ''}`}
                  />
                  {profileErrors.email && <p className="text-sm text-red-500 mt-1">{profileErrors.email}</p>}
                </div>
              ) : (
                <p className="text-base font-medium">{user?.email || '—'}</p>
              )}
            </div>

            {/* Role (read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {user?.role || 'ADMIN'}
              </span>
            </div>

            {/* Last Login */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Last Login
              </Label>
              <p className="text-base font-medium">
                {user?.lastLogin
                  ? new Date(user.lastLogin).toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </p>
            </div>

            {/* Account Created */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Account Created
              </Label>
              <p className="text-base font-medium">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>

            {/* Edit buttons */}
            {isEditingProfile && (
              <div className="flex gap-3 pt-2">
                <Button onClick={handleProfileSave} disabled={profileSaving} className="btn-press">
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} disabled={profileSaving} className="btn-press">
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Password & Security</CardTitle>
                  <CardDescription>Manage your password</CardDescription>
                </div>
              </div>
              {!isChangingPassword && (
                <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                  Change Password
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isChangingPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative max-w-sm">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setPasswordErrors(prev => ({ ...prev, currentPassword: '' })); }}
                      placeholder="Enter current password"
                      className={passwordErrors.currentPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && <p className="text-sm text-red-500">{passwordErrors.currentPassword}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative max-w-sm">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordErrors(prev => ({ ...prev, newPassword: '' })); }}
                      placeholder="Enter new password"
                      className={passwordErrors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>}
                  <p className="text-xs text-muted-foreground">At least 8 characters with uppercase, lowercase, number, and special character.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative max-w-sm">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                      placeholder="Confirm new password"
                      className={passwordErrors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handlePasswordChange} disabled={passwordSaving} variant="destructive" className="btn-press">
                    {passwordSaving ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button variant="outline" onClick={handleCancelPassword} disabled={passwordSaving} className="btn-press">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                It's recommended to use a strong password that you don't use elsewhere.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
