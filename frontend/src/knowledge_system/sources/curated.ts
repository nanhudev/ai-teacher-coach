import type { SourcedChunk } from '../types'

/**
 * 权威公开语料（名句级，非全文盗版教材）
 * 置信度 0.85–0.9；进入课程前仍须 Verifier
 */
type CuratedText = {
  title: string
  author: string
  dynasty?: string
  kind: 'classical' | 'modern_prose'
  theme?: string
  lines: { label: string; text: string }[]
  words?: { word: string; meaning: string; example: string }[]
  exam?: string[]
}

const CORPUS: CuratedText[] = [
  {
    title: '岳阳楼记',
    author: '范仲淹',
    dynasty: '宋',
    kind: 'classical',
    theme: '先天下之忧而忧，后天下之乐而乐',
    lines: [
      { label: '迁客心境', text: '若夫淫雨霏霏，连月不开，阴风怒号，浊浪排空。' },
      { label: '晴明之乐', text: '至若春和景明，波澜不惊，上下天光，一碧万顷。' },
      { label: '核心志向', text: '先天下之忧而忧，后天下之乐而乐。' },
    ],
    words: [
      { word: '属', meaning: '通「嘱」，嘱托', example: '属予作文以记之' },
      { word: '横无', meaning: '宽阔无边', example: '横无际涯' },
      { word: '偕', meaning: '一起', example: '宠辱偕忘' },
      { word: '微', meaning: '如果没有', example: '微斯人，吾谁与归' },
    ],
    exam: ['文言实词：属、偕、微', '迁客骚人两种心境对比', '先忧后乐的志向'],
  },
  {
    title: '师说',
    author: '韩愈',
    dynasty: '唐',
    kind: 'classical',
    theme: '师者，所以传道受业解惑也',
    lines: [
      { label: '论师', text: '师者，所以传道受业解惑也。' },
      { label: '从师', text: '是故无贵无贱，无长无少，道之所存，师之所存也。' },
      { label: '耻学', text: '士大夫之族，曰师曰弟子云者，则群聚而笑之。' },
    ],
    words: [
      { word: '所以', meaning: '用来……的', example: '所以传道受业解惑也' },
      { word: '受', meaning: '通「授」，传授', example: '受业' },
      { word: '道', meaning: '道理、儒家之道', example: '传道' },
    ],
    exam: ['通假：受', '判断句与「所以」', '从师之道'],
  },
  {
    title: '劝学',
    author: '荀子',
    dynasty: '战国',
    kind: 'classical',
    theme: '学不可以已',
    lines: [
      { label: '开篇', text: '君子曰：学不可以已。' },
      { label: '青出于蓝', text: '青，取之于蓝，而青于蓝；冰，水为之，而寒于水。' },
      { label: '积累', text: '积土成山，风雨兴焉；积水成渊，蛟龙生焉。' },
    ],
    words: [
      { word: '已', meaning: '停止', example: '学不可以已' },
      { word: '于', meaning: '比；从', example: '青于蓝；取之于蓝' },
      { word: '就', meaning: '接近', example: '金就砺则利' },
    ],
    exam: ['比喻论证', '虚词「于」', '积累与坚持'],
  },
  {
    title: '出师表',
    author: '诸葛亮',
    dynasty: '三国',
    kind: 'classical',
    theme: '亲贤臣，远小人；北定中原',
    lines: [
      {
        label: '开篇',
        text: '先帝创业未半而中道崩殂，今天下三分，益州疲弊，此诚危急存亡之秋也。',
      },
      { label: '亲贤', text: '亲贤臣，远小人，此先汉所以兴隆也。' },
      {
        label: '报效',
        text: '臣本布衣，躬耕于南阳，苟全性命于乱世，不求闻达于诸侯。',
      },
    ],
    words: [
      { word: '秋', meaning: '时候', example: '危急存亡之秋' },
      { word: '所以', meaning: '……的原因', example: '先汉所以兴隆也' },
      { word: '躬', meaning: '亲自', example: '躬耕于南阳' },
    ],
    exam: ['出师表忠贞之情', '实词：秋、躬', '对比论证'],
  },
  {
    title: '兰亭集序',
    author: '王羲之',
    dynasty: '东晋',
    kind: 'classical',
    theme: '死生亦大矣；修短随化',
    lines: [
      {
        label: '雅集',
        text: '永和九年，岁在癸丑，暮春之初，会于会稽山阴之兰亭，修禊事也。',
      },
      { label: '生死', text: '固知一死生为虚诞，齐彭殇为妄作。' },
      { label: '感慨', text: '后之视今，亦犹今之视昔。' },
    ],
    words: [
      { word: '修禊', meaning: '上巳日临水洗濯祈福', example: '修禊事也' },
      { word: '信', meaning: '实在', example: '信可乐也' },
    ],
    exam: ['兰亭集会背景', '生死观', '实词：信'],
  },
  {
    title: '醉翁亭记',
    author: '欧阳修',
    dynasty: '宋',
    kind: 'classical',
    theme: '醉翁之意不在酒，在乎山水之间也',
    lines: [
      { label: '得名', text: '醉翁之意不在酒，在乎山水之间也。' },
      { label: '与民同乐', text: '人知从太守游而乐，而不知太守之乐其乐也。' },
    ],
    words: [
      { word: '意', meaning: '情趣', example: '醉翁之意不在酒' },
      { word: '乎', meaning: '于', example: '在乎山水之间也' },
    ],
    exam: ['与民同乐', '「也」字收束', '记叙层次'],
  },
  {
    title: '桃花源记',
    author: '陶渊明',
    dynasty: '东晋',
    kind: 'classical',
    theme: '理想社会与现实之隔',
    lines: [
      { label: '发现', text: '忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。' },
      { label: '隔世', text: '问今是何世，乃不知有汉，无论魏晋。' },
    ],
    words: [
      { word: '缘', meaning: '沿着', example: '缘溪行' },
      { word: '无论', meaning: '不要说，更不必说', example: '无论魏晋' },
    ],
    exam: ['乌托邦叙事', '古今异义：无论', '记叙顺序'],
  },
  {
    title: '陋室铭',
    author: '刘禹锡',
    dynasty: '唐',
    kind: 'classical',
    theme: '斯是陋室，惟吾德馨',
    lines: [
      { label: '德馨', text: '斯是陋室，惟吾德馨。' },
      { label: '往来', text: '谈笑有鸿儒，往来无白丁。' },
    ],
    words: [
      { word: '馨', meaning: '香气，喻品德高尚', example: '惟吾德馨' },
      { word: '鸿儒', meaning: '博学的人', example: '谈笑有鸿儒' },
    ],
    exam: ['托物言志', '对偶', '实词：馨'],
  },
  {
    title: '爱莲说',
    author: '周敦颐',
    dynasty: '宋',
    kind: 'classical',
    theme: '莲，花之君子者也',
    lines: [
      { label: '君子', text: '莲，花之君子者也。' },
      { label: '不染', text: '出淤泥而不染，濯清涟而不妖。' },
    ],
    words: [
      { word: '蕃', meaning: '多', example: '可爱者甚蕃' },
      { word: '濯', meaning: '洗涤', example: '濯清涟而不妖' },
    ],
    exam: ['象征手法', '对比：菊/牡丹/莲', '判断句'],
  },
]

