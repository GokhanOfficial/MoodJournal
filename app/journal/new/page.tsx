import { Suspense } from 'react'
import JournalEditor from '@/components/editor/JournalEditor'

export default function NewJournalPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading journal editor...</p>
          </div>
        </div>
      }>
        <JournalEditor />
      </Suspense>
    </main>
  )
}