import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Shield, 
  Globe, 
  Lock, 
  Key, 
  AlertCircle, 
  Calendar, 
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Toast from '../components/Toast';

const Profile = ({ user, onUserUpdate }) => {
  // Persisted state from API
  const [persistedData, setPersistedData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    role: 'User',
    createdAt: ''
  });

  // Local editable form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });

  // Security password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI & Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [toast, setToast] = useState(null);

  // Load user data on mount
  useEffect(() => {
    let isMounted = true;
    axios.get('/api/v1/auth/me', { withCredentials: true })
      .then(res => {
        if (!isMounted) return;
        const data = res.data || {};
        const name = data.name || '';
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const loaded = {
          firstName,
          lastName,
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          role: data.role || 'User',
          createdAt: data.createdAt || ''
        };

        setPersistedData(loaded);
        setFormData({
          firstName: loaded.firstName,
          lastName: loaded.lastName,
          email: loaded.email,
          phone: loaded.phone,
          location: loaded.location,
          bio: loaded.bio
        });
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to load user profile:', err);
        setToast({ message: 'Failed to load profile parameters from server.', type: 'error' });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Dirty detection (Local edits differ from persisted)
  const isDirty = useMemo(() => {
    return (
      formData.firstName !== persistedData.firstName ||
      formData.lastName !== persistedData.lastName ||
      formData.phone !== persistedData.phone ||
      formData.location !== persistedData.location ||
      formData.bio !== persistedData.bio
    );
  }, [formData, persistedData]);

  // Handle Input Changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name] || passwordErrors.server) {
      setPasswordErrors(prev => ({ ...prev, [name]: undefined, server: undefined }));
    }
  };

  // Revert/Cancel Unsaved Changes
  const handleCancel = () => {
    setFormData({
      firstName: persistedData.firstName,
      lastName: persistedData.lastName,
      email: persistedData.email,
      phone: persistedData.phone,
      location: persistedData.location,
      bio: persistedData.bio
    });
    setProfileErrors({});
    setToast({ message: 'Unsaved profile edits reverted.', type: 'info' });
  };

  // Validate Profile Form
  const validateProfileForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    }
    if (formData.phone && !/^[+0-9\s\-()]{7,20}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number (e.g. +91 98765 43210).';
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Profile Details
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    if (!validateProfileForm()) {
      setToast({ message: 'Please correct the highlighted form errors.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    try {
      const res = await axios.put('/api/v1/auth/profile', {
        name: fullName,
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim()
      }, { withCredentials: true });

      const updated = res.data;
      const nameParts = (updated.name || fullName).trim().split(/\s+/);
      const updatedFirst = nameParts[0] || '';
      const updatedLast = nameParts.slice(1).join(' ') || '';

      const newPersisted = {
        ...persistedData,
        firstName: updatedFirst,
        lastName: updatedLast,
        phone: updated.phone || formData.phone,
        location: updated.location || formData.location,
        bio: updated.bio || formData.bio,
      };

      setPersistedData(newPersisted);
      setFormData({
        firstName: newPersisted.firstName,
        lastName: newPersisted.lastName,
        email: newPersisted.email,
        phone: newPersisted.phone,
        location: newPersisted.location,
        bio: newPersisted.bio
      });
      setProfileErrors({});
      setToast({ message: 'Profile details saved successfully!', type: 'success' });

      if (onUserUpdate) {
        onUserUpdate(updated);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errMsg = err.response?.data?.message || 'Failed to update profile.';
      setToast({ message: errMsg, type: 'error' });
      // Preserves user-entered values in formData on failure!
    } finally {
      setIsSaving(false);
    }
  };

  // Validate Password Form
  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters.';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'New passwords do not match.';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Password Update
  const handleSavePassword = async (e) => {
    if (e) e.preventDefault();
    if (isUpdatingPassword) return;

    if (!validatePasswordForm()) {
      setToast({ message: 'Please correct password form requirements.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await axios.put('/api/v1/auth/profile', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, { withCredentials: true });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      setToast({ message: 'Security password successfully updated!', type: 'success' });
    } catch (err) {
      console.error('Failed to update password:', err);
      const errMsg = err.response?.data?.message || 'Failed to update password.';
      setPasswordErrors(prev => ({ ...prev, server: errMsg }));
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Display Formatters
  const fullName = `${persistedData.firstName} ${persistedData.lastName}`.trim() || user?.name || 'FinFlow User';
  const memberSince = persistedData.createdAt 
    ? new Date(persistedData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Active Account';

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex justify-between items-center pt-2">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-muted rounded-radius animate-pulse" />
            <div className="h-4 w-72 bg-surface-secondary rounded-radius animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <div className="h-80 bg-surface border border-border rounded-radius p-6 animate-pulse" />
            <div className="h-48 bg-surface border border-border rounded-radius p-6 animate-pulse" />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <div className="h-96 bg-surface border border-border rounded-radius p-6 animate-pulse" />
            <div className="h-72 bg-surface border border-border rounded-radius p-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 pb-20 profile-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" icon={Shield} className="text-xs">
              {persistedData.role || user?.role || 'Standard'} Account
            </Badge>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {user?._id || 'Verified User'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-display">
            Account Profile
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your personal identity, contact coordinates, and security credentials.
          </p>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="text-xs px-2.5 py-1">
              Unsaved changes
            </Badge>
          </div>
        )}
      </div>

      {/* Main Grid: Left Column (Avatar & Meta) + Right Column (Forms) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN: Identity & Account Meta */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Identity Card */}
          <Card>
            <CardContent className="p-6 text-center flex flex-col items-center">
              {/* Profile Avatar Frame */}
              <div className="relative mb-5">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=256`} 
                  className="w-28 h-28 rounded-2xl border-2 border-border shadow-token-md object-cover"
                  alt={`Profile avatar for ${fullName}`}
                />
              </div>

              {/* User Name & Role */}
              <h2 className="text-xl font-black text-foreground font-display tracking-tight">
                {fullName}
              </h2>
              
              <div className="mt-2">
                <Badge variant="secondary" icon={Shield} className="text-[11px] font-bold">
                  {persistedData.role || 'Standard User'}
                </Badge>
              </div>

              {/* Registration Date */}
              <div className="w-full mt-6 pt-5 border-t border-border flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" /> Member Since
                </span>
                <span className="font-semibold text-foreground font-mono text-[11px]">
                  {memberSince}
                </span>
              </div>

              {/* Quick Contacts List */}
              <div className="w-full mt-4 pt-4 border-t border-border space-y-3 text-left">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="font-medium text-foreground truncate text-xs">{persistedData.email || 'Not available'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <Phone size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="font-medium text-foreground truncate text-xs">{persistedData.phone || 'Not added'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</p>
                    <p className="font-medium text-foreground truncate text-xs">{persistedData.location || 'Not added'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & System Metadata Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Globe size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold font-display">Security Overview</CardTitle>
                  <p className="text-[11px] text-muted-foreground">Active session and protection protocols</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-1 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Session Auth</span>
                <Badge variant="success" className="text-[10px]">JWT Cookie</Badge>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Password Hash</span>
                <span className="font-mono text-[11px] font-semibold text-foreground">Bcrypt (Salt 10)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground font-medium">Account Status</span>
                <Badge variant="success" className="text-[10px]">Verified Active</Badge>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground font-medium">Server Node</span>
                <span className="font-mono text-[11px] font-semibold text-foreground">Asia-Pacific (Local)</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Profile Forms & Security */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Form 1: Personal Profile Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <User size={18} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold font-display">Personal Details</CardTitle>
                    <p className="text-xs text-muted-foreground">Update your public identifiers and contact information</p>
                  </div>
                </div>
                {isDirty && (
                  <Badge variant="warning" className="text-[10px]">
                    Unsaved Edits
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* First Name */}
                  <div>
                    <label 
                      htmlFor="profile-first-name"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      First Name <span className="text-destructive">*</span>
                    </label>
                    <input 
                      id="profile-first-name"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleProfileChange}
                      placeholder="e.g. John"
                      className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                        profileErrors.firstName 
                          ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                          : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                      }`}
                    />
                    {profileErrors.firstName && (
                      <p className="text-[11px] text-destructive mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle size={12} /> {profileErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label 
                      htmlFor="profile-last-name"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      Last Name
                    </label>
                    <input 
                      id="profile-last-name"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleProfileChange}
                      placeholder="e.g. Doe"
                      className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    />
                  </div>

                  {/* Registered Email (Read-Only) */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label 
                        htmlFor="profile-email"
                        className="block text-xs font-bold text-foreground font-display"
                      >
                        Registered Email Address
                      </label>
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Lock size={10} /> Managed by account auth
                      </span>
                    </div>
                    <input 
                      id="profile-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      aria-readonly="true"
                      className="w-full bg-surface-secondary text-muted-foreground border border-border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm font-mono cursor-not-allowed opacity-80"
                    />
                  </div>

                  {/* Primary Phone */}
                  <div>
                    <label 
                      htmlFor="profile-phone"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      Primary Phone
                    </label>
                    <input 
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleProfileChange}
                      placeholder="e.g. +91 98765 43210"
                      className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                        profileErrors.phone 
                          ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                          : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                      }`}
                    />
                    {profileErrors.phone && (
                      <p className="text-[11px] text-destructive mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle size={12} /> {profileErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label 
                      htmlFor="profile-location"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      Location / Timezone
                    </label>
                    <input 
                      id="profile-location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleProfileChange}
                      placeholder="e.g. Bangalore, India"
                      className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    />
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label 
                      htmlFor="profile-bio"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      Biography Summary
                    </label>
                    <textarea 
                      id="profile-bio"
                      name="bio"
                      rows={3}
                      value={formData.bio}
                      onChange={handleProfileChange}
                      placeholder="Share a brief overview of your finance operations, company role, or invoicing responsibilities..."
                      className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all resize-y min-h-[80px]"
                    />
                  </div>

                </div>

                {/* Profile Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
                  {isDirty && (
                    <Button 
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={handleCancel}
                      disabled={isSaving}
                      leftIcon={RotateCcw}
                      className="text-xs sm:text-sm"
                    >
                      Cancel & Revert
                    </Button>
                  )}
                  <Button 
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    disabled={!isDirty || isSaving}
                    leftIcon={Save}
                    className="text-xs sm:text-sm shadow-sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Form 2: Account Security & Credentials */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Lock size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-display">Security Credentials</CardTitle>
                  <p className="text-xs text-muted-foreground">Update your account password using strong cryptographic hashing</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              {/* Server Password Error Alert */}
              {passwordErrors.server && (
                <div 
                  className="mb-4 p-3.5 rounded-radius bg-destructive/10 border border-destructive/25 text-destructive text-xs font-medium flex items-center gap-2"
                  role="alert"
                >
                  <ShieldAlert size={16} className="flex-shrink-0" />
                  <span>{passwordErrors.server}</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Current Password */}
                  <div className="md:col-span-2">
                    <label 
                      htmlFor="security-current-password"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      Current Password <span className="text-destructive">*</span>
                    </label>
                    <input 
                      id="security-current-password"
                      name="currentPassword"
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                        passwordErrors.currentPassword 
                          ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                          : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                      }`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-[11px] text-destructive mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle size={12} /> {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label 
                      htmlFor="security-new-password"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      New Password <span className="text-destructive">*</span>
                    </label>
                    <input 
                      id="security-new-password"
                      name="newPassword"
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Minimum 6 characters"
                      className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                        passwordErrors.newPassword 
                          ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                          : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-[11px] text-destructive mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle size={12} /> {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label 
                      htmlFor="security-confirm-password"
                      className="block text-xs font-bold text-foreground font-display mb-1.5"
                    >
                      Confirm New Password <span className="text-destructive">*</span>
                    </label>
                    <input 
                      id="security-confirm-password"
                      name="confirmPassword"
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-type new password"
                      className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                        passwordErrors.confirmPassword 
                          ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                          : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-[11px] text-destructive mt-1 flex items-center gap-1 font-medium" role="alert">
                        <AlertCircle size={12} /> {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                </div>

                {/* Password Form Actions */}
                <div className="flex items-center justify-end pt-4 border-t border-border mt-4">
                  <Button 
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isUpdatingPassword}
                    disabled={isUpdatingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                    leftIcon={Key}
                    className="text-xs sm:text-sm shadow-sm"
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Global Toast Feedback */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default Profile;
