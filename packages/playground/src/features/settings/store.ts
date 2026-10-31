import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import { PREFIX, safeStorage } from '../../lib/storage.js';
export const settingsSchema = z.object({ theme: z.enum(['system','light','dark']).default('system'), fontSize: z.number().int().min(12).max(22).default(14), ai: z.object({ enabled: z.boolean(), baseUrl: z.string().max(2000), model: z.string().max(200), apiKey: z.string().max(4000) }).default({enabled:false,baseUrl:'http://127.0.0.1:1234/v1',model:'',apiKey:''}), tourSeen: z.boolean().default(false) });
export type Settings = z.infer<typeof settingsSchema>;
export const defaults: Settings = settingsSchema.parse({});
interface SettingsState extends Settings { update: (patch: Partial<Settings>) => void; reset: () => void }
export const useSettings = create<SettingsState>()(persist((set) => ({ ...defaults, update: patch => set(patch), reset: () => set(defaults) }), { name: PREFIX+'settings', storage: createJSONStorage(() => safeStorage), merge: (stored, current) => { const parsed = settingsSchema.safeParse(stored); return parsed.success ? { ...current, ...parsed.data } : current; } }));
export function resolvedTheme(theme: Settings['theme'], systemDark: boolean) { return theme === 'system' ? systemDark ? 'dark' : 'light' : theme; }
