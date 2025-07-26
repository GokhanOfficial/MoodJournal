'use client'

import { useState, useEffect } from 'react'
import { Upload, X, Globe, Lock, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { PublicCoverImage, UserCoverImage } from '@/types/database'

interface CoverImageSelectorProps {
  currentImageUrl?: string | null
  onImageSelect: (imageUrl: string, imagePath: string, isPublic: boolean) => void
  userId: string
}

export default function CoverImageSelector({ 
  currentImageUrl, 
  onImageSelect,
  userId 
}: CoverImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'upload'>('public')
  const [publicImages, setPublicImages] = useState<PublicCoverImage[]>([])
  const [userImages, setUserImages] = useState<UserCoverImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadPublic, setUploadPublic] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadImages()
    }
  }, [isOpen])

  const loadImages = async () => {
    try {
      // Load public cover images
      const { data: publicData } = await supabase
        .from('public_cover_images')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (publicData) {
        setPublicImages(publicData)
      }

      // Load user's private cover images
      const { data: userData } = await supabase
        .from('user_cover_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (userData) {
        setUserImages(userData)
      }
    } catch (error) {
      console.error('Error loading images:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload to appropriate bucket
      const bucket = uploadPublic ? 'journal-covers' : 'user-covers'
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      // Save to database
      if (uploadPublic) {
        // For public uploads, we need admin privileges
        // For now, we'll save it as a user image with public flag
        const { error: dbError } = await supabase
          .from('user_cover_images')
          .insert({
            user_id: userId,
            title: file.name.split('.')[0],
            image_url: publicUrl,
            image_path: filePath,
            is_public: true
          })

        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase
          .from('user_cover_images')
          .insert({
            user_id: userId,
            title: file.name.split('.')[0],
            image_url: publicUrl,
            image_path: filePath,
            is_public: false
          })

        if (dbError) throw dbError
      }

      // Reload images
      await loadImages()

      // Select the uploaded image
      onImageSelect(publicUrl, filePath, uploadPublic)
      setIsOpen(false)
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleImageSelect = (imageUrl: string, imagePath: string, isPublic: boolean) => {
    onImageSelect(imageUrl, imagePath, isPublic)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Current Cover Preview */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Journal Cover</label>
        <div 
          onClick={() => setIsOpen(true)}
          className="relative h-32 w-24 rounded-lg overflow-hidden border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors group"
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Journal cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs">Change Cover</span>
          </div>
        </div>
      </div>

      {/* Image Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Select Journal Cover</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('public')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'public'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                Public Covers
              </button>
              <button
                onClick={() => setActiveTab('private')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'private'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="h-4 w-4 inline mr-2" />
                My Covers
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload New
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {activeTab === 'public' && (
                <div className="grid grid-cols-4 gap-4">
                  {publicImages.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => handleImageSelect(image.image_url, image.image_path, true)}
                      className="cursor-pointer group"
                    >
                      <div className="relative h-40 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all">
                        <img
                          src={image.image_url}
                          alt={image.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">{image.title}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'private' && (
                <div className="grid grid-cols-4 gap-4">
                  {userImages.filter(img => !img.is_public).map((image) => (
                    <div
                      key={image.id}
                      onClick={() => handleImageSelect(image.image_url, image.image_path, false)}
                      className="cursor-pointer group"
                    >
                      <div className="relative h-40 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all">
                        <img
                          src={image.image_url}
                          alt={image.title || 'Cover image'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {image.title || 'Untitled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {userImages.filter(img => !img.is_public).length === 0 && (
                    <div className="col-span-4 text-center py-8 text-muted-foreground">
                      No private covers yet. Upload your first one!
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <label className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={uploadPublic}
                        onChange={(e) => setUploadPublic(e.target.checked)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">
                        Make this cover available to other users
                      </span>
                    </label>
                    <div className="text-sm text-muted-foreground mb-4">
                      {uploadPublic ? (
                        <div className="flex items-start gap-2">
                          <Globe className="h-4 w-4 mt-0.5 text-primary" />
                          <span>
                            This cover will be visible to all users and can be used by anyone.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <span>
                            This cover will be private and only visible to you.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="block">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium mb-2">
                        Click to upload an image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  {uploading && (
                    <div className="mt-4 text-center">
                      <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}