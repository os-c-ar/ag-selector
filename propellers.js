/* Technical catalog: local persistence and FILES/DATABASE/propelas.json. */
'use strict';

const NFS_PROPELLERS = (() => {
  const KEY = 'nfs_propellers_v1';
  const defaults = Object.entries(PROPELLERS)
    .filter(([model]) => model !== 'N.A.')
    .map(([modelo, data]) => ({
      modelo, ...data,
      peso: linInterp(PROP_WEIGHT[TYPE_TO_WEIGHT[data.type]], data.D),
      codType: APP_TO_COD[data.type],
    }));
  let items = [];
  let handle = null;
  let baseline = null;
  let pending = Promise.resolve();
  let initialized = false;
  let fileError = '';
  let loadError = '';

  function validate(obj) {
    if (!obj || obj.version !== 1 || !Array.isArray(obj.propelas) || !obj.propelas.length) {
      throw new Error('El JSON debe tener version: 1 y una lista no vacía "propelas".');
    }
    const seen = new Set();
    return obj.propelas.map(p => {
      if (!p || typeof p.modelo !== 'string' || typeof p.type !== 'string') {
        throw new Error('Cada propela debe tener modelo y tipo de texto.');
      }
      const modelo = p.modelo.trim();
      const type = p.type.trim().toUpperCase();
      if (!modelo || !type || modelo.toUpperCase() === 'N.A.' || type === 'N.A.') {
        throw new Error('Modelo y tipo son obligatorios; N.A. está reservado.');
      }
      if (seen.has(modelo.toUpperCase())) throw new Error('Modelo duplicado: ' + modelo);
      seen.add(modelo.toUpperCase());
      const row = { modelo, type };
      for (const key of ['D', 'rpm', 'Kp', 'Nq', 'peso']) {
        if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key] <= 0) {
          throw new Error(modelo + ': ' + key + ' debe ser un número mayor que cero.');
        }
        row[key] = p[key];
      }
      if (typeof p.codType !== 'string' || p.codType === 'NO APLICA' ||
          !Object.hasOwn(COD.tipoPropela, p.codType)) {
        throw new Error(modelo + ': seleccione una categoría de codificación válida.');
      }
      row.codType = p.codType;
      return row;
    });
  }

  function serialize(list = items) {
    return JSON.stringify({ version: 1, propelas: list }, null, 2);
  }

  function apply(list, persist = true) {
    if (persist) {
      localStorage.setItem(KEY, serialize(list));
      loadError = '';
    }
    items = list;
    for (const model of Object.keys(PROPELLERS)) {
      if (model !== 'N.A.') delete PROPELLERS[model];
    }
    for (const { modelo, ...data } of items) {
      Object.defineProperty(PROPELLERS, modelo, {
        value: { ...data }, enumerable: true, configurable: true, writable: true,
      });
    }
    refreshPropellerCatalogSelectors();
    if (initialized) {
      calculate();
      if (typeof calculateShaft === 'function') calculateShaft();
      renderPropellersTable();
    }
  }

  async function write() {
    if (!handle) return;
    if (!await NFS_HANDLES.ensurePermission(handle)) {
      throw new Error('No hay permiso de escritura. Los cambios quedan en el navegador.');
    }
    const conflict = await NFS_HANDLES.checkConflict(handle, baseline, true);
    if (!conflict.proceed) {
      apply(validate(JSON.parse(conflict.externalText)));
      baseline = conflict.externalText;
      fileError = '';
      updatePropellersFileStatus();
      return;
    }
    const text = serialize();
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    baseline = text;
    fileError = '';
    updatePropellersFileStatus();
  }

  function enqueue(operation) {
    pending = pending.then(operation, operation);
    return pending;
  }

  async function commit(list) {
    apply(list);
    try {
      await write();
    } catch (e) {
      fileError = 'No se pudo guardar en el archivo; cambios conservados en el navegador.';
      updatePropellersFileStatus();
      throw new Error(fileError + '\n' + e.message);
    }
  }

  return {
    getItems: () => items.map(p => ({ ...p })),
    exportJSON: () => serialize(),
    validate,
    load() {
      const stored = localStorage.getItem(KEY);
      if (stored === null) apply(validate({ version: 1, propelas: defaults }));
      else apply(validate(JSON.parse(stored)));
    },
    useInitialCatalog() {
      apply(validate({ version: 1, propelas: defaults }), false);
      loadError = 'Base local no disponible. Catálogo inicial en memoria: importe una base válida antes de editar.';
    },
    start() {
      initialized = true;
      refreshPropellerCatalogSelectors();
      calculate();
      calculateShaft();
    },
    save(row, originalModel = null) {
      return enqueue(async () => {
        if (loadError) throw new Error(loadError);
        const next = items.map(p => ({ ...p }));
        if (originalModel !== null) {
          const index = next.findIndex(p => p.modelo === originalModel);
          if (index < 0) throw new Error('La propela ya no existe en la base.');
          if (row.modelo !== originalModel) throw new Error('No se puede cambiar el modelo.');
          next[index] = row;
        } else next.push(row);
        await commit(validate({ version: 1, propelas: next }));
      });
    },
    replace(obj) {
      return enqueue(() => commit(validate(obj)));
    },
    // File adoption never writes back to a previously linked file.
    importObject(obj) {
      apply(validate(obj));
    },
    getFileHandle: () => handle,
    setFileHandle(h) { handle = h; fileError = ''; },
    markSynced(text) { baseline = text; },
    getFileError: () => fileError || loadError,
    async connect(fileHandle) {
      return enqueue(async () => {
        if (!await NFS_HANDLES.ensurePermission(fileHandle)) {
          throw new Error('Se requiere permiso de lectura y escritura para vincular.');
        }
        const text = await (await fileHandle.getFile()).text();
        const list = validate(JSON.parse(text));
        apply(list);
        handle = fileHandle;
        baseline = text;
        fileError = '';
        await NFS_HANDLES.save('propellers', handle);
        updatePropellersFileStatus();
      });
    },
  };
})();

