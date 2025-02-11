// src/components/global/rich-text-editor/index.tsx
"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Quote } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const customStyles = `
  .ProseMirror {
    min-height: 120px;
    max-height: 170px; /* Fixed height */
    overflow-y: auto; /* Add scrollbar when content overflows */
    padding: 0.5rem;
    border-radius: 0 0 var(--radius) var(--radius);
    border: 1px solid hsl(var(--input));
    border-top: none;
    outline: none;
    font-size: 0.875rem;
  }

  /* Custom scrollbar styling */
  .ProseMirror::-webkit-scrollbar {
    width: 8px;
  }

  .ProseMirror::-webkit-scrollbar-track {
    background: hsl(var(--secondary));
    border-radius: 0 0 var(--radius) 0;
  }

  .ProseMirror::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground));
    border-radius: 4px;
  }

  .ProseMirror::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--foreground));
  }

  .ProseMirror p {
    margin: 0;
    line-height: 1.5;
  }

  .ProseMirror ul,
  .ProseMirror ol {
    margin: 0;
    padding-left: 1.2rem;
  }

  .ProseMirror li {
    margin: 0.2rem 0;
  }

  .ProseMirror h1 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.5rem 0;
  }

  .ProseMirror h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0.4rem 0;
  }

  .ProseMirror blockquote {
    border-left: 2px solid hsl(var(--border));
    margin: 0.5rem 0;
    padding-left: 1rem;
    font-style: italic;
  }
`

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = ""
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose-sm focus:outline-none max-w-none',
      },
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div className={`flex flex-col w-full ${className}`}>
      <style>{customStyles}</style>
      <TooltipProvider>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-t-md border border-input">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                className="h-8 w-8"
              >
                <Bold className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                className="h-8 w-8"
              >
                <Italic className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="h-8 px-2 text-sm font-semibold"
              >
                H1
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="h-8 px-2 text-sm font-semibold"
              >
                H2
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('bulletList')}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('orderedList')}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                className="h-8 w-8"
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('blockquote')}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                className="h-8 w-8"
              >
                <Quote className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <EditorContent editor={editor} />
    </div>
  )
}