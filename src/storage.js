import { seedState, VERSION } from './data.js';

const DATABASE = 'atiera-hr3-portfolio-demo';
let connection;
export let storageMode = 'IndexedDB';
export async function loadState() {
  try {
    connection = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Storage is blocked by another tab.'));
    });
    const saved = await new Promise((resolve, reject) => {
      const request = connection.transaction('state').objectStore('state').get('current');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const value = saved?.version === VERSION ? saved : seedState();
    if (!saved) await persistState(value);
    return value;
  } catch {
    storageMode = 'Temporary memory';
    return seedState();
  }
}
export async function persistState(state) {
  if (storageMode === 'Temporary memory' || !connection) return;
  await new Promise((resolve, reject) => {
    const tx = connection.transaction('state', 'readwrite');
    tx.objectStore('state').put(state, 'current');
    tx.oncomplete = resolve; tx.onerror = () => reject(new Error('Unable to save demo data. Browser storage may be full.')); tx.onabort = () => reject(new Error('The demo data could not be saved.'));
  });
}