function openPropellersModal() {
  renderPropellersTable();
  updatePropellersFileStatus();
  document.getElementById('propellersModal').classList.remove('hidden');
}

function closePropellersModal() {
  document.getElementById('propellersModal').classList.add('hidden');
}

function renderPropellersTable() {
  const tbody = document.getElementById('propellersTableBody');
  tbody.replaceChildren();
  const filter = document.getElementById('propellersFilter').value.trim().toLowerCase();
  for (const row of NFS_PROPELLERS.getItems()) {
    if (!(row.modelo + ' ' + row.type).toLowerCase().includes(filter)) continue;
    const tr = tbody.insertRow();
    for (const key of ['modelo', 'type', 'D', 'rpm', 'Kp', 'Nq', 'peso', 'codType']) {
      tr.insertCell().textContent = String(row[key]);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-db btn-db-edit';
    button.textContent = 'Editar';
    button.onclick = () => editPropeller(row.modelo);
    tr.insertCell().appendChild(button);
  }
  const types = [...new Set(NFS_PROPELLERS.getItems().map(p => p.type))];
  document.getElementById('propellerTypes').replaceChildren(
    ...types.map(type => new Option(type, type)));
}

function editPropeller(model = null) {
  const form = document.getElementById('propellerForm');
  form.reset();
  const row = model === null ? null : NFS_PROPELLERS.getItems().find(p => p.modelo === model);
  if (model !== null && !row) {
    alert('La propela ya no existe. Actualice la lista.');
    return;
  }
  form.dataset.originalModel = model || '';
  for (const key of ['modelo', 'type', 'D', 'rpm', 'Kp', 'Nq', 'peso', 'codType']) {
    form.elements.namedItem(key).value = row ? row[key] : '';
  }
  form.elements.namedItem('modelo').readOnly = model !== null;
  document.getElementById('propellerEditorTitle').textContent =
    row ? 'Editar propela: ' + row.modelo : 'Agregar propela';
  document.getElementById('propellerEditor').showModal();
}

async function savePropeller(event) {
  event.preventDefault();
  const form = event.target;
  const row = {};
  for (const key of ['modelo', 'type', 'D', 'rpm', 'Kp', 'Nq', 'peso', 'codType']) {
    const value = form.elements.namedItem(key).value;
    row[key] = ['modelo', 'type', 'codType'].includes(key) ? value.trim() : Number(value);
  }
  const button = document.getElementById('propellerSave');
  button.disabled = true;
  try {
    await NFS_PROPELLERS.save(row, form.dataset.originalModel || null);
    document.getElementById('propellerEditor').close();
  } catch (e) {
    alert('No se completó el guardado de la propela:\n' + e.message);
  } finally {
    button.disabled = false;
  }
}

function updatePropellersFileStatus() {
  const el = document.getElementById('propellersFileStatus');
  const handle = NFS_PROPELLERS.getFileHandle();
  const error = NFS_PROPELLERS.getFileError();
  el.className = 'db-file-status ' +
    (handle && !error ? 'db-file-connected' : 'db-file-disconnected');
  el.textContent = error || (handle
    ? 'Vinculado a ' + handle.name + ' — cambios guardados automáticamente en el archivo.'
    : 'Cambios guardados en el navegador. Exporte o vincule propelas.json para compartir la base.');
  if (typeof _dbLinkRefreshGlobalBadge === 'function') _dbLinkRefreshGlobalBadge();
}

async function propellersConnectFile() {
  if (!window.showOpenFilePicker) {
    alert('Use Chrome/Edge para vincular archivos, o las opciones Importar y Exportar JSON.');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      id: 'nfs-propellers', multiple: false,
      types: [{ description: 'Propelas (JSON)', accept: { 'application/json': ['.json'] } }],
    });
    await NFS_PROPELLERS.connect(handle);
  } catch (e) {
    if (e.name !== 'AbortError') alert('Error al vincular propelas:\n' + e.message);
  }
}

