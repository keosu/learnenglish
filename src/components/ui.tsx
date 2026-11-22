import { useMemo, useState, type ReactNode, type SyntheticEvent } from 'react'
import { Check, Sparkles, Star, Turtle, Volume2, X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Focus, QuizItem, Track } from '../types'
import { db, phraseFavorite, toggleFavorite } from '../lib/db'
import { useExplain } from '../lib/explain'
import { usePlayer } from '../lib/store'
import { groupTokens, isSpoken, tokenize } from '../lib/tokens'

export function SentenceText({ text, focus, word, picked, onPick }: { text: string; focus: Focus[]; word?: number | null; picked?: number | null; onPick?: (index: number) => void }) {
  const groups = useMemo(() => groupTokens(tokenize(text, focus)), [text, focus])
  return <>{groups.map((group, groupIndex) => {
    const body = group.tokens.map((token) => <span key={token.start} className={isSpoken(token, word ?? null) ? 'spoken' : undefined}>{token.text}</span>)
    if (group.focus === null) return <span key={groupIndex}>{body}</span>
    const className = group.focus === picked ? 'focus picked' : 'focus'
    if (!onPick) return <mark key={groupIndex} className={className}>{body}</mark>
    const index = group.focus
    const pick = (event: SyntheticEvent) => { event.stopPropagation(); onPick(index) }
    return <span role="button" tabIndex={0} key={groupIndex} className={className} onClick={pick} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && pick(event)}>{body}</span>
  })}</>
}

export function WordBars({ text, word }: { text: string; word?: number | null }) {
  const tokens = useMemo(() => tokenize(text, []), [text])
  return <span className="bars" aria-label="盲听中，原文已隐藏">{tokens.filter((token) => !token.space).map((token) => <i key={token.start} className={isSpoken(token, word ?? null) ? 'on' : undefined} style={{ width: `${Math.max(0.9, token.text.replace(/[^\w]/g, '').length * 0.5)}em` }} />)}</span>
}

export function Ring({ value, size = 26 }: { value: number; size?: number }) {
  const radius = size / 2 - 2.5
  const length = 2 * Math.PI * radius
  return <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
    <circle cx={size / 2} cy={size / 2} r={radius} />
    <circle cx={size / 2} cy={size / 2} r={radius} className="ring-fill" strokeDasharray={length} strokeDashoffset={length * (1 - Math.min(1, value))} />
  </svg>
}

export function FocusCard({ track, focus, onClose }: { track: Track; focus: Focus; onClose: () => void }) {
  const item = phraseFavorite(track, focus.text, focus.meaning, focus.note)
  const saved = useLiveQuery(() => db.favorites.get(item.id), [item.id])
  return <div className="focus-card" onClick={(event) => event.stopPropagation()}>
    <div>
      <strong>{focus.text}</strong>
      <span>{focus.meaning}</span>
      {focus.note && <small>{focus.note}</small>}
    </div>
    <button className={saved ? 'icon on' : 'icon'} onClick={() => toggleFavorite(item)} aria-label={saved ? '取消收藏短语' : '收藏短语'}><Star /></button>
    <button className="icon" onClick={onClose} aria-label="收起"><X /></button>
  </div>
}

export function Quiz({ items, label }: { items: QuizItem[]; label: string }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const once = usePlayer((state) => state.once)
  if (!items.length) return null
  return <section className="quiz">
    <h2>听后小测</h2>
    {items.map((item, index) => {
      const chosen = answers[index]
      const done = chosen !== undefined
      return <div className="quiz-item" key={index}>
        <div className="quiz-q">
          <p>{index + 1}. {item.q}</p>
          <button className="icon" aria-label="朗读题目" onClick={() => once({ key: `quiz:${label}:${index}`, date: '', articleId: '', articleTitle: label, category: 'ai', index, en: item.q, zh: '', focus: [] })}><Volume2 /></button>
        </div>
        <div className="quiz-options">{item.options.map((option, optionIndex) => {
          const state = !done ? '' : optionIndex === item.answer ? 'right' : optionIndex === chosen ? 'wrong' : 'dim'
          return <button key={optionIndex} className={state} disabled={done} onClick={() => setAnswers({ ...answers, [index]: optionIndex })}>
            <b>{'ABCD'[optionIndex]}</b><span>{option}</span>{state === 'right' && <Check />}
          </button>
        })}</div>
        {done && item.explainZh && <p className="quiz-note">{item.explainZh}</p>}
      </div>
    })}
  </section>
}

function SheetPhrase({ track, focus }: { track: Track; focus: Focus }) {
  const item = phraseFavorite(track, focus.text, focus.meaning, focus.note)
  const saved = useLiveQuery(() => db.favorites.get(item.id), [item.id])
  return <li>
    <div><strong>{focus.text}</strong><span>{focus.meaning}</span>{focus.note && <small>{focus.note}</small>}</div>
    <button className={saved ? 'icon on' : 'icon'} onClick={() => toggleFavorite(item)} aria-label={saved ? '取消收藏短语' : '收藏短语'}><Star /></button>
  </li>
}

export function ExplainSheet() {
  const { track, open } = useExplain()
  const { once, speakingKey, word } = usePlayer()
  if (!track) return null
  const speaking = speakingKey === track.key
  return <div className="sheet-backdrop" onClick={() => open(null)}>
    <section className="sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="句子解析">
      <header><Sparkles /><strong>句子解析</strong><small>随每日内容由免费大模型生成</small><button className="icon" onClick={() => open(null)} aria-label="关闭"><X /></button></header>
      <p className="sheet-en"><SentenceText text={track.en} focus={track.focus} word={speaking ? word : null} /></p>
      <div className="sheet-play">
        <button className="pill" onClick={() => once(track)}><Volume2 />原速</button>
        <button className="pill" onClick={() => once(track, true)}><Turtle />慢速</button>
      </div>
      <div className="sheet-body">
        <p><b>译文</b>{track.zh}</p>
        {track.tip && <p><b>结构与听读</b>{track.tip}</p>}
        {track.focus.length > 0 && <><b className="sheet-label">重点短语</b><ul className="sheet-phrases">{track.focus.map((focus) => <SheetPhrase key={focus.text} track={track} focus={focus} />)}</ul></>}
      </div>
    </section>
  </div>
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return <div className="empty">{icon}<h3>{title}</h3>{children && <p>{children}</p>}</div>
}
