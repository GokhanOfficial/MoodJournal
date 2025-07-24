'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { PlusIcon, MagnifyingGlassIcon, CalendarIcon, HeartIcon } from '@heroicons/react/24/outline';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood_score: number | null;
  emotions: string[] | null;
  created_at: string;
  updated_at: string;
}

const moodColorMap = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200', 
  3: 'bg-amber-100 text-amber-800 border-amber-200',
  4: 'bg-green-100 text-green-800 border-green-200',
  5: 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

const moodLabels = {
  1: 'Very Sad',
  2: 'Sad', 
  3: 'Neutral',
  4: 'Happy',
  5: 'Very Happy'
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mood'>('newest');
  const [filterMood, setFilterMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    filterAndSortEntries();
  }, [entries, searchQuery, sortBy, filterMood]);

  const fetchEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please sign in to view your journal entries');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEntries = () => {
    let filtered = entries.filter(entry => {
      const matchesSearch = 
        (entry.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMood = filterMood === null || entry.mood_score === filterMood;
      
      return matchesSearch && matchesMood;
    });

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'mood':
          return (b.mood_score || 0) - (a.mood_score || 0);
        default:
          return 0;
      }
    });

    setFilteredEntries(filtered);
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getMoodColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-800 border-gray-200';
    return moodColorMap[score as keyof typeof moodColorMap] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMoodLabel = (score: number | null) => {
    if (!score) return 'Unknown';
    return moodLabels[score as keyof typeof moodLabels] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-pulse-slow w-8 h-8 bg-purple-200 rounded-full"></div>
              <p className="text-gray-600">Loading your journal entries...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/auth/signin" className="btn-primary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Journal</h1>
            <p className="text-gray-600">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in your journal
            </p>
          </div>
          <Link href="/journal/new" className="btn-primary mt-4 sm:mt-0 inline-flex items-center">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Entry
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'mood')}
              className="input w-full"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="mood">Highest Mood</option>
            </select>

            {/* Mood Filter */}
            <select
              value={filterMood || ''}
              onChange={(e) => setFilterMood(e.target.value ? parseInt(e.target.value) : null)}
              className="input w-full"
            >
              <option value="">All Moods</option>
              <option value="5">Very Happy</option>
              <option value="4">Happy</option>
              <option value="3">Neutral</option>
              <option value="2">Sad</option>
              <option value="1">Very Sad</option>
            </select>
          </div>
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery || filterMood ? 'No matching entries found' : 'No journal entries yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterMood 
                ? 'Try adjusting your search or filters'
                : 'Start capturing your thoughts and emotions in your personal journal'
              }
            </p>
            {!searchQuery && !filterMood && (
              <Link href="/journal/new" className="btn-primary inline-flex items-center">
                <PlusIcon className="w-5 h-5 mr-2" />
                Write Your First Entry
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredEntries.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`}>
                <div className="card hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </span>
                        {entry.mood_score && (
                          <span className="flex items-center">
                            <HeartIcon className="w-4 h-4 mr-1" />
                            Mood: {getMoodLabel(entry.mood_score)}
                          </span>
                        )}
                      </div>
                    </div>
                    {entry.mood_score && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getMoodColor(entry.mood_score)} mt-2 sm:mt-0`}>
                        {getMoodLabel(entry.mood_score)}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {truncateContent(entry.content || 'No content available')}
                  </p>

                  {entry.emotions && entry.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.emotions.slice(0, 5).map((emotion, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200"
                        >
                          {emotion}
                        </span>
                      ))}
                      {entry.emotions.length > 5 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                          +{entry.emotions.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Results Info */}
        {searchQuery || filterMood ? (
          <div className="mt-8 text-center text-gray-600">
            Showing {filteredEntries.length} of {entries.length} entries
            {(searchQuery || filterMood) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMood(null);
                }}
                className="ml-2 text-purple-600 hover:text-purple-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}