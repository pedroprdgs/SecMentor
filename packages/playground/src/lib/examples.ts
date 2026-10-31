import expressCode from '../../../../examples/express/app.js?raw';
import reactCode from '../../../../examples/react/App.jsx?raw';
import expressManifest from '../../../../examples/express/package.json?raw';
import { lessons } from './content.js';
import { t } from '../i18n/index.js';
import type { SourceFile } from '@secmentor/core/content';
export interface Example { id:string; title:string; files:SourceFile[] }
export const projectExample:Example={id:'project',title:t.analyzer.exampleProject,files:[{path:'express/app.js',content:expressCode},{path:'express/package.json',content:expressManifest},{path:'react/App.jsx',content:reactCode}]};
export const examples:Example[]=[projectExample,...lessons.map(l=>({id:l.id,title:l.titulo,files:[{path:l.id==='SM005'?'.env':l.id==='SM011'?'package.json':`${l.id}.ts`,content:l.exemplo_vulneravel}]}))];
