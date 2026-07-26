import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  convertInchesToTwip,
} from 'docx'
import { saveAs } from 'file-saver'
import type { DemoSession, LessonPlan } from '../types/demo'

function p(text: string, opts?: { bold?: boolean; size?: number; color?: string }) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        size: opts?.size ?? 21, // 10.5pt
        font: '宋体',
        color: opts?.color,
      }),
    ],
  })
}

function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, size: 32, font: '黑体' })],
  })
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '1F6B55', space: 4 },
    },
    children: [new TextRun({ text, bold: true, size: 24, font: '黑体', color: '1F6B55' })],
  })
}

function bullet(text: string) {
  return new Paragraph({
    spacing: { after: 80, line: 360 },
    indent: { left: convertInchesToTwip(0.25) },
    children: [new TextRun({ text: `• ${text}`, size: 21, font: '宋体' })],
  })
}

function cell(text: string, width: number, opts?: { bold?: boolean; shade?: string }) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: opts?.shade ? { fill: opts.shade } : undefined,
    children: [
      new Paragraph({
        spacing: { after: 60, before: 60 },
        children: [
          new TextRun({
            text,
            bold: opts?.bold,
            size: 20,
            font: '宋体',
          }),
        ],
      }),
    ],
  })
}

/**
 * 中学教案 Word 模板（教务常见七要素 + 分层作业 + 考情链接）
 * 参考：中小学教案编写常见规范（基本信息/目标/重难点/过程/板书/作业/反思）
 */
export async function exportLessonDocx(session: DemoSession, filenameHint?: string) {
  const lesson = session.lesson
  const meta = session.meta
  const o3 = lesson.objectives_3d
  const hw = lesson.homework
  const exam = lesson.exam_link

  const children: (Paragraph | Table)[] = [
    h1(lesson.title || `《${meta.label}》教案`),
    p(
      `学科：${lesson.subject || meta.subject}　　年级：${lesson.grade || meta.grade}　　课型：${lesson.lesson_type || '新授课'}　　课时：${lesson.periods || '1课时'}`,
      { size: 20 },
    ),
    p(`课题：${meta.label}`, { size: 20 }),
    p('（本教案可直接用于备课检查 / 公开课文本；课后请填写教学反思）', {
      size: 18,
      color: '666666',
    }),

    h2('一、教材分析'),
    p(lesson.textbook_analysis || `本节围绕「${meta.label}」组织教学，突出核心概念与关键能力。`),

    h2('二、学情分析'),
    p(
      lesson.student_analysis ||
        `学生已有一定相关基础，但对抽象概念易混淆，需支架与分层练习。`,
    ),

    h2('三、教学目标'),
  ]

  if (o3) {
    children.push(p('（一）知识与技能', { bold: true }))
    o3.knowledge.forEach((t) => children.push(bullet(t)))
    children.push(p('（二）过程与方法', { bold: true }))
    o3.process.forEach((t) => children.push(bullet(t)))
    children.push(p('（三）情感态度与价值观', { bold: true }))
    o3.values.forEach((t) => children.push(bullet(t)))
  } else {
    lesson.objectives.forEach((t) => children.push(bullet(t)))
  }

  children.push(h2('四、教学重难点'))
  children.push(p('重点：', { bold: true }))
  lesson.key_points.forEach((t) => children.push(bullet(t)))
  children.push(p('难点：', { bold: true }))
  lesson.difficulty_points.forEach((t) => children.push(bullet(t)))

  if (lesson.materials?.length || lesson.methods?.length) {
    children.push(h2('五、教学准备与方法'))
    if (lesson.materials?.length) {
      children.push(p(`教学准备：${lesson.materials.join('、')}`))
    }
    if (lesson.methods?.length) {
      children.push(p(`主要方法：${lesson.methods.join('、')}`))
    }
  }

  children.push(h2('六、教学过程'))

  // 过程表：环节 | 教师活动 | 学生活动 | 设计意图 | 时间
  const col = [1400, 2200, 2200, 1800, 900]
  children.push(
    new Table({
      width: { size: 8500, type: WidthType.DXA },
      columnWidths: col,
      rows: [
        new TableRow({
          children: [
            cell('环节', col[0], { bold: true, shade: 'E8F0EB' }),
            cell('教师活动', col[1], { bold: true, shade: 'E8F0EB' }),
            cell('学生活动', col[2], { bold: true, shade: 'E8F0EB' }),
            cell('设计意图', col[3], { bold: true, shade: 'E8F0EB' }),
            cell('时间', col[4], { bold: true, shade: 'E8F0EB' }),
          ],
        }),
        ...lesson.process.map(
          (row) =>
            new TableRow({
              children: [
                cell(row.stage, col[0], { bold: true }),
                cell(row.teacher_action, col[1]),
                cell(row.student_action, col[2]),
                cell(row.intent || row.theory || '', col[3]),
                cell(row.time, col[4]),
              ],
            }),
        ),
      ],
    }),
  )

  children.push(h2('七、板书设计'))
  ;(lesson.board_design || '（课堂生成）').split('\n').forEach((line) => children.push(p(line)))

  children.push(h2('八、作业布置（分层）'))
  if (hw) {
    children.push(p('【基础作业】（全体必做）', { bold: true }))
    hw.basic.forEach((t) => children.push(bullet(t)))
    children.push(p('【提升作业】（选做 / 学有余力）', { bold: true }))
    hw.advanced.forEach((t) => children.push(bullet(t)))
    children.push(p('【拓展作业】（迁移 / 开放）', { bold: true }))
    hw.extension.forEach((t) => children.push(bullet(t)))
  } else {
    lesson.assessment.forEach((t) => children.push(bullet(t)))
  }

  if (exam) {
    children.push(h2(`九、${exam.exam_type}衔接提示`))
    children.push(p(`相关考点：${exam.points.join('、')}`))
    children.push(p(`常见题型：${exam.question_types.join('、')}`))
    children.push(p('答题提醒：', { bold: true }))
    exam.tips.forEach((t) => children.push(bullet(t)))
  }

  children.push(h2(exam ? '十、教学反思' : '九、教学反思'))
  children.push(p(lesson.reflection_prompt || '（课后填写）'))
  children.push(p(' '))
  children.push(p('目标达成：________________________________'))
  children.push(p('问题与改进：______________________________'))
  children.push(p('学生证据（出口票摘录）：____________________'))

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: 'AI Teacher Coach · 中学标准教案模板',
          size: 16,
          font: '宋体',
          color: '888888',
          italics: true,
        }),
      ],
    }),
  )

  const doc = new Document({
    creator: 'AI Teacher Coach',
    title: lesson.title,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const name =
    (filenameHint || lesson.title || '教案').replace(/[\\/:*?"<>|]/g, '_') +
    (filenameHint?.endsWith('.docx') ? '' : '.docx')
  saveAs(blob, name.endsWith('.docx') ? name : `${name}.docx`)
}

export type { LessonPlan }
