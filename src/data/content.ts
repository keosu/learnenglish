import type { Expression, Scene, Topic } from '../types'
import { extraExpressions, extraScenes } from './catalog'

export const topicCatalog: { id: Topic; summary: string }[] = [
  { id: 'AI 前沿', summary: '模型会怎么错、怎么评、怎么盯' },
  { id: '软件开发', summary: '评审、接口、架构和技术债' },
  { id: '发布运维', summary: '灰度、告警和容量' },
  { id: '数据实验', summary: '指标、样本和实验结论' },
  { id: '产品协作', summary: '优先级、范围和验收' },
  { id: '技术沟通', summary: '进度、解释、事故和复盘' },
]

export const expressions: Expression[] = [
  { id: 'hallucinate', phrase: 'hallucinate', meaning: '（模型）产生看似合理但错误的信息', note: 'AI 语境中的正式动词；名词为 hallucination', example: 'The model may hallucinate citations when it lacks context.', relations: ['grounded', 'edge-case'] },
  { id: 'grounded', phrase: 'grounded in', meaning: '以……为事实依据', note: '常用于描述有可靠数据支持的输出', example: 'Every answer must be grounded in the retrieved documents.', relations: ['hallucinate', 'trade-off'] },
  { id: 'trade-off', phrase: 'trade-off', meaning: '权衡；取舍', note: '常搭配 make / strike / involve', example: 'There is a trade-off between latency and answer quality.', relations: ['bottleneck', 'viable'] },
  { id: 'edge-case', phrase: 'edge case', meaning: '边缘情况；极端场景', note: '开发沟通高频名词', example: 'This test covers the edge case where the input is empty.', relations: ['reproduce', 'regression'] },
  { id: 'bottleneck', phrase: 'bottleneck', meaning: '瓶颈；限制整体性能的环节', note: '常搭配 identify / remove / become', example: 'Database writes are the main performance bottleneck.', relations: ['trade-off', 'scale'] },
  { id: 'scale', phrase: 'scale gracefully', meaning: '平稳扩展', note: 'gracefully 强调不会突然失效', example: 'The service should scale gracefully during traffic spikes.', relations: ['bottleneck', 'robust'] },
  { id: 'reproduce', phrase: 'reproduce the issue', meaning: '复现问题', note: '比 repeat the bug 更专业', example: 'I can reproduce the issue in the staging environment.', relations: ['root-cause', 'edge-case'] },
  { id: 'root-cause', phrase: 'root cause', meaning: '根本原因', note: '常搭配 identify / isolate / address', example: 'We identified a race condition as the root cause.', relations: ['reproduce', 'mitigate'] },
  { id: 'mitigate', phrase: 'mitigate the risk', meaning: '降低风险', note: 'mitigate 是降低而非完全消除', example: 'A feature flag will help us mitigate the rollout risk.', relations: ['root-cause', 'rollback'] },
  { id: 'rollback', phrase: 'roll back', meaning: '回滚到上一版本', note: '动词 roll back；名词 rollback', example: 'We should roll back if the error rate keeps rising.', relations: ['mitigate', 'regression'] },
  { id: 'regression', phrase: 'regression', meaning: '回归缺陷；已有功能再次失效', note: '常见搭配 regression test', example: 'The patch introduced a regression in the login flow.', relations: ['rollback', 'edge-case'] },
  { id: 'robust', phrase: 'robust', meaning: '健壮的；能应对异常的', note: '比 strong 更适合描述系统和方案', example: 'We need a robust fallback for network failures.', relations: ['scale', 'viable'] },
  { id: 'viable', phrase: 'viable approach', meaning: '可行的方法', note: '兼顾技术、成本与业务约束的可行', example: 'Caching is a viable approach for read-heavy traffic.', relations: ['robust', 'trade-off'] },
  { id: 'align', phrase: 'align on', meaning: '就……达成共识', note: '职场会议高频；常接 scope / priorities', example: 'Let us align on the acceptance criteria first.', relations: ['scope', 'push-back'] },
  { id: 'scope', phrase: 'out of scope', meaning: '超出当前范围', note: '反义表达 in scope', example: 'Offline editing is out of scope for this release.', relations: ['align', 'follow-up'] },
  { id: 'push-back', phrase: 'push back on', meaning: '对……提出异议', note: '礼貌但明确地挑战某项提议', example: 'I would push back on launching without monitoring.', relations: ['align', 'trade-off'] },
  { id: 'follow-up', phrase: 'follow up on', meaning: '跟进', note: '名词 follow-up；动词 follow up', example: 'I will follow up on the open questions tomorrow.', relations: ['scope', 'align'] },
  { id: 'observable', phrase: 'observable', meaning: '可观测的', note: '系统能通过日志、指标和追踪理解内部状态', example: 'The pipeline must be observable in production.', relations: ['root-cause', 'robust'] },
  { id: 'drift', phrase: 'model drift', meaning: '模型漂移', note: '数据分布变化导致模型表现下降', example: 'We monitor model drift by segment and region.', relations: ['grounded', 'observable'] },
  { id: 'backward', phrase: 'backward compatible', meaning: '向后兼容', note: '旧客户端仍能使用新接口', example: 'The API change needs to remain backward compatible.', relations: ['regression', 'deprecate'] },
  { id: 'deprecate', phrase: 'deprecate', meaning: '标记弃用', note: '不是立即删除，而是不建议继续使用', example: 'We will deprecate the endpoint before removing it.', relations: ['backward', 'scope'] },
  { id: 'actionable', phrase: 'actionable', meaning: '可执行的；能直接采取行动的', note: '常修饰 feedback / insight / alert', example: 'Code review feedback should be specific and actionable.', relations: ['nit', 'follow-up'] },
  { id: 'nit', phrase: 'nit', meaning: '非阻塞的小建议', note: '源自 nitpick，代码评审中常用', example: 'Nit: could we rename this variable for clarity?', relations: ['actionable', 'push-back'] },
  { id: 'ownership', phrase: 'take ownership', meaning: '主动承担责任', note: '强调端到端负责，不只是接任务', example: 'I will take ownership of the migration plan.', relations: ['follow-up', 'align'] },
]

