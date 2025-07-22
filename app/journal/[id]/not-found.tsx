import { notFound } from 'next/navigation'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Journal Entry Not Found</h2>
        <p className="mt-4 text-muted-foreground">
          The journal entry you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Return to Dashboard
        </a>
      </div>
    </main>
  )
}