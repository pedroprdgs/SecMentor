import { registerSW } from 'virtual:pwa-register';
export const updateApp = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event('secmentor-update'));
  },
  onOfflineReady() {
    window.dispatchEvent(new Event('secmentor-offline-ready'));
  },
});
