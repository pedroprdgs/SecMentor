import { lessons as bundled, lessonSchema, type Lesson } from '@secmentor/core/content';
import { t } from '../i18n/index.js';
export const lessons: Lesson[] = bundled.map(lesson => { const parsed = lessonSchema.safeParse(lesson); if (!parsed.success) throw new Error(t.errors.invalidLesson); return parsed.data; });
export const ruleCount = new Set(lessons.map(l=>l.id)).size;
export function lessonFor(id:string) { return lessons.find(l=>l.id===id); }
export function topic(id:string): 'web'|'data'|'execution' { return ['SM002','SM009','SM010'].includes(id)?'web':['SM001','SM003','SM004','SM005','SM011','SM012'].includes(id)?'data':'execution'; }
