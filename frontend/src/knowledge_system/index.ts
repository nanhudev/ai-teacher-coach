/**
 * 高中语文知识系统 V6
 * 教材精校 + 权威语料 + 教师上传 + 教研审核（RAG）
 * 联网只进审核，不直通生成
 */
export { searchKnowledge, searchKnowledgeSync } from './search_service'
export { runKnowledgeRetrieval } from './agents/retrieval'
export { runTextUnderstanding } from './agents/text_understanding'
export { runKnowledgeVerifier } from './agents/verifier'
export { retrieveAndBuildPack } from './agents/assemble'
export { saveTeacherUpload, listTeacherUploads } from './sources/teacher_upload'
export { listCuratedTitles } from './sources/curated'
export { TEXTBOOK_PACKS } from './sources/textbook'
export type {
  SourcedChunk,
  RetrievalBundle,
  TextUnderstanding,
  VerificationResult,
  KnowledgeSourceKind,
} from './types'
