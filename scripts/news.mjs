import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { dateKey, dedupe, distinctEvents, extractJson, parseFeed, sameEvent, updateIndex, validateLesson } from './news-lib.mjs'

const FEEDS = {
  ai: [
    ['TechCrunch', 'https://techcrunch.com/category/artificial-intelligence/feed/'],
    ['The Verge', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'],
    ['MIT Technology Review', 'https://www.technologyreview.com/topic/artificial-intelligence/feed'],
    ['Ars Technica', 'https://arstechnica.com/ai/feed/'],
    ['OpenAI', 'https://openai.com/news/rss.xml'],
    ['Google', 'https://blog.google/technology/ai/rss/'],
    ['Hugging Face', 'https://huggingface.co/blog/feed.xml'],
  ],
  world: [
    ['BBC News', 'https://feeds.bbci.co.uk/news/world/rss.xml'],
    ['NPR', 'https://feeds.npr.org/1004/rss.xml'],
    ['The Guardian', 'https://www.theguardian.com/world/rss'],
    ['NPR Politics', 'https://feeds.npr.org/1014/rss.xml'],
  ],
}
const PICK = { ai: Number(process.env.NEWS_AI ?? 6), world: Number(process.env.NEWS_WORLD ?? 4) }
const OUT = join(import.meta.dirname, '..', 'public', 'news')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Pollinations allows one anonymous reply per 45 s per IP, counted from the end of the previous reply.
const providers = [
  {
    name: 'Pollinations',
    model: 'openai',
    url: 'https://text.pollinations.ai/openai',
    headers: {},
    gap: 46000,
  },
]

const used = new Set()
const readyAt = new Map()
const strikes = new Map()

async function chat(messages) {
  let lastError
  for (const provider of providers) {
    if ((strikes.get(provider.name) ?? 0) >= 4) continue
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const wait = (readyAt.get(provider.name) ?? 0) - Date.now()
      if (wait > 0) await sleep(wait)
      try {
        const response = await fetch(provider.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...provider.headers },
          body: JSON.stringify({ model: provider.model, messages, temperature: 0.4, response_format: { type: 'json_object' } }),
          signal: AbortSignal.timeout(150000),
        })
        const text = await response.text()
        readyAt.set(provider.name, Date.now() + provider.gap)
        if (response.status === 402 || response.status === 429) {
          const retry = Number(text.match(/retry after (\d+)/i)?.[1] ?? response.headers.get('retry-after'))
          readyAt.set(provider.name, Date.now() + Math.max(provider.gap, (Number.isFinite(retry) ? retry : 0) * 1000 + 2000))
          throw new Error(`${provider.name} rate limited`)
        }
        if (!response.ok) throw new Error(`${provider.name} ${response.status}: ${text.slice(0, 160)}`)
        const content = JSON.parse(text).choices?.[0]?.message?.content ?? ''
        const json = extractJson(content)
        used.add(`${provider.name} · ${provider.model}`)
        strikes.set(provider.name, 0)
        return json
      } catch (error) {
        lastError = error
        readyAt.set(provider.name, Math.max(readyAt.get(provider.name) ?? 0, Date.now() + provider.gap))
        if (!/rate limited/.test(error.message)) strikes.set(provider.name, (strikes.get(provider.name) ?? 0) + 1)
        console.warn(`  ${provider.name} attempt ${attempt + 1} failed: ${error.message}`)
        if (/rate limited/.test(error.message)) continue
        if (attempt >= 1) break
      }
    }
  }
  throw lastError
}

async function loadFeeds(category) {
  const since = Date.now() - 48 * 3600 * 1000
  const lists = await Promise.all(FEEDS[category].map(async ([source, url]) => {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (EchoNewsEnglish; +https://github.com/keosu/learnenglish)' }, signal: AbortSignal.timeout(20000) })
      if (!response.ok) throw new Error(String(response.status))
      const items = parseFeed(await response.text(), source)
      const fresh = items.filter((item) => item.publishedAt ? Date.parse(item.publishedAt) >= since : false)
      console.log(`  ${source}: ${fresh.length} fresh / ${items.length}`)
      return fresh.slice(0, 12)
    } catch (error) {
      console.warn(`  ${source} failed: ${error.message}`)
      return []
    }
  }))
  return dedupe(lists.flat().sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))).slice(0, 40)
}

function roundRobin(items, count) {
  const bySource = new Map()
  for (const item of items) bySource.set(item.source, [...(bySource.get(item.source) ?? []), item])
  const picked = []
  while (picked.length < count && [...bySource.values()].some((list) => list.length)) {
    for (const list of bySource.values()) if (list.length && picked.length < count) picked.push(list.shift())
  }
  return picked
}

