/* =====================================================
   NFS - Staff Directory
   Stores the people who prepare selections in localStorage.
   ===================================================== */

'use strict';

const NFS_STAFF = (function () {
  const KEY = 'nfs_staff_v1';
  const HANDLE_KEY = 'staff';
  let _profiles = [];
  let _fileHandle = null;
  let _lastSyncedText = null; // last content we read/wrote, for conflict detection

  function _newId() {
    return Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function _normalize(raw) {
    const p = raw || {};
    return {
      id: /^[\w-]+$/.test(String(p.id || '')) ? String(p.id) : _newId(),
      nombre: String(p.nombre || '').trim(),
      cargo: String(p.cargo || '').trim(),
      extension: String(p.extension || '').trim(),
      celular: String(p.celular || '').trim(),
      correo: String(p.correo || '').trim(),
    };
  }

  function _persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: 1, staff: _profiles }));
    } catch (error) {
      console.error('No se pudo guardar la base de elaboradores en el navegador.', error);
      alert('No se pudo guardar la base de elaboradores en el navegador.');
    }
  }

  async function _writeFile() {
    if (!_fileHandle) return;
    try {
      const ok = await NFS_HANDLES.ensurePermission(_fileHandle);
      if (!ok) {
        _fileHandle = null;
        staffUpdateFileStatus('Se perdió el permiso del archivo. Los cambios siguen guardados en el navegador.');
        return;
      }

      const check = await NFS_HANDLES.checkConflict(_fileHandle, _lastSyncedText);
      if (!check.proceed) {
        // Another user/computer changed the file: adopt their version instead of overwriting it.
        try {
          const parsed = check.externalText.trim() ? JSON.parse(check.externalText) : null;
          if (parsed && Array.isArray(parsed.staff)) _profiles = parsed.staff.map(_normalize);
        } catch (_) { /* keep current in-memory data if the external file is invalid */ }
        _lastSyncedText = check.externalText;
        _persist();
        if (typeof staffRefreshFilter === 'function') staffRefreshFilter();
        if (typeof staffRefreshHeaderList === 'function') staffRefreshHeaderList();
        if (typeof staffRenderTable === 'function') staffRenderTable();
        staffUpdateFileStatus();
        return;
      }

      const text = exportJSON();
      const writable = await _fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      _lastSyncedText = text;
      staffFlashSaved();
    } catch (error) {
      console.error('No se pudo actualizar el archivo de elaboradores.', error);
      _fileHandle = null;
      staffUpdateFileStatus('No se pudo actualizar el archivo. Los cambios siguen guardados en el navegador.');
    }
  }

  function _afterMutate() {
    _persist();
    _writeFile();
  }

  function exportJSON() {
    return JSON.stringify({ version: 1, staff: _profiles }, null, 2);
  }

  return {
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          _profiles = Array.isArray(parsed.staff) ? parsed.staff.map(_normalize) : [];
        } else {
          _profiles = [];
        }
      } catch (error) {
        console.error('No se pudo leer la base de elaboradores guardada.', error);
        _profiles = [];
      }
      _persist();
    },
    getProfiles() {
      return [..._profiles];
    },
    getNames() {
      return [...new Set(_profiles.map(p => p.nombre).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'));
    },
    add(profile) {
      const item = _normalize(profile);
      _profiles.push(item);
      _afterMutate();
      return item;
    },
    update(id, values) {
      const index = _profiles.findIndex(p => p.id === id);
      if (index === -1) return false;
      _profiles[index] = _normalize({ ..._profiles[index], ...values, id });
      _afterMutate();
      return true;
    },
    remove(id) {
      _profiles = _profiles.filter(p => p.id !== id);
      _afterMutate();
    },
    reset() {
      _profiles = [];
      _afterMutate();
    },
    exportJSON,
    importObject(obj) {
      if (!obj || !Array.isArray(obj.staff)) return false;
      _profiles = obj.staff.map(_normalize);
      _afterMutate();
      return true;
    },
    setFileHandle(handle) { _fileHandle = handle; },
    getFileHandle() { return _fileHandle; },
    handleKey: HANDLE_KEY,
    markSynced(text) { _lastSyncedText = text; },
  };
})();

function staffEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openStaffModal() {
  staffRefreshFilter();
  staffRenderTable();
  staffUpdateFileStatus();
  document.getElementById('staffModal').classList.remove('hidden');
}

function closeStaffModal() {
  document.getElementById('staffModal').classList.add('hidden');
  staffRefreshHeaderList();
}

function staffUpdateFileStatus(message) {
  const el = document.getElementById('staffFileStatus');
  if (!el) return;
  const handle = NFS_STAFF.getFileHandle();
  if (handle) {
    el.className = 'db-file-status db-file-connected';
    el.innerHTML =
      '<span class="db-file-icon">🔗</span>' +
      'Vinculado a <strong>' + staffEscape(handle.name) + '</strong> – cambios guardados automáticamente en el archivo' +
      '<span id="staffSaveIndicator" class="db-save-indicator"></span>';
  } else {
    el.className = 'db-file-status db-file-disconnected';
    el.innerHTML =
      '<span class="db-file-icon">💾</span>' + staffEscape(message || 'Cambios guardados en el navegador.') + ' ' +
      '<button class="btn-db-link" onclick="staffConnectFile()">Vincular archivo JSON…</button>' +
      ' para persistencia permanente.';
  }
  if (typeof _dbLinkRefreshGlobalBadge === 'function') _dbLinkRefreshGlobalBadge();
}

function staffFlashSaved() {
  const indicator = document.getElementById('staffSaveIndicator');
  if (!indicator) return;
  indicator.textContent = ' ✓ guardado';
  indicator.style.opacity = '1';
  clearTimeout(indicator._hideTimer);
  indicator._hideTimer = setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
}

function staffFilteredProfiles() {
  const filter = document.getElementById('staffFilter');
  const selected = filter ? filter.value : '';
  return NFS_STAFF.getProfiles().filter(profile => !selected || profile.nombre === selected);
}

function staffReadRow(profile) {
  const row = document.createElement('tr');
  row.dataset.id = profile.id;
  row.innerHTML =
    '<td>' + staffEscape(profile.nombre) + '</td>' +
    '<td>' + staffEscape(profile.cargo) + '</td>' +
    '<td>' + staffEscape(profile.extension) + '</td>' +
    '<td>' + staffEscape(profile.celular) + '</td>' +
    '<td>' + staffEscape(profile.correo) + '</td>' +
    '<td class="rec-td-actions">' +
      '<button class="btn-db btn-db-use" onclick="staffUseProfile(\'' + staffEscape(profile.id) + '\')">✓ Usar</button>' +
      '<button class="btn-db btn-db-edit" onclick="staffEditRow(\'' + staffEscape(profile.id) + '\',this)">✏ Editar</button>' +
      '<button class="btn-db btn-db-del" onclick="staffDeleteRow(\'' + staffEscape(profile.id) + '\')">🗑</button>' +
    '</td>';
  return row;
}

function staffEditRowElement(profile, isNew) {
  const row = document.createElement('tr');
  row.dataset.id = profile.id || '';
  row.classList.add('db-row-editing');
  if (isNew) row.classList.add('staff-row-new');

  const input = (className, value, placeholder) =>
    '<td><input class="db-input ' + className + '" value="' + staffEscape(value) + '" placeholder="' + placeholder + '" /></td>';
  row.innerHTML =
    input('staff-nombre', profile.nombre, 'Nombre') +
    input('staff-cargo', profile.cargo, 'Cargo') +
    input('staff-extension', profile.extension, 'Extensión') +
    input('staff-celular', profile.celular, 'Celular') +
    input('staff-correo', profile.correo, 'Correo electrónico') +
    '<td class="rec-td-actions">' +
      (isNew
        ? '<button class="btn-db btn-db-save" onclick="staffSaveNewRow(this)">✔ Guardar</button>'
        : '<button class="btn-db btn-db-save" onclick="staffSaveRow(\'' + staffEscape(profile.id) + '\',this)">✔ Guardar</button>') +
      '<button class="btn-db btn-db-cancel" onclick="staffCancelEdit(this)">✖</button>' +
    '</td>';
  return row;
}

