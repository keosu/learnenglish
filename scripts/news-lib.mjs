const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
    if (code[0] === '#') {
      const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(value) ? String.fromCodePoint(value) : whole
    }
    return ENTITIES[code.toLowerCase()] ?? whole
  })
}

export function cleanText(raw = '') {
  const unwrapped = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  const decoded = decodeEntities(unwrapped)
  return decodeEntities(decoded.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function tag(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
    if (match && cleanText(match[1])) return cleanText(match[1])
  }
  return ''
}

function atomLink(block) {
  const links = [...block.matchAll(/<link\b([^>]*)\/?>/gi)].map((match) => match[1])
  const pick = links.find((attrs) => !/rel=["'](?!alternate)/i.test(attrs)) ?? links[0]
  return pick?.match(/href=["']([^"']+)["']/i)?.[1] ?? ''
}

export function parseFeed(xml, source) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((match) => match[0])
  return blocks.map((block) => {
    const title = tag(block, ['title'])
    const link = tag(block, ['link']) || atomLink(block)
    const summary = tag(block, ['description', 'summary', 'content:encoded', 'content'])
    const dateText = tag(block, ['pubDate', 'published', 'updated', 'dc:date'])
    const time = dateText ? Date.parse(dateText) : NaN
    return { title, link: decodeEntities(link.trim()), summary, publishedAt: Number.isFinite(time) ? new Date(time).toISOString() : null, source }
  }).filter((item) => item.title && /^https?:\/\//.test(item.link))
}

export function titleKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 2).slice(0, 8).join(' ')
}

export function dedupe(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = titleKey(item.title)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const COMMON = new Set(['artificial', 'intelligence', 'company', 'companies', 'government', 'president', 'minister', 'country', 'countries', 'people', 'announces', 'launches', 'release', 'released', 'against', 'between', 'because', 'despite', 'million', 'billion', 'chatgpt', 'openai', 'google', 'microsoft', 'anthropic', 'nvidia', 'people', 'report', 'reports', 'talks', 'after', 'about'])

function signature(title) {
  return new Set(title.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((word) => word.length >= 6 && !COMMON.has(word)))
}

export function sameEvent(a, b) {
  const left = signature(a)
  let shared = 0
  for (const word of signature(b)) if (left.has(word)) shared += 1
  return shared >= 2
}

export function distinctEvents(items) {
  const kept = []
  for (const item of items) if (!kept.some((other) => sameEvent(other.title, item.title))) kept.push(item)
  return kept
}

export function hashId(text) {
  let hash = 0x811c9dc5
  for (const char of text) {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(36)
}

export function dateKey(date = new Date(), timeZone = 'Asia/Shanghai') {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function extractJson(text) {
  const body = text.replace(/```(?:json)?/gi, '')
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('no JSON object in model output')
  return JSON.parse(body.slice(start, end + 1))
}

const str = (value, max = 400) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''

export function validateLesson(raw, meta) {
  if (!raw || typeof raw !== 'object') return null
  const sentences = (Array.isArray(raw.sentences) ? raw.sentences : []).map((item) => {
    const en = str(item?.en, 320)
    const zh = str(item?.zh, 240)
    if (en.length < 12 || !zh) return null
    const lower = en.toLowerCase()
    const focus = (Array.isArray(item.focus) ? item.focus : []).map((entry) => ({
      text: str(entry?.text, 60),
      meaning: str(entry?.meaning, 80),
      note: str(entry?.note, 120),
    })).filter((entry) => entry.text.length >= 2 && entry.meaning && entry.text.split(/\s+/).length <= 6 && lower.includes(entry.text.toLowerCase()))
    const tip = str(item.tip, 200)
    return tip ? { en, zh, tip, focus: focus.slice(0, 3) } : { en, zh, focus: focus.slice(0, 3) }
  }).filter(Boolean).slice(0, 12)
  if (sentences.length < 5) return null
  const quiz = (Array.isArray(raw.quiz) ? raw.quiz : []).map((item) => {
    const options = (Array.isArray(item?.options) ? item.options : []).map((option) => str(option, 140)).filter(Boolean)
    const answer = Number(item?.answer)
    const q = str(item?.q, 200)
    if (!q || options.length < 3 || options.length > 4 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) return null
    return { q, options, answer, explainZh: str(item?.explainZh, 200) }
  }).filter(Boolean).slice(0, 3)
  const title = str(raw.title, 160) || meta.title
  return {
    id: hashId(meta.link),
    category: meta.category,
    source: meta.source,
    url: meta.link,
    publishedAt: meta.publishedAt,
    title,
    titleZh: str(raw.titleZh, 120),
    summaryZh: str(raw.summaryZh, 300),
    level: ['B1', 'B2', 'C1'].includes(raw.level) ? raw.level : 'B2',
    sentences,
    quiz,
  }
}

export function updateIndex(index, day, keep = 30) {
  const others = (index?.days ?? []).filter((item) => item.date !== day.date)
  const days = [day, ...others].sort((a, b) => b.date.localeCompare(a.date))
  return { latest: days[0].date, updatedAt: new Date().toISOString(), days: days.slice(0, keep), dropped: days.slice(keep).map((item) => item.date) }
}
