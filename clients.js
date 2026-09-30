/* =====================================================
   NFS - Clients & Contacts Module
   Stores clients and contacts in localStorage.
   One client can have multiple contacts.
   ===================================================== */

'use strict';

const NFS_CLIENTS = (function () {
  const KEY = 'nfs_clients_v1';
  let _data = null;

  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(_data)); } catch (e) {}
  }

  function _emptyData() {
    return { version: 1, contacts: [] };
  }

  function _normalizeContact(raw) {
    const c = raw || {};
    return {
      id: c.id || (Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      cliente: String(c.cliente || '').trim(),
      ciudad: String(c.ciudad || '').trim(),
      telefono: String(c.telefono || '').trim(),
      celular: String(c.celular || '').trim(),
      correo: String(c.correo || '').trim(),
      contacto: String(c.contacto || '').trim(),
    };
  }

  return {
    load() {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        _data = _emptyData();
        _persist();
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        const contacts = Array.isArray(parsed.contacts) ? parsed.contacts.map(_normalizeContact) : [];
        _data = { version: parsed.version || 1, contacts };
      } catch (e) {
        _data = _emptyData();
      }
      _persist();
    },

    getContacts() {
      return _data ? [..._data.contacts] : [];
    },

    getClients() {
      const set = new Set(((_data && _data.contacts) || []).map(c => c.cliente).filter(Boolean));
      return [...set].sort((a, b) => a.localeCompare(b, 'es'));
    },

    addContact(contact) {
      const c = _normalizeContact(contact);
      _data.contacts.push(c);
      _persist();
      return c;
    },

    updateContact(id, values) {
      const i = _data.contacts.findIndex(c => c.id === id);
      if (i === -1) return false;
      _data.contacts[i] = _normalizeContact({ ..._data.contacts[i], ...values, id });
      _persist();
      return true;
    },

    removeContact(id) {
      _data.contacts = _data.contacts.filter(c => c.id !== id);
      _persist();
    },

    reset() {
      _data = _emptyData();
      _persist();
    },

    exportJSON() {
      return JSON.stringify(_data, null, 2);
    },

    importObject(obj) {
      if (!obj || !Array.isArray(obj.contacts)) return false;
      _data = {
        version: obj.version || 1,
        contacts: obj.contacts.map(_normalizeContact),
      };
      _persist();
      return true;
    },
  };
})();

function openClientsModal() {
  _clientsRefreshFilter();
  clientsRenderTable();
  document.getElementById('clientsModal').classList.remove('hidden');
}

function closeClientsModal() {
  document.getElementById('clientsModal').classList.add('hidden');
  _clientsRefreshHeaderList();
}

function _clientsEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _clientsValidate(values, currentId) {
  const required = [
    ['cliente', 'CLIENTE'],
    ['ciudad', 'CIUDAD'],
    ['telefono', 'TELEFONO'],
    ['celular', 'CELULAR'],
    ['correo', 'DIRECCION DE CORREO ELECTRONICO'],
    ['contacto', 'NOMBRE DE CONTACTO'],
  ];

  const missing = required.filter(([k]) => !String(values[k] || '').trim()).map(([, label]) => label);
  if (missing.length) {
    alert('Complete los campos obligatorios:\n- ' + missing.join('\n- '));
    return false;
  }

  const email = String(values.correo || '').trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    alert('El correo electronico no tiene un formato valido.');
    return false;
  }

  const onlyDigitsCount = str => (String(str || '').match(/\d/g) || []).length;
  if (onlyDigitsCount(values.telefono) < 7) {
    alert('El telefono debe tener al menos 7 digitos.');
    return false;
  }
  if (onlyDigitsCount(values.celular) < 7) {
    alert('El celular debe tener al menos 7 digitos.');
    return false;
  }

  const clientName = String(values.cliente || '').trim().toLowerCase();
  const contactName = String(values.contacto || '').trim().toLowerCase();
  const duplicate = NFS_CLIENTS.getContacts().find(c => {
    if (currentId && c.id === currentId) return false;
    return c.cliente.trim().toLowerCase() === clientName &&
           c.contacto.trim().toLowerCase() === contactName;
  });
  if (duplicate) {
    alert('Ya existe un contacto con ese nombre para este cliente.');
    return false;
  }

  return true;
}

function _clientsCurrentFilter() {
  const sel = document.getElementById('clientFilter');
  return sel ? sel.value : '';
}

function _clientsGetByClientName(name) {
  const needle = String(name || '').trim().toLowerCase();
  if (!needle) return [];
  return NFS_CLIENTS.getContacts().filter(c => c.cliente.trim().toLowerCase() === needle);
}

function _clientsFilteredContacts() {
  const filter = _clientsCurrentFilter();
  const all = NFS_CLIENTS.getContacts();
  if (!filter) return all;
  return all.filter(c => c.cliente === filter);
}

