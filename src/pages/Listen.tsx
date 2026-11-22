import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Eye, EyeOff, Headphones, Languages, Mic, Sparkles, Star, X } from 'lucide-react'
import type { Category, Track } from '../types'
import { db, sentenceFavorite, toggleFavorite } from '../lib/db'
import { useExplain } from '../lib/explain'
import { categoryLabel, loadDay, loadIndex, tracksOf } from '../lib/news'
import { usePlayer, useSettings } from '../lib/store'
import { Empty, SentenceText, WordBars } from '../components/ui'
import { PlayerBar } from '../components/PlayerBar'
import { useBack } from '../lib/nav'

async function todayTracks(category?: Category) {
  const index = await loadIndex()
  const day = await loadDay(index.latest)
  return day.articles.filter((item) => !category || item.category === category).flatMap((item) => tracksOf(day.date, item))
}

export default function Listen() {
  const back = useBack()
  const { queue, index, label, speakingKey, word, load, toggle } = usePlayer()
  const { showZh, blind, shadow, set } = useSettings()
  const openExplain = useExplain((state) => state.open)
  const current = queue[index] as Track | undefined
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [pick, setPick] = useState<{ key: string; at: number } | null>(null)
  const revealed = Boolean(current) && revealedKey === current?.key
  const picked = pick && pick.key === current?.key ? pick.at : null
  const setRevealed = (value: boolean) => setRevealedKey(value && current ? current.key : null)
  const setPicked = (at: number | null) => setPick(at === null || !current ? null : { key: current.key, at })
  const previous = index > 0 && queue[index - 1]?.articleId === current?.articleId ? queue[index - 1] : undefined
  const favId = current ? sentenceFavorite(current).id : ''
  const saved = useLiveQuery(() => (favId ? db.favorites.get(favId) : undefined), [favId])

  useEffect(() => {
    if (!usePlayer.getState().queue.length) todayTracks().then((tracks) => tracks.length && load(tracks, '今日播报'), () => undefined)
  }, [load])

  const choose = async (source: 'all' | Category | 'saved') => {
    if (source === 'saved') {
      const items = await db.favorites.where('kind').equals('sentence').reverse().sortBy('createdAt')
      load(items, '收藏句子')
    } else load(await todayTracks(source === 'all' ? undefined : source), source === 'all' ? '今日播报' : categoryLabel[source])
  }

  const hidden = blind && !revealed
  const position = current ? queue.filter((item) => item.articleId === current.articleId) : []
  const articleIndex = new Set(queue.slice(0, index + 1).map((item) => item.articleId)).size
  const articleCount = new Set(queue.map((item) => item.articleId)).size

  return <div className={`screen listen ${current?.category ?? ''}`}>
    <header className="bar">
      <button className="icon" onClick={back} aria-label="关闭"><X /></button>
      <div className="listen-label"><strong>{label || '听力'}</strong>{current && <small>第 {articleIndex}/{articleCount} 条 · 第 {current.index + 1}/{position.length} 句</small>}</div>
      <button className={showZh ? 'icon on' : 'icon'} onClick={() => set({ showZh: !showZh })} aria-label={showZh ? '隐藏中文' : '显示中文'}><Languages /></button>
    </header>
    <div className="source-tabs">
      {(['all', 'ai', 'world', 'saved'] as const).map((key) => {
        const name = key === 'all' ? '今日播报' : key === 'saved' ? '收藏句子' : categoryLabel[key]
        return <button key={key} className={label === name ? 'on' : ''} onClick={() => choose(key)}>{key === 'all' ? '全部' : key === 'saved' ? '收藏' : categoryLabel[key]}</button>
      })}
    </div>
    {!current
      ? <Empty icon={<Headphones />} title={label === '收藏句子' ? '还没有收藏句子' : '正在准备今天的播报'}>{label === '收藏句子' ? '在新闻里点星标，就能在这里连续听。' : undefined}</Empty>
      : <section className="stage" onClick={() => (hidden ? setRevealed(true) : undefined)}>
        <p className="stage-article"><span className={`dot ${current.category}`} />{current.articleTitle}</p>
        {previous && !hidden && <p className="stage-prev">{previous.en}</p>}
        <p className={hidden ? 'stage-en veiled' : 'stage-en'}>
          {hidden ? <WordBars text={current.en} word={speakingKey === current.key ? word : null} /> : <SentenceText text={current.en} focus={current.focus} word={speakingKey === current.key ? word : null} picked={picked} onPick={(at) => setPicked(picked === at ? null : at)} />}
        </p>
        {hidden && <p className="stage-hint">先听，听不出再点一下看原文</p>}
        {!hidden && showZh && <p className="stage-zh">{current.zh}</p>}
        {!hidden && <div className="stage-focus">{current.focus.map((item, at) => <button key={item.text} className={picked === at ? 'on' : ''} onClick={(event) => { event.stopPropagation(); setPicked(picked === at ? null : at) }}><b>{item.text}</b><span>{item.meaning}</span></button>)}</div>}
      </section>}
    <div className="listen-tools">
      <button className={blind ? 'on' : ''} onClick={() => set({ blind: !blind })}>{blind ? <EyeOff /> : <Eye />}盲听</button>
      <button className={shadow ? 'on' : ''} onClick={() => set({ shadow: !shadow })}><Mic />跟读</button>
      <button className={saved ? 'on' : ''} disabled={!current} onClick={() => current && toggleFavorite(sentenceFavorite(current))}><Star />收藏</button>
      <button disabled={!current} onClick={() => current && openExplain(current)}><Sparkles />解析</button>
    </div>
    <PlayerBar big active={queue.length > 0} onStart={toggle} />
  </div>
}
