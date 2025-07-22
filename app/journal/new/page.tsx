import { Suspense } from 'react'
import JournalEditor from '@/components/editor/JournalEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewJournalPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Suspense fallback={<div>Loading editor...</div>}>
          <JournalEditor />
        </Suspense>
      </div>
    </main>
  )
}