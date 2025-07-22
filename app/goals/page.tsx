'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Target, ArrowLeft, BarChart3 } from 'lucide-react'
import GoalsTracker from '@/components/goals/GoalsTracker'

export default function GoalsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Goals & Tracking
                </h1>
                <p className="text-sm text-muted-foreground">Set and monitor your emotional wellness goals</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link href="/analytics" className="btn-ghost">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <GoalsTracker />
      </main>
    </div>
  )
}