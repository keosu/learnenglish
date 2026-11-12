export interface HighlightPhrase {
  id: string
  phrase: string
}

export interface HighlightPart {
  text: string
  expressionId?: string
}

const TRAILING_WORD = /\s+(on|in|of|for|to|the|a|an)$/i

export function matchForms(phrase: string) {
  const forms = [phrase]
  let current = phrase
  while (TRAILING_WORD.test(current)) {
    current = current.replace(TRAILING_WORD, '')
    if (current.length >= 3) forms.push(current)
  }
  return forms
}

function isBoundary(text: string, start: number, end: number) {
  const before = start === 0 || /[^A-Za-z0-9-]/.test(text[start - 1])
  const after = end >= text.length || /[^A-Za-z0-9-]/.test(text[end])
  return before && after
}

export function splitHighlights(text: string, phrases: HighlightPhrase[]): HighlightPart[] {
  const needles = phrases
    .flatMap((item) => matchForms(item.phrase).map((form) => ({ id: item.id, form })))
    .sort((a, b) => b.form.length - a.form.length)
  const lower = text.toLowerCase()
  const ranges: { start: number; end: number; id: string }[] = []
  for (const needle of needles) {
    const target = needle.form.toLowerCase()
    if (!target) continue
    let from = 0
    while (from <= lower.length - target.length) {
      const index = lower.indexOf(target, from)
      if (index < 0) break
      const end = index + target.length
      const overlapped = ranges.some((range) => index < range.end && end > range.start)
      if (!overlapped && isBoundary(text, index, end)) ranges.push({ start: index, end, id: needle.id })
      from = index + target.length
    }
  }
  ranges.sort((a, b) => a.start - b.start)
  const parts: HighlightPart[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start > cursor) parts.push({ text: text.slice(cursor, range.start) })
    parts.push({ text: text.slice(range.start, range.end), expressionId: range.id })
    cursor = range.end
  }
  if (cursor < text.length || parts.length === 0) parts.push({ text: text.slice(cursor) })
  return parts
}
