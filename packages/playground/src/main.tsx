import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, Code2, BookOpen, ChartNoAxesColumnIncreasing, ArrowUpRight, ArrowRight, Play, Sun, Moon, Check, ChevronRight, CircleHelp, Terminal, LockKeyhole, RotateCcw, AlertTriangle, CheckCircle2, Copy, Github, X, PanelLeftClose } from 'lucide-react';
import { scanSource, lessons, type Finding, type Lesson, type ScanResult } from '@secmentor/core';
import './style.css';

const demo = `import express from "express";
import { db } from "./database.js";

const app = express();
const apiKey = "sk_demo_apenas_um_exemplo";

app.get("/usuarios", (req, res) => {
  const id = req.query.id;
  db.query("SELECT * FROM users WHERE id = " + id);
  res.cookie("session", "demo", {
    httpOnly: false,
    secure: false,
  });
});`;
const examples = [
  { name: 'API Express', file: 'servidor.ts', code: demo },
  { name: 'Componente React', file: 'Perfil.tsx', code: `export function Perfil({ bio }: { bio: string }) {\n  return <article dangerouslySetInnerHTML={{ __html: bio }} />;\n}` },
  ...lessons.filter(l => l.id !== 'SM005').map(l => ({ name: `${l.id} · ${l.titulo}`, file: l.id === 'SM011' ? 'package.json' : 'exemplo.ts', code: l.exemplo_vulneravel })),
];
const initial = scanSource({ path: examples[0].file, content: demo });
type View = 'playground' | 'lessons' | 'progress';
function readProgress(): string[] { try { const value: unknown = JSON.parse(localStorage.getItem('secmentor-completed') ?? '[]'); return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []; } catch { return []; } }
function App() {
  const [view, setView] = useState<View>('playground');
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('secmentor-theme') !== 'light'; } catch { return true; } });
  const [code, setCode] = useState(demo);
  const [example, setExample] = useState(0);
  const [result, setResult] = useState<ScanResult>(initial);
  const [scannedCode, setScannedCode] = useState(demo);
  const [selected, setSelected] = useState<Finding | undefined>(initial.findings[0]);
  const [lesson, setLesson] = useState<Lesson>(lessons[0]);
  const [tab, setTab] = useState<'understand' | 'fix' | 'quiz'>('understand');
  const [filter, setFilter] = useState('todas');
  const [scroll, setScroll] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [completed, setCompleted] = useState(readProgress);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const stale = code !== scannedCode;
  const visible = result.findings.filter(f => filter === 'todas' || f.severity === filter);
  function choose(f: Finding) { setSelected(f); setLesson(lessons.find(l => l.id === f.lessonId)!); setAnswer(null); setTab('understand'); }
  function analyze(next = code, index = example) {
    setBusy(true);
    window.setTimeout(() => {
      const found = scanSource({ path: examples[index].file, content: next });
      setResult(found); setScannedCode(next); setSelected(found.findings[0]);
      if (found.findings[0]) { setLesson(lessons.find(l => l.id === found.findings[0].lessonId)!); setTab('understand'); setAnswer(null); }
      setBusy(false); setNotice(`${found.findings.length} achados. ${found.warnings.length ? 'Confira o aviso de sintaxe.' : 'Análise concluída localmente.'}`);
    }, 40);
  }
  function load(index: number) { setExample(index); setCode(examples[index].code); setScroll(0); analyze(examples[index].code, index); }
  function toggleTheme() { setDark(!dark); try { localStorage.setItem('secmentor-theme', dark ? 'light' : 'dark'); } catch { /* Tema ainda funciona sem armazenamento. */ } }
  function quizAnswer(index: number) {
    setAnswer(index);
    if (index === lesson.quiz[0].resposta && !completed.includes(lesson.id)) {
      const next = [...completed, lesson.id]; setCompleted(next);
      try { localStorage.setItem('secmentor-completed', JSON.stringify(next)); } catch { setNotice('Progresso desta sessão salvo apenas em memória.'); }
    }
  }
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); setNotice('Exemplo copiado.'); } catch { setNotice('Não foi possível copiar. Selecione o exemplo manualmente.'); } }
  function openLesson(l: Lesson) { setLesson(l); setAnswer(null); setTab('understand'); setView('lessons'); }
  return <div className={dark ? 'app dark' : 'app'}>
    <a className="skip" href="#main">Pular para conteúdo</a>
    <aside className={`sidebar ${sidebar ? 'is-open' : ''}`}>
      <a href="#" className="brand" onClick={e => { e.preventDefault(); setView('playground'); }}><span className="brand-mark"><ShieldCheck size={24}/></span>secmentor<span className="brand-dot">.</span></a>
      <div className="workspace-label">SEU ESPAÇO DE APRENDIZADO</div>
      <nav aria-label="Principal">
        <button className={view === 'playground' ? 'nav active' : 'nav'} onClick={() => { setView('playground'); setSidebar(false); }}><Code2 size={18}/>Playground<span className="nav-tag">local</span></button>
        <button className={view === 'lessons' ? 'nav active' : 'nav'} onClick={() => { setView('lessons'); setSidebar(false); }}><BookOpen size={18}/>Biblioteca de lições<span className="nav-count">12</span></button>
        <button className={view === 'progress' ? 'nav active' : 'nav'} onClick={() => { setView('progress'); setSidebar(false); }}><ChartNoAxesColumnIncreasing size={18}/>Meu progresso</button>
      </nav>
      <div className="sidebar-course"><span className="eyebrow">APRENDA NA PRÁTICA</span><div className="course-symbol"><Terminal size={25}/><span>01 — 12</span></div><h3>Pequenas mudanças.<br/>Código mais seguro.</h3><p>Entenda o risco. Aprenda a corrigir. Leve para o próximo projeto.</p><button onClick={() => openLesson(lessons[0])}>Explorar as lições <ArrowUpRight size={16}/></button></div>
      <div className="sidebar-bottom"><div className="offline-note"><span className="status-dot"/><div>Seu código fica aqui.<small>Sem nuvem. Sem cadastro.</small></div><LockKeyhole size={15}/></div><div className="version"><span>OPEN SOURCE · v0.1.0</span><a href="https://github.com/topics/secmentor" target="_blank" rel="noreferrer" aria-label="SecMentor no GitHub"><Github size={17}/></a></div></div>
    </aside>
    <div className="shell"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setSidebar(!sidebar)} aria-label="Alternar menu"><PanelLeftClose size={20}/></button><span>Seu workspace</span><ChevronRight size={14}/><strong>{view === 'playground' ? 'Playground' : view === 'lessons' ? 'Biblioteca de lições' : 'Meu progresso'}</strong></div><div className="top-actions"><span className="local-status"><span className="status-dot"/>100% local</span><span className="language">PT-BR</span><button className="icon-button" onClick={toggleTheme} aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></div></header>
    <main id="main">
      <section className="intro"><div><div className="eyebrow intro-kicker"><span className="little-line"/> SEGURANÇA SE APRENDE</div><h1>{view === 'playground' ? <>Seu código tem uma lição<br/>para ensinar<span>.</span></> : view === 'lessons' ? <>Segurança, sem<br/>barreira de idioma<span>.</span></> : <>Cada descoberta,<br/>um passo à frente<span>.</span></>}</h1><p>{view === 'playground' ? 'Encontre falhas. Entenda o porquê. Aprenda a escrever código mais seguro.' : view === 'lessons' ? '12 lições práticas, em português e no seu ritmo. Comece pela curiosidade.' : 'O conhecimento fica com você. Seu progresso fica neste navegador.'}</p></div><div className="intro-stamp"><ShieldCheck size={30} strokeWidth={1.3}/><span>FEITO PARA APRENDER<br/><strong>não só apontar erros.</strong></span></div></section>
      {view === 'playground' && <>
        <div className="workspace-heading"><div><h2>Laboratório de código</h2><span>Cole seu código ou experimente um exemplo</span></div><span className="no-ai"><LockKeyhole size={13}/> Nenhum código é enviado</span></div>
        <section className="lab" aria-label="Laboratório de código"><div className="editor-pane"><div className="pane-toolbar"><span className="file-label"><Code2 size={16}/>{examples[example].file}</span><span className="file-lang">{examples[example].file.endsWith('.json') ? 'JSON' : examples[example].file.endsWith('.tsx') ? 'TSX' : 'TypeScript'}</span></div><div className="example-bar"><label htmlFor="example">Carregar código vulnerável</label><select id="example" value={example} onChange={e => load(Number(e.target.value))}>{examples.map((e,i) => <option value={i} key={e.name}>{e.name}</option>)}</select></div>
          <div className="code-editor"><div className="gutter" aria-hidden="true"><div style={{ transform: `translateY(-${scroll}px)` }}>{code.split('\n').map((_,i) => <div className={result.findings.some(f => f.line === i+1) && !stale ? 'line issue-line' : 'line'} key={i}>{i+1}</div>)}</div></div><div className="code-input"><div aria-hidden="true" className="line-highlights">{!stale && result.findings.map((f,i) => <div key={i} className={selected === f ? 'line-highlight selected-line' : 'line-highlight'} style={{ top: 20 + (f.line - 1) * 25 - scroll }}/>)}</div><textarea ref={editor} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" aria-label="Código para análise" value={code} onChange={e => setCode(e.target.value)} onScroll={e => setScroll(e.currentTarget.scrollTop)}/></div></div>
          <div className="editor-footer"><span><span className="status-dot"/>{stale ? 'Alterações não analisadas' : 'Análise por regras + AST'}</span><button className="icon-button" aria-label="Restaurar exemplo" onClick={() => load(example)}><RotateCcw size={15}/></button><button className="primary-button" onClick={() => analyze()} disabled={busy}><Play size={14} fill="currentColor"/>{busy ? 'Analisando…' : 'Analisar código'}<span>↵</span></button></div>
        </div><div className="results-pane"><div className="pane-toolbar"><span className="results-title">O que seu código ensina <span className="count-badge">{result.findings.length}</span></span><span className="scan-time">{Math.max(1, Math.round(result.durationMs))} ms</span></div><div className="filters" aria-label="Filtrar achados">{['todas','critica','alta','media'].map(f => <button key={f} className={filter === f ? 'filter active' : 'filter'} onClick={() => setFilter(f)}>{f === 'todas' ? 'Todos' : f === 'critica' ? 'Críticos' : f === 'alta' ? 'Altos' : 'Médios'} {f === 'todas' ? result.findings.length : result.findings.filter(item => item.severity === f).length}</button>)}</div>
          {stale ? <div className="empty"><Code2 size={28}/><h3>Seu código mudou.</h3><p>Analise novamente para atualizar as lições.</p><button onClick={() => analyze()}>Analisar alterações <ArrowRight size={15}/></button></div> : <div className="findings" aria-label="Achados">{visible.map((f,i) => <button key={`${f.ruleId}-${f.line}-${i}`} className={selected === f ? 'finding selected' : 'finding'} onClick={() => choose(f)}><span className={`severity-icon ${f.severity}`}><AlertTriangle size={15}/></span><span className="finding-info"><strong>{f.title}</strong><span>{f.ruleId} <b>·</b> Linha {f.line} <b>·</b> <span className={`severity-text ${f.severity}`}>{f.severity === 'critica' ? 'Crítica' : f.severity === 'alta' ? 'Alta' : 'Média'}</span></span></span><ChevronRight size={15}/></button>)}{!visible.length && <div className="empty"><CheckCircle2 size={28}/><h3>{result.findings.length ? 'Nenhum achado neste filtro.' : 'Nenhum achado pelas regras.'}</h3><p>Continue revisando: nenhum scanner garante segurança completa.</p></div>}</div>}
          {result.warnings.map(w => <div role="alert" className="warning" key={w.message}>{w.message}</div>)}
          <div className="learning-note"><BookOpen size={17}/><p>Um achado é um ponto de partida.<br/><strong>Selecione para entender e aprender.</strong></p></div>
        </div></section>
        {selected && !stale && <LessonPanel lesson={lesson} tab={tab} setTab={setTab} answer={answer} onAnswer={quizAnswer} copy={copy}/>}
        <div className="bottom-strip"><div><span className="step-number">01</span><span>Detecte com regras</span><ArrowRight size={15}/><span className="step-number">02</span><span>Entenda em português</span><ArrowRight size={15}/><span className="step-number">03</span><span>Leve o aprendizado</span></div><span>Seu próximo commit pode ser melhor.</span></div>
      </>}
      {view === 'lessons' && <><div className="lesson-grid">{lessons.map(l => <button className={lesson.id === l.id ? 'lesson-card current' : 'lesson-card'} key={l.id} onClick={() => { setLesson(l); setAnswer(null); setTab('understand'); }}><span className="eyebrow">{l.id} <span className={`severity-text ${l.severidade}`}>{l.severidade}</span></span><h2>{l.titulo}</h2><p>{l.resumo}</p><span className="card-link">{completed.includes(l.id) ? 'Quiz concluído' : 'Abrir lição'} <ArrowUpRight size={17}/></span></button>)}</div><LessonPanel lesson={lesson} tab={tab} setTab={setTab} answer={answer} onAnswer={quizAnswer} copy={copy}/></>}
      {view === 'progress' && <section className="progress-view"><div className="progress-card"><span className="eyebrow">SEU CAMINHO</span><h2>{completed.length}<span>/12 lições praticadas</span></h2><progress value={completed.length} max={12}/><p>Nível {1+Math.floor(completed.length/4)} · {completed.length === 12 ? 'Conquista: Guardião do código' : completed.length ? 'Conquista: Primeiro passo' : 'Seu primeiro passo começa com uma pergunta.'}</p><button className="primary-button" onClick={() => openLesson(lessons.find(l => !completed.includes(l.id)) ?? lessons[0])}>Continuar aprendendo <ArrowRight size={16}/></button></div><div className="progress-list">{lessons.map(l => <button key={l.id} onClick={() => { openLesson(l); setTab('quiz'); }}>{completed.includes(l.id) ? <CheckCircle2 size={19}/> : <CircleHelp size={19}/>}<span>{l.id} · {l.titulo}</span><ArrowUpRight size={16}/></button>)}</div></section>}
      <footer className="page-footer"><span><ShieldCheck size={15}/> SecMentor · segurança se aprende.</span><span>Offline por padrão. Aberto por princípio. <span className="footer-license">MIT</span></span></footer>
    </main></div><div className="sr-only" role="status" aria-live="polite">{notice}</div>{notice && <div className="toast"><Check size={15}/>{notice}<button className="icon-button" aria-label="Fechar aviso" onClick={() => setNotice('')}><X size={15}/></button></div>}
  </div>;
}
function LessonPanel({ lesson, tab, setTab, answer, onAnswer, copy }: { lesson: Lesson; tab: 'understand'|'fix'|'quiz'; setTab: (tab:'understand'|'fix'|'quiz') => void; answer: number|null; onAnswer:(index:number)=>void; copy:(text:string)=>void }) {
  const question = lesson.quiz[0];
  return <section className="lesson-panel" aria-label={`Lição ${lesson.titulo}`}><div className="lesson-top"><div className="lesson-title"><span className="lesson-icon"><BookOpen size={18}/></span><div><span className="eyebrow">VAMOS ENTENDER · {lesson.id}</span><h2>{lesson.titulo}</h2></div></div><div className="lesson-tabs" role="tablist" aria-label="Conteúdo da lição">{[['understand','Entenda o risco'],['fix','Antes e depois'],['quiz','Teste o que aprendeu']].map(([id,text]) => <button key={id} role="tab" id={`tab-${id}`} aria-selected={tab===id} aria-controls="lesson-content" onClick={() => setTab(id as typeof tab)}>{text}{id==='quiz' && <ArrowUpRight size={13}/>}</button>)}</div></div><div id="lesson-content" role="tabpanel" aria-labelledby={`tab-${tab}`}>
    {tab==='understand' && <div className="lesson-body"><div className="explanation"><span className="eyebrow">POR QUE ISSO IMPORTA</span><p>{lesson.por_que_e_perigoso}</p><button className="text-button" onClick={() => setTab('fix')}>Aprender a corrigir <ArrowRight size={16}/></button></div><div className="safe-demo"><span className="eyebrow"><Terminal size={13}/> EXPERIMENTO INOFENSIVO</span><p>{lesson.como_explorar_inofensivo}</p><details><summary>Erros comuns de iniciante</summary><ul>{lesson.erros_comuns_de_iniciante.map(e=><li key={e}>{e}</li>)}</ul></details></div></div>}
    {tab==='fix' && <><div className="comparison"><div><div className="comparison-label"><span>ANTES · VULNERÁVEL</span></div><pre><code>{lesson.exemplo_vulneravel}</code></pre></div><div><div className="comparison-label corrected"><span>DEPOIS · EXEMPLO DIDÁTICO</span><button className="icon-button" aria-label="Copiar exemplo corrigido" onClick={() => copy(lesson.exemplo_corrigido)}><Copy size={14}/></button></div><pre><code>{lesson.exemplo_corrigido}</code></pre></div></div><div className="correction-checklist"><p>Adapte ao contexto do seu projeto e teste o comportamento.</p>{lesson.checklist_de_correcao.map(c=><span key={c}><Check size={14}/>{c}</span>)}</div></>}
    {tab==='quiz' && <div className="quiz"><div><span className="eyebrow">CONHECIMENTO QUE FICA</span><h3>{question.pergunta}</h3><p>Escolha uma resposta. Errar também faz parte.</p></div><div className="quiz-options">{question.opcoes.map((option,i)=><button className={answer===i ? (i===question.resposta ? 'answer correct' : 'answer incorrect') : 'answer'} disabled={answer!==null} key={option} onClick={()=>onAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{option}{answer===i && (i===question.resposta ? <Check size={17}/> : <X size={17}/>)}</button>)}{answer!==null && <div role="status" className="quiz-feedback"><strong>{answer===question.resposta ? 'Boa! Você entendeu.' : 'Ainda não. Vamos aprender.'}</strong><p>{question.explicacao}</p><button className="text-button" onClick={()=>setTab('understand')}>Rever a lição <ArrowRight size={14}/></button></div>}</div></div>}
    </div><div className="lesson-reference"><span>Aprendizado com referências, não com adivinhação.</span>{lesson.referencias.map(url=><a href={url} key={url} target="_blank" rel="noreferrer">{new URL(url).hostname==='cwe.mitre.org' ? 'Referência CWE' : 'Saiba mais'} <ArrowUpRight size={12}/></a>)}</div></section>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
