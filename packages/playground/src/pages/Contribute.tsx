import { ArrowUpRight, BookOpen, Code2, GitPullRequest } from 'lucide-react';
import { t } from '../i18n/index.js';
import { GITHUB } from '../lib/constants.js';
import LessonCreator from '../features/contribute/LessonCreator.js';
export default function Contribute(){return <><header className="page-header"><span className="eyebrow">{t.contribute.kicker}</span><h1>{t.contribute.title}</h1><p>{t.contribute.subtitle}</p></header><div className="contribution-steps">{[BookOpen,Code2,GitPullRequest].map((Icon,i)=><div key={i}><span className="step-index">0{i+1}</span><Icon size={20}/><p>{t.contribute.steps[i]}</p></div>)}</div><a className="text-link" href={`${GITHUB}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">{t.contribute.guide}<ArrowUpRight size={15}/></a><LessonCreator/></>;}