async function select(category, items) {
  const count = Math.min(PICK[category], items.length)
  if (count === 0) return []
  const brief = category === 'ai'
    ? 'the most significant frontier AI and large language model news: new models, research results, safety and policy, major company moves, chips and compute. Skip product deals, minor app updates, gadget reviews and opinion pieces.'
    : 'the most important world news and politics: government decisions, elections, diplomacy, wars and ceasefires, major economic policy, international institutions. Skip crime stories without wider impact, celebrity, sport and lifestyle.'
  const list = items.map((item, index) => `${index}. [${item.source}] ${item.title} — ${item.summary.slice(0, 160)}`).join('\n')
  try {
    const result = await chat([
      { role: 'system', content: 'You are a senior news editor. Reply with JSON only.' },
      { role: 'user', content: `Pick ${count + 2} stories that are ${brief}\nEvery pick must be a different event: when several outlets cover the same event, choose only one of them. Mix sources. Return {"picks":[index,...]} ordered by importance.\n\n${list}` },
    ])
    const picks = [...new Set((result.picks ?? []).map(Number))].filter((index) => Number.isInteger(index) && items[index]).map((index) => items[index])
    const distinct = distinctEvents(picks).slice(0, count)
    if (distinct.length >= Math.min(count, 2)) return distinct
  } catch (error) {
    console.warn(`  selection fell back to round robin: ${error.message}`)
  }
  return distinctEvents(roundRobin(items, count * 2)).slice(0, count)
}

const LESSON_RULES = `You write short spoken news briefings for Chinese learners of English (CEFR B2) who practise listening and shadowing.
Write an original briefing about the story below as 8 to 10 sentences. Each sentence is 10 to 24 words, natural broadcast English, easy to say aloud.
Use only facts from the headline and summary. You may add general background that is widely known, but never invent numbers, quotes, names or dates.
Order: what happened, who is involved, key details, background, why it matters, what to watch next.
For each sentence give a faithful Simplified Chinese translation, 1 or 2 "focus" items: useful collocations or phrases (2 to 5 words) copied exactly from that sentence, skipping names and trivial words,
and a "tip" in Simplified Chinese (at most 70 characters): the sentence core or structure, plus one listening hint such as linking, weak forms or stress.
Then write 2 listening comprehension questions in English with 4 options each.
Reply with JSON only, in this shape:
{"title":"clear English headline, at most 14 words","titleZh":"中文标题","summaryZh":"两句中文：发生了什么，为什么重要","level":"B1|B2|C1",
"sentences":[{"en":"...","zh":"...","tip":"主干……；听：……","focus":[{"text":"exact phrase from en","meaning":"中文释义","note":"简短用法说明"}]}],
"quiz":[{"q":"...","options":["...","...","...","..."],"answer":0,"explainZh":"..."}]}`

async function lesson(item, category) {
  const messages = [
    { role: 'system', content: LESSON_RULES },
    { role: 'user', content: `Source: ${item.source}\nPublished: ${item.publishedAt}\nHeadline: ${item.title}\nSummary: ${item.summary.slice(0, 1400)}` },
  ]
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await chat(messages)
    const result = validateLesson(raw, { ...item, category })
    if (result) return result
    const count = Array.isArray(raw?.sentences) ? raw.sentences.length : 0
    console.warn(`  model returned ${count} sentences, asking again: ${JSON.stringify(raw?.sentences?.[0] ?? raw).slice(0, 160)}`)
    messages.push({ role: 'assistant', content: JSON.stringify(raw) }, { role: 'user', content: `That had ${count} sentences. Write 8 to 10 sentences, each with "en", "zh" and "focus" copied exactly from the sentence. Reply with the full JSON again.` })
  }
  return null
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

async function main() {
  const date = process.env.NEWS_DATE ?? dateKey()
  console.log(`Building ${date} with ${providers.map((item) => item.name).join(' → ')}`)
  const articles = []
  for (const category of ['ai', 'world']) {
    console.log(`Feeds: ${category}`)
    const items = await loadFeeds(category)
    const picks = await select(category, items)
    console.log(`Picked ${picks.length} ${category} stories`)
    const reserve = distinctEvents(items.filter((item) => !picks.includes(item) && !picks.some((pick) => sameEvent(pick.title, item.title))))
    const target = articles.length + picks.length
    for (const item of [...picks, ...reserve].slice(0, picks.length + 2)) {
      if (articles.length >= target) break
      try {
        const result = await lesson(item, category)
        if (result && articles.some((other) => sameEvent(other.title, result.title))) console.warn(`  ✗ same event as an earlier story: ${result.title}`)
        else if (result) {
          articles.push(result)
          console.log(`  ✓ ${result.title} (${result.sentences.length} sentences)`)
        } else console.warn(`  ✗ invalid lesson: ${item.title}`)
      } catch (error) {
        console.warn(`  ✗ ${item.title}: ${error.message}`)
      }
    }
  }
  if (!articles.length) {
    console.error('No lessons generated; keeping existing files.')
    process.exitCode = 1
    return
  }
  await mkdir(OUT, { recursive: true })
  const day = { date, generatedAt: new Date().toISOString(), models: [...used], articles }
  await writeFile(join(OUT, `${date}.json`), `${JSON.stringify(day, null, 1)}\n`)
  const summary = {
    date,
    count: articles.length,
    ai: articles.filter((item) => item.category === 'ai').length,
    world: articles.filter((item) => item.category === 'world').length,
    sentences: articles.reduce((sum, item) => sum + item.sentences.length, 0),
    headline: articles[0].titleZh || articles[0].title,
  }
  const index = updateIndex(await readJson(join(OUT, 'index.json'), null), summary)
  for (const old of index.dropped) await rm(join(OUT, `${old}.json`), { force: true })
  delete index.dropped
  await writeFile(join(OUT, 'index.json'), `${JSON.stringify(index, null, 1)}\n`)
  console.log(`Wrote ${articles.length} lessons for ${date}`)
}

await main()
