import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowUpRight, Play, Star, Trash2 } from 'lucide-react'
import type { Favorite, Track } from '../types'
import { db } from '../lib/db'
import { categoryLabel } from '../lib/news'
import { usePlayer } from '../lib/store'
import { Empty, SentenceText } from '../components/ui'

const asTrack = ({ key, date, articleId, articleTitle, category, index, en, zh, tip, focus }: Favorite): Track => ({ key, date, articleId, articleTitle, category, index, en, zh, tip, focus })

export default function Saved() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'sentence' | 'phrase'>('sentence')
  const items = useLiveQuery(() => db.favorites.orderBy('createdAt').reverse().toArray(), []) ?? []
  const { load, once, speakingKey, word } = usePlayer()
  const sentences = items.filter((item) => item.kind === 'sentence')
  const phrases = items.filter((item) => item.kind === 'phrase')
  const list = tab === 'sentence' ? sentences : phrases

  const playAll = () => {
    load(sentences.map(asTrack), '收藏句子', 0, true)
    navigate('/listen')
  }

  return <div className="page saved">
    <div className="page-head">
      <div><p className="eyebrow">Collection</p><h1>收藏</h1></div>
      {tab === 'sentence' && sentences.length > 0 && <button className="primary" onClick={playAll}><Play />连续听 {sentences.length} 句</button>}
    </div>
    <div className="segmented">
      <button className={tab === 'sentence' ? 'on' : ''} onClick={() => setTab('sentence')}>句子<small>{sentences.length}</small></button>
      <button className={tab === 'phrase' ? 'on' : ''} onClick={() => setTab('phrase')}>短语<small>{phrases.length}</small></button>
    </div>
    <ul className="saved-list">
      {list.map((item) => {
        const track = asTrack(item)
        const speaking = speakingKey === track.key
        return <li key={item.id} className={item.kind}>
          {item.kind === 'phrase' && <div className="saved-phrase"><strong>{item.phrase}</strong><span>{item.meaning}</span>{item.note && <small>{item.note}</small>}</div>}
          <p className="en"><SentenceText text={item.en} focus={item.kind === 'phrase' ? item.focus.filter((f) => f.text === item.phrase) : item.focus} word={speaking ? word : null} /></p>
          {item.kind === 'sentence' && <p className="zh">{item.zh}</p>}
          <div className="saved-foot">
            <span className={`dot ${item.category}`} /><span className="saved-src">{categoryLabel[item.category]} · {item.articleTitle}</span>
            <button className="icon" onClick={() => once(track)} aria-label="朗读"><Play /></button>
            <NavLink className="icon" to={`/story/${item.date}/${item.articleId}`} aria-label="打开原新闻"><ArrowUpRight /></NavLink>
            <button className="icon" onClick={() => db.favorites.delete(item.id)} aria-label="移除"><Trash2 /></button>
          </div>
        </li>
      })}
      {!list.length && <Empty icon={<Star />} title={tab === 'sentence' ? '还没有收藏的句子' : '还没有收藏的短语'}>{tab === 'sentence' ? '读新闻时点句子下方的星标。' : '点句子里高亮的短语，再点星标。'}</Empty>}
    </ul>
  </div>
}
