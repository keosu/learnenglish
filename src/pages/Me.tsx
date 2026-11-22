import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Maximize, Monitor, Moon, Smartphone, Sun, Trash2, Volume2 } from 'lucide-react'
import { clearAll, db, localDay, streak } from '../lib/db'
import { loadIndex, useAsync } from '../lib/news'
import { chooseTheme, isIOS, isStandalone, promptInstall, useFullscreen, useInstall, useThemeChoice } from '../lib/pwa'
import { englishVoices, onVoicesChanged, speak, speechSupported } from '../lib/speech'
import { RATES, useSettings } from '../lib/store'

export default function Me() {
  const listens = useLiveQuery(() => db.listens.toArray(), []) ?? []
  const favorites = useLiveQuery(() => db.favorites.count(), []) ?? 0
  const index = useAsync(loadIndex, [])
  const settings = useSettings()
  const theme = useThemeChoice((state) => state.choice)
  const install = useInstall((state) => state.event)
  const fullscreen = useFullscreen()
  const [voices, setVoices] = useState(englishVoices)
  useEffect(() => onVoicesChanged(() => setVoices(englishVoices())), [])

  const today = localDay()
  const todayCount = new Set(listens.filter((item) => item.day === today).map((item) => item.key)).size
  const total = new Set(listens.map((item) => item.key)).size
  const days = streak(new Set(listens.map((item) => item.day)))
  const updated = index.data?.updatedAt ? new Date(index.data.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  return <div className="page me">
    <div className="page-head"><div><p className="eyebrow">Profile</p><h1>我的</h1></div></div>
    <div className="scroll me-scroll">
      <section className="stats">
        <div><strong>{todayCount}</strong><span>今日听句</span></div>
        <div><strong>{days}</strong><span>连续天数</span></div>
        <div><strong>{total}</strong><span>累计句子</span></div>
        <div><strong>{favorites}</strong><span>收藏</span></div>
      </section>

      <section className="group">
        <h2>朗读</h2>
        {!speechSupported && <p className="hint">这个浏览器不支持语音朗读，换 Chrome、Edge 或 Safari 试试。</p>}
        <label className="row"><span>声音</span>
          <select value={settings.voiceURI ?? ''} onChange={(event) => settings.set({ voiceURI: event.target.value || null })}>
            <option value="">自动选择</option>
            {voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name.replace(/^Microsoft /, '')} · {voice.lang}</option>)}
          </select>
          <button className="icon" onClick={() => speak('Here is your daily briefing on artificial intelligence and world news.', { rate: settings.rate, voiceURI: settings.voiceURI })} aria-label="试听"><Volume2 /></button>
        </label>
        <div className="row"><span>语速</span>
          <div className="segmented small">{RATES.map((rate) => <button key={rate} className={settings.rate === rate ? 'on' : ''} onClick={() => settings.set({ rate })}>{rate}×</button>)}</div>
        </div>
        <label className="row toggle"><span>跟读停顿<small>每句读完留出同样长的时间给你复述</small></span><input type="checkbox" checked={settings.shadow} onChange={(event) => settings.set({ shadow: event.target.checked })} /></label>
        <label className="row toggle"><span>盲听<small>先只听声音，点一下再看原文</small></span><input type="checkbox" checked={settings.blind} onChange={(event) => settings.set({ blind: event.target.checked })} /></label>
        <label className="row toggle"><span>显示中文</span><input type="checkbox" checked={settings.showZh} onChange={(event) => settings.set({ showZh: event.target.checked })} /></label>
      </section>

      <section className="group">
        <h2>外观与应用</h2>
        <div className="row"><span>主题</span>
          <div className="segmented small">
            <button className={theme === 'system' ? 'on' : ''} onClick={() => chooseTheme('system')}><Monitor />自动</button>
            <button className={theme === 'light' ? 'on' : ''} onClick={() => chooseTheme('light')}><Sun />浅色</button>
            <button className={theme === 'dark' ? 'on' : ''} onClick={() => chooseTheme('dark')}><Moon />深色</button>
          </div>
        </div>
        {install && <button className="row action" onClick={promptInstall}><Download /><span>安装到桌面<small>全屏打开，不显示浏览器和系统栏</small></span></button>}
        {!install && !isStandalone() && isIOS() && <p className="row hint"><Smartphone />在 Safari 点「分享」→「添加到主屏幕」，即可全屏使用。</p>}
        {fullscreen.supported && <button className="row action" onClick={fullscreen.toggle}><Maximize /><span>{fullscreen.active ? '退出全屏' : '进入全屏'}</span></button>}
      </section>

      <section className="group">
        <h2>内容</h2>
        <p className="about">每天自动抓取 TechCrunch、The Verge、MIT Technology Review、BBC、NPR、The Guardian 等公开 RSS，由免费大模型改写成适合听读的英文播报，并配中文、重点短语、句子解析和小测。无需账号或密钥。</p>
        <p className="about muted">最近更新 {updated}{index.data ? ` · 共 ${index.data.days.length} 天` : ''}</p>
        <button className="row action danger" onClick={() => confirm('清空收听记录和收藏？') && clearAll()}><Trash2 /><span>清空本机数据</span></button>
      </section>
    </div>
  </div>
}
