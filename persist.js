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

  /** Read a file handle's current text content. Returns null on failure. */
  async function readText(handle) {
    try { return await (await handle.getFile()).text(); }
    catch (e) { return null; }
  }

  /**
   * Optimistic-concurrency guard, needed because multiple people/computers
   * may share the same linked file (e.g. via a synced Google Drive / OneDrive
   * folder). Re-reads the file right before writing and compares it against
   * `lastSyncedText` (the content this tab last read or wrote). If someone
   * else changed the file in the meantime, asks the user how to proceed
   * instead of silently overwriting their work.
   *
   * Returns one of:
   *   { proceed: true }                       – no conflict, safe to write
   *   { proceed: true, resolved: 'overwrite' } – conflict, user kept their own changes
   *   { proceed: false, externalText }         – conflict, user chose to discard their
   *                                              in-memory changes and adopt `externalText`
   *                                              instead (caller must NOT write in this case)
   * With requireRead, missing baselines and read errors reject the write.
   */
  async function checkConflict(handle, lastSyncedText, requireRead = false) {
    if (requireRead && lastSyncedText == null) {
      throw new Error('No hay una versión de referencia del archivo; vuelva a vincularlo.');
    }
    if (lastSyncedText == null) return { proceed: true }; // no baseline yet, nothing to compare
    const diskText = await readText(handle);
    if (requireRead && diskText === null) {
      throw new Error('No se pudo leer el archivo para comprobar cambios externos.');
    }
    if (diskText === null || diskText === lastSyncedText) return { proceed: true };

    const keepMine = confirm(
      'El archivo "' + (handle.name || '') + '" fue modificado por otra persona o equipo ' +
      'desde la última vez que se leyó aquí (posible edición simultánea).\n\n' +
      'Aceptar = guardar MIS cambios actuales (se perderá lo que la otra persona guardó).\n' +
      'Cancelar = descartar mis cambios en memoria y cargar la versión más reciente del archivo.'
    );
    if (keepMine) return { proceed: true, resolved: 'overwrite' };
    return { proceed: false, externalText: diskText };
  }

  return { save, load, remove, ensurePermission, readText, checkConflict };
})();
