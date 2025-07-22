import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import JournalEditor from '@/components/editor/JournalEditor'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { JournalEntry } from '@/types/database'

interface PageProps {
  params: {
    id: string
  }
}

async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const supabase = createServerSupabaseClient()
  
  const { data: entry, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !entry) {
    return null
  }

  return entry
}

export default async function JournalEntryPage({ params }: PageProps) {
  const entry = await getJournalEntry(params.id)

  if (!entry) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            
            <div className="text-sm text-muted-foreground">
              {new Date(entry.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Suspense fallback={<div>Loading editor...</div>}>
          <JournalEditor entry={entry} />
        </Suspense>
      </div>
    </main>
  )
}