import { describe, expect, it } from 'vitest'
import { splitHighlights } from './highlight'

describe('splitHighlights', () => {
  it('marks a key phrase inside a sentence', () => {
    const parts = splitHighlights('The model can still hallucinate when evidence is weak.', [
      { id: 'hallucinate', phrase: 'hallucinate' },
    ])
    expect(parts.filter((part) => part.expressionId === 'hallucinate').map((part) => part.text)).toEqual(['hallucinate'])
  })

  it('keeps the longer phrase when a shorter one overlaps', () => {
    const parts = splitHighlights('Answers must be grounded in the docs.', [
      { id: 'grounded', phrase: 'grounded in' },
      { id: 'short', phrase: 'grounded' },
    ])
    expect(parts.find((part) => part.expressionId)?.text).toBe('grounded in')
    expect(parts.some((part) => part.expressionId === 'short')).toBe(false)
  })

  it('matches a phrase after dropping a trailing particle', () => {
    const parts = splitHighlights('I will follow up weekly.', [{ id: 'follow-up', phrase: 'follow up on' }])
    expect(parts.find((part) => part.expressionId)?.text).toBe('follow up')
  })

  it('does not mark a phrase hidden inside another word', () => {
    const parts = splitHighlights('Skip the knitting pattern.', [{ id: 'nit', phrase: 'nit' }])
    expect(parts.some((part) => part.expressionId)).toBe(false)
  })
})
