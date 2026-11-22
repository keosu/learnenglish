const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

export const speechSupported = Boolean(synth)

const PREFERRED = [/natural/i, /neural/i, /online/i, /google us english/i, /samantha/i, /aria/i, /jenny/i, /guy/i, /daniel/i]

export function englishVoices() {
  const voices = (synth?.getVoices() ?? []).filter((voice) => voice.lang.toLowerCase().startsWith('en'))
  const score = (voice: SpeechSynthesisVoice) => {
    const hit = PREFERRED.findIndex((pattern) => pattern.test(voice.name))
    return (hit < 0 ? 50 : hit) + (voice.lang === 'en-US' ? 0 : 5)
  }
  return voices.sort((a, b) => score(a) - score(b))
}

export function onVoicesChanged(callback: () => void) {
  synth?.addEventListener('voiceschanged', callback)
  return () => synth?.removeEventListener('voiceschanged', callback)
}

export function pickVoice(uri?: string | null) {
  const voices = englishVoices()
  return voices.find((voice) => voice.voiceURI === uri) ?? voices[0]
}

export type SpeakResult = 'end' | 'cancel' | 'error'

export function speak(text: string, options: { rate: number; voiceURI?: string | null; onWord?: (charIndex: number) => void }) {
  return new Promise<SpeakResult>((resolve) => {
    if (!synth) return resolve('error')
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(options.voiceURI)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else utterance.lang = 'en-US'
    utterance.rate = options.rate
    let settled = false
    const done = (result: SpeakResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.name === undefined) options.onWord?.(event.charIndex)
    }
    utterance.onend = () => done('end')
    utterance.onerror = (event) => done(event.error === 'interrupted' || event.error === 'canceled' ? 'cancel' : 'error')
    synth.speak(utterance)
  })
}

export function stopSpeaking() {
  synth?.cancel()
}
