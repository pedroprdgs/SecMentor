import type { Lesson } from '@secmentor/core/content';
export interface Question {id:string;lessonId:string;lessonTitle:string;question:Lesson['quiz'][number]}
export function shuffle<T>(items:T[],random:()=>number=Math.random):T[]{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
export function questionsFor(lessons:Lesson[]):Question[]{return lessons.flatMap(lesson=>lesson.quiz.map((question,i)=>({id:`${lesson.id}:${i}`,lessonId:lesson.id,lessonTitle:lesson.titulo,question})));}
