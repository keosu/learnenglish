export type Category = 'ai' | 'world'

export interface Focus {
  text: string
  meaning: string
  note?: string
}

export interface Sentence {
  en: string
  zh: string
  tip?: string
  focus: Focus[]
}

export interface QuizItem {
  q: string
  options: string[]
  answer: number
  explainZh?: string
}

export interface Article {
  id: string
  category: Category
  source: string
  url: string
  publishedAt: string | null
  title: string
  titleZh: string
  summaryZh: string
  level: string
  sentences: Sentence[]
  quiz: QuizItem[]
}

export interface Day {
  date: string
  generatedAt: string
  models: string[]
  articles: Article[]
}

export interface DaySummary {
  date: string
  count: number
  ai: number
  world: number
  sentences: number
  headline: string
}

export interface NewsIndex {
  latest: string
  updatedAt: string
  days: DaySummary[]
}

export interface Track {
  key: string
  date: string
  articleId: string
  articleTitle: string
  category: Category
  index: number
  en: string
  zh: string
  tip?: string
  focus: Focus[]
}

export interface Favorite extends Track {
  id: string
  kind: 'sentence' | 'phrase'
  phrase?: string
  meaning?: string
  note?: string
  createdAt: string
}

export interface Listen {
  id?: number
  key: string
  day: string
  articleId: string
  at: string
}
