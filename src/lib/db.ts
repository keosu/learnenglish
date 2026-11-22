import Dexie, { type EntityTable } from 'dexie'
import type { Favorite, Listen, Track } from '../types'

class EchoDB extends Dexie {
  favorites!: EntityTable<Favorite, 'id'>
  listens!: EntityTable<Listen, 'id'>

  constructor() {
    super('echo-news')
    this.version(1).stores({
      favorites: 'id, kind, createdAt, date',
      listens: '++id, key, day, articleId',
    })
  }
}

export const db = new EchoDB()

export const localDay = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export async function logListen(track: Track) {
  await db.listens.add({ key: track.key, day: localDay(), articleId: track.articleId, at: new Date().toISOString() })
}

export function sentenceFavorite(track: Track): Favorite {
  return { ...track, id: `s:${track.key}`, kind: 'sentence', createdAt: new Date().toISOString() }
}

export function phraseFavorite(track: Track, phrase: string, meaning: string, note?: string): Favorite {
  return { ...track, id: `p:${track.key}:${phrase.toLowerCase()}`, kind: 'phrase', phrase, meaning, note, createdAt: new Date().toISOString() }
}

export async function toggleFavorite(item: Favorite) {
  if (await db.favorites.get(item.id)) await db.favorites.delete(item.id)
  else await db.favorites.put(item)
}

export async function clearAll() {
  await Promise.all([db.favorites.clear(), db.listens.clear()])
}

export function streak(days: Set<string>) {
  let count = 0
  const cursor = new Date()
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(localDay(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}
