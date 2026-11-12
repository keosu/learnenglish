import { describe, expect, it } from 'vitest'
import { splitHighlights } from '../lib/highlight'
import { expressionMap, expressions, scenes, topicCatalog } from './content'

describe('catalog', () => {
  it('keeps enough scenes to keep studying', () => {
    expect(topicCatalog.length).toBeGreaterThanOrEqual(6)
    expect(scenes.length).toBeGreaterThan(16)
    expect(expressions.length).toBeGreaterThan(40)
  })

  it('uses each exercise phrase inside that scene', () => {
    for (const scene of scenes) {
      expect(scene.dialogue.length, scene.id).toBeGreaterThanOrEqual(7)
      const spoken = scene.dialogue.map((line) => line.text).join(' ').toLowerCase()
      for (const exercise of scene.exercises) {
        expect(spoken, scene.id).toContain(exercise.focus.toLowerCase())
        if (exercise.type === 'choice') expect(exercise.sentence.toLowerCase()).toContain(exercise.focus.toLowerCase())
        if (exercise.type === 'cloze') expect(exercise.sentence).toContain('______')
      }
    }
  })

  it('only links expressions that exist', () => {
    const ids = new Set(expressions.map((item) => item.id))
    expect(ids.size).toBe(expressions.length)
    for (const item of expressions) {
      for (const relation of item.relations) expect(ids.has(relation), item.id).toBe(true)
    }
    for (const scene of scenes) {
      const spoken = scene.dialogue.map((line) => line.text).join(' ')
      for (const id of scene.expressions) {
        expect(ids.has(id), scene.id).toBe(true)
        const phrase = expressionMap[id].phrase
        const found = splitHighlights(spoken, [{ id, phrase }]).some((part) => part.expressionId === id)
        expect(found, `${scene.id} missing ${phrase}`).toBe(true)
      }
    }
    expect(expressionMap.hallucinate.phrase).toBe('hallucinate')
  })
})
