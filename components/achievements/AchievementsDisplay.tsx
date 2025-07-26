'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  Trophy, 
  Star, 
  Award, 
  Crown, 
  Target, 
  Lock, 
  Calendar,
  BookOpen,
  Heart,
  TrendingUp,
  BarChart3,
  MessageCircle,
  Mic,
  Cloud,
  MapPin,
  CheckCircle,
  Flame,
  Zap,
  Scale,
  Sun,
  Users,
  Search,
  Filter,
  Sparkles
} from 'lucide-react'

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
  is_completed: boolean
  progress_value: number
  unlocked_at: string | null
}

interface AchievementStats {
  total_achievements: number
  unlocked_achievements: number
  total_points: number
  completion_percentage: number
}

const iconMap: { [key: string]: any } = {
  BookOpen,
  Edit3: BookOpen,
  PenTool: BookOpen,
  BookMarked: BookOpen,
  Library: BookOpen,
  Scroll: BookOpen,
  Crown,
  Heart,
  Smile: Heart,
  TrendingUp,
  Sun,
  Scale,
  Calendar,
  Flame,
  Target,
  Award,
  Trophy,
  Zap,
  Infinity: Zap,
  BarChart3,
  Search,
  MessageCircle,
  Users,
  Mic,
  Cloud,
  MapPin,
  CheckCircle,
  Star,
  Sparkles
}

export default function AchievementsDisplay() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all achievements with user progress
      const { data: achievementsData } = await supabase
        .from('user_achievements_with_details')
        .select('*')
        .eq('user_id', user.id)
        .order('achievement_category', { ascending: true })
        .order('sort_order', { ascending: true })

      // Get achievements that user hasn't unlocked yet
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })

      if (allAchievements) {
        const userAchievementIds = new Set(achievementsData?.map(a => a.achievement_id) || [])
        
        const combinedAchievements = allAchievements.map(achievement => {
          const userAchievement = achievementsData?.find(ua => ua.achievement_id === achievement.id)
          
          return {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            type: achievement.type,
            target_value: achievement.target_value,
            target_decimal: achievement.target_decimal,
            rarity: achievement.rarity,
            points: achievement.points,
            is_active: achievement.is_active,
            sort_order: achievement.sort_order,
            is_completed: userAchievement?.is_completed || false,
            progress_value: userAchievement?.progress_value || 0,
            unlocked_at: userAchievement?.unlocked_at || null
          }
        })

        setAchievements(combinedAchievements)

        // Calculate stats
        const unlockedCount = combinedAchievements.filter(a => a.is_completed).length
        const totalPoints = combinedAchievements
          .filter(a => a.is_completed)
          .reduce((sum, a) => sum + a.points, 0)

        setStats({
          total_achievements: combinedAchievements.length,
          unlocked_achievements: unlockedCount,
          total_points: totalPoints,
          completion_percentage: Math.round((unlockedCount / combinedAchievements.length) * 100)
        })
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-500 border-gray-500'
      case 'uncommon': return 'text-green-500 border-green-500'
      case 'rare': return 'text-blue-500 border-blue-500'
      case 'epic': return 'text-purple-500 border-purple-500'
      case 'legendary': return 'text-yellow-500 border-yellow-500'
      default: return 'text-gray-500 border-gray-500'
    }
  }

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/10'
      case 'uncommon': return 'bg-green-500/10'
      case 'rare': return 'bg-blue-500/10'
      case 'epic': return 'bg-purple-500/10'
      case 'legendary': return 'bg-yellow-500/10'
      default: return 'bg-gray-500/10'
    }
  }

  const getProgressPercentage = (achievement: Achievement) => {
    if (achievement.is_completed) return 100
    
    if (achievement.type === 'milestone') {
      return achievement.progress_value > 0 ? 100 : 0
    }
    
    if (achievement.target_value) {
      return Math.min((achievement.progress_value / achievement.target_value) * 100, 100)
    }
    
    if (achievement.target_decimal) {
      return Math.min((achievement.progress_value / achievement.target_decimal) * 100, 100)
    }
    
    return 0
  }

  const filteredAchievements = achievements.filter(achievement => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unlocked' && achievement.is_completed) ||
                         (filter === 'locked' && !achievement.is_completed)
    
    const matchesCategory = categoryFilter === 'all' || achievement.category === categoryFilter
    
    const matchesSearch = achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesCategory && matchesSearch
  })

  const categories = ['all', 'journaling', 'mood', 'streak', 'analytics', 'social', 'special']

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
          <h2 className="text-2xl font-bold">Achievements</h2>
          <p className="text-muted-foreground">Track your progress and unlock rewards</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">{stats?.total_points || 0} points</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total_achievements}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unlocked</p>
                <p className="text-2xl font-bold">{stats.unlocked_achievements}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{stats.completion_percentage}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points</p>
                <p className="text-2xl font-bold">{stats.total_points}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unlocked' | 'locked')}
            className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Achievements</option>
            <option value="unlocked">Unlocked</option>
            <option value="locked">Locked</option>
          </select>
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>

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
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const IconComponent = iconMap[achievement.icon] || Star
          const rarityColor = getRarityColor(achievement.rarity)
          const rarityBg = getRarityBg(achievement.rarity)
          const progressPercentage = getProgressPercentage(achievement)
          
          return (
            <div
              key={achievement.id}
              className={`card relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                achievement.is_completed 
                  ? `border-2 ${rarityColor} ${rarityBg}` 
                  : 'border-border opacity-75'
              }`}
            >
              {/* Rarity indicator */}
              <div className={`absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] ${
                achievement.rarity === 'common' ? 'border-t-gray-500' :
                achievement.rarity === 'uncommon' ? 'border-t-green-500' :
                achievement.rarity === 'rare' ? 'border-t-blue-500' :
                achievement.rarity === 'epic' ? 'border-t-purple-500' :
                'border-t-yellow-500'
              }`} />

              {/* Lock overlay for locked achievements */}
              {!achievement.is_completed && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${rarityBg} ${rarityColor}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {!achievement.is_completed && achievement.type !== 'milestone' && (
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs text-muted-foreground">
                        {achievement.progress_value}/{achievement.target_value || achievement.target_decimal}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${rarityBg} ${rarityColor}`}>
                      {achievement.rarity}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {achievement.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium">{achievement.points}</span>
                  </div>
                </div>

                {achievement.is_completed && achievement.unlocked_at && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No achievements found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  )
}