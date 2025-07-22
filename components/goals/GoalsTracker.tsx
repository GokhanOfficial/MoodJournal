'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Plus, Target, TrendingUp, Calendar, CheckCircle, Circle, Edit2, Trash2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import type { Goal, GoalProgressView } from '@/types/database'

interface GoalsTrackerProps {
  className?: string
}

export default function GoalsTracker({ className = '' }: GoalsTrackerProps) {
  const [goals, setGoals] = useState<GoalProgressView[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_value: 0,
    target_date: '',
    goal_type: 'mood_average' as Goal['goal_type']
  })

  const supabase = createClient()

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Use the goal_progress_view for enhanced data
      const { data: goalsData, error } = await supabase
        .from('goal_progress_view')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading goals:', error)
        return
      }

      if (goalsData) {
        setGoals(goalsData)
      }
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async () => {
    if (!newGoal.title || !newGoal.target_value || !newGoal.target_date) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: newGoal.title,
          description: newGoal.description || null,
          goal_type: newGoal.goal_type,
          target_value: newGoal.target_value,
          target_date: newGoal.target_date
        })

      if (error) {
        console.error('Error creating goal:', error)
        return
      }

      // Reload goals after creation
      await loadGoals()

      // Reset form
      setNewGoal({
        title: '',
        description: '',
        target_value: 0,
        target_date: '',
        goal_type: 'mood_average'
      })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

      if (error) {
        console.error('Error deleting goal:', error)
        return
      }

      // Remove from local state
      setGoals(prev => prev.filter(g => g.id !== goalId))
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const toggleGoalCompletion = async (goalId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ completed: !completed })
        .eq('id', goalId)

      if (error) {
        console.error('Error updating goal:', error)
        return
      }

      // Reload goals to get updated progress view
      await loadGoals()
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const getGoalTypeLabel = (type: Goal['goal_type']) => {
    switch (type) {
      case 'mood_average':
        return 'Mood Average'
      case 'entry_count':
        return 'Entry Count'
      case 'streak':
        return 'Streak'
      case 'custom':
        return 'Custom'
      default:
        return 'Unknown'
    }
  }

  const getGoalTypeIcon = (type: Goal['goal_type']) => {
    switch (type) {
      case 'mood_average':
        return <TrendingUp className="h-4 w-4" />
      case 'entry_count':
        return <Calendar className="h-4 w-4" />
      case 'streak':
        return <Target className="h-4 w-4" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: GoalProgressView['status']) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
      case 'overdue':
        return 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
      case 'due_soon':
        return 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20'
      default:
        return 'border-border bg-background/50 hover:bg-background/80'
    }
  }

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="border-b border-border pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goals & Tracking
            </h3>
            <p className="text-sm text-muted-foreground">Set and track your emotional wellness goals</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-ghost text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/20">
          <h4 className="font-medium mb-4">Create New Goal</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Goal Title</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Improve daily mood"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Describe your goal..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Type</label>
                <select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, goal_type: e.target.value as Goal['goal_type'] }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="mood_average">Mood Average</option>
                  <option value="entry_count">Entry Count</option>
                  <option value="streak">Streak</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Value</label>
                <input
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Date</label>
              <input
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={createGoal}
                className="btn-primary"
              >
                Create Goal
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-medium mb-2">No goals set yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Set your first goal to start tracking your progress.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border transition-all duration-200 ${getStatusColor(goal.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      goal.completed ? 'bg-emerald-500/10' : 'bg-primary/10'
                    }`}>
                      {goal.completed ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        getGoalTypeIcon(goal.goal_type)
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getGoalTypeIcon(goal.goal_type)}
                          {getGoalTypeLabel(goal.goal_type)}
                        </span>
                        <span>
                          Due: {format(new Date(goal.target_date), 'MMM dd, yyyy')}
                        </span>
                        {goal.days_remaining >= 0 ? (
                          <span>{goal.days_remaining} days left</span>
                        ) : (
                          <span className="text-red-500">
                            {Math.abs(goal.days_remaining)} days overdue
                          </span>
                        )}
                        <span className="capitalize text-xs px-2 py-1 rounded-full bg-muted">
                          {goal.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleGoalCompletion(goal.id, goal.completed)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {goal.completed ? <Circle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {goal.current_value} / {goal.target_value}
                      {goal.goal_type === 'mood_average' && '/10'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        goal.completed ? 'bg-emerald-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {goal.progress_percentage}% complete
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}