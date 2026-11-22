import { Mic, Pause, Play, Repeat1, SkipBack, SkipForward } from 'lucide-react'
import { nextRate, usePlayer, useSettings } from '../lib/store'

export function PlayerBar({ active, onStart, big }: { active: boolean; onStart: () => void; big?: boolean }) {
  const { queue, index, playing, repeatOne, step, setRepeat } = usePlayer()
  const { rate, shadow, set } = useSettings()
  const total = active ? queue.length : 0
  const isPlaying = active && playing
  return <footer className={big ? 'player big' : 'player'}>
    <div className="player-progress"><i style={{ width: `${total ? ((index + 1) / total) * 100 : 0}%` }} /></div>
    <div className="player-row">
      <button className="pill" onClick={() => set({ rate: nextRate(rate) })} aria-label="切换语速">{rate}×</button>
      <button className="icon" onClick={() => step(-1)} disabled={!active || index === 0} aria-label="上一句"><SkipBack /></button>
      <button className="play" onClick={onStart} aria-label={isPlaying ? '暂停' : '播放'}>{isPlaying ? <Pause /> : <Play />}</button>
      <button className="icon" onClick={() => step(1)} disabled={!active || index >= total - 1} aria-label="下一句"><SkipForward /></button>
      {big
        ? <button className={repeatOne ? 'pill on' : 'pill'} onClick={() => setRepeat(!repeatOne)} aria-label="单句循环"><Repeat1 /></button>
        : <button className={shadow ? 'pill on' : 'pill'} onClick={() => set({ shadow: !shadow })} aria-label="跟读停顿"><Mic />跟读</button>}
    </div>
  </footer>
}
