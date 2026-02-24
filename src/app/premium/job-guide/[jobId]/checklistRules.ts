/**
 * Kaynak odaklı checklist – lib'den re-export (tek kaynak).
 */
export {
  buildChecklist,
  calcProgress,
  getProgressFromSevenQuestions,
  getMissingTop,
  answersFromJson,
  type Answers,
  type ChecklistItem,
  type ChecklistModule,
  type JobForChecklist,
} from "@/lib/checklistRules";
