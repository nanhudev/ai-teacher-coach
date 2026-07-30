import type { SourcedChunk } from '../types'

/**
 * 权威公开语料（名句级，非全文盗版教材）
 * 置信度 0.85–0.9；进入课程前仍须 Verifier
 */
type CuratedText = {
  title: string
  author: string
  dynasty?: string
  kind: 'classical' | 'modern_prose' | 'poetry'
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
  {
    title: '项脊轩志',
    author: '归有光',
    dynasty: '明',
    kind: 'classical',
    theme: '借项脊轩的兴废写家族变迁与亲情追忆',
    lines: [
      { label: '轩中之乐', text: '借书满架，偃仰啸歌，冥然兀坐，万籁有声。' },
      { label: '祖母之语', text: '吾儿，久不见若影，何竟日默默在此，大类女郎也？' },
      { label: '物在人亡', text: '庭有枇杷树，吾妻死之年所手植也，今已亭亭如盖矣。' },
    ],
    words: [
      { word: '顾', meaning: '回头看', example: '每移案，顾视无可置者' },
      { word: '迨', meaning: '等到', example: '迨诸父异爨' },
      { word: '殆', meaning: '大概', example: '殆有神护者' },
    ],
    exam: ['借物抒情与细节描写', '项脊轩兴废和情感线索', '实词：顾、迨、殆'],
  },
  {
    title: '陈情表',
    author: '李密',
    dynasty: '西晋',
    kind: 'classical',
    theme: '以祖母病重陈述尽孝与尽忠不能两全的处境',
    lines: [
      { label: '身世', text: '既无伯叔，终鲜兄弟，门衰祚薄，晚有儿息。' },
      { label: '祖孙相依', text: '臣无祖母，无以至今日；祖母无臣，无以终余年。' },
      { label: '陈情', text: '乌鸟私情，愿乞终养。' },
    ],
    words: [
      { word: '鲜', meaning: '少，这里指没有', example: '终鲜兄弟' },
      { word: '逮', meaning: '及、至', example: '逮奉圣朝' },
      { word: '矜', meaning: '怜悯', example: '犹蒙矜育' },
    ],
    exam: ['陈情的层次与说服策略', '孝情与忠情的矛盾化解', '实词：鲜、逮、矜'],
  },
  {
    title: '阿房宫赋',
    author: '杜牧',
    dynasty: '唐',
    kind: 'classical',
    theme: '借秦亡讽谏唐统治者戒奢爱民',
    lines: [
      { label: '铺陈宫室', text: '五步一楼，十步一阁；廊腰缦回，檐牙高啄。' },
      { label: '民与秦', text: '一人之心，千万人之心也。秦爱纷奢，人亦念其家。' },
      { label: '历史警策', text: '后人哀之而不鉴之，亦使后人而复哀后人也。' },
    ],
    words: [
      { word: '缦', meaning: '萦绕、曲折', example: '廊腰缦回' },
      { word: '族', meaning: '灭族', example: '族秦者秦也' },
      { word: '鉴', meaning: '以……为鉴', example: '后人哀之而不鉴之' },
    ],
    exam: ['铺陈夸张与对偶', '由描写转议论的结构', '借古讽今'],
  },
  {
    title: '六国论',
    author: '苏洵',
    dynasty: '宋',
    kind: 'classical',
    theme: '论证六国破灭弊在赂秦并借古讽今',
    lines: [
      { label: '中心论点', text: '六国破灭，非兵不利，战不善，弊在赂秦。' },
      { label: '赂秦之害', text: '以地事秦，犹抱薪救火，薪不尽，火不灭。' },
      { label: '讽谏现实', text: '苟以天下之大，下而从六国破亡之故事，是又在六国下矣。' },
    ],
    words: [
      { word: '率', meaning: '全都、一概', example: '六国互丧，率赂秦耶' },
      { word: '厥', meaning: '其、他们的', example: '思厥先祖父' },
      { word: '故事', meaning: '旧事、先例', example: '从六国破亡之故事' },
    ],
    exam: ['分论点与论证结构', '对比、引用和比喻论证', '借古讽今'],
  },
  {
    title: '过秦论',
    author: '贾谊',
    dynasty: '西汉',
    kind: 'classical',
    theme: '铺叙秦由兴而亡，归结为仁义不施',
    lines: [
      { label: '秦之强盛', text: '于是从散约败，争割地而赂秦。秦有余力而制其弊。' },
      { label: '陈涉之弱', text: '蹑足行伍之间，而倔起阡陌之中。' },
      { label: '结论', text: '仁义不施而攻守之势异也。' },
    ],
    words: [
      { word: '却', meaning: '使……退却', example: '却匈奴七百余里' },
      { word: '序', meaning: '招致', example: '序八州而朝同列' },
      { word: '度', meaning: '比量', example: '试使山东之国与陈涉度长絜大' },
    ],
    exam: ['铺排夸张与对比', '秦兴亡的逻辑链', '结论句的论证作用'],
  },
  {
    title: '烛之武退秦师',
    author: '《左传》',
    dynasty: '先秦',
    kind: 'classical',
    theme: '烛之武以利益分析瓦解秦晋联盟',
    lines: [
      { label: '临危受命', text: '吾不能早用子，今急而求子，是寡人之过也。' },
      { label: '亡郑无益', text: '越国以鄙远，君知其难也，焉用亡郑以陪邻？' },
      { label: '存郑利秦', text: '若舍郑以为东道主，行李之往来，共其乏困，君亦无所害。' },
    ],
    words: [
      { word: '鄙', meaning: '把……当作边邑', example: '越国以鄙远' },
      { word: '陪', meaning: '增加', example: '焉用亡郑以陪邻' },
      { word: '行李', meaning: '外交使者', example: '行李之往来' },
    ],
    exam: ['游说辞的层次与对象意识', '人物形象', '古今异义与词类活用'],
  },
  {
    title: '庖丁解牛',
    author: '《庄子》',
    dynasty: '先秦',
    kind: 'classical',
    theme: '由解牛之技进入顺应规律、游刃有余之道',
    lines: [
      { label: '由技入道', text: '臣之所好者道也，进乎技矣。' },
      { label: '依乎天理', text: '依乎天理，批大郤，导大窾，因其固然。' },
      { label: '游刃有余', text: '以无厚入有间，恢恢乎其于游刃必有余地矣。' },
    ],
    words: [
      { word: '善', meaning: '赞叹词，好', example: '善哉！技盖至此乎' },
      { word: '间', meaning: '空隙', example: '以无厚入有间' },
      { word: '踌躇满志', meaning: '悠然自得、心满意足', example: '踌躇满志，善刀而藏之' },
    ],
    exam: ['寓言说理', '解牛三阶段', '技与道的关系'],
  },
  {
    title: '归去来兮辞并序',
    author: '陶渊明',
    dynasty: '东晋',
    kind: 'classical',
    theme: '辞官归田后的自我觉醒与生命选择',
    lines: [
      { label: '归隐决心', text: '悟已往之不谏，知来者之可追。' },
      { label: '归家之乐', text: '三径就荒，松菊犹存。' },
      { label: '生命态度', text: '聊乘化以归尽，乐夫天命复奚疑！' },
    ],
    words: [
      { word: '谏', meaning: '挽回、改正', example: '悟已往之不谏' },
      { word: '策', meaning: '拄着', example: '策扶老以流憩' },
      { word: '审', meaning: '深知', example: '审容膝之易安' },
    ],
    exam: ['辞赋语言与情感脉络', '归隐选择的内在原因', '实词与倒装句'],
  },
  {
    title: '屈原列传（节选）',
    author: '司马迁',
    dynasty: '西汉',
    kind: 'classical',
    theme: '以屈原遭际、作品和精神寄托司马迁的价值判断',
    lines: [
      { label: '创作缘起', text: '屈平疾王听之不聪也，谗谄之蔽明也，邪曲之害公也，方正之不容也，故忧愁幽思而作《离骚》。' },
      { label: '人格', text: '其志洁，故其称物芳；其行廉，故死而不容。' },
      { label: '评价', text: '推此志也，虽与日月争光可也。' },
    ],
    words: [
      { word: '疾', meaning: '痛心、痛恨', example: '屈平疾王听之不聪也' },
      { word: '绌', meaning: '罢免官职', example: '屈平既绌' },
      { word: '迁', meaning: '放逐', example: '顷襄王怒而迁之' },
    ],
    exam: ['传记叙议结合', '屈原人格与司马迁寄托', '实词与被动句'],
  },
  {
    title: '苏武传（节选）',
    author: '班固',
    dynasty: '东汉',
    kind: 'classical',
    theme: '通过冲突与对比塑造苏武坚贞不屈的使者形象',
    lines: [
      { label: '拒降', text: '屈节辱命，虽生，何面目以归汉！' },
      { label: '牧羊', text: '乃徙武北海上无人处，使牧羝，羝乳乃得归。' },
      { label: '持节', text: '杖汉节牧羊，卧起操持，节旄尽落。' },
    ],
    words: [
      { word: '相当', meaning: '相抵偿', example: '汉亦留之以相当' },
      { word: '幸', meaning: '希望', example: '幸蒙其赏赐' },
      { word: '膏', meaning: '使……肥沃，滋润', example: '空以身膏草野' },
    ],
    exam: ['典型环境与人物冲突', '苏武、卫律、李陵对比', '实词与词类活用'],
  },
  {
    title: '谏太宗十思疏',
    author: '魏征',
    dynasty: '唐',
    kind: 'classical',
    theme: '劝谏君主居安思危、积德义并落实十思',
    lines: [
      { label: '比喻起兴', text: '求木之长者，必固其根本；欲流之远者，必浚其泉源。' },
      { label: '核心警策', text: '居安思危，戒奢以俭，德不处其厚，情不胜其欲。' },
      { label: '理想政治', text: '文武争驰，在君无事，可以尽豫游之乐，可以养松乔之寿。' },
    ],
    words: [
      { word: '固', meaning: '使……稳固', example: '必固其根本' },
      { word: '董', meaning: '督察', example: '虽董之以严刑' },
      { word: '简', meaning: '选拔', example: '简能而任之' },
    ],
    exam: ['比喻论证与正反对比', '十思的逻辑分类', '词类活用'],
  },
  {
    title: '答司马谏议书',
    author: '王安石',
    dynasty: '北宋',
    kind: 'classical',
    theme: '逐条回应变法责难，表明不恤怨诽、坚持改革的立场',
    lines: [
      { label: '争议根源', text: '盖儒者所争，尤在于名实，名实已明，而天下之理得矣。' },
      { label: '逐条反驳', text: '至于怨诽之多，则固前知其如此也。' },
      { label: '改革立场', text: '如君实责我以在位久，未能助上大有为，以膏泽斯民，则某知罪矣。' },
    ],
    words: [
      { word: '见恕', meaning: '原谅我', example: '故今具道所以，冀君实或见恕也' },
      { word: '胥怨', meaning: '相怨、普遍怨恨', example: '至于怨诽之多' },
      { word: '膏泽', meaning: '施恩惠', example: '以膏泽斯民' },
    ],
    exam: ['驳论文的论证结构', '名实之辨', '坚定而克制的语言'],
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