function staffValuesFromRow(row) {
  return {
    nombre: row.querySelector('.staff-nombre').value.trim(),
    cargo: row.querySelector('.staff-cargo').value.trim(),
    extension: row.querySelector('.staff-extension').value.trim(),
    celular: row.querySelector('.staff-celular').value.trim(),
    correo: row.querySelector('.staff-correo').value.trim(),
  };
}

function staffValidate(profile, currentId) {
  if (!profile.nombre) {
    alert('El nombre es obligatorio.');
    return false;
  }
  if (profile.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.correo)) {
    alert('El correo electrónico no tiene un formato válido.');
    return false;
  }
  const duplicate = NFS_STAFF.getProfiles().find(item =>
    item.id !== currentId && item.nombre.toLocaleLowerCase() === profile.nombre.toLocaleLowerCase()
  );
  if (duplicate) {
    alert('Ya existe un elaborador registrado con ese nombre.');
    return false;
  }
  return true;
}

function staffRenderTable() {
  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const profiles = staffFilteredProfiles();
  if (!profiles.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="rec-empty">No hay elaboradores registrados para este filtro.</td>';
    tbody.appendChild(row);
    return;
  }
  profiles.forEach(profile => tbody.appendChild(staffReadRow(profile)));
}

function staffRefreshFilter() {
  const select = document.getElementById('staffFilter');
  if (!select) return;
  const previous = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  NFS_STAFF.getNames().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
  select.value = NFS_STAFF.getNames().includes(previous) ? previous : '';
}

function staffRefreshHeaderList() {
  const datalist = document.getElementById('elaboradoresList');
  if (!datalist) return;
  datalist.innerHTML = '';
  NFS_STAFF.getNames().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    datalist.appendChild(option);
  });
}

function staffApplyHeaderProfile() {
  const name = document.getElementById('elaboro');
  if (!name) return;
  const profile = NFS_STAFF.getProfiles().find(item =>
    item.nombre.toLocaleLowerCase() === name.value.trim().toLocaleLowerCase()
  );
  if (!profile) return;
  document.getElementById('cargoElaboro').value = profile.cargo;
  document.getElementById('extensionElaboro').value = profile.extension;
  document.getElementById('celularElaboro').value = profile.celular;
  document.getElementById('correoElaboro').value = profile.correo;
}

function staffAddRow() {
  const tbody = document.getElementById('staffTableBody');
  if (!tbody || tbody.querySelector('.staff-row-new')) return;
  const empty = tbody.querySelector('.rec-empty');
  if (empty) tbody.innerHTML = '';
  const row = staffEditRowElement({ nombre: document.getElementById('staffFilter').value }, true);
  tbody.appendChild(row);
  row.querySelector('input').focus();
}

function staffEditRow(id, button) {
  const profile = NFS_STAFF.getProfiles().find(item => item.id === id);
  const row = button.closest('tr');
  if (!profile || !row) return;
  row.parentNode.replaceChild(staffEditRowElement(profile, false), row);
}

function staffSaveRow(id, button) {
  const row = button.closest('tr');
  if (!row) return;
  const values = staffValuesFromRow(row);
  if (!staffValidate(values, id)) return;
  NFS_STAFF.update(id, values);
  staffRefreshFilter();
  staffRefreshHeaderList();
  staffRenderTable();
}

function staffSaveNewRow(button) {
  const row = button.closest('tr');
  if (!row) return;
  const values = staffValuesFromRow(row);
  if (!staffValidate(values, null)) return;
  NFS_STAFF.add(values);
  staffRefreshFilter();
  staffRefreshHeaderList();
  staffRenderTable();
}

