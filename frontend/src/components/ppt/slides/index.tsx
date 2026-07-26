import type { ComponentType } from 'react'
import type { EngineSlide } from '../types'
import type { ThemeTokens } from '../themes'
import { CoverSlide } from './CoverSlide'
import { QuestionSlide } from './QuestionSlide'
import { QuestionCardSlide } from './QuestionCardSlide'
import { QuoteAnalysisSlide } from './QuoteAnalysisSlide'
import { ImageSceneSlide } from './ImageSceneSlide'
import { ConceptSlide } from './ConceptSlide'
import { ImageTextSlide } from './ImageTextSlide'
import { TimelineSlide } from './TimelineSlide'
import { ComparisonSlide } from './ComparisonSlide'
import { ProcessSlide } from './ProcessSlide'
import { ActivitySlide } from './ActivitySlide'
import { SummarySlide } from './SummarySlide'
import { HomeworkSlide } from './HomeworkSlide'
import { ChartSlide } from './ChartSlide'
import { QuoteSlide } from './QuoteSlide'
import { TextAnalysisSlide } from './TextAnalysisSlide'

const MAP: Record<string, ComponentType<{ slide: EngineSlide; theme: ThemeTokens }>> = {
  cover: CoverSlide,
  opening: CoverSlide,
  question: QuestionSlide,
  question_card: QuestionCardSlide,
  quote_analysis: QuoteAnalysisSlide,
  image_scene: ImageSceneSlide,
  concept: ConceptSlide,
  image_text: ImageTextSlide,
  quote: QuoteSlide,
  timeline: TimelineSlide,
  comparison: ComparisonSlide,
  process: ProcessSlide,
  activity: ActivitySlide,
  summary: SummarySlide,
  homework: HomeworkSlide,
  chart: ChartSlide,
  text_analysis: TextAnalysisSlide,
}

export function renderSlide(slide: EngineSlide, theme: ThemeTokens) {
  const Comp = MAP[slide.type] || ConceptSlide
  return <Comp slide={slide} theme={theme} />
}

export {
  CoverSlide,
  QuestionSlide,
  QuestionCardSlide,
  QuoteAnalysisSlide,
  ImageSceneSlide,
  ConceptSlide,
  ImageTextSlide,
  QuoteSlide,
  TimelineSlide,
  ComparisonSlide,
  ProcessSlide,
  ActivitySlide,
  SummarySlide,
  HomeworkSlide,
  ChartSlide,
  TextAnalysisSlide,
}
