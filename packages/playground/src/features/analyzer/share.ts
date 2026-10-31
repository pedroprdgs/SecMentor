import { z } from 'zod';
import { safePath } from './files.js';
import { t } from '../../i18n/index.js';
const sharedSchema = z.object({
  path: z.string().min(1).max(240),
  content: z.string(),
});
const LIMIT = 8192;
export async function encodeShared(path: string, content: string) {
  const payload = new TextEncoder().encode(JSON.stringify({ path, content }));
  if (payload.length > LIMIT) throw new Error(t.analyzer.shareTooLarge);
  const stream = new Blob([payload])
    .stream()
    .pipeThrough(new CompressionStream('deflate'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}
export async function decodeShared(value: string) {
  if (value.length > 16000 || !/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error(t.analyzer.shareBad);
  try {
    const bytes = Uint8Array.from(
      atob(value.replaceAll('-', '+').replaceAll('_', '/')),
      (c) => c.charCodeAt(0),
    );
    const reader = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('deflate'))
      .getReader();
    let total = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > LIMIT) {
        await reader.cancel();
        throw new Error(t.analyzer.shareBad);
      }
      chunks.push(value);
    }
    const payload = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      payload.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed = sharedSchema.parse(
      JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(payload)),
    );
    if (!safePath(parsed.path)) throw new Error(t.analyzer.shareBad);
    return parsed;
  } catch {
    throw new Error(t.analyzer.shareBad);
  }
}
