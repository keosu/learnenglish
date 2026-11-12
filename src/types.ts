export type Topic = 'AI 前沿' | '软件开发' | '发布运维' | '数据实验' | '产品协作' | '技术沟通'
export type Difficulty = '进阶' | '挑战'

export interface Expression {
  id: string
  phrase: string
  meaning: string
  note: string
  example: string
  relations: string[]
}

export interface Exercise {
  id: string
  type: 'choice' | 'cloze' | 'order'
  prompt: string
  sentence: string
  focus: string
  options: string[]
  answer: string
  explanation: string
}

export interface Scene {
  id: string
  title: string
  subtitle: string
  topic: Topic
  difficulty: Difficulty
  duration: number
  icon: string
  context: string
  dialogue: { speaker: string; role: string; text: string }[]
  expressions: string[]
  exercises: Exercise[]
}

export interface LearningEvent {
  id?: number
  sceneId: string
  expressionId?: string
  kind: 'answer' | 'complete' | 'review'
  correct?: boolean
  confidence?: number
  duration?: number
  createdAt: string
}

export interface Mastery {
  expressionId: string
  score: number
  stability: number
  dueAt: string
  reviews: number
  lapses: number
}

export interface UserSettings {
  dailyGoal: number
  interests: Topic[]
  joinedAt: string
}
