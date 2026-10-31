import type { SourceFile, ScanResult } from '@secmentor/core/content';
export interface ScanRequest { files: SourceFile[] }
export type ScanMessage = { type:'progress'; done:number; total:number } | { type:'result'; result:ScanResult } | { type:'error' };
