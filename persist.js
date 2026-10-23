/* =====================================================
   NFS – Persisted File Handles (IndexedDB)
   Keeps FileSystemFileHandle references across page reloads
   so the user doesn't have to re-link FILES/DATABASE/*.json every
   session. Permission is still re-requested per session
   (browser security requirement), but the handle itself
   (and therefore "which file") is remembered.
   ===================================================== */

'use strict';

const NFS_HANDLES = (function () {
  const DB_NAME = 'nfs_handles_db';
  const STORE   = 'handles';
  let _dbPromise = null;

  function _openDb() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('IndexedDB no disponible')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
    return _dbPromise;
  }

  async function save(key, handle) {
    try {
      const db = await _openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(handle, key);
        tx.oncomplete = resolve;
        tx.onerror    = () => reject(tx.error);
      });
    } catch (e) { /* ignore – non-fatal */ }
  }

  async function load(key) {
    try {
      const db = await _openDb();
      return await new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror   = () => reject(req.error);
      });
    } catch (e) { return null; }
  }

  async function remove(key) {
    try {
      const db = await _openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = resolve;
        tx.onerror    = () => reject(tx.error);
      });
    } catch (e) { /* ignore */ }
  }

  /** Verify/request readwrite permission for a stored handle. Returns boolean. */
  async function ensurePermission(handle) {
    try {
      let perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') perm = await handle.requestPermission({ mode: 'readwrite' });
      return perm === 'granted';
    } catch (e) { return false; }
  }

  return { save, load, remove, ensurePermission };
})();
