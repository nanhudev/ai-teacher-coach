import type { DemoSession } from '../types/demo'
import { exportLessonDocx } from '../lesson-engine/exportLessonDocx'
import { exportPptxClient } from '../ppt-engine/v3/exportPptx'
import type { PptDesign } from '../components/ppt/types'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import { saveAs } from 'file-saver'

function p(text: string, bold = false) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold, font: '宋体', size: 21 })],
  })
}

function h(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 160 },
    children: [new TextRun({ text, bold: true, font: '黑体', size: 28 })],
  })
}

function homeworkBuckets(session: DemoSession) {
  const fromLesson = session.lesson.homework
  if (fromLesson) {
    return {
      basic: fromLesson.basic,
      advanced: fromLesson.advanced,
      open: fromLesson.extension,
    }
  }
  const ex = session.blueprint?.exercises
  return {
    basic: ex?.basic || [],
    advanced: ex?.advanced || [],
    open: ex?.open || [],
  }
}

/** 作业 DOCX（基础 / 提高 / 开放） */
export async function exportHomeworkDocx(session: DemoSession) {
  const { basic, advanced, open } = homeworkBuckets(session)

  const children = [
    h(`${session.meta.label} · 分层作业`),
    p(`学科：${session.meta.subject}　年级：${session.meta.grade}`),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: '说明：基础题全体必做；提高题学有余力选做；开放题用于迁移与表达。',
          font: '宋体',
          size: 18,
          color: '666666',
        }),
      ],
    }),
    h('一、基础题'),
    ...basic.map((t, i) => p(`${i + 1}. ${t}`)),
    h('二、提高题'),
    ...advanced.map((t, i) => p(`${i + 1}. ${t}`)),
    h('三、开放题'),
    ...open.map((t, i) => p(`${i + 1}. ${t}`)),
    new Paragraph({
      spacing: { before: 400 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: 'AI Teacher Coach · Exercise Agent',
          font: '宋体',
          size: 16,
          color: '888888',
          italics: true,
        }),
      ],
    }),
  ]

  const doc = new Document({
    creator: 'AI Teacher Coach',
    title: `${session.meta.label}-作业`,
    sections: [{ children }],
  })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${safe(session.meta.label)}-作业.docx`)
}

function safe(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_')
}

/** 完整课程包：教案 + 课件 + 作业（连续下载） */
export async function exportCoursePack(session: DemoSession) {
  const label = safe(session.meta.label)
  await exportLessonDocx(session, `${label}-教案.docx`)
  await new Promise((r) => setTimeout(r, 400))
  await exportPptxClient(session.ppt as unknown as PptDesign, `${label}-精品课件.pptx`)
  await new Promise((r) => setTimeout(r, 400))
  await exportHomeworkDocx(session)
}