function staffCancelEdit(button) {
  const row = button.closest('tr');
  if (!row) return;
  if (row.classList.contains('staff-row-new')) {
    row.remove();
    if (!document.getElementById('staffTableBody').children.length) staffRenderTable();
    return;
  }
  staffRenderTable();
}

function staffDeleteRow(id) {
  if (!confirm('¿Eliminar este elaborador?')) return;
  NFS_STAFF.remove(id);
  staffRefreshFilter();
  staffRefreshHeaderList();
  staffRenderTable();
}

function staffUseProfile(id) {
  const profile = NFS_STAFF.getProfiles().find(item => item.id === id);
  if (!profile) return;
  document.getElementById('elaboro').value = profile.nombre;
  document.getElementById('cargoElaboro').value = profile.cargo;
  document.getElementById('extensionElaboro').value = profile.extension;
  document.getElementById('celularElaboro').value = profile.celular;
  document.getElementById('correoElaboro').value = profile.correo;
  closeStaffModal();
}

function staffResetAll() {
  if (!confirm('¿Vaciar por completo la base de elaboradores?')) return;
  NFS_STAFF.reset();
  staffRefreshFilter();
  staffRefreshHeaderList();
  staffRenderTable();
}

async function staffConnectFile() {
  if (!window.showOpenFilePicker) {
    alert('Tu navegador no soporta la escritura directa a archivos. Usa Importar y Exportar para administrar la base de elaboradores.');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      id: 'nfs-staff',
      types: [{ description: 'Base de elaboradores NFS (JSON)', accept: { 'application/json': ['.json'] } }],
      multiple: false,
    });
    const ok = await NFS_HANDLES.ensurePermission(handle);
    if (!ok) {
      alert('Se requiere permiso de escritura para vincular el archivo.');
      return;
    }
    const text = await (await handle.getFile()).text();
    if (text.trim()) {
      const parsed = JSON.parse(text);
      if (!NFS_STAFF.importObject(parsed)) throw new Error('El archivo no contiene un arreglo "staff" válido.');
    }
    NFS_STAFF.markSynced(text);
    NFS_STAFF.setFileHandle(handle);
    await NFS_HANDLES.save(NFS_STAFF.handleKey, handle);
    staffRefreshFilter();
    staffRefreshHeaderList();
    staffRenderTable();
    staffUpdateFileStatus();
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error al conectar el archivo de elaboradores.', error);
      alert('Error al conectar con el archivo:\n' + error.message);
    }
  }
}

async function staffTryAutoReconnect() {
  const handle = await NFS_HANDLES.load(NFS_STAFF.handleKey);
  if (!handle) return;
  const ok = await NFS_HANDLES.ensurePermission(handle);
  if (!ok) return;
  NFS_STAFF.setFileHandle(handle);
  NFS_STAFF.markSynced(await NFS_HANDLES.readText(handle));
  staffUpdateFileStatus();
}

function staffExportJSON() {
  const blob = new Blob([NFS_STAFF.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'elaboradores.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function staffImportJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.staff)) {
        alert('Archivo inválido. Debe contener un arreglo "staff".');
        return;
      }
      if (!confirm('¿Importar ' + parsed.staff.length + ' elaboradores desde "' + file.name + '"?\nEsto reemplazará los datos actuales.')) return;
      NFS_STAFF.importObject(parsed);
      staffRefreshFilter();
      staffRefreshHeaderList();
      staffRenderTable();
    } catch (error) {
      console.error('Error al importar la base de elaboradores.', error);
      alert('Error al importar:\n' + error.message);
    }
  };
  input.click();
}

document.addEventListener('DOMContentLoaded', () => {
  NFS_STAFF.load();
  staffRefreshHeaderList();
  staffTryAutoReconnect();
  const name = document.getElementById('elaboro');
  if (name) {
    name.addEventListener('input', staffApplyHeaderProfile);
    name.addEventListener('change', staffApplyHeaderProfile);
  }
});
