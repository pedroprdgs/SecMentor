/// <reference lib="webworker" />
import { scanSource } from '@secmentor/core';
import type { ScanRequest, ScanMessage } from './protocol.js';
import type { ScanResult } from '@secmentor/core/content';
const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.onmessage = async (event: MessageEvent<ScanRequest>) => {
  const send = (message: ScanMessage) => scope.postMessage(message);
  const start = performance.now();
  const result: ScanResult = {
    findings: [],
    warnings: [],
    filesScanned: 0,
    durationMs: 0,
  };
  try {
    const { files } = event.data;
    for (let i = 0; i < files.length; i++) {
      const scanned = scanSource({
        ...files[i],
        envIgnored: files[i].path.split('/').at(-1)?.startsWith('.env')
          ? false
          : undefined,
      });
      result.findings.push(...scanned.findings);
      result.warnings.push(...scanned.warnings);
      result.filesScanned++;
      if (i % 20 === 0 || i === files.length - 1) {
        send({ type: 'progress', done: i + 1, total: files.length });
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    result.durationMs = performance.now() - start;
    send({ type: 'result', result });
  } catch {
    send({ type: 'error' });
  }
};
