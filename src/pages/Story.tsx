import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ExternalLink, Eye, EyeOff, Languages, Newspaper, Play, Sparkles, Star, Turtle } from 'lucide-react'
import type { Track } from '../types'
import { db, sentenceFavorite, toggleFavorite } from '../lib/db'
import { useExplain } from '../lib/explain'
import { categoryLabel, loadDay, minutesOf, tracksOf, useAsync } from '../lib/news'
import { usePlayer, useSettings } from '../lib/store'
import { Empty, FocusCard, Quiz, SentenceText, WordBars } from '../components/ui'
import { PlayerBar } from '../components/PlayerBar'
import { useBack } from '../lib/nav'

export default function Story() {
  const { date = '', id = '' } = useParams()
  const back = useBack()
  const day = useAsync(() => loadDay(date), [date])
  const article = day.data?.articles.find((item) => item.id === id)
  const tracks = useMemo(() => (article ? tracksOf(date, article) : []), [article, date])
  const { queue, index, speakingKey, word, load, jump, once } = usePlayer()
  const { showZh, blind, set } = useSettings()
  const openExplain = useExplain((state) => state.open)
  const favorites = useLiveQuery(() => db.favorites.where('kind').equals('sentence').primaryKeys(), []) ?? []
  const saved = new Set(favorites)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [picked, setPicked] = useState<{ sentence: number; focus: number } | null>(null)
  const mine = tracks.length > 0 && queue[0]?.key.startsWith(`${date}/${id}/`)
  const active = mine ? index : -1
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (active < 0) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active])

  if (day.error || (!day.loading && !article)) return <div className="screen">
    <header className="bar"><button className="icon" onClick={back} aria-label="返回"><ArrowLeft /></button></header>
    <Empty icon={<Newspaper />} title="找不到这条新闻">它可能已经过期了，回到今日看看最新的。</Empty>
  </div>
  if (!article) return <div className="page" />

  const ensure = () => {
    if (!mine) load(tracks, article.title)
  }
  const playFrom = (at: number) => {
    if (!mine) load(tracks, article.title, at, true)
    else jump(at, true)
  }
  const reveal = (at: number) => setRevealed(new Set(revealed).add(at))

  return <div className={`screen story-page ${article.category}`}>
    <header className="bar">
      <button className="icon" onClick={back} aria-label="返回"><ArrowLeft /></button>
      <span className={`tag ${article.category}`}>{categoryLabel[article.category]}</span>
      <span className="bar-title">{article.source}</span>
      <button className={showZh ? 'icon on' : 'icon'} onClick={() => set({ showZh: !showZh })} aria-label={showZh ? '隐藏中文' : '显示中文'}><Languages /></button>
      <button className={blind ? 'icon on' : 'icon'} onClick={() => { set({ blind: !blind }); setRevealed(new Set()) }} aria-label={blind ? '关闭盲听' : '盲听'}>{blind ? <EyeOff /> : <Eye />}</button>
    </header>
    <div className="scroll">
      <section className="story-head">
        <p className="eyebrow">{article.source} · {article.level} · 约 {minutesOf(article.sentences, 0.85)} 分钟</p>
        <h1>{article.title}</h1>
        <p className="zh-title">{article.titleZh}</p>
        {article.summaryZh && <p className="summary">{article.summaryZh}</p>}
      </section>
      <ol className="sentences" ref={listRef}>
        {tracks.map((track: Track, at) => {
          const speaking = speakingKey === track.key
          const hidden = blind && !revealed.has(at)
          const favorite = sentenceFavorite(track)
          return <li key={track.key} className={[at === active ? 'active' : '', speaking ? 'speaking' : ''].join(' ')} onClick={() => (hidden ? reveal(at) : playFrom(at))}>
            <span className="num">{String(at + 1).padStart(2, '0')}</span>
            <div className="sentence-body">
              <p className="en">{hidden ? <WordBars text={track.en} word={speaking ? word : null} /> : <SentenceText text={track.en} focus={track.focus} word={speaking ? word : null} picked={picked?.sentence === at ? picked.focus : null} onPick={(focus) => setPicked(picked?.sentence === at && picked.focus === focus ? null : { sentence: at, focus })} />}</p>
              {showZh && !hidden && <p className="zh">{track.zh}</p>}
              {picked?.sentence === at && track.focus[picked.focus] && <FocusCard track={track} focus={track.focus[picked.focus]} onClose={() => setPicked(null)} />}
              <div className="tools" onClick={(event) => event.stopPropagation()}>
                <button onClick={() => { ensure(); once(track) }} aria-label="重听这句"><Play /></button>
                <button onClick={() => { ensure(); once(track, true) }} aria-label="慢速"><Turtle /></button>
                <button className={saved.has(favorite.id) ? 'on' : ''} onClick={() => toggleFavorite(favorite)} aria-label="收藏句子"><Star /></button>
                <button onClick={() => openExplain(track)} aria-label="句子解析"><Sparkles /></button>
                {hidden && <button className="reveal" onClick={() => reveal(at)}>看原文</button>}
              </div>
            </div>
          </li>
        })}
      </ol>
      <Quiz items={article.quiz} label={article.id} />
      <a className="source-link" href={article.url} target="_blank" rel="noreferrer">阅读原文 · {article.source}<ExternalLink /></a>
    </div>
    <PlayerBar onStart={() => (mine ? usePlayer.getState().toggle() : playFrom(0))} active={mine} />
  </div>
}
