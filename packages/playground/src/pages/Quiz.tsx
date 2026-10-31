import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { lessons } from '../lib/content.js';
import { t } from '../i18n/index.js';
import { useProgress } from '../features/progress/store.js';
import QuizRunner from '../features/quiz/QuizRunner.js';
import { questionsFor, shuffle, type Question } from '../features/quiz/model.js';
import { Empty } from '../components/ui/index.js';
export default function Quiz(){const[params]=useSearchParams();const preselected=lessons.find(l=>l.id===params.get('licao'));const[mode,setMode]=useState(preselected?'lesson':'quick');const[id,setId]=useState(preselected?.id??lessons[0].id);const[session,setSession]=useState<Question[]|undefined>(()=>preselected?questionsFor([preselected]):undefined);const[run,setRun]=useState(0);const wrong=useProgress(s=>s.wrong);
 function start(){const pool=mode==='lesson'?lessons.filter(l=>l.id===id):mode==='review'?lessons.filter(l=>wrong.includes(l.id)):lessons;setSession(mode==='quick'?shuffle(questionsFor(pool)).slice(0,5):shuffle(questionsFor(pool)));setRun(n=>n+1);}
 return <><header className="page-header"><span className="eyebrow">{t.quiz.kicker}</span><h1>{t.quiz.title}</h1><p>{t.quiz.subtitle}</p></header><section className="quiz-selector panel no-print"><div className="quiz-modes" role="group" aria-label={t.quiz.modes}>{[{id:'quick',text:t.quiz.quick},{id:'lesson',text:t.quiz.byLesson},{id:'review',text:t.quiz.review}].map(item=><button className={`button ${mode===item.id?'primary':''}`} key={item.id} aria-pressed={mode===item.id} onClick={()=>{setMode(item.id);setSession(undefined);}}>{item.text}</button>)}</div><div className="button-row">{mode==='lesson'&&<label>{t.quiz.chooseLesson}<select value={id} onChange={e=>{setId(e.target.value);setSession(undefined);}}>{lessons.map(l=><option key={l.id} value={l.id}>{l.id} · {l.titulo}</option>)}</select></label>}<button className="button primary" onClick={start}>{t.quiz.start}</button></div></section>{mode==='review'&&!wrong.length?<Empty title={t.quiz.noErrors}/>:session?.length?<QuizRunner key={run+session.map(q=>q.id).join()} questions={session} onRestart={start}/>:null}</>;
}
