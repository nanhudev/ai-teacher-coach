import type { ChineseUnit, LiteraryKind } from './types'

export type ParsedChineseInput = {
  raw: string
  title: string
  authorHint?: string
  unit: ChineseUnit
  kindGuess: LiteraryKind
}

const CLASSICAL_HINT =
  /说$|记$|赋$|序$|表$|论$|书$|劝学|师说|过秦|兰亭|赤壁|鸿门|项脊|陈情|出师|逍遥|寡人|孟子|庄子|诗经|楚辞|乐府|唐诗|宋词|文言/

const MODERN_HINT = /荷塘|春|背影|故都|雨巷|再别|边城|围城|呐喊|彷徨|散文|现代/

/** 从一句话解析课题（不依赖知识库） */
export function parseChineseInput(oneLiner: string): ParsedChineseInput {
  const raw = (oneLiner || '').trim()
  const compact = raw.replace(/\s+/g, '')

  let unit: ChineseUnit = '其他'
  if (/必修下|必修二|必修2/.test(compact)) unit = '必修下'
  else if (/必修上|必修一|必修1/.test(compact)) unit = '必修上'
  else if (/选择性必修|选修/.test(compact)) unit = '选择性必修'

  // 《标题》优先
  let title = ''
  const book = compact.match(/《([^》]+)》/)
  if (book) title = book[1]
  else {
    // 去掉年级学科噪声
    title = compact
      .replace(/高中|初中|小学|大学/g, '')
      .replace(/语文|文言文|现代文|散文/g, '')
      .replace(/人教版|部编版/g, '')
      .replace(/必修[上下一二三四12]|选择性必修[上下一二]?/g, '')
      .replace(/第?[一二三四五六七八九十\d]+单元/g, '')
      .replace(/公开课|精品课|备课/g, '')
      .trim()
  }

  // 作者提示：苏轼《…》 / 韩愈师说
  let authorHint: string | undefined
  const authorMatch = compact.match(
    /(韩愈|荀子|范仲淹|王勃|苏轼|苏洵|欧阳修|柳宗元|李白|杜甫|白居易|朱自清|鲁迅|郁达夫|老舍|巴金|沈从文|徐志摩|戴望舒)[《]?/,
  )
  if (authorMatch) authorHint = authorMatch[1]

  if (!title) title = '未命名课文'

  let kindGuess: LiteraryKind = 'classical'
  if (MODERN_HINT.test(title + compact)) kindGuess = 'modern_prose'
  else if (CLASSICAL_HINT.test(title + compact)) kindGuess = 'classical'
  else if (/诗|词|曲/.test(title)) kindGuess = 'poetry'
  else if (/记|传|宴/.test(title)) kindGuess = 'narrative'
  else if (/说|论|序|表/.test(title)) kindGuess = 'classical'

  return { raw, title, authorHint, unit, kindGuess }
}

export function slugifyTitle(title: string) {
  return title
    .replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '')
    .slice(0, 24) || 'untitled'
}
