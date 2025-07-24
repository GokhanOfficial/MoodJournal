'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon,
  Image as ImageIcon,
  Palette,
  Highlighter,
  Undo,
  Redo,
  Type
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...", 
  className = "",
  disabled = false 
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] ${className}`,
      },
    },
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#D97706', '#22C55E',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
  ]

  const highlights = [
    '#FEF0E6', '#FECACA', '#FED7D7', '#C7F9CC',
    '#BFDBFE', '#C4B5FD', '#F3E8FF', '#FCE7F3'
  ]

  if (!isMounted || !editor) {
    return <div className="min-h-[400px] animate-pulse bg-muted rounded-lg" />
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border bg-muted/50">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-background transition-colors ${
              editor.isActive('bold') ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-background transition-colors ${
              editor.isActive('italic') ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-background transition-colors ${
              editor.isActive('strike') ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-background transition-colors ${
              editor.isActive('code') ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-2 rounded hover:bg-background transition-colors text-sm font-medium ${
              editor.isActive('heading', { level: 1 }) ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-2 rounded hover:bg-background transition-colors text-sm font-medium ${
              editor.isActive('heading', { level: 2 }) ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-2 rounded hover:bg-background transition-colors text-sm font-medium ${
              editor.isActive('heading', { level: 3 }) ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-background transition-colors ${
              editor.isActive('bulletList') ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-background transition-colors ${
              editor.isActive('orderedList') ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-background transition-colors ${
              editor.isActive('blockquote') ? 'bg-background text-primary' : 'text-muted-foreground'
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
        </div>

        {/* Colors and Highlights */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded hover:bg-background transition-colors text-muted-foreground"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-background border border-border rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-4 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run()
                        setShowColorPicker(false)
                      }}
                      className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="p-2 rounded hover:bg-background transition-colors text-muted-foreground"
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-background border border-border rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-4 gap-1">
                  {highlights.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        editor.chain().focus().setHighlight({ color }).run()
                        setShowHighlightPicker(false)
                      }}
                      className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 border-r border-border pr-2 mr-2">
          <button
            onClick={addLink}
            className="p-2 rounded hover:bg-background transition-colors text-muted-foreground"
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-background transition-colors text-muted-foreground"
            title="Add Image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-background transition-colors text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-background transition-colors text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent 
          editor={editor} 
          className="min-h-[400px] focus-within:outline-none"
        />
      </div>
    </div>
  )
}