export function searchCurated(topic: string): SourcedChunk[] {
  const s = topic.replace(/\s+/g, '')
  const hit = CORPUS.find((t) => s.includes(t.title) || t.title.includes(s.slice(0, 4)))
  if (!hit) return []

  const chunks: SourcedChunk[] = []
  hit.lines.forEach((line, i) => {
    chunks.push({
      id: `curated-${hit.title}-line-${i}`,
      kind: 'original_text',
      content: line.text,
      meta: { label: line.label, author: hit.author, title: hit.title },
      source: 'curated',
      source_label: `权威公开资料·《${hit.title}》名句`,
      confidence: 0.88,
      topic: hit.title,
    })
  })
  ;(hit.words || []).forEach((w, i) => {
    chunks.push({
      id: `curated-${hit.title}-word-${i}`,
      kind: 'annotation',
      content: `${w.word}：${w.meaning}`,
      meta: { word: w.word, meaning: w.meaning, example: w.example },
      source: 'curated',
      source_label: `权威公开资料·《${hit.title}》注释`,
      confidence: 0.86,
      topic: hit.title,
    })
  })
  chunks.push({
    id: `curated-${hit.title}-bg`,
    kind: 'author_background',
    content: `${hit.author}${hit.dynasty ? ` · ${hit.dynasty}` : ''}｜${hit.theme || ''}`,
    meta: { author: hit.author, dynasty: hit.dynasty || '', theme: hit.theme || '' },
    source: 'curated',
    source_label: '权威公开资料·文学常识',
    confidence: 0.9,
    topic: hit.title,
  })
  ;(hit.exam || []).forEach((e, i) => {
    chunks.push({
      id: `curated-${hit.title}-exam-${i}`,
      kind: 'exam_point',
      content: e,
      source: 'curated',
      source_label: '权威公开资料·考点',
      confidence: 0.84,
      topic: hit.title,
    })
  })
  return chunks
}

export function listCuratedTitles() {
  return CORPUS.map((t) => t.title)
}
