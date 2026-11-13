import React from 'react'

/**
 * Safely parses and renders supported Markdown formatting (bold, italic, lists, paragraphs)
 * without using dangerouslySetInnerHTML or external libraries.
 */

function renderInline(text: string): React.ReactNode[] {
  // Regex matches **bold**, *italic*, or plain text
  const tokens: React.ReactNode[] = []
  // Match **bold** or *italic*
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts = text.split(regex)

  parts.forEach((part, index) => {
    if (!part) return
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      tokens.push(
        <strong key={index} className="font-bold text-gray-950">
          {part.slice(2, -2)}
        </strong>
      )
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      tokens.push(
        <em key={index} className="italic text-gray-800">
          {part.slice(1, -1)}
        </em>
      )
    } else {
      tokens.push(part)
    }
  })

  return tokens
}

export function MarkdownText({ content }: { content: string }) {
  if (!content) return null

  // Normalize newlines
  const normalized = content.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')

  const elements: React.ReactNode[] = []
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null
  let currentParagraphLines: string[] = []

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim()
      if (text) {
        elements.push(
          <p key={`p-${elements.length}`} className="leading-relaxed">
            {renderInline(text)}
          </p>
        )
      }
      currentParagraphLines = []
    }
  }

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="space-y-1.5 my-1.5 pl-4 list-disc text-gray-800 marker:text-purple-600"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-snug">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        )
      } else {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="space-y-1.5 my-1.5 pl-4 list-decimal text-gray-800 marker:font-bold marker:text-purple-700"
          >
            {currentList.items.map((item, idx) => (
              <li key={idx} className="leading-snug">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        )
      }
      currentList = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      // Empty line breaks paragraphs and lists
      flushParagraph()
      flushList()
      continue
    }

    // Check for unordered list item (- , * , • )
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/)
    if (ulMatch) {
      flushParagraph()
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(ulMatch[1])
      continue
    }

    // Check for ordered list item (1. , 2. )
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (olMatch) {
      flushParagraph()
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(olMatch[1])
      continue
    }

    // Regular text line
    flushList()
    currentParagraphLines.push(trimmed)
  }

  flushParagraph()
  flushList()

  return <div className="space-y-2 text-inherit">{elements}</div>
}
