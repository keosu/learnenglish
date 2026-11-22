import { describe, expect, it } from 'vitest'
import { cleanText, dateKey, dedupe, distinctEvents, extractJson, parseFeed, sameEvent, updateIndex, validateLesson } from './news-lib.mjs'

const rss = `<rss><channel>
<item><title><![CDATA[EU agrees new &amp; tougher AI rules]]></title><link>https://example.com/a?x=1&amp;y=2</link>
<description><![CDATA[<p>Lawmakers reached a deal <b>late</b> on Friday.</p>]]></description><pubDate>Sat, 21 Nov 2026 10:00:00 GMT</pubDate></item>
<item><title>No link here</title></item>
</channel></rss>`

const atom = `<feed><entry><title>Model card</title><link rel="self" href="https://example.com/self"/><link rel="alternate" href="https://example.com/post"/>
<summary>Short &lt;em&gt;summary&lt;/em&gt;</summary><updated>2026-11-21T08:00:00Z</updated></entry></feed>`

describe('feeds', () => {
  it('parses RSS items with CDATA, entities and html', () => {
    const [item, ...rest] = parseFeed(rss, 'Test')
    expect(rest).toHaveLength(0)
    expect(item.title).toBe('EU agrees new & tougher AI rules')
    expect(item.link).toBe('https://example.com/a?x=1&y=2')
    expect(item.summary).toBe('Lawmakers reached a deal late on Friday.')
    expect(item.publishedAt).toBe('2026-11-21T10:00:00.000Z')
  })

  it('parses Atom entries and prefers the alternate link', () => {
    const [item] = parseFeed(atom, 'Atom')
    expect(item.link).toBe('https://example.com/post')
    expect(item.summary).toBe('Short summary')
  })

  it('drops duplicate headlines and repeat coverage of one event', () => {
    expect(dedupe([{ title: 'OpenAI ships a new model!' }, { title: 'OpenAI ships a new model' }])).toHaveLength(1)
    expect(sameEvent('AI claimed a solution to the Riemann hypothesis', 'Riemann hypothesis: mathematician disputes AI proof')).toBe(true)
    expect(sameEvent('Nvidia earnings beat forecasts', 'EU agrees tougher AI rules')).toBe(false)
    expect(distinctEvents([{ title: 'Riemann hypothesis proof claimed' }, { title: 'Second Riemann hypothesis proof' }, { title: 'Ceasefire talks resume' }])).toHaveLength(2)
  })

  it('names each day by Beijing date', () => {
    expect(dateKey(new Date('2026-11-22T22:10:00Z'))).toBe('2026-11-23')
    expect(dateKey(new Date('2026-11-22T10:00:00Z'))).toBe('2026-11-22')
  })

  it('cleans nested markup', () => {
    expect(cleanText('&lt;p&gt;Hello&nbsp;<b>world</b>&lt;/p&gt;')).toBe('Hello world')
  })
})

describe('model output', () => {
  it('extracts JSON from fenced replies', () => {
    expect(extractJson('Here:\n```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(() => extractJson('OK')).toThrow()
  })

  const sentence = (en) => ({ en, zh: '中文', tip: '主干：Lawmakers reached；听：reached a 连读', focus: [{ text: 'reached a deal', meaning: '达成协议' }, { text: 'not in sentence', meaning: 'x' }] })
  const meta = { title: 'Raw', link: 'https://example.com/a', source: 'BBC News', publishedAt: null, category: 'world' }

  it('keeps only focus phrases that appear in the sentence', () => {
    const lesson = validateLesson({ title: 'Deal', sentences: Array.from({ length: 6 }, () => sentence('Lawmakers reached a deal late on Friday night.')), quiz: [{ q: 'When?', options: ['A', 'B', 'C', 'D'], answer: 1 }, { q: 'Bad', options: ['A'], answer: 3 }] }, meta)
    expect(lesson.sentences).toHaveLength(6)
    expect(lesson.sentences[0].focus).toEqual([{ text: 'reached a deal', meaning: '达成协议', note: '' }])
    expect(lesson.sentences[0].tip).toContain('连读')
    expect(lesson.quiz).toHaveLength(1)
    expect(lesson.level).toBe('B2')
    expect(lesson.id).toMatch(/^[a-z0-9]+$/)
  })

  it('rejects lessons that are too short to listen to', () => {
    expect(validateLesson({ sentences: [sentence('Lawmakers reached a deal late on Friday night.')] }, meta)).toBeNull()
    expect(validateLesson(null, meta)).toBeNull()
  })
})

describe('index', () => {
  it('replaces the same day, sorts newest first and reports dropped days', () => {
    const days = Array.from({ length: 3 }, (_, i) => ({ date: `2026-11-0${i + 1}`, count: 1 }))
    const next = updateIndex({ days }, { date: '2026-11-02', count: 9 }, 2)
    expect(next.latest).toBe('2026-11-03')
    expect(next.days.map((day) => day.date)).toEqual(['2026-11-03', '2026-11-02'])
    expect(next.days[1].count).toBe(9)
    expect(next.dropped).toEqual(['2026-11-01'])
  })
})
