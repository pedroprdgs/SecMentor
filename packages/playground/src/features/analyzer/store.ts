import { create } from 'zustand';
import type { SourceFile, ScanResult, Finding } from '@secmentor/core/content';
import { validateProject, type Language } from './files.js';
import { t } from '../../i18n/index.js';
interface AnalyzerState {
  files: SourceFile[];
  active: string;
  language: Language;
  result?: ScanResult;
  selected?: Finding;
  revision: number;
  analyzedRevision: number;
  replace: (files: SourceFile[]) => void;
  merge: (files: SourceFile[]) => void;
  edit: (path: string, content: string) => void;
  select: (finding: Finding) => void;
  setActive: (path: string) => void;
  setLanguage: (language: Language) => void;
  complete: (result: ScanResult, revision: number) => void;
  clear: () => void;
}
const initialFile = { path: t.analyzer.filename, content: '' };
export const useAnalyzer = create<AnalyzerState>((set, get) => ({
  files: [initialFile],
  active: initialFile.path,
  language: 'auto',
  revision: 0,
  analyzedRevision: -1,
  replace: (files) => {
    validateProject(files);
    set((s) => ({
      files,
      active: files[0]?.path ?? '',
      language: 'auto',
      result: undefined,
      selected: undefined,
      revision: s.revision + 1,
      analyzedRevision: -1,
    }));
  },
  merge: (files) => {
    const all = new Map(
      get()
        .files.filter((f) => f.content || f.path !== initialFile.path)
        .map((f) => [f.path, f]),
    );
    for (const file of files) all.set(file.path, file);
    const next = validateProject([...all.values()]);
    set((s) => ({
      files: next,
      active: files[0]?.path ?? s.active,
      revision: s.revision + 1,
    }));
  },
  edit: (path, content) =>
    set((s) => ({
      files: s.files.map((f) => (f.path === path ? { ...f, content } : f)),
      revision: s.revision + 1,
    })),
  select: (finding) => set({ active: finding.file, selected: finding }),
  setActive: (active) => set({ active, selected: undefined }),
  setLanguage: (language) =>
    set((s) => ({ language, revision: s.revision + 1 })),
  complete: (result, revision) =>
    set((s) =>
      revision === s.revision
        ? {
            result,
            analyzedRevision: revision,
            selected: result.findings[0],
            active: result.findings[0]?.file ?? s.active,
          }
        : {},
    ),
  clear: () =>
    set((s) => ({
      files: [],
      active: '',
      result: undefined,
      selected: undefined,
      revision: s.revision + 1,
      analyzedRevision: -1,
    })),
}));
