import Dexie, { type EntityTable } from 'dexie'
import type { LearningEvent, Mastery, UserSettings } from '../types'

class ContextFlowDB extends Dexie {
  events!: EntityTable<LearningEvent, 'id'>
  mastery!: EntityTable<Mastery, 'expressionId'>
  settings!: EntityTable<UserSettings & { id: string }, 'id'>

  constructor() {
    super('contextflow')
    this.version(1).stores({
      events: '++id, sceneId, expressionId, kind, createdAt',
      mastery: 'expressionId, dueAt, score',
      settings: 'id',
    })
  }
}

export const db = new ContextFlowDB()

export const defaultSettings: UserSettings = {
  dailyGoal: 15,
  interests: ['AI 前沿', '软件开发', '发布运维', '数据实验', '产品协作', '技术沟通'],
  joinedAt: new Date().toISOString(),
}

export async function getSettings() {
  const value = await db.settings.get('me')
  return value ?? { ...defaultSettings, id: 'me' }
}

export async function exportData() {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    events: await db.events.toArray(),
    mastery: await db.mastery.toArray(),
    settings: await getSettings(),
  }, null, 2)
}

export async function importData(raw: string) {
  const data = JSON.parse(raw)
  if (data.version !== 1 || !Array.isArray(data.events) || !Array.isArray(data.mastery)) throw new Error('不支持的数据文件')
  await db.transaction('rw', [db.events, db.mastery, db.settings], async () => {
    await Promise.all([db.events.clear(), db.mastery.clear(), db.settings.clear()])
    await db.events.bulkAdd(data.events.map(({ id: _id, ...event }: LearningEvent) => event))
    await db.mastery.bulkPut(data.mastery)
    await db.settings.put({ ...defaultSettings, ...data.settings, id: 'me' })
  })
}

export async function clearData() {
  await db.transaction('rw', [db.events, db.mastery, db.settings], async () => {
    await Promise.all([db.events.clear(), db.mastery.clear(), db.settings.clear()])
  })
}
