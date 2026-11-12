import type { LearningEvent, Mastery, Scene, Topic } from '../types'

const DAY = 86_400_000

export function nextMastery(current: Mastery | undefined, expressionId: string, correct: boolean, confidence = 3, now = new Date()): Mastery {
  const previous = current ?? { expressionId, score: 0, stability: 1, dueAt: now.toISOString(), reviews: 0, lapses: 0 }
  const quality = Math.max(1, Math.min(5, confidence))
  const stability = correct
    ? Math.min(90, Math.max(1, previous.stability * (1.35 + quality * 0.18)))
    : Math.max(0.5, previous.stability * 0.45)
  const score = Math.round(Math.max(0, Math.min(100, previous.score + (correct ? 9 + quality * 2 : -14))))
  const interval = correct ? stability : 0.5
  return {
    expressionId,
    score,
    stability,
    dueAt: new Date(now.getTime() + interval * DAY).toISOString(),
    reviews: previous.reviews + 1,
    lapses: previous.lapses + (correct ? 0 : 1),
  }
}

export function recommendScenes(scenes: Scene[], masteries: Mastery[], interests: Topic[], completed: string[], now = new Date()) {
  const masteryById = Object.fromEntries(masteries.map((item) => [item.expressionId, item]))
  return [...scenes].sort((a, b) => {
    const rank = (scene: Scene) => {
      const values = scene.expressions.map((id) => masteryById[id])
      const due = values.filter((m) => m && new Date(m.dueAt) <= now).length
      const weakness = values.reduce((sum, m) => sum + (100 - (m?.score ?? 0)), 0) / values.length
      return due * 80 + weakness * 0.5 + (interests.includes(scene.topic) ? 18 : 0) - (completed.includes(scene.id) ? 14 : 0)
    }
    return rank(b) - rank(a)
  })
}

export function studyStats(events: LearningEvent[], masteries: Mastery[]) {
  const answers = events.filter((event) => event.kind === 'answer')
  const completed = events.filter((event) => event.kind === 'complete')
  const dates = new Set(events.map((event) => event.createdAt.slice(0, 10)))
  let streak = 0
  const date = new Date()
  while (dates.has(date.toISOString().slice(0, 10))) {
    streak += 1
    date.setDate(date.getDate() - 1)
  }
  return {
    minutes: Math.round(events.reduce((sum, event) => sum + (event.duration ?? 0), 0) / 60),
    completed: completed.length,
    accuracy: answers.length ? Math.round(answers.filter((event) => event.correct).length / answers.length * 100) : 0,
    mastered: masteries.filter((item) => item.score >= 70).length,
    due: masteries.filter((item) => new Date(item.dueAt) <= new Date()).length,
    streak,
  }
}
