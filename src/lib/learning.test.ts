import { describe, expect, it } from 'vitest'
import { scenes } from '../data/content'
import { nextMastery, recommendScenes, studyStats } from './learning'

describe('learning model', () => {
  it('raises mastery and schedules a correct answer in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const result = nextMastery(undefined, 'grounded', true, 4, now)
    expect(result.score).toBeGreaterThan(0)
    expect(new Date(result.dueAt).getTime()).toBeGreaterThan(now.getTime())
  })

  it('reduces stability and records a lapse after an error', () => {
    const now = new Date('2026-01-10T00:00:00Z')
    const current = { expressionId: 'grounded', score: 60, stability: 8, reviews: 4, lapses: 0, dueAt: now.toISOString() }
    const result = nextMastery(current, 'grounded', false, 2, now)
    expect(result.score).toBeLessThan(current.score)
    expect(result.stability).toBeLessThan(current.stability)
    expect(result.lapses).toBe(1)
  })

  it('prioritizes scenes with due expressions', () => {
    const due = { expressionId: 'hallucinate', score: 50, stability: 2, reviews: 2, lapses: 0, dueAt: '2025-01-01T00:00:00Z' }
    const ranked = recommendScenes(scenes, [due], [], [], new Date('2026-01-01T00:00:00Z'))
    expect(ranked[0].id).toBe('ai-hallucination')
  })

  it('calculates answer accuracy', () => {
    const stats = studyStats([
      { sceneId: 'one', kind: 'answer', correct: true, createdAt: '2026-01-01T00:00:00Z' },
      { sceneId: 'one', kind: 'answer', correct: false, createdAt: '2026-01-01T00:01:00Z' },
    ], [])
    expect(stats.accuracy).toBe(50)
  })
})
