'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Users, 
  Trophy, 
  Shield, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  Filter,
  Crown,
  Star,
  Award,
  Target,
  BarChart3,
  UserX,
  UserCheck,
  AlertTriangle
} from 'lucide-react'

interface User {
  id: string
  email: string
  display_name: string | null
  is_admin: boolean
  created_at: string
  total_entries: number
  total_achievements: number
  last_entry_date: string | null
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  type: string
  target_value: number | null
  target_decimal: number | null
  rarity: string
  points: number
  is_active: boolean
  sort_order: number
  created_at: string
  total_unlocked: number
}

interface AdminStats {
  total_users: number
  total_admins: number
  total_achievements: number
  active_achievements: number
  total_entries: number
  total_unlocked_achievements: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
    }
  }, [isAdmin])

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.is_admin || false)
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const loadAdminData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadUsers(),
        loadAchievements(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    const { data: usersData } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        is_admin,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (usersData) {
      // Get additional user stats
      const usersWithStats = await Promise.all(
        usersData.map(async (user) => {
          const { data: entriesData } = await supabase
            .from('journal_entries')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          const { data: achievementsData } = await supabase
            .from('user_achievements')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_completed', true)

          return {
            ...user,
            total_entries: entriesData?.length || 0,
            total_achievements: achievementsData?.length || 0,
            last_entry_date: entriesData?.[0]?.created_at || null
          }
        })
      )

      setUsers(usersWithStats)
    }
  }

  const loadAchievements = async () => {
    const { data: achievementsData } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order', { ascending: true })

    if (achievementsData) {
      // Get unlock counts for each achievement
      const achievementsWithStats = await Promise.all(
        achievementsData.map(async (achievement) => {
          const { data: unlockedData } = await supabase
            .from('user_achievements')
            .select('id')
            .eq('achievement_id', achievement.id)
            .eq('is_completed', true)

          return {
            ...achievement,
            total_unlocked: unlockedData?.length || 0
          }
        })
      )

      setAchievements(achievementsWithStats)
    }
  }

  const loadStats = async () => {
    const { data: usersCount } = await supabase
      .from('profiles')
      .select('id, is_admin')

    const { data: achievementsCount } = await supabase
      .from('achievements')
      .select('id, is_active')

    const { data: entriesCount } = await supabase
      .from('journal_entries')
      .select('id')

    const { data: unlockedCount } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('is_completed', true)

    setStats({
      total_users: usersCount?.length || 0,
      total_admins: usersCount?.filter(u => u.is_admin).length || 0,
      total_achievements: achievementsCount?.length || 0,
      active_achievements: achievementsCount?.filter(a => a.is_active).length || 0,
      total_entries: entriesCount?.length || 0,
      total_unlocked_achievements: unlockedCount?.length || 0
    })
  }

  const toggleUserAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isCurrentlyAdmin })
        .eq('id', userId)

      if (error) throw error

      await loadUsers()
      await loadStats()
    } catch (error) {
      console.error('Error updating user admin status:', error)
      alert('Failed to update user admin status')
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    const confirmation = prompt(
      `This will permanently delete the user "${userEmail}" and all their data. Type "DELETE" to confirm:`
    )

    if (confirmation !== 'DELETE') return

    try {
      // Delete user data first
      await supabase.from('user_achievements').delete().eq('user_id', userId)
      await supabase.from('goals').delete().eq('user_id', userId)
      await supabase.from('journal_entries').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      await loadUsers()
      await loadStats()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const toggleAchievementActive = async (achievementId: string, isCurrentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .update({ is_active: !isCurrentlyActive })
        .eq('id', achievementId)

      if (error) throw error

      await loadAchievements()
      await loadStats()
    } catch (error) {
      console.error('Error updating achievement status:', error)
      alert('Failed to update achievement status')
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  )

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-500'
      case 'uncommon': return 'text-green-500'
      case 'rare': return 'text-blue-500'
      case 'epic': return 'text-purple-500'
      case 'legendary': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return Star
      case 'uncommon': return Award
      case 'rare': return Trophy
      case 'epic': return Crown
      case 'legendary': return Target
      default: return Star
    }
  }

  if (!isAdmin) {
    return (
      <div className="card max-w-md mx-auto">
        <div className="text-center p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, achievements, and system settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Admin Mode</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total_users}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{stats.total_admins}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{stats.total_achievements}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active_achievements}</p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{stats.total_entries}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unlocked</p>
                <p className="text-2xl font-bold">{stats.total_unlocked_achievements}</p>
              </div>
              <Award className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Achievements
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.display_name?.[0] || user.email[0]}
                    </div>
                    <div>
                      <p className="font-medium">{user.display_name || user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.total_entries} entries • {user.total_achievements} achievements
                      </p>
                    </div>
                  </div>
                  {user.is_admin && (
                    <Shield className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Popular Achievements</h3>
            <div className="space-y-3">
              {achievements
                .filter(a => a.is_active)
                .sort((a, b) => b.total_unlocked - a.total_unlocked)
                .slice(0, 5)
                .map((achievement) => {
                  const RarityIcon = getRarityIcon(achievement.rarity)
                  return (
                    <div key={achievement.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <RarityIcon className={`h-6 w-6 ${getRarityColor(achievement.rarity)}`} />
                        <div>
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {achievement.total_unlocked} users unlocked
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {achievement.points} pts
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">User Management</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Activity</th>
                  <th className="text-left p-3">Joined</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.display_name?.[0] || user.email[0]}
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {user.is_admin ? (
                          <>
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Admin</span>
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">User</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p>{user.total_entries} entries</p>
                        <p className="text-muted-foreground">{user.total_achievements} achievements</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleUserAdmin(user.id, user.is_admin)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_admin
                              ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
                              : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                          }`}
                          title={user.is_admin ? 'Remove admin' : 'Make admin'}
                        >
                          {user.is_admin ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id, user.email)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Achievement Management</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Categories</option>
                <option value="journaling">Journaling</option>
                <option value="mood">Mood</option>
                <option value="streak">Streak</option>
                <option value="analytics">Analytics</option>
                <option value="social">Social</option>
                <option value="special">Special</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">Achievement</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Rarity</th>
                  <th className="text-left p-3">Progress</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAchievements.map((achievement) => {
                  const RarityIcon = getRarityIcon(achievement.rarity)
                  return (
                    <tr key={achievement.id} className="border-b border-border/50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <RarityIcon className={`h-6 w-6 ${getRarityColor(achievement.rarity)}`} />
                          <div>
                            <p className="font-medium">{achievement.name}</p>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-muted rounded-full text-xs font-medium capitalize">
                          {achievement.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-sm font-medium capitalize ${getRarityColor(achievement.rarity)}`}>
                          {achievement.rarity}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <p>{achievement.total_unlocked} users</p>
                          <p className="text-muted-foreground">{achievement.points} points</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            achievement.is_active ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-sm ${
                            achievement.is_active ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {achievement.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleAchievementActive(achievement.id, achievement.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            achievement.is_active
                              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                              : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                          }`}
                          title={achievement.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {achievement.is_active ? <AlertTriangle className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}