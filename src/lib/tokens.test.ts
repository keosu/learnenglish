import { describe, expect, it } from 'vitest'
import { groupTokens, isSpoken, tokenize } from './tokens'

describe('tokens', () => {
  const text = 'Officials agreed to push back on the plan today.'
  const focus = [{ text: 'push back on', meaning: '反对' }]

  it('keeps the full text and offsets', () => {
    const tokens = tokenize(text, focus)
    expect(tokens.map((token) => token.text).join('')).toBe(text)
    for (const token of tokens) expect(text.slice(token.start, token.end)).toBe(token.text)
  })

  it('groups a focus phrase into one unit', () => {
    const groups = groupTokens(tokenize(text, focus))
    const phrase = groups.find((group) => group.focus === 0)
    expect(phrase?.tokens.map((token) => token.text).join('')).toBe('push back on')
  })

  it('marks the word the voice is on', () => {
    const tokens = tokenize(text, [])
    const at = text.indexOf('plan')
    expect(tokens.filter((token) => isSpoken(token, at)).map((token) => token.text)).toEqual(['plan'])
    expect(tokens.some((token) => isSpoken(token, null))).toBe(false)
  })
})