function _clientsRowRead(c) {
  const tr = document.createElement('tr');
  tr.dataset.id = c.id;
  tr.innerHTML =
    '<td>' + _clientsEscape(c.cliente) + '</td>' +
    '<td>' + _clientsEscape(c.ciudad) + '</td>' +
    '<td>' + _clientsEscape(c.telefono) + '</td>' +
    '<td>' + _clientsEscape(c.celular) + '</td>' +
    '<td>' + _clientsEscape(c.correo) + '</td>' +
    '<td>' + _clientsEscape(c.contacto) + '</td>' +
    '<td class="rec-td-actions">' +
      '<button class="btn-db btn-db-use" onclick="clientsUseContact(\'' + c.id + '\')">✓ Usar</button>' +
      '<button class="btn-db btn-db-edit" onclick="clientsEditRow(\'' + c.id + '\',this)">✏ Editar</button>' +
      '<button class="btn-db btn-db-del" onclick="clientsDeleteRow(\'' + c.id + '\',this)">🗑</button>' +
    '</td>';
  return tr;
}

function _clientsRowEdit(c, isNew) {
  const tr = document.createElement('tr');
  tr.dataset.id = c.id || '';
  tr.classList.add('db-row-editing');
  if (isNew) tr.classList.add('clients-row-new');

  function inCell(cls, value, placeholder) {
    return '<td><input class="db-input ' + cls + '" value="' + _clientsEscape(value || '') + '" placeholder="' + _clientsEscape(placeholder || '') + '" /></td>';
  }

  tr.innerHTML =
    inCell('cl-cliente', c.cliente, 'Cliente') +
    inCell('cl-ciudad', c.ciudad, 'Ciudad') +
    inCell('cl-telefono', c.telefono, 'Telefono') +
    inCell('cl-celular', c.celular, 'Celular') +
    inCell('cl-correo', c.correo, 'Correo electronico') +
    inCell('cl-contacto', c.contacto, 'Nombre de contacto') +
    '<td class="rec-td-actions">' +
      (isNew
        ? '<button class="btn-db btn-db-save" onclick="clientsSaveNewRow(this)">✔ Guardar</button>'
        : '<button class="btn-db btn-db-save" onclick="clientsSaveRow(\'' + c.id + '\',this)">✔ Guardar</button>') +
      '<button class="btn-db btn-db-cancel" onclick="clientsCancelEdit(this)">✖</button>' +
    '</td>';

  return tr;
}

function _clientsReadValuesFromRow(tr) {
  return {
    cliente: tr.querySelector('.cl-cliente').value,
    ciudad: tr.querySelector('.cl-ciudad').value,
    telefono: tr.querySelector('.cl-telefono').value,
    celular: tr.querySelector('.cl-celular').value,
    correo: tr.querySelector('.cl-correo').value,
    contacto: tr.querySelector('.cl-contacto').value,
  };
}

function clientsRenderTable() {
  const tbody = document.getElementById('clientsTableBody');
  if (!tbody) return;

  const list = _clientsFilteredContacts();
  tbody.innerHTML = '';

  if (!list.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" class="rec-empty">No hay contactos registrados para este filtro.</td>';
    tbody.appendChild(tr);
    return;
  }

  list.forEach(c => tbody.appendChild(_clientsRowRead(c)));
}

function clientsAddRow() {
  const tbody = document.getElementById('clientsTableBody');
  if (!tbody) return;
  if (tbody.querySelector('.clients-row-new')) return;

  const filter = _clientsCurrentFilter();
  const tr = _clientsRowEdit({ cliente: filter || '' }, true);

  const empty = tbody.querySelector('.rec-empty');
  if (empty) tbody.innerHTML = '';
  tbody.appendChild(tr);

  const firstInput = tr.querySelector('input');
  if (firstInput) firstInput.focus();
}

function clientsEditRow(id, btn) {
  const tr = btn.closest('tr');
  const c = NFS_CLIENTS.getContacts().find(x => x.id === id);
  if (!tr || !c) return;
  tr.parentNode.replaceChild(_clientsRowEdit(c, false), tr);
}

function clientsSaveRow(id, btn) {
  const tr = btn.closest('tr');
  if (!tr) return;
  const values = _clientsReadValuesFromRow(tr);
  if (!_clientsValidate(values, id)) return;

  NFS_CLIENTS.updateContact(id, values);
  _clientsRefreshFilter();
  _clientsRefreshHeaderList();
  clientsRenderTable();
}

function clientsSaveNewRow(btn) {
  const tr = btn.closest('tr');
  if (!tr) return;
  const values = _clientsReadValuesFromRow(tr);
  if (!_clientsValidate(values, null)) return;

  NFS_CLIENTS.addContact(values);
  _clientsRefreshFilter();
  _clientsRefreshHeaderList();
  clientsRenderTable();
}