function propellersExportJSON() {
  const url = URL.createObjectURL(new Blob([NFS_PROPELLERS.exportJSON()], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'propelas.json';
  a.click();
  URL.revokeObjectURL(url);
}

function propellersImportJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      const rows = NFS_PROPELLERS.validate(obj);
      if (!confirm('¿Reemplazar el catálogo con ' + rows.length + ' propelas de ' + file.name +
          '? Las selecciones se recalcularán con estos datos.')) return;
      await NFS_PROPELLERS.replace(obj);
    } catch (e) {
      alert('No se completó la importación de propelas:\n' + e.message);
    }
  };
  input.click();
}

try {
  NFS_PROPELLERS.load();
} catch (e) {
  NFS_PROPELLERS.useInitialCatalog();
  alert('No se pudo cargar la base local de propelas. Se conserva el catálogo inicial en memoria; ' +
    'importe una base válida antes de editar.\n' + e.message);
}

document.addEventListener('DOMContentLoaded', async () => {
  NFS_PROPELLERS.start();
  document.getElementById('propellerForm').addEventListener('submit', savePropeller);
  document.getElementById('propellersFilter').addEventListener('input', renderPropellersTable);
  const codingSelect = document.getElementById('propellerCodType');
  for (const type of Object.keys(COD.tipoPropela)) {
    if (type !== 'NO APLICA') codingSelect.add(new Option(type, type));
  }
  updatePropellersFileStatus();
  const handle = await NFS_HANDLES.load('propellers');
  if (!handle) return;
  try {
    if (await NFS_HANDLES.ensurePermission(handle)) await NFS_PROPELLERS.connect(handle);
  } catch (e) {
    alert('No se pudo reconectar la base de propelas:\n' + e.message);
  }
});
