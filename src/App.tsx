import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, Check, Clock3, Download, Flame, Home, Library, Moon, RotateCcw, Search, Settings, Sparkles, Sun, Target, Trash2, Upload } from 'lucide-react'
import { db, clearData, defaultSettings, exportData, getSettings, importData } from './lib/db'
import { splitHighlights, type HighlightPhrase } from './lib/highlight'
import { nextMastery, recommendScenes, studyStats } from './lib/learning'
import { expressionMap, expressions, scenes, topicCatalog } from './data/content'
import type { Scene } from './types'
import './App.css'

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const nowIso = () => new Date().toISOString()
const nowMs = () => Date.now()

function readTheme(): 'light' | 'dark' {
  if (document.documentElement.dataset.theme === 'dark') return 'dark'
  if (document.documentElement.dataset.theme === 'light') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark', persist: boolean) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#141311' : '#f2efe8')
  if (persist) localStorage.setItem('cf-theme', theme)
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme)
  useEffect(() => {
    if (localStorage.getItem('cf-theme')) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      const next = media.matches ? 'dark' : 'light'
      applyTheme(next, false)
      setTheme(next)
    }
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next, true)
    setTheme(next)
  }
  return { theme, toggle }
}

function ThemeButton() {
  const { theme, toggle } = useTheme()
  return <button className="icon-button" onClick={toggle} aria-label={theme === 'dark' ? '切换浅色' : '切换暗色'}>{theme === 'dark' ? <Sun /> : <Moon />}</button>
}

function AppShell() {
  const learning = useLocation().pathname.startsWith('/learn/')
  return <div className="app-shell">
    {!learning && <TopBar />}
    <main><Routes>
      <Route path="/" element={<Today />} />
      <Route path="/scenes" element={<SceneLibrary />} />
      <Route path="/learn/:sceneId" element={<Learn />} />
      <Route path="/graph" element={<IndexPage />} />
      <Route path="/profile" element={<Profile />} />
    </Routes></main>
    {!learning && <nav className="bottom-nav">
      <NavLink to="/" end><Home /><span>今日</span></NavLink>
      <NavLink to="/scenes"><BookOpen /><span>话题</span></NavLink>
      <NavLink to="/graph"><Library /><span>索引</span></NavLink>
      <NavLink to="/profile"><BarChart3 /><span>我的</span></NavLink>
    </nav>}
  </div>
}

function TopBar() {
  const { masteries, events } = useLearningData()
  const stats = studyStats(events, masteries)
  return <header>
    <NavLink className="brand" to="/"><span>CF</span><strong>ContextFlow</strong></NavLink>
    <div className="header-actions">
      <span className="streak"><Flame size={14} /><span>{stats.streak} 天</span></span>
      <ThemeButton />
      <NavLink to="/profile" className="avatar">JL</NavLink>
    </div>
  </header>
}

