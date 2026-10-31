import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { t } from '../../i18n/index.js';
import type { Severity } from '@secmentor/core';
export function Logo() { return <svg role="img" aria-label={t.brand} width="32" height="36" viewBox="0 0 40 44"><path d="M20 2 37 8v13c0 10-17 21-17 21S3 31 3 21V8Z" fill="currentColor"/><path d="M10 15c4-1 7 0 10 2 3-2 6-3 10-2v13c-4-1-7 0-10 2-3-2-6-3-10-2z" fill="var(--bg)"/><path d="M20 18v11" stroke="currentColor" strokeWidth="1.5"/></svg>; }
export function SeverityBadge({ value }: { value: Severity }) { return <span className={`severity-badge severity-${value}`}><AlertTriangle size={13} aria-hidden="true"/>{t.severity[value]}</span>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="empty-state"><CheckCircle2 size={28} aria-hidden="true"/><h3>{title}</h3>{children && <p>{children}</p>}</div>; }
export function Loading() { return <div role="status" className="loading-state"><span className="loader"/>{t.common.loading}<div className="skeleton"/><div className="skeleton short"/></div>; }
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const dialog = ref.current!; dialog.showModal(); const cancel = (e: Event) => {e.preventDefault(); close.current();}; dialog.addEventListener('cancel',cancel); return () => {dialog.removeEventListener('cancel',cancel); dialog.close(); previous?.focus();}; }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title"><div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label={t.common.close} onClick={onClose}><X size={18}/></button></div>{children}</dialog>;
}
export function Tabs({ value, onChange, tabs }: { value: string; onChange: (value: string) => void; tabs: {id:string;label:string}[] }) { return <div className="tabs" role="tablist" aria-label={t.lesson.kicker}>{tabs.map((tab,index) => <button type="button" key={tab.id} role="tab" id={'tab-'+tab.id} aria-controls={'panel-'+value} aria-selected={value===tab.id} tabIndex={value===tab.id?0:-1} onClick={()=>onChange(tab.id)} onKeyDown={event=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;onChange(tabs[next].id);document.getElementById('tab-'+tabs[next].id)?.focus();}}}>{tab.label}</button>)}</div>; }
