import type { SourceFile, ScanResult } from '@secmentor/core/content';
import type { ScanMessage, ScanRequest } from '../../workers/protocol.js';
import { t } from '../../i18n/index.js';
export function scanInWorker(files:SourceFile[], onProgress:(done:number,total:number)=>void, signal?:AbortSignal):Promise<ScanResult> {
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('../../workers/scanner.worker.ts',import.meta.url),{type:'module'});
  const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();};
  const abort=()=>{cleanup();reject(new DOMException(t.analyzer.cancelled,'AbortError'));};
  const timer=setTimeout(()=>{cleanup();reject(new Error(t.errors.timeout));},30000);
  if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=()=>{cleanup();reject(new Error(t.analyzer.workerError));};
  worker.onmessage=(event:MessageEvent<ScanMessage>)=>{const message=event.data;if(message.type==='progress')onProgress(message.done,message.total);else if(message.type==='result'){cleanup();resolve(message.result);}else{cleanup();reject(new Error(t.analyzer.workerError));}};
  const request:ScanRequest={files};worker.postMessage(request);
 });
}