function useLearningData() {
  const masteries = useLiveQuery(() => db.mastery.toArray(), []) ?? []
  const events = useLiveQuery(() => db.events.toArray(), []) ?? []
  const settings = useLiveQuery(getSettings, []) ?? { ...defaultSettings, id: 'me' }
  return { masteries, events, settings }
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function Today() {
  const { masteries, events, settings } = useLearningData()
  const completedIds = events.filter((event) => event.kind === 'complete').map((event) => event.sceneId)
  const picks = recommendScenes(scenes, masteries, settings.interests, completedIds)
  const stats = studyStats(events, masteries)
  const progress = Math.min(100, Math.round(stats.minutes / settings.dailyGoal * 100))
  return <div className="page today">
    <div className="today-head">
      <div><p className="kicker">{weekdays[new Date().getDay()]} · 今日</p><h1>{greeting()}</h1></div>
      <div className="goal"><strong>{stats.minutes}<small>/{settings.dailyGoal} 分</small></strong><i><em style={{ width: `${progress}%` }} /></i></div>
    </div>
    <section className="metrics">
      <div><span><Flame />连续</span><strong>{stats.streak}</strong></div>
      <div><span><Target />掌握</span><strong>{stats.mastered}<small>/{expressions.length}</small></strong></div>
      <div><span><Check />正确</span><strong>{stats.accuracy || '—'}{stats.accuracy ? '%' : ''}</strong></div>
      <div><span><RotateCcw />复习</span><strong>{stats.due}</strong></div>
    </section>
    <div className="section-heading"><h2>接着学</h2><NavLink to="/scenes">按话题看 <ArrowRight /></NavLink></div>
    <section className="today-list">{picks.slice(0, 4).map((scene, index) => <SceneRow key={scene.id} scene={scene} lead={index === 0} />)}</section>
    <section className="review-strip">
      <RotateCcw />
      <div><strong>{stats.due ? `${stats.due} 个表达待复习` : '复习已清空'}</strong><p>{stats.due ? '现在复习，记得更牢。' : '学完一个场景后会安排复习。'}</p></div>
      <NavLink className="button ghost" to="/graph">查索引</NavLink>
    </section>
  </div>
}

function SceneRow({ scene, lead = false, showTopic = true }: { scene: Scene; lead?: boolean; showTopic?: boolean }) {
  return <NavLink to={`/learn/${scene.id}`} className={lead ? 'scene-row lead' : 'scene-row'}>
    <span className="scene-icon">{scene.icon}</span>
    <span className="scene-copy"><strong>{scene.title}</strong><small>{scene.subtitle}</small></span>
    <em className="scene-side"><span>{showTopic ? scene.topic : scene.difficulty}</span><span>{scene.duration} 分钟</span></em>
    <ArrowRight />
  </NavLink>
}

function SceneLibrary() {
  const { events } = useLearningData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const selected = topicCatalog.find((item) => item.id === params.get('topic')) ?? null
  const completed = new Set(events.filter((event) => event.kind === 'complete').map((event) => event.sceneId))
  const needle = query.trim().toLowerCase()
  const matches = (scene: Scene) => `${scene.title}${scene.subtitle}${scene.context}${scene.topic}`.toLowerCase().includes(needle)
  const inTopic = selected ? scenes.filter((scene) => scene.topic === selected.id) : []
  const visible = (selected ? inTopic : scenes).filter((scene) => !needle || matches(scene))
  const phraseIds = [...new Set(inTopic.flatMap((scene) => scene.expressions))]
  return <div className="page">
    <div className="toolbar">
      {selected && <button className="icon-button" onClick={() => { setQuery(''); setParams({}) }} aria-label="全部话题"><ArrowLeft /></button>}
      <h1>{selected ? selected.id : '话题'}</h1>
      <label className="search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={selected ? '在这个话题里搜' : '搜索话题或场景'} /></label>
    </div>
    {!selected && !needle && <div className="topic-list">{topicCatalog.map((topic) => {
      const group = scenes.filter((scene) => scene.topic === topic.id)
      const done = group.filter((scene) => completed.has(scene.id)).length
      const phrases = new Set(group.flatMap((scene) => scene.expressions)).size
      return <button className="topic-row" key={topic.id} onClick={() => setParams({ topic: topic.id })}>
        <strong>{topic.id}</strong>
        <small>{topic.summary}</small>
        <em>{group.length} 个场景 · {phrases} 个表达 · 学过 {done}</em>
        <i><span style={{ width: `${group.length ? Math.round(done / group.length * 100) : 0}%` }} /></i>
      </button>
    })}</div>}
    {(selected || needle) && <>
      {selected && <p className="context">{selected.summary}。点一个场景开始，或先看这个话题里的说法。</p>}
      {selected && <div className="chip-rail">{phraseIds.map((id) => <NavLink key={id} to={`/graph?${new URLSearchParams({ focus: id, topic: selected.id })}`}>{expressionMap[id].phrase}</NavLink>)}</div>}
      <div className="library-list">
        {visible.map((scene) => <SceneRow scene={scene} key={scene.id} showTopic={!selected} />)}
        {!visible.length && <div className="empty"><Search /><h3>没有匹配的场景</h3><p>换个关键词，或回到话题列表。</p></div>}
      </div>
    </>}
  </div>
}

function scenePhrases(scene: Scene): HighlightPhrase[] {
  return scene.expressions.map((id) => ({ id, phrase: expressionMap[id].phrase }))
}

function Highlighted({ text, phrases, activeId, onPick }: { text: string; phrases: HighlightPhrase[]; activeId?: string | null; onPick?: (id: string) => void }) {
  const parts = useMemo(() => splitHighlights(text, phrases), [text, phrases])
  return <>{parts.map((part, index) => {
    const chunks = part.text.split('______')
    const body = chunks.map((chunk, chunkIndex) => <span key={chunkIndex}>{chunk}{chunkIndex < chunks.length - 1 && <span className="blank" />}</span>)
    if (!part.expressionId) return <span key={index}>{body}</span>
    const className = part.expressionId === activeId ? 'mark active' : 'mark'
    if (!onPick) return <mark key={index} className={className}>{body}</mark>
    return <button key={index} type="button" className={className} onClick={() => onPick(part.expressionId!)}>{body}</button>
  })}</>
}

function Learn() {
  const { sceneId } = useParams()
  const navigate = useNavigate()
  const scene = scenes.find((item) => item.id === sceneId)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState('')
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [openExpression, setOpenExpression] = useState<string | null>(null)
  const [started, setStarted] = useState(nowMs)
  useEffect(() => {
    setStep(0)
    setSelected('')
    setAnswered(false)
    setCorrectCount(0)
    setOpenExpression(null)
    setStarted(nowMs())
  }, [sceneId])
  if (!scene) return <div className="page empty"><h3>场景不存在</h3></div>
  const phrases = scenePhrases(scene)
  const total = scene.exercises.length + 2
  const exercise = step > 0 && step < total - 1 ? scene.exercises[step - 1] : null
  const activeId = exercise
    ? scene.expressions.find((id) => expressionMap[id].phrase === exercise.focus) ?? null
    : openExpression ?? scene.expressions[0]
  const active = activeId ? expressionMap[activeId] : null
  const finish = async () => {
    const duration = Math.round((nowMs() - started) / 1000)
    await db.events.add({ sceneId: scene.id, kind: 'complete', duration, createdAt: nowIso() })
    navigate('/')
  }
  const answer = async (option: string) => {
    if (!exercise || answered) return
    const correct = option === exercise.answer
    setSelected(option)
    setAnswered(true)
    if (correct) setCorrectCount((value) => value + 1)
    const expressionId = activeId ?? scene.expressions[(step - 1) % scene.expressions.length]
    const old = await db.mastery.get(expressionId)
    await db.mastery.put(nextMastery(old, expressionId, correct, correct ? 4 : 2))
    await db.events.add({ sceneId: scene.id, expressionId, kind: 'answer', correct, confidence: correct ? 4 : 2, createdAt: nowIso() })
  }
  const next = () => { setSelected(''); setAnswered(false); setStep((value) => value + 1) }
  return <div className="learn-page">
    <div className="learn-header">
      <button className="icon-button" onClick={() => navigate(-1)} aria-label="返回"><ArrowLeft /></button>
      <div><small>{scene.topic}</small><strong>{scene.title}</strong></div>
      <span>{step + 1}/{total}</span>
      <ThemeButton />
    </div>
    <div className="progress-line"><i style={{ width: `${(step + 1) / total * 100}%` }} /></div>
    <div className="learn-body">
      {step === 0 && <section className="lesson">
        <p className="context">{scene.context}</p>
        <div className="dialogue">{scene.dialogue.map((line, index) => <div className={line.speaker === 'You' ? 'dialogue-line you' : 'dialogue-line'} key={index}><span>{line.speaker.slice(0, 1)}</span><div><small>{line.speaker} · {line.role}</small><div className="line-text"><Highlighted text={line.text} phrases={phrases} activeId={activeId} onPick={setOpenExpression} /></div></div></div>)}</div>
        {active && <div className="phrase-dock">
          <div className="phrase-chips">{phrases.map((item) => <button key={item.id} className={item.id === activeId ? 'active' : ''} onClick={() => setOpenExpression(item.id)}>{item.phrase}</button>)}</div>
          <strong>{active.phrase}</strong>
          <small>{active.meaning} · {active.note}</small>
        </div>}
      </section>}
      {exercise && <section className="lesson exercise">
        <div className="lesson-title"><p className="kicker">{exercise.type === 'cloze' ? '补全句子' : '句中词义'}</p><h1>{exercise.prompt}</h1></div>
        <div className="sentence-card"><div><Highlighted text={exercise.sentence} phrases={phrases} activeId={activeId} /></div></div>
        <div className="options">{exercise.options.map((option) => <button key={option} onClick={() => answer(option)} className={answered ? option === exercise.answer ? 'correct' : option === selected ? 'wrong' : '' : ''}><span>{option}</span>{answered && option === exercise.answer && <Check />}</button>)}</div>
        {answered && <div className={selected === exercise.answer ? 'feedback good' : 'feedback'}><strong>{selected === exercise.answer ? '对了' : '再看这句'}</strong><p>{exercise.explanation}</p></div>}
      </section>}
      {step === total - 1 && <section className="lesson complete"><div className="complete-card"><div className="complete-mark"><Sparkles /></div><p className="kicker">完成</p><h1>这个场景过完了</h1><p>答对 {correctCount}/{scene.exercises.length}。关键词会进入复习。</p><div className="learned">{scene.expressions.map((id) => <span key={id}>{expressionMap[id].phrase}</span>)}</div></div></section>}
    </div>
    <div className="learn-footer">{step === total - 1 ? <button className="button" onClick={finish}>完成 <Check /></button> : <button disabled={!!exercise && !answered} className="button" onClick={next}>继续 <ArrowRight /></button>}</div>
  </div>
}

function mentions(text: string, id: string, phrase: string) {
  return splitHighlights(text, [{ id, phrase }]).some((part) => part.expressionId === id)
}

function IndexPage() {
  const { masteries } = useLearningData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const topic = params.get('topic')
  const focus = params.get('focus')
  const selected = focus && expressionMap[focus] ? expressionMap[focus] : null
  const open = (id: string, keepTopic = topic) => {
    const next: Record<string, string> = { focus: id }
    if (keepTopic) next.topic = keepTopic
    setParams(next)
  }
  if (selected) return <WordEntry entryId={selected.id} onBack={() => setParams(topic ? { topic } : {})} onOpen={(id) => open(id)} />
  const needle = query.trim().toLowerCase()
  const groups = topicCatalog
    .filter((item) => !topic || item.id === topic)
    .map((item) => {
      const ids = new Set(scenes.filter((scene) => scene.topic === item.id).flatMap((scene) => scene.expressions))
      const items = expressions
        .filter((entry) => ids.has(entry.id))
        .filter((entry) => !needle || `${entry.phrase} ${entry.meaning} ${entry.example}`.toLowerCase().includes(needle))
        .sort((a, b) => a.phrase.localeCompare(b.phrase))
      return { topic: item, items }
    })
    .filter((group) => group.items.length)
  return <div className="page index-page">
    <div className="toolbar">
      <h1>索引</h1>
      <label className="search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜说法或意思" /></label>
    </div>
    <div className="filters">
      <button className={!topic ? 'active' : ''} onClick={() => setParams({})}>全部</button>
      {topicCatalog.map((item) => <button key={item.id} className={topic === item.id ? 'active' : ''} onClick={() => setParams({ topic: item.id })}>{item.id}</button>)}
    </div>
    <div className="index-scroll">
      {groups.map((group) => <section key={group.topic.id}>
        <h2 className="index-head"><span>{group.topic.id}</span><small>{group.items.length}</small></h2>
        {group.items.map((entry) => {
          const score = masteries.find((item) => item.expressionId === entry.id)?.score ?? 0
          return <button key={entry.id} className="index-row" onClick={() => open(entry.id, group.topic.id)}>
            <i className={score >= 70 ? 'pip high' : score > 0 ? 'pip mid' : 'pip'} />
            <span className="index-copy">
              <span className="index-sentence"><Highlighted text={entry.example} phrases={[{ id: entry.id, phrase: entry.phrase }]} activeId={entry.id} /></span>
              <small>{entry.meaning}</small>
            </span>
          </button>
        })}
      </section>)}
      {!groups.length && <div className="empty"><Search /><h3>没有这词</h3><p>换个说法，或换一个话题。</p></div>}
    </div>
  </div>
}

function WordEntry({ entryId, onBack, onOpen }: { entryId: string; onBack: () => void; onOpen: (id: string) => void }) {
  const { masteries } = useLearningData()
  const entry = expressionMap[entryId]
  const mastery = masteries.find((item) => item.expressionId === entryId)
  const phrase = [{ id: entry.id, phrase: entry.phrase }]
  const lines = useMemo(() => scenes.flatMap((scene) => scene.dialogue.flatMap((line) => mentions(line.text, entry.id, entry.phrase) ? [{ sceneId: scene.id, title: scene.title, speaker: line.speaker, text: line.text }] : [])), [entry])
  const related = entry.relations.map((id) => expressionMap[id]).filter(Boolean)
  return <div className="page index-page">
    <div className="toolbar">
      <button className="icon-button" onClick={onBack} aria-label="返回索引"><ArrowLeft /></button>
      <h1>{entry.phrase}</h1>
      <strong className="index-score">{mastery?.score ?? 0}%</strong>
    </div>
    <p className="meaning">{entry.meaning}</p>
    <p className="note">{entry.note}</p>
    <div className="mastery-bar"><span><b>掌握</b><b>{mastery?.score ?? 0}%</b></span><i><em style={{ width: `${mastery?.score ?? 0}%` }} /></i></div>
    <div className="index-scroll">
      <h2 className="index-head">出现在这些句子里</h2>
      {lines.map((line) => <NavLink key={`${line.sceneId}-${line.text}`} to={`/learn/${line.sceneId}`} className="quote-row">
        <small>{line.title} · {line.speaker}</small>
        <span className="quote-text"><Highlighted text={line.text} phrases={phrase} activeId={entry.id} /></span>
      </NavLink>)}
      <h2 className="index-head">放在一起记</h2>
      {related.map((item) => <button key={item.id} className="index-row" onClick={() => onOpen(item.id)}>
        <span className="index-copy">
          <span className="index-sentence"><Highlighted text={item.example} phrases={[{ id: item.id, phrase: item.phrase }]} activeId={item.id} /></span>
          <small>{item.phrase} · {item.meaning}</small>
        </span>
        <ArrowRight />
      </button>)}
    </div>
  </div>
}

function Profile() {
  const { masteries, events, settings } = useLearningData()
  const stats = studyStats(events, masteries)
  const fileRef = useRef<HTMLInputElement>(null)
  const topicScores = useMemo(() => topicCatalog.map((item) => {
    const topic = item.id
    const ids = scenes.filter((scene) => scene.topic === topic).flatMap((scene) => scene.expressions)
    const records = masteries.filter((item) => ids.includes(item.expressionId))
    return { topic, score: records.length ? Math.round(records.reduce((sum, item) => sum + item.score, 0) / records.length) : 0 }
  }), [masteries])
  const download = async () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([await exportData()], { type: 'application/json' }))
    link.download = `contextflow-${nowIso().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  const upload = async (file?: File) => { if (file) { await importData(await file.text()); location.reload() } }
  return <div className="page">
    <div className="today-head"><div><p className="kicker">进度</p><h1>我的学习</h1></div><span className="streak"><Settings size={14} />本地</span></div>
    <section className="metrics">
      <div><span><Clock3 />分钟</span><strong>{stats.minutes}</strong></div>
      <div><span><BookOpen />场景</span><strong>{stats.completed}</strong></div>
      <div><span><Check />正确</span><strong>{stats.accuracy}%</strong></div>
      <div><span><Flame />连续</span><strong>{stats.streak}</strong></div>
    </section>
    <div className="profile-grid">
      <section className="panel"><div className="panel-title"><h3>主题掌握</h3><Target /></div>{topicScores.map(({ topic, score }) => <div className="topic-progress" key={topic}><span><b>{topic}</b><b>{score}%</b></span><i><em style={{ width: `${score}%` }} /></i></div>)}</section>
      <section className="panel"><div className="panel-title"><h3>每日目标</h3><Clock3 /></div><div className="goal-options">{[10, 15, 20, 30].map((value) => <button className={settings.dailyGoal === value ? 'active' : ''} key={value} onClick={() => db.settings.put({ ...settings, id: 'me', dailyGoal: value })}>{value}<small>分钟</small></button>)}</div></section>
      <section className="panel data-panel"><div className="data-copy"><h3>数据在这台设备上</h3><p>可导出备份，或导入到另一台设备。</p></div><div className="data-actions"><button onClick={download}><Download />导出</button><button onClick={() => fileRef.current?.click()}><Upload />导入</button><button className="danger" onClick={() => confirm('确定清空全部学习记录？此操作无法撤销。') && clearData()}><Trash2 />清空</button><input ref={fileRef} hidden type="file" accept=".json" onChange={(event) => upload(event.target.files?.[0])} /></div></section>
    </div>
  </div>
}

export default function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>
}
