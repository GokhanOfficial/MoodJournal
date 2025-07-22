import Link from 'next/link'
import { ArrowRight, Heart, Brain, TrendingUp, Sparkles, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                MoodJournal
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin" className="btn-ghost">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10" />
        
        <div className="relative mx-auto max-w-5xl">
          <div className="animate-fade-in mb-8 inline-flex items-center rounded-full bg-primary/10 px-6 py-3 text-sm font-medium text-primary border border-primary/20">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered Emotional Intelligence
          </div>
          
          <h1 className="animate-slide-up mb-8 text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            Your Personal
            <span className="block bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
              MoodJournal
            </span>
          </h1>
          
          <p className="animate-slide-up mx-auto mb-12 max-w-3xl text-xl text-muted-foreground sm:text-2xl leading-relaxed">
            Transform your emotional well-being with AI-powered insights. Track your mood, 
            understand your patterns, and discover the path to better mental health.
          </p>
          
          <div className="animate-slide-up flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/signup" className="btn-primary text-base px-8 py-4">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link href="/demo" className="btn-secondary text-base px-8 py-4">
              View Demo
            </Link>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-pulse-slow">
          <div className="h-3 w-3 rounded-full bg-primary/30" />
        </div>
        <div className="absolute top-40 right-20 animate-pulse-slow" style={{ animationDelay: '1s' }}>
          <div className="h-2 w-2 rounded-full bg-purple-400/40" />
        </div>
        <div className="absolute bottom-32 left-20 animate-pulse-slow" style={{ animationDelay: '2s' }}>
          <div className="h-4 w-4 rounded-full bg-blue-400/30" />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-gradient-to-b from-muted/50 to-background px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you need for
              <span className="block text-primary">emotional wellness</span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Powerful features designed to help you understand and improve your mental well-being
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="card group">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
                <Brain className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-semibold">AI-Powered Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Advanced sentiment analysis powered by cutting-edge AI to understand your emotional patterns, 
                triggers, and provide personalized insights for better mental health.
              </p>
            </div>
            
            <div className="card group">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Mood Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Beautiful, interactive visualizations that help you track mood trends over time, 
                identify patterns, and celebrate your emotional growth journey.
              </p>
            </div>
            
            <div className="card group">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Private & Secure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your thoughts are encrypted and completely private. Advanced security measures 
                ensure only you have access to your personal journal and emotional data.
              </p>
            </div>

            <div className="card group">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Real-time Insights</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant emotional feedback as you write, with smart suggestions and 
                recommendations to improve your mental well-being in real-time.
              </p>
            </div>

            <div className="card group">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Emotional Intelligence</h3>
              <p className="text-muted-foreground leading-relaxed">
                Develop deeper self-awareness through detailed emotion analysis covering joy, sadness, 
                anger, fear, and more with actionable insights for growth.
              </p>
            </div>

            <div className="card group">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Personalized Experience</h3>
              <p className="text-muted-foreground leading-relaxed">
                Adaptive interface that learns from your writing patterns and preferences, 
                providing increasingly personalized insights and recommendations over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-purple-600 px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
            Ready to transform your emotional well-being?
          </h2>
          <p className="mb-8 text-xl text-primary-foreground/80 leading-relaxed">
            Join thousands of users who have discovered the power of AI-driven emotional intelligence.
          </p>
          <Link href="/auth/signup" className="btn-secondary bg-white text-primary hover:bg-white/90">
            Start Your Free Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-8">
        <div className="mx-auto max-w-7xl text-center text-muted-foreground">
          <p>&copy; 2024 MoodJournal. Empowering emotional wellness through AI.</p>
        </div>
      </footer>
    </main>
  )
}