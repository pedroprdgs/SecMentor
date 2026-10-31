import type { Finding } from '@secmentor/core/content';
import { t } from '../../i18n/index.js';
export function applySafeFix(content: string, finding: Finding) {
  const fix = finding.fix;
  if (
    !fix ||
    fix.start < 0 ||
    fix.end > content.length ||
    fix.start >= fix.end ||
    content.slice(fix.start, fix.end) !== 'false' ||
    fix.replacement !== 'true'
  )
    throw new Error(t.lesson.fixConflict);
  return content.slice(0, fix.start) + fix.replacement + content.slice(fix.end);
}
