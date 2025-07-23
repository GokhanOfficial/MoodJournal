import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import JournalEditor from '@/components/editor/JournalEditor'
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
      <Suspense fallback={<div>Loading editor...</div>}>
        <JournalEditor entry={entry} />
      </Suspense>
    </main>
  )
}