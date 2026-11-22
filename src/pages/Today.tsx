import { useMemo } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, Headphones, Newspaper, Play, WifiOff } from 'lucide-react'
import type { Category } from '../types'
import { db } from '../lib/db'
import { categoryLabel, loadDay, loadIndex, minutesOf, tracksOf, useAsync } from '../lib/news'
import { usePlayer } from '../lib/store'
import { Empty, Ring } from '../components/ui'

const longDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' })

export default function Today() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const index = useAsync(loadIndex, [])
  const date = params.get('d') ?? index.data?.latest ?? ''
  const filter = (params.get('c') as Category | null) ?? null
  const day = useAsync(() => (date ? loadDay(date) : Promise.reject(new Error('empty'))), [date])
  const listened = useLiveQuery(() => (date ? db.listens.where('key').startsWith(`${date}/`).toArray() : []), [date])
  const heard = useMemo(() => new Set((listened ?? []).map((item) => item.key)), [listened])
  const load = usePlayer((state) => state.load)
  const articles = day.data?.articles ?? []
  const visible = filter ? articles.filter((item) => item.category === filter) : articles
  const sentences = visible.flatMap((item) => item.sentences)
  const heardCount = visible.reduce((sum, article) => sum + article.sentences.filter((_, i) => heard.has(`${date}/${article.id}/${i}`)).length, 0)
  const setQuery = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next, { replace: true })
  }
  const playAll = () => {
    if (!day.data) return
    load(visible.flatMap((article) => tracksOf(date, article)), filter ? `${categoryLabel[filter]} · ${shortDate(date)}` : `今日播报 · ${shortDate(date)}`, 0, true)
    navigate('/listen')
  }

  if (index.error) return <div className="page"><Empty icon={<WifiOff />} title="暂时拿不到新闻">联网后再打开，读过的内容离线也能看。</Empty></div>

  return <div className="page today">
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">{date ? longDate(date) : 'Daily Brief'}</p>
        <h1>{filter ? categoryLabel[filter] : '今日播报'}</h1>
        <p className="hero-sub">{visible.length} 条新闻 · {sentences.length} 句 · 约 {minutesOf(sentences, 0.85)} 分钟</p>
        <div className="hero-progress"><span className="track"><i style={{ width: `${sentences.length ? (heardCount / sentences.length) * 100 : 0}%` }} /></span><span>已听 {heardCount}/{sentences.length}</span></div>
      </div>
      <button className="hero-play" onClick={playAll} disabled={!visible.length} aria-label="连续播放"><Play /></button>
      <div className="wave" aria-hidden>{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${18 + Math.abs(Math.sin(i * 1.7)) * 62}%` }} />)}</div>
    </section>

    <div className="filter-row">
      <div className="segmented">
        <button className={!filter ? 'on' : ''} onClick={() => setQuery({ c: null })}>全部<small>{articles.length}</small></button>
        <button className={filter === 'ai' ? 'on' : ''} onClick={() => setQuery({ c: 'ai' })}>AI 前沿<small>{articles.filter((a) => a.category === 'ai').length}</small></button>
        <button className={filter === 'world' ? 'on' : ''} onClick={() => setQuery({ c: 'world' })}>时政<small>{articles.filter((a) => a.category === 'world').length}</small></button>
      </div>
      {(index.data?.days.length ?? 0) > 1 && <label className="date-pick"><CalendarDays />
        <select value={date} onChange={(event) => setQuery({ d: event.target.value === index.data?.latest ? null : event.target.value })} aria-label="往期">
          {index.data?.days.map((item) => <option key={item.date} value={item.date}>{item.date === index.data?.latest ? '最新' : shortDate(item.date)}</option>)}
        </select>
      </label>}
    </div>

    <ol className="stories">
      {visible.map((article, position) => {
        const done = article.sentences.filter((_, i) => heard.has(`${date}/${article.id}/${i}`)).length
        return <li key={article.id}>
          <NavLink className={`story ${article.category}`} to={`/story/${date}/${article.id}`}>
            <span className="story-no">{String(position + 1).padStart(2, '0')}</span>
            <span className="story-copy">
              <span className="story-meta"><b>{article.category === 'ai' ? 'AI' : 'WORLD'}</b>{article.source}<em>{article.sentences.length} 句 · {article.level}</em></span>
              <strong>{article.title}</strong>
              <small>{article.titleZh}</small>
            </span>
            <span className="story-ring"><Ring value={done / article.sentences.length} /><Headphones /></span>
          </NavLink>
        </li>
      })}
      {(day.loading || index.loading) && !articles.length && Array.from({ length: 5 }, (_, i) => <li key={i} className="story skeleton"><i /><i /><i /></li>)}
      {!day.loading && !index.loading && !visible.length && <Empty icon={<Newspaper />} title="这一栏今天还没有内容">换个分类，或者看看往期。</Empty>}
    </ol>
  </div>
}
