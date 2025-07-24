'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, Target, Lightbulb, AlertCircle, CheckCircle, Calendar, BarChart3 } from 'lucide-react'
import { advancedAnalyticsService, type AdvancedInsights, type MoodPattern } from '@/lib/advanced-analytics'
import { createClient } from '@/lib/supabase'

interface AdvancedInsightsProps {
  timeRange: '7d' | '30d' | '90d'
}

export default function AdvancedInsightsPanel({ timeRange }: AdvancedInsightsProps) {
  const [insights, setInsights] = useState<AdvancedInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'patterns' | 'insights' | 'recommendations'>('patterns')

  const supabase = createClient()

  useEffect(() => {
    loadInsights()
  }, [timeRange])

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setLoading(true)
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const advancedInsights = await advancedAnalyticsService.generateAdvancedInsights(user.id, days)
      setInsights(advancedInsights)
    } catch (error) {
      console.error('Error loading advanced insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPatternIcon = (type: MoodPattern['type']) => {
    switch (type) {
      case 'weekly_cycle':
        return <Calendar className="h-5 w-5 text-blue-500" />
      case 'improvement_trend':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />
      case 'monthly_trend':
        return <BarChart3 className="h-5 w-5 text-orange-500" />
      case 'stress_indicator':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Target className="h-5 w-5 text-purple-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-500'
    if (confidence >= 0.6) return 'text-amber-600'
    return 'text-orange-500'
  }

  const getStabilityColor = (score: number) => {
    if (score >= 0.7) return 'text-emerald-500'
    if (score >= 0.4) return 'text-amber-600'
    return 'text-red-500'
  }

  const getGrowthColor = (score: number) => {
    if (score >= 0.7) return 'text-emerald-500'
    if (score >= 0.4) return 'text-blue-500'
    return 'text-purple-500'
  }

  if (loading) {
    return (
      <div className="card">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Analyzing your emotional patterns...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No insights available</h3>
          <p className="text-muted-foreground">Start journaling to unlock AI-powered insights about your emotional patterns.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="border-b border-border pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI-Powered Insights
            </h3>
            <p className="text-sm text-muted-foreground">
              Advanced analysis of your emotional patterns and growth
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'patterns'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Patterns
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Recommendations
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'patterns' && (
          <>
            {/* Mood Stability & Growth Overview */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Mood Stability</h4>
                  <span className={`text-sm font-semibold ${getStabilityColor(insights.moodStability.score)}`}>
                    {Math.round(insights.moodStability.score * 100)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {insights.moodStability.description}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`h-2 w-2 rounded-full ${
                    insights.moodStability.trend === 'improving' ? 'bg-emerald-500' :
                    insights.moodStability.trend === 'declining' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <span className="capitalize">{insights.moodStability.trend}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Emotional Growth</h4>
                  <span className={`text-sm font-semibold ${getGrowthColor(insights.emotionalGrowth.score)}`}>
                    {Math.round(insights.emotionalGrowth.score * 100)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {insights.emotionalGrowth.description}
                </p>
                {insights.emotionalGrowth.keyAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {insights.emotionalGrowth.keyAreas.map((area, index) => (
                      <span key={index} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                        {area}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detected Patterns */}
            {insights.patterns.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Detected Patterns</h4>
                <div className="space-y-4">
                  {insights.patterns.map((pattern, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border bg-background/50">
                      <div className="flex items-start gap-3">
                        {getPatternIcon(pattern.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium capitalize">
                              {pattern.type.replace('_', ' ')}
                            </h5>
                            <span className={`text-xs font-medium ${getConfidenceColor(pattern.confidence)}`}>
                              {Math.round(pattern.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {pattern.description}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            {pattern.insight}
                          </p>
                          {pattern.recommendation && (
                            <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                              💡 {pattern.recommendation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlations */}
            {insights.correlations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Mood Correlations</h4>
                <div className="space-y-3">
                  {insights.correlations.map((correlation, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border bg-background/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{correlation.factor}</span>
                        <span className={`text-sm font-semibold ${
                          correlation.correlation > 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {correlation.correlation > 0 ? '+' : ''}{Math.round(correlation.correlation * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {correlation.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              AI-Generated Insights
            </h4>
            {insights.aiInsights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-500">{index + 1}</span>
                  </div>
                  <p className="text-sm">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Personalized Recommendations
            </h4>
            {insights.recommendations.map((recommendation, index) => (
              <div key={index} className="p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}