function clientsCancelEdit(btn) {
  const tr = btn.closest('tr');
  if (!tr) return;
  if (tr.classList.contains('clients-row-new')) {
    tr.remove();
    if (!document.getElementById('clientsTableBody').children.length) clientsRenderTable();
    return;
  }
  clientsRenderTable();
}

function clientsDeleteRow(id) {
  if (!confirm('¿Eliminar este contacto?')) return;
  NFS_CLIENTS.removeContact(id);
  _clientsRefreshFilter();
  _clientsRefreshHeaderList();
  clientsRenderTable();
}

function clientsUseContact(id) {
  const c = NFS_CLIENTS.getContacts().find(x => x.id === id);
  if (!c) return;

  const cliente = document.getElementById('cliente');
  const contacto = document.getElementById('contactoCliente');
  if (cliente) cliente.value = c.cliente;
  if (contacto) contacto.value = c.contacto;

  _setContactHeaderFields(c);
  syncClientContacts();
  closeClientsModal();
}

function _clientsRefreshFilter() {
  const sel = document.getElementById('clientFilter');
  if (!sel) return;

  const prev = sel.value;
  sel.innerHTML = '<option value="">Todos</option>';
  NFS_CLIENTS.getClients().forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });

  const exists = [...sel.options].some(o => o.value === prev);
  sel.value = exists ? prev : '';
}

function _clientsRefreshHeaderList() {
  const list = document.getElementById('clientesList');
  if (list) {
    list.innerHTML = '';
    NFS_CLIENTS.getClients().forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      list.appendChild(opt);
    });
  }

  syncClientContacts();
}

function _setContactHeaderFields(c) {
  const ciudad = document.getElementById('ciudadCliente');
  const telefono = document.getElementById('telefonoCliente');
  const celular = document.getElementById('celularCliente');
  const correo = document.getElementById('correoCliente');
  if (ciudad) ciudad.value = c ? (c.ciudad || '') : '';
  if (telefono) telefono.value = c ? (c.telefono || '') : '';
  if (celular) celular.value = c ? (c.celular || '') : '';
  if (correo) correo.value = c ? (c.correo || '') : '';
}

function syncClientContacts() {
  const clientInput = document.getElementById('cliente');
  const contactInput = document.getElementById('contactoCliente');
  const contactList = document.getElementById('contactsList');
  if (!clientInput || !contactInput || !contactList) return;

  const contacts = _clientsGetByClientName(clientInput.value);
  const prevContact = contactInput.value;

  contactList.innerHTML = '';
  contacts.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.contacto;
    contactList.appendChild(opt);
  });

  const matched = contacts.find(c => c.contacto.trim().toLowerCase() === prevContact.trim().toLowerCase());
  if (matched) {
    _setContactHeaderFields(matched);
    return;
  }

  if (contacts.length === 1) {
    contactInput.value = contacts[0].contacto;
    _setContactHeaderFields(contacts[0]);
    return;
  }

  if (!contacts.length) {
    contactInput.value = '';
  }
  _setContactHeaderFields(null);
}

function applySelectedContact() {
  const clientInput = document.getElementById('cliente');
  const contactInput = document.getElementById('contactoCliente');
  if (!clientInput || !contactInput) return;

  const contacts = _clientsGetByClientName(clientInput.value);
  const selected = contacts.find(c => c.contacto.trim().toLowerCase() === contactInput.value.trim().toLowerCase());
  _setContactHeaderFields(selected || null);
}

function clientsResetAll() {
  if (!confirm('¿Vaciar por completo la base de clientes y contactos?')) return;
  NFS_CLIENTS.reset();
  _clientsRefreshFilter();
  _clientsRefreshHeaderList();
  clientsRenderTable();
}

function clientsExportJSON() {
  const blob = new Blob([NFS_CLIENTS.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clientes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clientsImportJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.contacts)) {
        alert('Archivo invalido. Debe contener un array "contacts".');
        return;
      }

      if (!confirm('¿Importar ' + parsed.contacts.length + ' contactos desde "' + file.name + '"?\nEsto reemplazara los datos actuales.')) return;
      NFS_CLIENTS.importObject(parsed);
      _clientsRefreshFilter();
      _clientsRefreshHeaderList();
      clientsRenderTable();
    } catch (err) {
      alert('Error al importar:\n' + err.message);
    }
  };
  input.click();
}

document.addEventListener('DOMContentLoaded', () => {
  NFS_CLIENTS.load();
  _clientsRefreshHeaderList();

  const clientInput = document.getElementById('cliente');
  const contactInput = document.getElementById('contactoCliente');
  if (clientInput) {
    clientInput.addEventListener('change', syncClientContacts);
    clientInput.addEventListener('input', syncClientContacts);
  }
  if (contactInput) {
    contactInput.addEventListener('change', applySelectedContact);
    contactInput.addEventListener('input', applySelectedContact);
  }
});
