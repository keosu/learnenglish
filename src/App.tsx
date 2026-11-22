import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, Headphones, Maximize, Minimize, Moon, Newspaper, Pause, Play, Sun, UserRound, X } from 'lucide-react'
import { chooseTheme, useApplyTheme, useFullscreen, useTheme } from './lib/pwa'
import { usePlayer } from './lib/store'
import { ExplainSheet } from './components/ui'
import Today from './pages/Today'
import Story from './pages/Story'
import Listen from './pages/Listen'
import Saved from './pages/Saved'
import Me from './pages/Me'
import './App.css'

function Header() {
  const theme = useTheme()
  const fullscreen = useFullscreen()
  return <header className="top">
    <NavLink to="/" className="brand"><span className="logo" aria-hidden><i /><i /><i /><i /></span><strong>Echo</strong><small>听讯</small></NavLink>
    <div className="top-actions">
      {fullscreen.supported && <button className="icon" onClick={fullscreen.toggle} aria-label={fullscreen.active ? '退出全屏' : '全屏'}>{fullscreen.active ? <Minimize /> : <Maximize />}</button>}
      <button className="icon" onClick={() => chooseTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? '切换浅色' : '切换深色'}>{theme === 'dark' ? <Sun /> : <Moon />}</button>
    </div>
  </header>
}

function MiniPlayer() {
  const navigate = useNavigate()
  const { queue, index, playing, speakingKey, label, toggle, load } = usePlayer()
  const track = queue[index]
  if (!track || (!playing && !speakingKey)) return null
  return <div className="mini" onClick={() => navigate('/listen')}>
    <span className="mini-wave" aria-hidden><i /><i /><i /></span>
    <span className="mini-copy"><small>{label}</small><strong>{track.en}</strong></span>
    <button className="icon" onClick={(event) => { event.stopPropagation(); toggle() }} aria-label={playing ? '暂停' : '播放'}>{playing ? <Pause /> : <Play />}</button>
    <button className="icon" onClick={(event) => { event.stopPropagation(); load([], '') }} aria-label="停止"><X /></button>
  </div>
}

function Notice() {
  const { notice, dismiss } = usePlayer()
  if (!notice) return null
  return <div className="toast" role="status" onClick={dismiss}>{notice}</div>
}

function Shell() {
  useApplyTheme()
  const location = useLocation()
  const immersive = /^\/(story|listen)/.test(location.pathname)
  return <div className="app">
    {!immersive && <Header />}
    <main>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/story/:date/:id" element={<Story />} />
        <Route path="/listen" element={<Listen />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/me" element={<Me />} />
        <Route path="*" element={<Today />} />
      </Routes>
    </main>
    {!immersive && <MiniPlayer />}
    {!immersive && <nav className="tabs">
      <NavLink to="/" end><Newspaper /><span>今日</span></NavLink>
      <NavLink to="/listen"><Headphones /><span>听力</span></NavLink>
      <NavLink to="/saved"><Bookmark /><span>收藏</span></NavLink>
      <NavLink to="/me"><UserRound /><span>我的</span></NavLink>
    </nav>}
    <ExplainSheet />
    <Notice />
  </div>
}

export default function App() {
  return <HashRouter><Shell /></HashRouter>
}
