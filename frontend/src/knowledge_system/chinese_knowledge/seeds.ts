/**
 * 按知识类型组织的教研种子（不是按课文存）
 * // ponytail: 先种子字典，向量库以后再上
 */
export const PEDAGOGY_CHUNKS = {
  文言方法: [
    {
      id: 'method-classical-translate',
      kind: 'method' as const,
      content: '文言翻译四步：落实词 → 理句式 → 直译贯通 → 核对文意',
      source: 'pedagogy' as const,
      source_label: '高考体系·翻译',
      confidence: 0.95,
    },
    {
      id: 'method-classical-words',
      kind: 'method' as const,
      content: '实词教学：语境义优先，禁止脱离原文背词典义',
      source: 'pedagogy' as const,
      source_label: '文言知识·实词教法',
      confidence: 0.95,
    },
  ],
  散文方法: [
    {
      id: 'method-prose-appreciate',
      kind: 'method' as const,
      content: '散文赏析三步：手法 → 画面/内容 → 情感/主旨',
      source: 'pedagogy' as const,
      source_label: '高考体系·阅读',
      confidence: 0.95,
    },
  ],
  公开课: [
    {
      id: 'method-open-class',
      kind: 'teaching_resource' as const,
      content: '公开课节奏：真问题导入 → 原文细读 → 证据链 → 价值思辨 → 高考迁移',
      source: 'pedagogy' as const,
      source_label: '教学方法·公开课',
      confidence: 0.95,
    },
  ],
  核心素养: [
    {
      id: 'method-literacy',
      kind: 'teaching_resource' as const,
      content: '任务群教学：语言建构、思维发展、审美鉴赏、文化传承四维落地到文本证据',
      source: 'pedagogy' as const,
      source_label: '教学方法·核心素养',
      confidence: 0.92,
    },
  ],
}

/** 常见作者速查（文学常识层，非课文全文） */
export const AUTHOR_REGISTRY: Record<
  string,
  { author: string; dynasty?: string; note: string; works: string[] }
> = {
  报任安书: {
    author: '司马迁',
    dynasty: '汉',
    note: '因李陵之祸受宫刑，发愤著《史记》',
    works: ['史记'],
  },
  报任少卿书: {
    author: '司马迁',
    dynasty: '汉',
    note: '因李陵之祸受宫刑，发愤著《史记》',
    works: ['史记'],
  },
  岳阳楼记: {
    author: '范仲淹',
    dynasty: '宋',
    note: '庆历新政受挫后作，寄托「先忧后乐」',
    works: ['范文正公集'],
  },
  师说: {
    author: '韩愈',
    dynasty: '唐',
    note: '古文运动倡导者，论从师问学',
    works: ['昌黎先生集'],
  },
  劝学: {
    author: '荀子',
    dynasty: '战国',
    note: '强调学习与积累，「青出于蓝」',
    works: ['荀子'],
  },
  出师表: {
    author: '诸葛亮',
    dynasty: '三国',
    note: '北伐前上疏后主，忠贞与治国',
    works: ['诸葛亮集'],
  },
  兰亭集序: {
    author: '王羲之',
    dynasty: '东晋',
    note: '兰亭雅集，生死感慨',
    works: ['兰亭集'],
  },
  赤壁赋: {
    author: '苏轼',
    dynasty: '宋',
    note: '黄州贬谪中作，主客问答见旷达',
    works: ['东坡全集'],
  },
  前赤壁赋: {
    author: '苏轼',
    dynasty: '宋',
    note: '黄州贬谪中作，主客问答见旷达',
    works: ['东坡全集'],
  },
  鸿门宴: {
    author: '司马迁',
    dynasty: '汉',
    note: '选自《史记·项羽本纪》',
    works: ['史记'],
  },
  荷塘月色: {
    author: '朱自清',
    dynasty: '现代',
    note: '清华园夜步，借景抒幽愤',
    works: ['朱自清全集'],
  },
  故都的秋: {
    author: '郁达夫',
    dynasty: '现代',
    note: '北国之秋的清、静、悲凉',
    works: ['闲书'],
  },
  醉翁亭记: {
    author: '欧阳修',
    dynasty: '宋',
    note: '与民同乐，太守之乐',
    works: ['欧阳文忠公集'],
  },
  桃花源记: {
    author: '陶渊明',
    dynasty: '东晋',
    note: '乌托邦叙事，寄托理想社会',
    works: ['陶渊明集'],
  },
  陋室铭: {
    author: '刘禹锡',
    dynasty: '唐',
    note: '托物言志，安贫乐道',
    works: ['刘禹锡集'],
  },
  爱莲说: {
    author: '周敦颐',
    dynasty: '宋',
    note: '花之君子，象征高洁',
    works: ['周元公集'],
  },
}
