import { useEffect, useRef } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { lintGutter, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { indentWithTab, undo } from '@codemirror/commands';
import type { Finding } from '@secmentor/core/content';
import { t } from '../../i18n/index.js';
import { detectLanguage, type Language } from './files.js';
export interface EditorProps {
  path: string;
  content: string;
  onChange: (text: string) => void;
  findings: Finding[];
  selected?: Finding;
  language: Language;
  fontSize: number;
  undoToken: number;
}
export default function Editor({
  path,
  content,
  onChange,
  findings,
  selected,
  language,
  fontSize,
  undoToken,
}: EditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView>();
  const onEdit = useRef(onChange);
  onEdit.current = onChange;
  const size = useRef(new Compartment());
  const mode = useRef(new Compartment());
  const initialUndo = useRef(undoToken);
  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          lintGutter(),
          keymap.of([indentWithTab]),
          EditorView.contentAttributes.of({
            'aria-label': t.analyzer.editor,
            'data-testid': 'code-editor',
          }),
          EditorView.theme({
            '&': {
              height: '430px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
            },
            '.cm-scroller': {
              fontFamily: 'var(--font-code)',
              overflow: 'auto',
            },
            '.cm-content': { padding: '18px 0', caretColor: 'var(--accent)' },
            '.cm-gutters': {
              backgroundColor: 'var(--surface)',
              color: 'var(--subtle)',
              borderRight: '1px solid var(--border)',
            },
            '.cm-activeLine,.cm-activeLineGutter': {
              backgroundColor: 'var(--accent-soft)',
            },
            '.cm-selectionBackground': {
              backgroundColor: 'var(--accent-soft)!important',
            },
            '.cm-focused': { outline: '2px solid var(--accent)' },
            '.cm-tooltip': {
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            },
          }),
          size.current.of(
            EditorView.theme({ '&': { fontSize: fontSize + 'px' } }),
          ),
          mode.current.of([]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onEdit.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = undefined;
    };
  }, [path]);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== content)
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: content },
      });
  }, [content, path]);
  useEffect(() => {
    const actual = language === 'auto' ? detectLanguage(path) : language;
    view.current?.dispatch({
      effects: mode.current.reconfigure(
        actual === 'json'
          ? json()
          : ['js', 'ts', 'jsx', 'tsx'].includes(actual)
            ? javascript({
                typescript: actual === 'ts' || actual === 'tsx',
                jsx: actual === 'jsx' || actual === 'tsx',
              })
            : [],
      ),
    });
  }, [language, path]);
  useEffect(() => {
    view.current?.dispatch({
      effects: size.current.reconfigure(
        EditorView.theme({ '&': { fontSize: fontSize + 'px' } }),
      ),
    });
  }, [fontSize]);
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const diagnostics: Diagnostic[] = findings.map((f) => {
      const line = editor.state.doc.line(
        Math.min(f.line, editor.state.doc.lines),
      );
      const end = editor.state.doc.line(
        Math.min(f.endLine, editor.state.doc.lines),
      );
      return {
        from: Math.min(line.to, line.from + f.column - 1),
        to: Math.min(end.to, end.from + f.endColumn - 1),
        severity:
          f.severity === 'critica' || f.severity === 'alta'
            ? 'error'
            : 'warning',
        message: `${f.ruleId} · ${f.title}: ${f.message}`,
      };
    });
    editor.dispatch(setDiagnostics(editor.state, diagnostics));
  }, [findings, path, content]);
  useEffect(() => {
    const editor = view.current;
    if (!editor || !selected || selected.file !== path) return;
    const line = editor.state.doc.line(
      Math.min(selected.line, editor.state.doc.lines),
    );
    editor.dispatch({
      selection: { anchor: line.from, head: line.to },
      effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
    });
    editor.focus();
  }, [selected, path]);
  useEffect(() => {
    if (initialUndo.current !== undoToken) {
      initialUndo.current = undoToken;
      if (view.current) {
        undo(view.current);
        view.current.focus();
      }
    }
  }, [undoToken]);
  return <div className="code-editor" ref={host} />;
}