const cloze = (sentence: string, phrase: string) => {
  const index = sentence.toLowerCase().indexOf(phrase.toLowerCase())
  if (index < 0) return sentence
  return `${sentence.slice(0, index)}______${sentence.slice(index + phrase.length)}`
}

const exercise = (id: string, phrase: string, meaning: string, meanings: string[], phrases: string[], sentence: string) => [
  { id: `${id}-c`, type: 'choice' as const, prompt: `这句里，“${phrase}”是什么意思？`, sentence, focus: phrase, options: [meaning, ...meanings], answer: meaning, explanation: `在这个场景里，${phrase} 表示“${meaning}”。` },
  { id: `${id}-f`, type: 'cloze' as const, prompt: '用场景里的表达补全这句', sentence: cloze(sentence, phrase), focus: phrase, options: [phrase, ...phrases], answer: phrase, explanation: `${phrase} 放进这句最自然。` },
]

export const scenes: Scene[] = [
  { id: 'ai-hallucination', title: '解释模型幻觉', subtitle: '向产品经理说明 RAG 的边界', topic: 'AI 前沿', difficulty: '进阶', duration: 8, icon: '✦', context: '企业知识库助手上线后仍会编来源。产品经理觉得已经接了检索，就不该再出错。你要说明检索解决不了什么，以及团队准备牺牲什么来换可靠。', dialogue: [
    { speaker: 'Maya', role: 'Product Manager', text: 'Why does the assistant still make up sources after we added retrieval?' },
    { speaker: 'You', role: 'ML Engineer', text: 'Retrieval helps, but the model can still hallucinate when the evidence is weak or contradictory.' },
    { speaker: 'Maya', role: 'Product Manager', text: 'The documents are right there. Why would it ignore them?' },
    { speaker: 'You', role: 'ML Engineer', text: 'Sometimes the passages disagree, or they only answer half the question. The model then fills the gap with something that sounds specific.' },
    { speaker: 'Maya', role: 'Product Manager', text: 'How do we make the output more trustworthy?' },
    { speaker: 'You', role: 'ML Engineer', text: 'We should require answers to be grounded in retrieved passages and expose uncertainty. There is a trade-off between coverage and precision.' },
    { speaker: 'Maya', role: 'Product Manager', text: 'If we only answer when the evidence is strong, users will see more refusals.' },
    { speaker: 'You', role: 'ML Engineer', text: 'That is the trade-off. I would rather refuse than let it hallucinate a source a customer might forward.' },
  ], expressions: ['hallucinate', 'grounded', 'trade-off'], exercises: exercise('ai1', 'grounded in', '以……为事实依据', ['快速生成', '完全替代'], ['hallucinate', 'trade-off'], 'We should require answers to be grounded in retrieved passages and expose uncertainty.') },
  { id: 'code-review', title: '进行代码评审', subtitle: '给出清晰、可执行的反馈', topic: '软件开发', difficulty: '进阶', duration: 7, icon: '</>', context: '你在评审一项结账缓存。主路径是对的，但缓存一挂，请求会直接失败。你要把必须改的问题和顺手一提的小建议分开。', dialogue: [
    { speaker: 'You', role: 'Reviewer', text: 'This works for the common path, but have we covered the edge case where the cache is unavailable?' },
    { speaker: 'Leo', role: 'Developer', text: 'I assumed the cache is always up. It has been stable in staging.' },
    { speaker: 'You', role: 'Reviewer', text: 'Staging does not drop connections. In production the cache will fail, and checkout should not die with it.' },
    { speaker: 'Leo', role: 'Developer', text: 'Not yet. I can add a fallback and a regression test.' },
    { speaker: 'You', role: 'Reviewer', text: 'Please do. The fallback should read from the database, and the regression test should force the cache to fail.' },
    { speaker: 'Leo', role: 'Developer', text: 'If that test is red, we will know the fallback broke, not just the happy path.' },
    { speaker: 'You', role: 'Reviewer', text: 'Exactly. One nit: the method name could be clearer. The rest looks robust.' },
    { speaker: 'Leo', role: 'Developer', text: 'I will rename it in the same change. The fallback and the regression test come first.' },
  ], expressions: ['edge-case', 'regression', 'robust', 'nit'], exercises: exercise('dev1', 'edge case', '边缘情况；极端场景', ['主要流程', '版本计划'], ['regression', 'robust'], 'This works for the common path, but have we covered the edge case where the cache is unavailable?') },
  { id: 'incident', title: '汇报线上事故', subtitle: '复现、定位并降低影响', topic: '技术沟通', difficulty: '挑战', duration: 10, icon: '!', context: '支付错误率在发布后二十分钟升高。事故频道里有人已经在猜原因。你要先给能复现的事实，再决定要不要回滚。', dialogue: [
    { speaker: 'Nora', role: 'Incident Lead', text: 'Payments are failing. What do we actually know, not what we guess?' },
    { speaker: 'You', role: 'On-call Engineer', text: 'We can reproduce the issue under high concurrency. A database lock appears to be the root cause.' },
    { speaker: 'Nora', role: 'Incident Lead', text: 'Appears to be, or is?' },
    { speaker: 'You', role: 'On-call Engineer', text: 'The lock waits spiked in the same minute as the errors. I can reproduce the issue on staging with the same load, so I am confident in that root cause.' },
    { speaker: 'Nora', role: 'Incident Lead', text: 'What can we do to mitigate the risk now?' },
    { speaker: 'You', role: 'On-call Engineer', text: 'We can roll back the latest release, then validate the fix in staging.' },
    { speaker: 'Nora', role: 'Incident Lead', text: 'Rolling back drops the new fee logic. Finance will notice before morning.' },
    { speaker: 'You', role: 'On-call Engineer', text: 'We mitigate the risk first. The fee logic can ship again after the lock is gone. Leaving payments down is worse.' },
  ], expressions: ['reproduce', 'root-cause', 'mitigate', 'rollback'], exercises: exercise('ops1', 'root cause', '根本原因', ['临时现象', '发布窗口'], ['roll back', 'mitigate the risk'], 'A database lock appears to be the root cause.') },
  { id: 'api-design', title: '讨论 API 设计', subtitle: '平衡演进速度与兼容性', topic: '软件开发', difficulty: '挑战', duration: 9, icon: '{}', context: '核心接口要改返回结构。旧版 App 还会跑几个月，销售还想顺便加一个批量接口。你要保住旧客户端，并把范围卡住。', dialogue: [
    { speaker: 'Sam', role: 'Tech Lead', text: 'Can we replace the response shape in v2?' },
    { speaker: 'You', role: 'API Owner', text: 'Yes, but it should remain backward compatible during migration.' },
    { speaker: 'Sam', role: 'Tech Lead', text: 'For how long? Mobile is still shipping the old client.' },
    { speaker: 'You', role: 'API Owner', text: 'Until that client is gone. If we break the old shape now, those users cannot check out.' },
    { speaker: 'Sam', role: 'Tech Lead', text: 'Then let us deprecate the old fields first and publish a timeline.' },
    { speaker: 'You', role: 'API Owner', text: 'I will deprecate them in the changelog and keep them working for two releases.' },
    { speaker: 'Sam', role: 'Tech Lead', text: 'Sales also wants the batch endpoint in this change.' },
    { speaker: 'You', role: 'API Owner', text: 'That is out of scope. We finish the compatible migration before we add a new endpoint.' },
  ], expressions: ['backward', 'deprecate', 'scope'], exercises: exercise('api1', 'backward compatible', '向后兼容', ['双向同步', '自动扩容'], ['deprecate', 'out of scope'], 'Yes, but it should remain backward compatible during migration.') },
  { id: 'architecture', title: '评估技术方案', subtitle: '讨论性能瓶颈与取舍', topic: '软件开发', difficulty: '挑战', duration: 9, icon: '◇', context: '大促流量大约是现在的十倍。有人提议给读请求加缓存，但你看到先垮的会是写路径。你要比较方案，并把代价说清楚。', dialogue: [
    { speaker: 'Ari', role: 'Architect', text: 'The write path is likely to become our bottleneck.' },
    { speaker: 'You', role: 'Engineer', text: 'Agreed. At ten times the traffic, one database cannot take every write as it arrives.' },
    { speaker: 'Ari', role: 'Architect', text: 'Could we cache the reads and leave writes alone?' },
    { speaker: 'You', role: 'Engineer', text: 'That saves the read path, not this one. Async batching is a viable approach, though it adds latency.' },
    { speaker: 'Ari', role: 'Architect', text: 'Users will wait longer before they see a confirmation.' },
    { speaker: 'You', role: 'Engineer', text: 'A few hundred milliseconds. That trade-off is acceptable if the service can scale gracefully.' },
    { speaker: 'Ari', role: 'Architect', text: 'And if the queue itself backs up?' },
    { speaker: 'You', role: 'Engineer', text: 'We shed new writes instead of falling over. Scaling gracefully means the slow path stays up, not that every request stays instant.' },
  ], expressions: ['bottleneck', 'viable', 'trade-off', 'scale'], exercises: exercise('arch1', 'viable approach', '可行的方法', ['唯一方案', '临时故障'], ['bottleneck', 'trade-off'], 'Async batching is a viable approach, though it adds latency.') },
  { id: 'planning', title: '澄清项目范围', subtitle: '在跨团队会议中建立共识', topic: '产品协作', difficulty: '进阶', duration: 7, icon: '◎', context: '两个团队对首版理解不一样。销售已经对外提过导出功能，工程这边的排期里没有它。你要先把上线标准对齐，再处理这个越界的承诺。', dialogue: [
    { speaker: 'You', role: 'Engineering Lead', text: 'Before estimating, can we align on the launch criteria?' },
    { speaker: 'Iris', role: 'Product Lead', text: 'Sure. Is data export included?' },
    { speaker: 'You', role: 'Engineering Lead', text: 'I would push back on that for v1. It is currently out of scope, but I can follow up with an estimate.' },
    { speaker: 'Iris', role: 'Product Lead', text: 'Sales already told two customers that export ships with this release.' },
    { speaker: 'You', role: 'Engineering Lead', text: 'Then we should not pretend it is free. If we pull it in, search and permissions both slip.' },
    { speaker: 'Iris', role: 'Product Lead', text: 'Can it be a fast follow the week after launch?' },
    { speaker: 'You', role: 'Engineering Lead', text: 'Yes. I will follow up on Monday with a separate estimate, and v1 stays inside the criteria we align on today.' },
    { speaker: 'Iris', role: 'Product Lead', text: 'I will tell sales that export is out of scope for the launch, with a date to revisit.' },
  ], expressions: ['align', 'push-back', 'scope', 'follow-up'], exercises: exercise('pm1', 'align on', '就……达成共识', ['延迟处理', '取消会议'], ['push back on', 'out of scope'], 'Before estimating, can we align on the launch criteria?') },
  { id: 'ml-monitoring', title: '设计模型监控', subtitle: '让线上 AI 系统可观测', topic: 'AI 前沿', difficulty: '挑战', duration: 10, icon: '⌁', context: '模型上线三个月，总指标还好看，但一个地区的准确率在掉。你要说明为什么平均值会骗人，以及告警响了之后人能做什么。', dialogue: [
    { speaker: 'Rui', role: 'Data Scientist', text: 'The aggregate metric looks stable, but one region has significant model drift.' },
    { speaker: 'You', role: 'ML Platform Engineer', text: 'That region is only eight percent of traffic, so the global number barely moves.' },
    { speaker: 'Rui', role: 'Data Scientist', text: 'Which means we can look healthy while those users get worse answers.' },
    { speaker: 'You', role: 'ML Platform Engineer', text: 'Yes. We need segment-level dashboards so the pipeline is observable, not just the average.' },
    { speaker: 'Rui', role: 'Data Scientist', text: 'Agreed. The alerts should also be actionable, not just noisy.' },
    { speaker: 'You', role: 'ML Platform Engineer', text: 'Page us only when model drift in one segment stays high for two hours, and name the segment in the alert.' },
    { speaker: 'Rui', role: 'Data Scientist', text: 'What do we do when it fires?' },
    { speaker: 'You', role: 'ML Platform Engineer', text: 'Check the inputs first. If the features shifted, the drift is real and we retrain. If a logger broke, we fix the logger and do not retrain.' },
  ], expressions: ['drift', 'observable', 'actionable'], exercises: exercise('ml1', 'model drift', '模型漂移', ['模型压缩', '提示注入'], ['observable', 'actionable'], 'The aggregate metric looks stable, but one region has significant model drift.') },
  { id: 'retro', title: '参加项目复盘', subtitle: '承担责任并推动改进', topic: '技术沟通', difficulty: '进阶', duration: 7, icon: '↻', context: '发布晚了两周。复盘会上很容易停在“沟通不够”。你要说出具体漏了什么，并接下一个能检查的动作。', dialogue: [
    { speaker: 'Kim', role: 'Manager', text: 'The launch slipped two weeks. What actually happened?' },
    { speaker: 'You', role: 'Engineer', text: 'We found an external dependency in the last week. It had been on a slide, and nobody owned it.' },
    { speaker: 'Kim', role: 'Manager', text: 'What would you change for the next project?' },
    { speaker: 'You', role: 'Engineer', text: 'I will take ownership of the dependency checklist and follow up weekly.' },
    { speaker: 'Kim', role: 'Manager', text: 'Good. Please make each action item specific and actionable.' },
    { speaker: 'You', role: 'Engineer', text: 'First item: every external dependency has a name and a date before we commit to a launch.' },
    { speaker: 'Kim', role: 'Manager', text: 'And if that date slips?' },
    { speaker: 'You', role: 'Engineer', text: 'I follow up the same week, in writing, instead of discovering it at the end. That is the action, not a reminder to communicate more.' },
  ], expressions: ['ownership', 'follow-up', 'actionable'], exercises: exercise('retro1', 'take ownership', '主动承担责任', ['转交任务', '扩大范围'], ['follow up on', 'actionable'], 'I will take ownership of the dependency checklist and follow up weekly.') },
]

expressions.push(...extraExpressions)
scenes.push(...extraScenes)

export const expressionMap = Object.fromEntries(expressions.map((item) => [item.id, item]))
