import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { t } from '../i18n/index.js';
import { lessonFor } from '../lib/content.js';
import LessonPanel from '../features/lessons/LessonPanel.js';
import { Empty } from '../components/ui/index.js';
export default function Lesson(){const{id=''}=useParams();const lesson=lessonFor(id);useEffect(()=>{if(lesson){document.title=`${lesson.titulo} · ${t.brand}`;document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);document.querySelector('meta[name="description"]')?.setAttribute('content',lesson.resumo);}},[lesson]);return <><Link className="text-link" to="/licoes"><ArrowLeft size={14}/>{t.nav.lessons}</Link>{lesson?<LessonPanel key={id} id={id}/>:<Empty title={t.lesson.unknown}><Link to="/licoes">{t.lesson.choose}</Link></Empty>}</>;}
