import { t } from '../i18n/index.js';
export const PREFIX = 'secmentor-web-';
export let storageAvailable = true;
export function storageWarning() { return storageAvailable ? '' : t.progress.storageError; }
export const safeStorage = {
  getItem(name: string) { try { return localStorage.getItem(name); } catch { storageAvailable = false; return null; } },
  setItem(name: string, value: string) { try { localStorage.setItem(name, value); } catch { storageAvailable = false; } },
  removeItem(name: string) { try { localStorage.removeItem(name); } catch { storageAvailable = false; } },
};
export function clearLocalData() {
  try { for (const key of Object.keys(localStorage)) if (key.startsWith(PREFIX) || key.startsWith('secmentor-')) localStorage.removeItem(key); } catch { storageAvailable = false; }
}
