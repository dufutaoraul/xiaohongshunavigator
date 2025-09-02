'use client'

import { useState } from 'react'

interface ViewNoteOptions {
  note_id?: string
  url?: string
  use_proxy?: boolean
  cookie?: string
}

interface ViewNoteResult {
  success: boolean
  view_type: 'qrcode' | 'proxy'
  data: {
    note_id?: string
    url: string
    qr_code_url?: string
    content?: any
    message: string
    instructions?: string[]
    fallback_qr?: string
  }
}

export function useViewNote() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ViewNoteResult | null>(null)

  const viewNote = async (options: ViewNoteOptions): Promise<ViewNoteResult | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/note/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
      return data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '查看笔记失败'
      setError(errorMessage)
      console.error('View note error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setIsLoading(false)
  }

  return {
    viewNote,
    isLoading,
    error,
    result,
    reset
  }
}
