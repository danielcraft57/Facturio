import { useCallback, useEffect, useState } from 'react'
import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export const userDocumentTagsService = {
  async list(): Promise<string[]> {
    const res = await apiClient.get('/users/me/document-tags')
    const payload = unwrapApiPayload<{ tags?: string[] }>(res)
    return Array.isArray(payload?.tags) ? payload.tags : []
  },

  async saveAll(tags: string[]): Promise<string[]> {
    const res = await apiClient.put('/users/me/document-tags', { tags })
    const payload = unwrapApiPayload<{ tags?: string[] }>(res)
    return Array.isArray(payload?.tags) ? payload.tags : []
  },

  async add(tag: string): Promise<string[]> {
    const res = await apiClient.patch('/users/me/document-tags', { tag })
    const payload = unwrapApiPayload<{ tags?: string[] }>(res)
    return Array.isArray(payload?.tags) ? payload.tags : []
  },
}

export function useUserDocumentTags() {
  const [savedTags, setSavedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const tags = await userDocumentTagsService.list()
        if (!cancelled) setSavedTags(tags)
      } catch {
        if (!cancelled) setSavedTags([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const rememberTag = useCallback(async (tag: string) => {
    const t = tag.trim()
    if (!t) return
    if (savedTags.includes(t)) return
    try {
      const next = await userDocumentTagsService.add(t)
      setSavedTags(next)
    } catch {
      setSavedTags((prev) => (prev.includes(t) ? prev : [...prev, t]))
    }
  }, [savedTags])

  const removeFromLibrary = useCallback(async (tag: string) => {
    const previous = savedTags
    const next = previous.filter((t) => t !== tag)
    setSavedTags(next)
    try {
      const saved = await userDocumentTagsService.saveAll(next)
      setSavedTags(saved)
    } catch {
      setSavedTags(previous)
    }
  }, [savedTags])

  return { savedTags, loading, rememberTag, removeFromLibrary }
}
