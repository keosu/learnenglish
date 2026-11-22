import { useEffect, useState } from 'react'
import type { Article, Day, NewsIndex, Track } from '../types'

const base = import.meta.env.BASE_URL
const cache = new Map<string, Promise<unknown>>()

function load<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const request = fetch(`${base}news/${path}`, { cache: 'no-cache' }).then((response) => {
      if (!response.ok) throw new Error(`${response.status}`)
      return response.json()
    })
    request.catch(() => cache.delete(path))
    cache.set(path, request)
  }
  return cache.get(path) as Promise<T>
}

export const loadIndex = () => load<NewsIndex>('index.json')
export const loadDay = (date: string) => load<Day>(`${date}.json`)

export function useAsync<T>(task: () => Promise<T>, deps: unknown[]) {
  const key = JSON.stringify(deps)
  const [state, setState] = useState<{ key?: string; data?: T; error?: string }>({})
  useEffect(() => {
    let alive = true
    task().then((data) => alive && setState({ key, data }), (error: Error) => alive && setState({ key, error: error.message }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const current = state.key === key
  return { data: state.data, error: current ? state.error : undefined, loading: !current }
}

export function tracksOf(date: string, article: Article): Track[] {
  return article.sentences.map((sentence, index) => ({
    key: `${date}/${article.id}/${index}`,
    date,
    articleId: article.id,
    articleTitle: article.title,
    category: article.category,
    index,
    en: sentence.en,
    zh: sentence.zh,
    tip: sentence.tip,
    focus: sentence.focus,
  }))
}

export function minutesOf(sentences: { en: string }[], rate = 1) {
  const words = sentences.reduce((sum, item) => sum + item.en.split(/\s+/).length, 0)
  return Math.max(1, Math.round(words / (150 * rate)))
}

export const categoryLabel = { ai: 'AI 前沿', world: '时政' } as const
