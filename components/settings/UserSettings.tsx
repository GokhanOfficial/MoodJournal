'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { User, Mail, Lock, Bell, Shield, Trash2, Eye, EyeOff, Save, Camera, Palette, Settings } from 'lucide-react'
import NotificationSettings from '@/components/notifications/NotificationSettings'
import ThemeSelector from '@/components/settings/ThemeSelector'
import AdminDashboard from '@/components/admin/AdminDashboard'

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  is_admin: boolean
  theme_preference: string | null
}

export default function UserSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
        return
      }

      let userProfile = profileData

      // If no profile exists, create one
      if (!profileData) {
        try {
          // Use the stable RPC function to create profile
          const { data: rpcResult, error: rpcError } = await supabase
            .rpc('create_user_profile')

          if (rpcError) {
            console.error('Error creating profile via RPC:', rpcError)
            throw rpcError
          }

          console.log('Profile created successfully via RPC')

          // Fetch the newly created profile
          const { data: newProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (fetchError) {
            console.error('Error fetching created profile:', fetchError)
            throw fetchError
          }

          userProfile = newProfile
        } catch (createError) {
          console.error('Failed to create profile:', createError)
          // Fallback to temporary profile object
          userProfile = {
            id: user.id,
            email: user.email || '',
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
            avatar_url: null,
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at,
            is_admin: false,
            theme_preference: 'system'
          }
        }
      }

      setProfile(userProfile)
      setFormData({
        display_name: userProfile.display_name || '',
        email: userProfile.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    if (!profile) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          email: formData.email,
          display_name: formData.display_name || null,
          avatar_url: profile.avatar_url,
          is_admin: profile.is_admin,
          theme_preference: profile.theme_preference
        })

      if (error) {
        throw error
      }

      // Update email in auth if changed
      if (formData.email !== profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        
        if (emailError) {
          throw emailError
        }
      }

      await loadProfile()
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async () => {
    if (!formData.new_password || !formData.confirm_password) {
      alert('Please fill in all password fields.')
      return
    }

    if (formData.new_password !== formData.confirm_password) {
      alert('New passwords do not match.')
      return
    }

    if (formData.new_password.length < 6) {
      alert('Password must be at least 6 characters long.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.new_password
      })

      if (error) {
        throw error
      }

      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
      
      alert('Password updated successfully!')
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Failed to update password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async () => {
    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    )
    
    if (confirmation !== 'DELETE') {
      return
    }

    setSaving(true)
    try {
      // Note: In a production app, you'd want to handle this server-side
      // to ensure all user data is properly deleted
      const { error } = await supabase.auth.admin.deleteUser(profile!.id)
      
      if (error) {
        throw error
      }

      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    ...(profile?.is_admin ? [{ id: 'admin', label: 'Admin', icon: Settings }] : [])
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                  {tab.id === 'admin' && (
                    <Shield className="h-4 w-4 ml-auto" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                <p className="text-muted-foreground">Update your personal information and preferences.</p>
              </div>

              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {formData.display_name ? formData.display_name[0].toUpperCase() : formData.email[0].toUpperCase()}
                    </div>
                    <button className="absolute -bottom-1 -right-1 p-2 bg-background border border-border rounded-full hover:bg-muted transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium">Profile Picture</h3>
                    <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Admin Status Display */}
                {profile?.is_admin && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="font-medium text-primary">Admin Account</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have administrator privileges on this system.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={updateProfile}
                    disabled={saving}
                    className="btn-primary"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-xl font-semibold">Security Settings</h2>
                <p className="text-muted-foreground">Manage your password and security preferences.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={formData.current_password}
                          onChange={(e) => setFormData(prev => ({ ...prev, current_password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={formData.new_password}
                          onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirm_password}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={updatePassword}
                      disabled={saving}
                      className="btn-primary"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <ThemeSelector />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettings />
          )}

          {activeTab === 'privacy' && (
            <div className="card">
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-xl font-semibold">Privacy & Data</h2>
                <p className="text-muted-foreground">Manage your data and privacy settings.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Data Export</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all your journal entries and data in a portable format.
                  </p>
                  <button 
                    onClick={() => window.open('/api/user/export', '_blank')}
                    className="btn-secondary"
                  >
                    Export My Data
                  </button>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
                  <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <h4 className="font-medium text-red-800 dark:text-red-400 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={deleteAccount}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {saving ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && profile?.is_admin && (
            <AdminDashboard />
          )}
        </div>
      </div>
    </div>
  )
}