import type { Focus } from '../types'
import { splitHighlights } from './highlight'

export interface Token {
  text: string
  start: number
  end: number
  space: boolean
  focus: number | null
}

export function tokenize(text: string, focus: Focus[]): Token[] {
  const parts = splitHighlights(text, focus.map((item, index) => ({ id: String(index), phrase: item.text })))
  const tokens: Token[] = []
  let offset = 0
  for (const part of parts) {
    for (const piece of part.text.split(/(\s+)/)) {
      if (!piece) continue
      tokens.push({ text: piece, start: offset, end: offset + piece.length, space: /^\s+$/.test(piece), focus: part.expressionId ? Number(part.expressionId) : null })
      offset += piece.length
    }
  }
  return tokens
}

export interface TokenGroup {
  focus: number | null
  tokens: Token[]
}

export function groupTokens(tokens: Token[]): TokenGroup[] {
  const groups: TokenGroup[] = []
  for (const token of tokens) {
    const last = groups.at(-1)
    if (last && last.focus !== null && last.focus === token.focus) last.tokens.push(token)
    else groups.push({ focus: token.focus, tokens: [token] })
  }
  return groups
}

export const isSpoken = (token: Token, word: number | null) => word !== null && !token.space && word >= token.start && word < token.end
