// ===== Panel de administración · datos de ejemplo en localStorage (luego: API / Firestore) =====
const CLAVE = 'admin_datos_v2';
const GRACIA = 5; // días de gracia tras la fecha de pago; pasado el límite la baja es automática
const PLANES = { basico: { nombre: 'Básico', precio: 399 }, plus: { nombre: 'Plus', precio: 599 }, anual: { nombre: 'Premium', precio: 899 } };
const SALONES = ['Salón de yoga', 'Salón funcional', 'Salón de baile'];
// Roles: el administrador de gym ve todo; la recepción solo socios, instructores y salones.
// Esto solo oculta secciones en el navegador; la seguridad real se hará con Firebase Auth y requireRole en el servidor.
const ROL = sessionStorage.getItem('rol');
if (!['administrador', 'recepcionista'].includes(ROL)) location.replace('index.html');
const PERMISOS = { administrador: null, recepcionista: ['socios', 'instructores', 'salones'] };

const $ = (s) => document.querySelector(s);
const iso = (d) => d.toLocaleDateString('sv-SE');
const hoy = () => iso(new Date());
const sumar = (f, n) => { const d = new Date(f + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const dif = (a, b) => Math.round((new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')) / 864e5);
const moneda = (n) => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const fecha = (f) => (f ? new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function el(tag, clase = '', texto = '') { const e = document.createElement(tag); if (clase) e.className = clase; e.textContent = texto; return e; }
function btn(texto, clase, fn) { const b = el('button', 'btn ' + clase, texto); b.type = 'button'; b.addEventListener('click', fn); return b; }
function badge(texto, extra = '') { return el('span', 'estado ' + extra, texto); }
let toastT;
function avisar(m) { const t = $('#mp-toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }

function campo(nombre, etiqueta, valor = '', tipo = 'text', clase = '') {
  const d = el('div', clase); const id = 'f-' + nombre + uid();
  const l = el('label', 'form-label', etiqueta); l.htmlFor = id;
  const i = tipo === 'textarea' ? el('textarea', 'form-control') : el('input', 'form-control');
  if (tipo !== 'textarea') i.type = tipo;
  i.id = id; i.name = nombre; i.value = valor ?? ''; i.required = tipo !== 'textarea' && tipo !== 'text-opc';
  d.append(l, i); return d;
}
function selector(nombre, etiqueta, opciones, valor) {
  const d = el('div'); const l = el('label', 'form-label', etiqueta); const s = el('select', 'form-select'); s.name = nombre;
  opciones.forEach(([v, t]) => { const o = el('option', '', t); o.value = v; o.selected = v === valor; s.append(o); });
  d.append(l, s); return d;
}
function formulario(hijos, texto, alEnviar) {
  const f = el('form', 'ad-form'); f.noValidate = false;
  f.append(...hijos); const b = el('button', 'btn btn-primary', texto); b.type = 'submit'; f.append(b);
  f.addEventListener('submit', (e) => { e.preventDefault(); alEnviar(Object.fromEntries(new FormData(f))); });
  return f;
}
function tabla(cols, filas) {
  if (!filas.length) return el('p', 'mg-vacio', 'Sin registros todavía.');
  const w = el('div', 'ad-tabla'); const t = el('table', 'table mg-tabla'); const h = el('tr');
  cols.forEach((c) => h.append(el('th', '', c))); t.append(el('thead')); t.tHead.append(h);
  const tb = el('tbody');
  filas.forEach((f) => { const tr = el('tr'); f.forEach((c) => { const td = el('td'); td.append(c instanceof Node ? c : document.createTextNode(c ?? '')); tr.append(td); }); tb.append(tr); });
  t.append(tb); w.append(t); return w;
}
const acciones = (...bs) => { const d = el('div', 'ad-acc'); d.append(...bs); return d; };
const tarjeta = (...n) => { const c = el('article', 'mg-card mb-4'); c.append(...n); return c; };

// Ventana modal reutilizable
const dlg = $('#ad-dialogo');
function abrir(...nodos) {
  const m = el('menu'); m.append(btn('Cerrar', 'btn-outline-primary', () => dlg.close()));
  dlg.replaceChildren(...nodos, m); if (!dlg.open) dlg.showModal();
}
function pedir(titulo, etiqueta, textoBoton, alConfirmar) {
  abrir(el('h2', '', titulo), formulario([campo('v', etiqueta, '', 'text', 'ancho')], textoBoton, (d) => { alConfirmar(d.v.trim()); dlg.close(); }));
}

// ===== Datos =====
function semilla() {
  const h = hoy();
  const exp = (p, e, g) => ({ peso: p, estatura: e, grasa: g, lesiones: '', notas: '' });
  return {
        socios: [
      { id: 's1', codigo: 'PG-004722', nombre: 'Carlos Ramírez', plan: 'plus', proximoPago: sumar(h, 12), estado: 'activo', pagos: [{ fecha: sumar(h, -18), monto: 599 }], asistencia: [sumar(h, -1), sumar(h, -3), sumar(h, -6)], expediente: exp(82, 178, 21), rutina: 'Lunes: Pierna – Sentadilla 4x8\nMiércoles: Pecho – Press banca 4x10\nViernes: Espalda – Dominadas 4x8' },
      { id: 's2', codigo: 'PG-004801', nombre: 'Ana López', plan: 'basico', proximoPago: sumar(h, 3), estado: 'activo', pagos: [{ fecha: sumar(h, -27), monto: 399 }], asistencia: [sumar(h, -2)], expediente: exp(61, 165, 26), rutina: '' },
      { id: 's3', codigo: 'PG-004633', nombre: 'Miguel Torres', plan: 'anual', proximoPago: sumar(h, -2), estado: 'activo', pagos: [{ fecha: sumar(h, -32), monto: 899 }], asistencia: [], expediente: exp(90, 182, 24), rutina: '' },
      { id: 's4', codigo: 'PG-004915', nombre: 'Laura Vega', plan: 'plus', proximoPago: sumar(h, -9), estado: 'activo', pagos: [{ fecha: sumar(h, -39), monto: 599 }], asistencia: [], expediente: exp(58, 160, 23), rutina: '' },
    ],
    instructores: [
      { id: 'i1', nombre: 'Diego Hernández', especialidad: 'Fuerza e hipertrofia', estado: 'activo', dieta: 'Desayuno: avena con huevo\nComida: pollo, arroz y verduras\nCena: atún con ensalada', rutina: 'Plantilla fuerza 4 días (empuje / tirón / pierna / full body)' },
      { id: 'i2', nombre: 'Sofía Medina', especialidad: 'Yoga y movilidad', estado: 'activo', dieta: '', rutina: '' },
    ],
    reservas: [
      { id: 'r1', instructor: 'Sofía Medina', salon: 'Salón de yoga', dia: sumar(h, 2), horario: '18:00-19:00', actividad: 'Yoga para principiantes', estado: 'pendiente' },
      { id: 'r2', instructor: 'Diego Hernández', salon: 'Salón funcional', dia: sumar(h, 2), horario: '07:00-08:00', actividad: 'Circuito funcional', estado: 'aprobada' },
      { id: 'r3', instructor: 'Diego Hernández', salon: 'Salón funcional', dia: sumar(h, 2), horario: '07:30-08:30', actividad: 'Entrenamiento por parejas', estado: 'pendiente' },
      { id: 'r4', instructor: 'Sofía Medina', salon: 'Salón de baile', dia: sumar(h, 4), horario: '19:00-20:00', actividad: 'Zumba', estado: 'pendiente' },
    ],
    fallas: [
      { id: 'f1', equipo: 'Caminadora 3', reporta: 'Diego Hernández', descripcion: 'La banda se atora a alta velocidad', fecha: sumar(h, -2), estado: 'pendiente' },
      { id: 'f2', equipo: 'Polea alta', reporta: 'Sofía Medina', descripcion: 'Cable desgastado', fecha: sumar(h, -6), estado: 'revision' },
    ],
    equipos: [
      { id: 'e1', nombre: 'Caminadora 3', adquirido: sumar(h, -400), costo: 28000, estado: 'Operativo', historial: [] },
      { id: 'e2', nombre: 'Polea alta', adquirido: sumar(h, -700), costo: 15500, estado: 'En mantenimiento', historial: [{ fecha: sumar(h, -5), tipo: 'Mantenimiento', nota: 'Cambio de cable' }] },
    ],
    movs: [
      { id: 'm1', fecha: sumar(h, -18), tipo: 'ingreso', concepto: 'Mensualidad Plus · Carlos Ramírez', monto: 599 },
      { id: 'm2', fecha: sumar(h, -10), tipo: 'egreso', concepto: 'Renta del local', monto: 12000 },
      { id: 'm3', fecha: sumar(h, -4), tipo: 'egreso', concepto: 'Luz y agua', monto: 3200 },
    ],
  };
}
let DB;
try { DB = JSON.parse(localStorage.getItem(CLAVE)); } catch { DB = null; }
DB = DB || semilla();
const guardar = () => localStorage.setItem(CLAVE, JSON.stringify(DB));
const retardo = (s) => (s.estado === 'activo' ? Math.max(0, dif(hoy(), s.proximoPago)) : 0);
const limite = (s) => sumar(s.proximoPago, GRACIA);
const ingreso = (concepto, monto) => DB.movs.unshift({ id: uid(), fecha: hoy(), tipo: 'ingreso', concepto, monto });

// Baja automática: pasada la fecha límite de pago, el socio se da de baja solo
function revisarVencimientos() {
  const bajas = DB.socios.filter((s) => s.estado === 'activo' && hoy() > limite(s));
  bajas.forEach((s) => { s.estado = 'baja'; s.fechaBaja = hoy(); s.motivoBaja = 'Falta de pago (automática)'; });
  if (bajas.length) { guardar(); avisar(`${bajas.length} socio(s) dados de baja automáticamente por falta de pago`); }
}

// ===== Socios =====
const estadoSocio = (s) => (s.estado === 'baja' ? badge('Baja', 'vencido') : retardo(s) ? badge(`Retardo ${retardo(s)} d`, 'pend') : badge('Al corriente'));

function vistaSocios() {
  const v = el('div');
  const act = DB.socios.filter((s) => s.estado === 'activo');
  const r = el('div', 'ad-resumen');
  [['Activos', act.length], ['Con retardo', act.filter((s) => retardo(s)).length], ['Bajas', DB.socios.length - act.length]].forEach(([t, n]) => { const c = el('div', 'mg-card'); c.append(el('span', 'text-body-secondary', t), el('strong', '', n)); r.append(c); });
  const filas = [...DB.socios].sort((a, b) => a.proximoPago.localeCompare(b.proximoPago)).map((s) => [
    s.codigo, s.nombre, PLANES[s.plan].nombre, fecha(s.proximoPago), fecha(limite(s)), estadoSocio(s), btn('Gestionar', 'btn-outline-primary btn-sm', () => abrirSocio(s.id)),
  ]);
  v.append(r, tarjeta(el('h2', '', 'Socios'), tabla(['Código', 'Socio', 'Membresía', 'Próximo pago', 'Fecha límite', 'Estado', ''], filas)));
  return v;
}

function abrirSocio(id, tab = 'pagos') {
  const s = DB.socios.find((x) => x.id === id);
  const cab = el('div', 'd-flex justify-content-between align-items-center gap-3');
  const nom = el('div'); nom.append(el('h2', 'mb-0', s.nombre), el('small', 'text-body-secondary', s.codigo));
  cab.append(nom, estadoSocio(s));
  const tabs = el('div', 'ad-tabs');
  const T = { pagos: ['Membresía y pagos', pestPagos], asistencia: ['Asistencia', pestAsistencia], expediente: ['Expediente físico', pestExpediente], rutina: ['Rutina', pestRutina] };
  Object.entries(T).forEach(([k, [t]]) => tabs.append(btn(t, 'btn-outline-primary' + (k === tab ? ' activo' : ''), () => abrirSocio(id, k))));
  abrir(cab, tabs, T[tab][1](s));
}

function pestPagos(s) {
  const c = el('div'); const plan = PLANES[s.plan];
  const info = el('p', 'mb-3');
  info.textContent = s.estado === 'baja' ? `Baja el ${fecha(s.fechaBaja)}: ${s.motivoBaja}.` : `Próximo pago ${fecha(s.proximoPago)} · límite ${fecha(limite(s))} · ${retardo(s)} día(s) de retardo.`;
  const cambio = formulario([selector('plan', 'Membresía', Object.entries(PLANES).map(([k, p]) => [k, `${p.nombre} · ${moneda(p.precio)}`]), s.plan)], 'Cambiar plan', (d) => { s.plan = d.plan; guardar(); avisar('Membresía actualizada'); abrirSocio(s.id); });
  const pagar = btn(s.estado === 'baja' ? `Reactivar y cobrar ${moneda(plan.precio)}` : `Registrar pago ${moneda(plan.precio)}`, 'btn-primary', () => {
    const base = s.estado === 'baja' || retardo(s) > 0 ? hoy() : s.proximoPago;
    s.pagos.unshift({ fecha: hoy(), monto: plan.precio }); s.proximoPago = sumar(base, 30); s.estado = 'activo'; delete s.motivoBaja; delete s.fechaBaja;
    ingreso(`Mensualidad ${plan.nombre} · ${s.nombre}`, plan.precio); guardar(); avisar('Pago registrado'); abrirSocio(s.id);
  });
  c.append(info, cambio, pagar, el('h3', 'h5 mt-4', 'Historial de pagos'), tabla(['Fecha', 'Monto'], s.pagos.map((p) => [fecha(p.fecha), moneda(p.monto)])));
  if (s.estado === 'activo') c.append(el('h3', 'h5 mt-4', 'Baja por incumplimiento de reglas'), btn('Dar de baja', 'btn-danger', () =>
    pedir(`Baja de ${s.nombre}`, 'Regla incumplida', 'Confirmar baja', (m) => { s.estado = 'baja'; s.fechaBaja = hoy(); s.motivoBaja = 'Incumplimiento de reglas: ' + m; guardar(); avisar('Socio dado de baja'); })));
  return c;
}
function pestAsistencia(s) {
  const mes = s.asistencia.filter((f) => dif(hoy(), f) <= 30).length;
  const c = el('div');
  c.append(el('p', '', `${mes} asistencia(s) en los últimos 30 días.`),
    btn('Registrar asistencia de hoy', 'btn-primary mb-3', () => { if (s.asistencia.includes(hoy())) return avisar('Ya hay asistencia hoy'); s.asistencia.unshift(hoy()); guardar(); abrirSocio(s.id, 'asistencia'); }),
    tabla(['Fecha', ''], s.asistencia.slice(0, 10).map((f, i) => [fecha(f), btn('Quitar', 'btn-danger btn-sm', () => { s.asistencia.splice(i, 1); guardar(); avisar('Asistencia eliminada'); abrirSocio(s.id, 'asistencia'); })])));
  return c;
}

// Datos de solo lectura: lo que llenó el socio o el instructor desde su plataforma
function lectura(filas, vacio) {
  if (filas.every(([, v]) => !v)) return el('p', 'mg-vacio', vacio);
  const dl = el('dl', 'mg-filas mb-0');
  filas.forEach(([t, v]) => { const d = el('div'); d.append(el('dt', '', t), el('dd', 'ad-texto', v || '—')); dl.append(d); });
  return dl;
}
function pestExpediente(s) {
  const e = s.expediente;
  return lectura([['Peso', e.peso ? `${e.peso} kg` : ''], ['Estatura', e.estatura ? `${e.estatura} cm` : ''], ['% de grasa', e.grasa ? `${e.grasa} %` : ''], ['Lesiones o restricciones', e.lesiones], ['Notas', e.notas]], 'El socio aún no ha llenado su expediente.');
}
function pestRutina(s) {
  return lectura([['Rutina de entrenamiento', s.rutina]], 'El socio aún no tiene una rutina registrada.');
}

// ===== Instructores =====
const estadoInst = (i) => (i.estado === 'baja' ? badge('Baja', 'vencido') : badge('Activo'));

function vistaInstructores() {
  const alta = formulario([campo('nombre', 'Nombre'), campo('especialidad', 'Especialidad')], 'Agregar', (d) => { DB.instructores.push({ id: uid(), ...d, estado: 'activo', dieta: '', rutina: '' }); guardar(); vistaActual(); });
  const filas = DB.instructores.map((i) => [i.nombre, i.especialidad, i.dieta ? 'Registrada' : 'Sin registrar', i.rutina ? 'Registrada' : 'Sin registrar', estadoInst(i),
    acciones(btn('Ver', 'btn-outline-primary btn-sm', () => abrirInstructor(i)),
      ...(i.estado === 'baja' ? [] : [btn('Dar de baja', 'btn-danger btn-sm', () => pedir(`Baja de ${i.nombre}`, 'Motivo de la baja', 'Confirmar baja', (m) => { i.estado = 'baja'; i.fechaBaja = hoy(); i.motivoBaja = m; guardar(); avisar('Instructor dado de baja'); }))]))]);
  const v = el('div');
  v.append(tarjeta(el('h2', '', 'Nuevo instructor'), alta), tarjeta(el('h2', '', 'Instructores'), tabla(['Instructor', 'Especialidad', 'Dieta', 'Rutina', 'Estado', ''], filas)));
  return v;
}
function abrirInstructor(i) {
  const cab = el('div', 'd-flex justify-content-between align-items-center gap-3 mb-3'); cab.append(el('h2', 'mb-0', i.nombre), estadoInst(i));
  const c = el('div'); c.append(lectura([['Dieta', i.dieta], ['Rutina', i.rutina]], 'El instructor aún no ha registrado dietas ni rutinas.'));
  if (i.estado === 'baja') c.append(el('p', 'text-body-secondary mt-3 mb-0', `Baja el ${fecha(i.fechaBaja)}: ${i.motivoBaja}.`));
  abrir(cab, c);
}

// ===== Reservaciones de salones =====
const minutos = (h) => { const [a, b] = h.split(':'); return +a * 60 + +b; };
const rango = (h) => h.split('-').map(minutos);
function choca(r) {
  const [a, b] = rango(r.horario);
  return DB.reservas.find((o) => o.id !== r.id && o.estado === 'aprobada' && o.salon === r.salon && o.dia === r.dia && a < rango(o.horario)[1] && rango(o.horario)[0] < b);
}
function resolver(r, estado) {
  const o = estado === 'aprobada' && choca(r);
  if (o) return avisar(`Se empalma con ${o.actividad} (${o.horario})`);
  r.estado = estado; guardar(); vistaActual();
}
let salonActual = SALONES[0];
function vistaSalones() {
  const col = { pendiente: 'pend', aprobada: '', rechazada: 'vencido' };
  const tabs = el('div', 'ad-tabs');
  SALONES.forEach((n) => {
    const p = DB.reservas.filter((r) => r.salon === n && r.estado === 'pendiente').length;
    tabs.append(btn(p ? `${n} (${p})` : n, 'btn-outline-primary' + (n === salonActual ? ' activo' : ''), () => { salonActual = n; vistaActual(); }));
  });
  const filas = DB.reservas.filter((r) => r.salon === salonActual).sort((a, b) => a.dia.localeCompare(b.dia)).map((r) => [r.instructor, fecha(r.dia), r.horario.replace('-', ' – '), r.actividad, badge(r.estado, col[r.estado]),
    r.estado === 'pendiente' ? acciones(btn('Aprobar', 'btn-primary btn-sm', () => resolver(r, 'aprobada')), btn('Rechazar', 'btn-danger btn-sm', () => resolver(r, 'rechazada'))) : '']);
  return tarjeta(el('h2', '', 'Reservaciones de salones'), tabs, tabla(['Solicita', 'Día', 'Horario', 'Actividad', 'Estado', ''], filas));
}

// ===== Reportes de fallas =====
function vistaFallas() {
  const col = { pendiente: 'pend', revision: 'rev', completado: '' };
  const filas = DB.fallas.map((f) => {
    const s = selector('estado', '', [['pendiente', 'Pendiente'], ['revision', 'En revisión'], ['completado', 'Completado']], f.estado);
    s.querySelector('select').addEventListener('change', (e) => { f.estado = e.target.value; guardar(); vistaActual(); });
    s.querySelector('label').remove();
    return [f.equipo, f.reporta, f.descripcion, fecha(f.fecha), badge({ pendiente: 'Pendiente', revision: 'En revisión', completado: 'Completado' }[f.estado], col[f.estado]), s];
  });
  return tarjeta(el('h2', '', 'Fallas de equipo'), tabla(['Equipo', 'Reporta', 'Descripción', 'Fecha', 'Estado', 'Cambiar a'], filas));
}

// ===== Inventario =====
function vistaInventario() {
  const filas = DB.equipos.map((e) => {
    const col = e.estado === 'Operativo' ? '' : e.estado === 'Baja' ? 'vencido' : 'pend';
    const b = [];
    if (e.estado === 'Operativo') b.push(btn('Mantenimiento', 'btn-outline-primary btn-sm', () => pedir(`Mantenimiento · ${e.nombre}`, 'Motivo', 'Enviar', (n) => { e.estado = 'En mantenimiento'; e.historial.push({ fecha: hoy(), tipo: 'Mantenimiento', nota: n }); guardar(); vistaActual(); })));
    if (e.estado === 'En mantenimiento') b.push(btn('Terminar', 'btn-primary btn-sm', () => { e.estado = 'Operativo'; e.historial.push({ fecha: hoy(), tipo: 'Reparado', nota: '' }); guardar(); vistaActual(); }));
    if (e.estado !== 'Baja') b.push(btn('Dar de baja', 'btn-danger btn-sm', () => pedir(`Baja · ${e.nombre}`, 'Motivo de la baja', 'Confirmar', (n) => { e.estado = 'Baja'; e.historial.push({ fecha: hoy(), tipo: 'Baja', nota: n }); guardar(); vistaActual(); })));
    return [e.nombre, fecha(e.adquirido), moneda(e.costo), badge(e.estado, col), e.historial.filter((h) => h.tipo === 'Mantenimiento').length, acciones(...b)];
  });
  const alta = formulario([campo('nombre', 'Equipo'), campo('adquirido', 'Fecha', hoy(), 'date'), campo('costo', 'Costo (MXN)', '', 'number')], 'Registrar', (d) => {
    DB.equipos.push({ id: uid(), nombre: d.nombre, adquirido: d.adquirido, costo: +d.costo, estado: 'Operativo', historial: [] });
    DB.movs.unshift({ id: uid(), fecha: d.adquirido, tipo: 'egreso', concepto: 'Adquisición: ' + d.nombre, monto: +d.costo }); guardar(); vistaActual();
  });
  const v = el('div');
  v.append(tarjeta(el('h2', '', 'Nueva adquisición'), alta), tarjeta(el('h2', '', 'Inventario'), tabla(['Equipo', 'Adquirido', 'Costo', 'Estado', 'Mantenimientos', ''], filas)));
  return v;
}

// ===== Contabilidad =====
function vistaContabilidad() {
  const mes = DB.movs.filter((m) => m.fecha.startsWith(hoy().slice(0, 7)));
  const suma = (t) => mes.filter((m) => m.tipo === t).reduce((a, m) => a + m.monto, 0);
  const bal = suma('ingreso') - suma('egreso');
  const r = el('div', 'ad-resumen');
  [['Ingresos del mes', suma('ingreso'), ''], ['Egresos del mes', suma('egreso'), ''], ['Balance', bal, bal < 0 ? 'neg' : '']].forEach(([t, n, c]) => { const x = el('div', 'mg-card ' + c); x.append(el('span', 'text-body-secondary', t), el('strong', '', moneda(n))); r.append(x); });
  const form = formulario([selector('tipo', 'Tipo', [['ingreso', 'Ingreso'], ['egreso', 'Egreso']], 'egreso'), campo('concepto', 'Concepto'), campo('monto', 'Monto (MXN)', '', 'number'), campo('fecha', 'Fecha', hoy(), 'date')], 'Agregar movimiento', (d) => { DB.movs.unshift({ id: uid(), ...d, monto: +d.monto }); guardar(); vistaActual(); });
  const filas = [...DB.movs].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((m) => [fecha(m.fecha), m.concepto, badge(m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso', m.tipo === 'ingreso' ? '' : 'vencido'), moneda(m.monto)]);
  const v = el('div'); v.append(r, tarjeta(el('h2', '', 'Nuevo movimiento'), form), tarjeta(el('h2', '', 'Movimientos'), tabla(['Fecha', 'Concepto', 'Tipo', 'Monto'], filas)));
  return v;
}

// ===== Navegación =====
const SECCIONES = {
  socios: ['Socios', 'bi-people-fill', vistaSocios], instructores: ['Instructores', 'bi-person-badge-fill', vistaInstructores],
  salones: ['Salones', 'bi-door-open-fill', vistaSalones], fallas: ['Fallas', 'bi-tools', vistaFallas],
  inventario: ['Inventario', 'bi-box-seam-fill', vistaInventario], contabilidad: ['Contabilidad', 'bi-cash-coin', vistaContabilidad],
};
// Solo las secciones que el rol puede ver
const PERMITIDAS = Object.keys(SECCIONES).filter((k) => !PERMISOS[ROL] || PERMISOS[ROL].includes(k));
function vistaActual() {
  const k = PERMITIDAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'socios';
  document.querySelectorAll('.mg-link').forEach((a) => a.classList.toggle('activo', a.dataset.seccion === k));
  $('#vista').replaceChildren(SECCIONES[k][2]());
}
const nav = $('#ad-nav');
PERMITIDAS.forEach((k) => { const [t, i] = SECCIONES[k]; const a = el('a', 'mg-link'); a.href = '#' + k; a.dataset.seccion = k; a.append(el('i', 'bi ' + i), el('span', '', t)); nav.append(a); });
const salir = el('a', 'btn btn-primary mg-salir', 'Cerrar sesión'); salir.href = 'index.html'; nav.append(salir); // luego: Firebase Auth
dlg.addEventListener('close', vistaActual);
window.addEventListener('hashchange', vistaActual);
// La recepción ve su propio título
if (ROL === 'recepcionista') {
  $('#ad-titulo').textContent = 'Recepción';
  $('#ad-sub').textContent = 'Panel de recepción · Pulso Gym';
  document.title = 'Recepción · Pulso Gym';
}
revisarVencimientos();
vistaActual();