import type JSZipTypes from 'jszip';
import type { SourceFile } from '@secmentor/core/content';
import { t } from '../../i18n/index.js';
export const MAX_FILE = 1048576,
  MAX_TOTAL = 20 * MAX_FILE,
  MAX_FILES = 1500;
export const supported = (path: string) =>
  /\.[cm]?[jt]sx?$/.test(path) ||
  /(?:^|\/)package\.json$/.test(path) ||
  /(?:^|\/)\.env(?:\.[^/]+)?$/.test(path);
export function safePath(path: string): string | null {
  const parts = path.replaceAll('\\', '/').split('/');
  return !path ||
    parts.some(
      (p) =>
        p === '..' || ['node_modules', '.git', 'dist', 'coverage'].includes(p),
    ) ||
    path.startsWith('/')
    ? null
    : parts.filter((p) => p && p !== '.').join('/');
}
export function validateProject(files: SourceFile[]) {
  if (
    files.length > MAX_FILES ||
    files.some((f) => new TextEncoder().encode(f.content).length > MAX_FILE) ||
    files.reduce((n, f) => n + new TextEncoder().encode(f.content).length, 0) >
      MAX_TOTAL
  )
    throw new Error(t.analyzer.limit);
  return files;
}
export async function readFiles(files: File[]): Promise<SourceFile[]> {
  if (files.length > MAX_FILES) throw new Error(t.analyzer.limit);
  let total = 0;
  const result: SourceFile[] = [];
  for (const file of files) {
    const path = safePath(file.webkitRelativePath || file.name);
    if (!path || !supported(path)) continue;
    if (
      file.size > MAX_FILE ||
      (total += file.size) > MAX_TOTAL ||
      result.length >= MAX_FILES
    )
      throw new Error(t.analyzer.limit);
    try {
      const content = new TextDecoder('utf-8', { fatal: true }).decode(
        await file.arrayBuffer(),
      );
      if (!content.includes('\0')) result.push({ path, content });
    } catch {
      throw new Error(t.errors.read);
    }
  }
  return result;
}
export function preflightZip(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let count = 0,
    total = 0;
  for (let i = 0; i + 46 <= view.byteLength; i++) {
    if (view.getUint32(i, true) !== 0x02014b50) continue;
    const flags = view.getUint16(i + 8, true),
      size = view.getUint32(i + 24, true);
    const nameLength = view.getUint16(i + 28, true),
      extraLength = view.getUint16(i + 30, true),
      commentLength = view.getUint16(i + 32, true);
    if (
      flags & 1 ||
      size === 0xffffffff ||
      size > MAX_FILE ||
      (total += size) > MAX_TOTAL ||
      ++count > MAX_FILES
    )
      throw new Error(t.analyzer.zipUnsafe);
    i += 45 + nameLength + extraLength + commentLength;
  }
  if (!count) throw new Error(t.analyzer.zipUnsafe);
}
export async function readZip(file: File): Promise<SourceFile[]> {
  try {
    return await extractZip(file);
  } catch (error) {
    if (error instanceof Error && error.message === t.analyzer.limit)
      throw error;
    throw new Error(t.analyzer.zipUnsafe);
  }
}
async function extractZip(file: File): Promise<SourceFile[]> {
  if (file.size > 10 * MAX_FILE) throw new Error(t.analyzer.limit);
  const buffer = await file.arrayBuffer();
  preflightZip(buffer);
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const result: SourceFile[] = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const original = entry.unsafeOriginalName ?? entry.name;
    const path = safePath(original);
    if (!path || !supported(path)) continue;
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let length = 0;
      // JSZip documenta este método, mas omite-o em JSZipObject no arquivo de tipos.
      const streamingEntry = entry as typeof entry & {
        internalStream(
          type: 'uint8array',
        ): JSZipTypes.JSZipStreamHelper<Uint8Array>;
      };
      const stream = streamingEntry.internalStream('uint8array');
      stream
        .on('data', (chunk) => {
          length += chunk.byteLength;
          if (length > MAX_FILE) {
            stream.pause();
            reject(new Error(t.analyzer.limit));
            return;
          }
          chunks.push(chunk);
        })
        .on('error', () => reject(new Error(t.analyzer.zipUnsafe)))
        .on('end', () => {
          const output = new Uint8Array(length);
          let offset = 0;
          for (const chunk of chunks) {
            output.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(output);
        })
        .resume();
    });
    const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!content.includes('\0')) result.push({ path, content });
  }
  return validateProject(result);
}
export async function droppedFiles(transfer: DataTransfer): Promise<File[]> {
  // O navegador protege DataTransfer ao terminar o evento; capture antes do primeiro await.
  const items = Array.from(transfer.items).map((item) => ({
    entry: item.webkitGetAsEntry?.(),
    file: item.getAsFile(),
  }));
  const fallback = Array.from(transfer.files);
  const result: File[] = [];
  async function visit(entry: FileSystemEntry) {
    if (result.length > MAX_FILES) throw new Error(t.analyzer.limit);
    if (entry.isFile) {
      const file = await new Promise<File>((yes, no) =>
        (entry as FileSystemFileEntry).file(yes, no),
      );
      Object.defineProperty(file, 'webkitRelativePath', {
        value: entry.fullPath.replace(/^\//, ''),
      });
      result.push(file);
    } else if (entry.isDirectory) {
      if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name))
        return;
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((yes, no) =>
          reader.readEntries(yes, no),
        );
        if (!batch.length) break;
        for (const child of batch) await visit(child);
      }
    }
  }
  for (const { entry, file } of items) {
    if (entry) await visit(entry);
    else if (file) result.push(file);
  }
  return result.length ? result : fallback;
}
export type Language = 'auto' | 'js' | 'ts' | 'jsx' | 'tsx' | 'json' | 'env';
export function detectLanguage(path: string): Exclude<Language, 'auto'> {
  return path.endsWith('.json')
    ? 'json'
    : /(?:^|\/)\.env/.test(path)
      ? 'env'
      : path.endsWith('.tsx')
        ? 'tsx'
        : path.endsWith('.jsx')
          ? 'jsx'
          : /\.[cm]?ts$/.test(path)
            ? 'ts'
            : 'js';
}
export function languagePath(path: string, language: Language) {
  if (language === 'auto') return path;
  const folder = path.includes('/')
    ? path.slice(0, path.lastIndexOf('/') + 1)
    : '';
  return (
    folder +
    (language === 'json'
      ? 'package.json'
      : language === 'env'
        ? '.env'
        : path
            .split('/')
            .at(-1)!
            .replace(/\.[^.]+$/, '') +
          '.' +
          language)
  );
}
