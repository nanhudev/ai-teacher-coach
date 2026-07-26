import type { PptTemplateId } from './types'

export type ThemeTokens = {
  id: PptTemplateId
  bg: string
  fg: string
  muted: string
  accent: string
  accentSoft: string
  panel: string
  border: string
  titleSize: string
  bodySize: string
  radius: string
  shadow: string
  fontDisplay: string
  chip: string
  /** Gamma-like soft mesh overlay */
  mesh?: string
}

export const THEMES: Record<PptTemplateId, ThemeTokens> = {
  academic: {
    id: 'academic',
    bg: '#FAFAF8',
    fg: '#1F2937',
    muted: '#64748B',
    accent: '#0F766E',
    accentSoft: '#CCFBF1',
    panel: '#FFFFFF',
    border: 'rgba(15,23,42,0.08)',
    titleSize: 'clamp(1.75rem, 3.2vw, 2.75rem)',
    bodySize: 'clamp(1rem, 1.5vw, 1.35rem)',
    radius: '1.25rem',
    shadow: '0 20px 50px rgba(15,23,42,0.06)',
    fontDisplay: '"Noto Serif SC", "Songti SC", serif',
    chip: '#0F766E',
    mesh: 'radial-gradient(700px 320px at 85% 0%, rgba(15,118,110,0.08), transparent)',
  },
  classroom: {
    id: 'classroom',
    bg: 'linear-gradient(160deg, #FFF7ED 0%, #ECFDF5 100%)',
    fg: '#292524',
    muted: '#78716C',
    accent: '#EA580C',
    accentSoft: '#FFEDD5',
    panel: 'rgba(255,255,255,0.92)',
    border: 'rgba(234,88,12,0.12)',
    titleSize: 'clamp(1.7rem, 3vw, 2.5rem)',
    bodySize: 'clamp(1rem, 1.4vw, 1.3rem)',
    radius: '1.5rem',
    shadow: '0 16px 40px rgba(234,88,12,0.1)',
    fontDisplay: '"DM Sans", "PingFang SC", sans-serif',
    chip: '#EA580C',
    mesh: 'radial-gradient(600px 280px at 10% 0%, rgba(234,88,12,0.12), transparent)',
  },
  showcase: {
    id: 'showcase',
    bg: 'linear-gradient(145deg, #0B1220 0%, #132033 50%, #1A2740 100%)',
    fg: '#F8FAFC',
    muted: '#94A3B8',
    accent: '#F59E0B',
    accentSoft: 'rgba(245,158,11,0.15)',
    panel: 'rgba(255,255,255,0.06)',
    border: 'rgba(248,250,252,0.12)',
    titleSize: 'clamp(1.85rem, 3.4vw, 2.9rem)',
    bodySize: 'clamp(1.05rem, 1.5vw, 1.4rem)',
    radius: '1rem',
    shadow: '0 30px 80px rgba(0,0,0,0.45)',
    fontDisplay: '"Noto Serif SC", "Songti SC", serif',
    chip: '#F59E0B',
    mesh: 'radial-gradient(700px 360px at 80% 20%, rgba(245,158,11,0.18), transparent)',
  },
  gamma: {
    id: 'gamma',
    bg: 'linear-gradient(145deg, #F8FAFC 0%, #EEF2FF 45%, #E0F2FE 100%)',
    fg: '#0F172A',
    muted: '#64748B',
    accent: '#0284C7',
    accentSoft: 'rgba(14,165,233,0.12)',
    panel: 'rgba(255,255,255,0.78)',
    border: 'rgba(15,23,42,0.06)',
    titleSize: 'clamp(1.8rem, 3.3vw, 2.85rem)',
    bodySize: 'clamp(1.05rem, 1.5vw, 1.35rem)',
    radius: '1.75rem',
    shadow: '0 24px 60px rgba(2,132,199,0.12)',
    fontDisplay: '"DM Sans", "PingFang SC", sans-serif',
    chip: '#0284C7',
    mesh: 'radial-gradient(800px 400px at 90% 10%, rgba(56,189,248,0.25), transparent), radial-gradient(600px 300px at 10% 90%, rgba(99,102,241,0.12), transparent)',
  },
  noir: {
    id: 'noir',
    bg: '#0A0A0A',
    fg: '#FAFAFA',
    muted: '#A3A3A3',
    accent: '#F5F5F5',
    accentSoft: 'rgba(255,255,255,0.08)',
    panel: '#171717',
    border: 'rgba(255,255,255,0.1)',
    titleSize: 'clamp(1.9rem, 3.5vw, 3rem)',
    bodySize: 'clamp(1.05rem, 1.5vw, 1.35rem)',
    radius: '0.5rem',
    shadow: '0 30px 80px rgba(0,0,0,0.6)',
    fontDisplay: '"Noto Serif SC", "Songti SC", serif',
    chip: '#FAFAFA',
    mesh: 'radial-gradient(900px 420px at 70% 0%, rgba(255,255,255,0.06), transparent)',
  },
  sage: {
    id: 'sage',
    /** 宣纸米白 + 墨色 + 朱砂点缀 + 竹简肌理 */
    bg: 'linear-gradient(165deg, #F6F1E4 0%, #EDE6D6 48%, #E8E0CE 100%)',
    fg: '#1C1917',
    muted: '#78716C',
    accent: '#9F1239',
    accentSoft: 'rgba(159,18,57,0.08)',
    panel: 'rgba(255,252,245,0.45)',
    border: 'rgba(28,25,23,0.12)',
    titleSize: 'clamp(1.85rem, 3.4vw, 2.9rem)',
    bodySize: 'clamp(1.05rem, 1.5vw, 1.35rem)',
    radius: '0.15rem',
    shadow: '0 12px 40px rgba(28,25,23,0.06)',
    fontDisplay: '"Noto Serif SC", "Songti SC", "STSong", serif',
    chip: '#9F1239',
    mesh: 'radial-gradient(900px 400px at 80% 0%, rgba(28,25,23,0.05), transparent), repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(28,25,23,0.02) 48px, rgba(28,25,23,0.02) 49px), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(28,25,23,0.012) 3px, rgba(28,25,23,0.012) 4px)',
  },
  coral: {
    id: 'coral',
    /** 保留但语文引擎不再选用；改为偏文学杂志冷青 */
    bg: 'linear-gradient(160deg, #F7FAF8 0%, #E8F0EC 100%)',
    fg: '#1F2937',
    muted: '#64748B',
    accent: '#3F6F5C',
    accentSoft: 'rgba(63,111,92,0.1)',
    panel: 'rgba(255,255,255,0.55)',
    border: 'rgba(31,41,55,0.08)',
    titleSize: 'clamp(1.7rem, 3vw, 2.6rem)',
    bodySize: 'clamp(1rem, 1.4vw, 1.3rem)',
    radius: '0.5rem',
    shadow: '0 14px 36px rgba(31,41,55,0.06)',
    fontDisplay: '"Noto Serif SC", "Songti SC", serif',
    chip: '#3F6F5C',
    mesh: 'radial-gradient(650px 300px at 90% 15%, rgba(63,111,92,0.08), transparent)',
  },
  doubao_story: {
    id: 'doubao_story', bg: 'linear-gradient(135deg,#10251E,#284B3D)', fg: '#FFF8E8', muted: '#D5C9AD', accent: '#D5AE6E', accentSoft: 'rgba(213,174,110,.16)', panel: 'rgba(8,20,16,.42)', border: 'rgba(255,248,232,.16)', titleSize: 'clamp(2rem, 4vw, 3.5rem)', bodySize: 'clamp(1.05rem, 1.5vw, 1.35rem)', radius: '0.25rem', shadow: '0 30px 90px rgba(0,0,0,.38)', fontDisplay: '"Noto Serif SC", "Songti SC", serif', chip: '#D5AE6E', mesh: 'radial-gradient(900px 430px at 85% 0%, rgba(213,174,110,.18), transparent)',
  },
  gamma_narrative: {
    id: 'gamma_narrative', bg: 'linear-gradient(135deg,#F8F5EF,#E6EEE8)', fg: '#17251F', muted: '#647067', accent: '#426B62', accentSoft: 'rgba(66,107,98,.12)', panel: 'rgba(255,255,255,.62)', border: 'rgba(23,37,31,.09)', titleSize: 'clamp(1.9rem, 3.6vw, 3rem)', bodySize: 'clamp(1.05rem, 1.5vw, 1.35rem)', radius: '0.65rem', shadow: '0 22px 60px rgba(23,37,31,.09)', fontDisplay: '"Noto Serif SC", "Songti SC", serif', chip: '#426B62', mesh: 'radial-gradient(760px 360px at 90% 5%, rgba(174,196,181,.42), transparent)',
  },
  seminar_studio: {
    id: 'seminar_studio', bg: 'linear-gradient(135deg,#0C1C2E,#173A4A)', fg: '#F2FAF7', muted: '#A6C5C0', accent: '#4DC2B6', accentSoft: 'rgba(77,194,182,.16)', panel: 'rgba(255,255,255,.07)', border: 'rgba(242,250,247,.14)', titleSize: 'clamp(1.85rem, 3.4vw, 2.9rem)', bodySize: 'clamp(1.05rem, 1.5vw, 1.35rem)', radius: '0.85rem', shadow: '0 28px 70px rgba(0,0,0,.36)', fontDisplay: '"DM Sans", "PingFang SC", sans-serif', chip: '#4DC2B6', mesh: 'radial-gradient(680px 330px at 90% 0%, rgba(77,194,182,.2), transparent)',
  },
}
