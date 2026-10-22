// ===== Datos de ejemplo (después vendrán de la API / Firestore) =====
const USUARIO = {
  nombre: 'Carlos Ramirez',
  correo: 'carlos.ramirez@correo.com',
  codigoUsuario: 'PG-004722',
  codigoBarras: '0047 2291 8836',
  foto: '', // ruta de la imagen, por ejemplo 'img/perfil.jpg'. Vacío = se muestran las iniciales
};

// Sesión iniciada (viene de js/cuentas.js)
const SESION = Cuentas.sesion() || {};
const ROL = document.documentElement.dataset.rol;
const ES_ENTRENADOR = ROL === 'instructor';
const PREFIJO = 'u_' + (SESION.id || 'anonimo') + '_'; // cada cuenta guarda sus propios datos
const CLAVE_OBJETIVOS = PREFIJO + 'objetivos';
Object.assign(USUARIO, {
  nombre: SESION.nombre || USUARIO.nombre,
  correo: SESION.correo || USUARIO.correo,
  codigoUsuario: SESION.codigo || USUARIO.codigoUsuario,
  codigoBarras: SESION.codigoBarras || USUARIO.codigoBarras,
});


const OBJETIVOS = ['Bajar 3 kg de grasa', 'Entrenar 4 días por semana', 'Sentadilla con 100 kg'];

// La rutina semanal se lee de localStorage ('mygym_rutina_semanal'). Forma esperada:
// { lunes: { nombre: 'Pierna', ejercicios: [{ ejercicio: 'Sentadilla', series: 4, repeticiones: 8 }] }, martes: {...}, ... }
// Claves: domingo, lunes, martes, miercoles, jueves, viernes, sabado
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function leer(clave, defecto) {
  try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; }
}
// Crea elementos con textContent (evita inyectar HTML)
function el(tag, clase = '', texto = '') {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  e.textContent = texto ?? '';
  return e;
}

function pintarSuscripcion() {
  const s = cargarSuscripcion();
  const plan = PLANES[s.planId];
  const tarjeta = s.tarjetas.find((t) => t.id === s.predeterminada);
  const activo = s.estado === 'activo';
  document.getElementById('s-usuario').textContent = USUARIO.nombre;
  document.getElementById('s-plan').textContent = plan.nombre;
  document.getElementById('s-costo').textContent = `${moneda(plan.precio)} / ${plan.periodo}`;
  document.getElementById('s-fecha').textContent = activo ? fechaLarga(s.proximaFacturacion) : 'Sin renovación';
  document.getElementById('s-pago').textContent = tarjeta ? textoTarjeta(tarjeta) : 'Sin tarjeta';
  const estado = document.getElementById('s-estado');
  estado.textContent = activo ? 'Activo' : 'Baja programada';
  estado.classList.toggle('vencido', !activo);
}

// Rutina del día: se elige sola según el día de hoy
let diaPintado = null;
function pintarRutina() {
  const hoy = new Date().getDay();
  if (hoy === diaPintado) return; // solo se vuelve a pintar cuando cambia el día
  diaPintado = hoy;

  const titulo = document.getElementById('r-dia');
  const cont = document.getElementById('r-contenido');
  const semana = leer(CLAVE_RUTINA, null);
  cont.replaceChildren();

  if (!semana) {
    titulo.textContent = NOMBRES_DIA[hoy];
    cont.innerHTML = '<div class="mg-vacio"><p class="mb-1">Aún no hay rutinas registradas.</p>' +
      '<a href="#rutinas" data-seccion="rutinas">Pulsa aquí para registrar una</a></div>';
    return;
  }

  const dia = semana[DIAS[hoy]];
  titulo.textContent = NOMBRES_DIA[hoy] + (dia?.nombre ? ' · ' + dia.nombre : '');
  if (!dia || !dia.ejercicios?.length) {
    cont.innerHTML = '<div class="mg-vacio"><p class="mb-0">Hoy es día de descanso.</p></div>';
    return;
  }

  const tabla = el('table', 'table mg-tabla');
  tabla.innerHTML = '<thead><tr><th>Ejercicio</th><th>Series</th><th>Repeticiones</th></tr></thead>';
  const cuerpo = el('tbody');
  dia.ejercicios.forEach((e) => {
    const tr = el('tr');
    [e.ejercicio, e.series, e.repeticiones].forEach((v) => tr.appendChild(el('td', '', v)));
    cuerpo.appendChild(tr);
  });
  tabla.appendChild(cuerpo);
  cont.appendChild(tabla);
}

// Objetivos con checklist (se guarda en localStorage)
function pintarObjetivos() {
  const ul = document.getElementById('objetivos');
  const marcados = leer('CLAVE_OBJETIVOS', []);
  OBJETIVOS.forEach((texto, i) => {
    const li = el('li', 'form-check mb-3');
    const input = el('input', 'form-check-input');
    input.type = 'checkbox';
    input.id = 'obj' + i;
    input.checked = marcados.includes(i);
    const label = el('label', 'form-check-label', texto);
    label.htmlFor = input.id;
    input.addEventListener('change', () => {
      const ids = [...ul.querySelectorAll('input:checked')].map((c) => Number(c.id.slice(3)));
      localStorage.setItem('CLAVE_OBJETIVOS', JSON.stringify(ids));
    });
    li.append(input, label);
    ul.appendChild(li);
  });
}

// Navegación de la barra lateral (por ahora solo Inicio tiene contenido)
function mostrar(nombre) {
  document.querySelectorAll('.mg-seccion').forEach((s) => { s.hidden = s.id !== nombre; });
  document.querySelectorAll('.mg-link').forEach((a) => a.classList.toggle('activo', a.dataset.seccion === nombre));
}
document.addEventListener('click', (e) => {
  const enlace = e.target.closest('[data-seccion]');
  if (!enlace) return;
  e.preventDefault();
  mostrar(enlace.dataset.seccion);
});

// Dibuja las barras a partir de los dígitos del código (cada código da un dibujo distinto)
function dibujarCodigo(cont, codigo) {
  cont.replaceChildren();
  cont.setAttribute('aria-label', 'Código de barras de acceso ' + codigo);
  const digitos = [...codigo.replace(/\D/g, '')].map(Number);
  const anchos = [1, 1, 1];
  digitos.forEach((d) => anchos.push((d % 3) + 1, ((d * 7) % 3) + 1, (d % 2) + 1));
  anchos.push(1, 1, 1);
  anchos.forEach((ancho, i) => {
    const barra = document.createElement('i');
    barra.style.flex = ancho;
    if (i % 2 === 1) barra.style.background = 'transparent'; // los impares son espacios
    cont.appendChild(barra);
  });
}

function pintarCodigos() {
  document.querySelectorAll('.js-barcode').forEach((c) => dibujarCodigo(c, USUARIO.codigoBarras));
  document.querySelectorAll('.js-codigo-num').forEach((p) => { p.textContent = USUARIO.codigoBarras; });
}

function pintarPerfil() {
  const u = USUARIO;
  document.getElementById('p-nombre').textContent = u.nombre;
  document.getElementById('p-correo').textContent = u.correo;
  document.getElementById('p-codigo').textContent = u.codigoUsuario;

  const avatar = document.getElementById('p-avatar');
  if (u.foto) {
    const img = el('img');
    img.src = u.foto;
    img.alt = 'Foto de perfil de ' + u.nombre;
    avatar.replaceChildren(img);
  } else {
    avatar.textContent = u.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  }

  const copiar = document.getElementById('p-copiar');
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(u.codigoUsuario);
      copiar.textContent = 'Copiado';
      setTimeout(() => { copiar.textContent = 'Copiar'; }, 1500);
    } catch { /* sin permiso para el portapapeles: no pasa nada */ }
  });
}

// ===== Rutinas: semana completa =====
const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // lunes a domingo (índices de DIAS)
const CLAVE_RUTINA = PREFIJO + 'rutina_semanal';
let editando = false;
let borrador = null; // copia de trabajo mientras se edita

function cargarSemana() {
  const guardada = leer(CLAVE_RUTINA, null);
  const semana = {};
  DIAS.forEach((clave) => {
    const d = guardada?.[clave] || {};
    semana[clave] = {
      nombre: d.nombre || '',
      descanso: !!d.descanso,
      ejercicios: (d.ejercicios || []).map((e) => ({
        ejercicio: e.ejercicio ?? '', series: e.series ?? '', repeticiones: e.repeticiones ?? '',
      })),
    };
  });
  return semana;
}

function cabeceraDia(nombreDia, esHoy) {
  const h = el('h3', 'rt-titulo', nombreDia);
  if (esHoy) h.appendChild(el('span', 'badge rt-hoy-badge', 'Hoy'));
  return h;
}

function mensajeDescanso() {
  const p = el('p', 'rt-vacio');
  p.innerHTML = '<i class="bi bi-moon-stars"></i> Día de descanso';
  return p;
}

function diaLectura(i, d, esHoy) {
  const card = el('article', 'mg-card rt-dia' + (esHoy ? ' rt-hoy' : ''));
  card.appendChild(cabeceraDia(NOMBRES_DIA[i], esHoy));
  if (d.descanso) { card.appendChild(mensajeDescanso()); return card; }
  if (d.nombre) card.appendChild(el('p', 'mg-dia mb-2', d.nombre));
  if (!d.ejercicios.length) { card.appendChild(el('p', 'rt-vacio', 'Sin ejercicios aún')); return card; }
  const ul = el('ul', 'rt-lista');
  d.ejercicios.forEach((e) => {
    const li = el('li');
    li.append(el('span', '', e.ejercicio), el('span', 'rt-serie', `${e.series || '–'} × ${e.repeticiones || '–'}`));
    ul.appendChild(li);
  });
  card.appendChild(ul);
  return card;
}

function campo(obj, clave, etiqueta, tipo) {
  const inp = el('input', 'form-control form-control-sm');
  inp.type = tipo;
  inp.placeholder = etiqueta;
  inp.setAttribute('aria-label', etiqueta);
  inp.value = obj[clave];
  if (tipo === 'number') { inp.min = 1; inp.max = 20; } else { inp.maxLength = clave === 'ejercicio' ? 40 : 10; }
  inp.oninput = () => { obj[clave] = inp.value; }; // solo guarda en el borrador, no vuelve a pintar
  return inp;
}

function diaEditable(clave, i, d, esHoy) {
  const card = el('article', 'mg-card rt-dia' + (esHoy ? ' rt-hoy' : ''));
  card.appendChild(cabeceraDia(NOMBRES_DIA[i], esHoy));

  const sw = el('div', 'form-check form-switch mb-3');
  const chk = el('input', 'form-check-input');
  chk.type = 'checkbox';
  chk.setAttribute('role', 'switch');
  chk.id = 'desc-' + clave;
  chk.checked = d.descanso;
  chk.onchange = () => { d.descanso = chk.checked; pintarSemana(); };
  const lab = el('label', 'form-check-label', 'Día de descanso');
  lab.htmlFor = chk.id;
  sw.append(chk, lab);
  card.appendChild(sw);
  if (d.descanso) { card.appendChild(mensajeDescanso()); return card; }

  const nombre = el('input', 'form-control form-control-sm mb-3');
  nombre.placeholder = 'Nombre (ej. Pierna)';
  nombre.maxLength = 30;
  nombre.value = d.nombre;
  nombre.setAttribute('aria-label', 'Nombre de la rutina del ' + NOMBRES_DIA[i]);
  nombre.oninput = () => { d.nombre = nombre.value; };
  card.appendChild(nombre);

  d.ejercicios.forEach((e, n) => {
    const fila = el('div', 'rt-fila');
    const quitar = el('button', 'btn btn-sm rt-quitar', '✕');
    quitar.type = 'button';
    quitar.setAttribute('aria-label', 'Quitar ejercicio');
    quitar.onclick = () => { d.ejercicios.splice(n, 1); pintarSemana(); };
    fila.append(campo(e, 'ejercicio', 'Ejercicio', 'text'), campo(e, 'series', 'Series', 'number'), campo(e, 'repeticiones', 'Reps', 'text'), quitar);
    card.appendChild(fila);
  });

  const mas = el('button', 'btn btn-outline-primary btn-sm mt-2', '+ Agregar ejercicio');
  mas.type = 'button';
  mas.onclick = () => { d.ejercicios.push({ ejercicio: '', series: '', repeticiones: '' }); pintarSemana(); };
  card.appendChild(mas);
  return card;
}

function tarjetaResumen(semana) {
  const dias = DIAS.map((k) => semana[k]);
  const datos = [
    [dias.filter((d) => !d.descanso && d.ejercicios.length).length, 'días de entrenamiento'],
    [dias.filter((d) => d.descanso).length, 'días de descanso'],
    [dias.reduce((suma, d) => suma + d.ejercicios.length, 0), 'ejercicios en la semana'],
  ];
  const col = el('div', 'col-12 col-md-6 col-xl-3');
  const card = el('article', 'mg-card rt-dia');
  card.appendChild(el('h3', 'rt-titulo', 'Resumen'));
  datos.forEach(([n, texto]) => {
    const p = el('p', 'mb-2');
    p.append(el('span', 'rt-num', n), el('small', 'ms-2 text-body-secondary', texto));
    card.appendChild(p);
  });
  col.appendChild(card);
  return col;
}

function guardarSemana() {
  const limpia = {};
  DIAS.forEach((clave) => {
    const d = borrador[clave];
    limpia[clave] = {
      nombre: d.descanso ? '' : String(d.nombre).trim(),
      descanso: d.descanso,
      ejercicios: d.descanso ? [] : d.ejercicios
        .map((e) => ({ ejercicio: String(e.ejercicio).trim(), series: String(e.series).trim(), repeticiones: String(e.repeticiones).trim() }))
        .filter((e) => e.ejercicio), // ignora filas sin nombre de ejercicio
    };
  });
  const aviso = document.getElementById('rt-aviso');
  try {
    localStorage.setItem(CLAVE_RUTINA, JSON.stringify(limpia));
  } catch {
    aviso.textContent = 'No se pudo guardar la rutina en este navegador.';
    return;
  }
  editando = false;
  borrador = null;
  pintarSemana();
  diaPintado = null; // fuerza a Inicio a leer la rutina nueva
  pintarRutina();
  aviso.textContent = 'Rutina guardada. Ya aparece en Inicio.';
  setTimeout(() => { aviso.textContent = ''; }, 3000);
}

function pintarSemana() {
  const cont = document.getElementById('semana');
  const acciones = document.getElementById('rt-acciones');
  const hayRutina = localStorage.getItem(CLAVE_RUTINA) !== null;
  const semana = editando ? borrador : cargarSemana();
  const hoy = new Date().getDay();
  cont.replaceChildren();
  acciones.replaceChildren();

  if (editando) {
    const guardar = el('button', 'btn btn-primary', 'Guardar cambios');
    const cancelar = el('button', 'btn btn-outline-primary', 'Cancelar');
    guardar.type = 'button';
    cancelar.type = 'button';
    guardar.onclick = guardarSemana;
    cancelar.onclick = () => { editando = false; borrador = null; pintarSemana(); };
    acciones.append(guardar, cancelar);
  } else {
    const editar = el('button', 'btn btn-primary', hayRutina ? 'Editar rutina' : 'Crear mi rutina');
    editar.type = 'button';
    editar.onclick = () => { borrador = cargarSemana(); editando = true; pintarSemana(); };
    acciones.appendChild(editar);
  }

  ORDEN_SEMANA.forEach((i) => {
    const d = semana[DIAS[i]];
    const col = el('div', editando ? 'col-12 col-lg-6' : 'col-12 col-md-6 col-xl-3');
    col.appendChild(editando ? diaEditable(DIAS[i], i, d, i === hoy) : diaLectura(i, d, i === hoy));
    cont.appendChild(col);
  });
  if (!editando) cont.appendChild(tarjetaResumen(semana));
}

// ===== Dietas =====
const CLAVE_DIETA = PREFIJO + 'dieta_semanal';
const CATEGORIAS = {
  proteinas: { nombre: 'Proteínas', color: '#2dff72' },
  carbohidratos: { nombre: 'Carbohidratos', color: '#ffd23f' },
  grasas: { nombre: 'Grasas', color: '#ff7a45' },
  fibra: { nombre: 'Fibra', color: '#4cc9f0' },
  otros: { nombre: 'Otros', color: '#b388ff' },
};
// Forma guardada: { lunes: [ { nombre, descripcion, items: [ { categoria, gramos } ] } ], martes: [...], ... }
let dtEditando = false;
let dtBorrador = null;

function cargarDieta() {
  const guardada = leer(CLAVE_DIETA, null);
  const dieta = {};
  DIAS.forEach((clave) => {
    dieta[clave] = (guardada?.[clave] || []).map((c) => ({
      nombre: c.nombre ?? '',
      descripcion: c.descripcion ?? '',
      items: (c.items || []).map((x) => ({ categoria: CATEGORIAS[x.categoria] ? x.categoria : 'otros', gramos: x.gramos ?? '' })),
    }));
  });
  return dieta;
}

// Suma los gramos por categoría de una lista de comidas
function totalesDe(comidas) {
  const t = Object.fromEntries(Object.keys(CATEGORIAS).map((k) => [k, 0]));
  comidas.forEach((c) => c.items.forEach((x) => { t[x.categoria] += Number(x.gramos) || 0; }));
  return t;
}

function chip(categoria, gramos) {
  const s = el('span', 'dt-chip');
  const punto = el('i');
  punto.style.background = CATEGORIAS[categoria].color;
  s.append(punto, `${CATEGORIAS[categoria].nombre} ${gramos || 0} g`);
  return s;
}

function bloqueComida(c) {
  const b = el('div', 'dt-comida');
  b.appendChild(el('p', 'dt-comida-nombre', c.nombre || 'Comida'));
  if (c.descripcion) b.appendChild(el('p', 'dt-desc', c.descripcion));
  const fila = el('div', 'dt-chips');
  c.items.forEach((x) => fila.appendChild(chip(x.categoria, x.gramos)));
  b.appendChild(fila);
  return b;
}

function resumenTotales(t, titulo) {
  const caja = el('div', 'dt-total');
  caja.appendChild(el('p', 'dt-total-titulo', titulo));
  const fila = el('div', 'dt-chips');
  Object.keys(CATEGORIAS).filter((k) => t[k] > 0).forEach((k) => fila.appendChild(chip(k, Math.round(t[k]))));
  caja.appendChild(fila);
  return caja;
}

// Card izquierda: dieta del día (siempre con lo guardado)
function pintarDietaHoy(dieta, hayDieta) {
  const cont = document.getElementById('dt-hoy');
  const hoy = new Date().getDay();
  document.getElementById('dt-hoy-dia').textContent = NOMBRES_DIA[hoy];
  cont.replaceChildren();
  if (!hayDieta) {
    cont.innerHTML = '<div class="mg-vacio"><p class="mb-1">Aún no hay dieta registrada.</p>' +
      '<a href="#dt-semana" data-dieta="editar">Pulsa aquí para registrar una</a></div>';
    return;
  }
  const comidas = dieta[DIAS[hoy]];
  if (!comidas.length) { cont.appendChild(el('p', 'rt-vacio', 'No hay comidas registradas para hoy.')); return; }
  comidas.forEach((c) => cont.appendChild(bloqueComida(c)));
  cont.appendChild(resumenTotales(totalesDe(comidas), 'Total del día'));
}

// Card derecha: gráfica de pastel (dona) con el reparto de la semana
function pintarGrafica(dieta) {
  const cont = document.getElementById('dt-grafica');
  const t = totalesDe(DIAS.flatMap((k) => dieta[k]));
  const total = Object.values(t).reduce((a, b) => a + b, 0);
  cont.replaceChildren();
  if (!total) { cont.appendChild(el('p', 'rt-vacio', 'Registra tu dieta para ver el reparto de la semana.')); return; }

  let acumulado = 0;
  const tramos = [];
  const leyenda = el('ul', 'dt-leyenda');
  Object.keys(CATEGORIAS).forEach((k) => {
    if (!t[k]) return;
    const pct = (t[k] / total) * 100;
    tramos.push(`${CATEGORIAS[k].color} ${acumulado}% ${acumulado + pct}%`);
    acumulado += pct;
    const punto = el('i');
    punto.style.background = CATEGORIAS[k].color;
    const li = el('li');
    li.append(punto, el('span', '', CATEGORIAS[k].nombre), el('strong', '', `${Math.round(pct)}%`), el('small', '', `${Math.round(t[k])} g`));
    leyenda.appendChild(li);
  });

  const pastel = el('div', 'dt-pastel');
  pastel.style.background = `conic-gradient(${tramos.join(', ')})`;
  pastel.setAttribute('role', 'img');
  pastel.setAttribute('aria-label', 'Gráfica de pastel con el reparto semanal de nutrientes');
  const centro = el('div', 'dt-pastel-centro');
  centro.append(el('strong', '', `${Math.round(total)} g`), el('small', '', 'en la semana'));
  pastel.appendChild(centro);
  cont.append(pastel, leyenda);
}

function diaDietaLectura(i, comidas, esHoy) {
  const card = el('article', 'mg-card rt-dia' + (esHoy ? ' rt-hoy' : ''));
  card.appendChild(cabeceraDia(NOMBRES_DIA[i], esHoy));
  if (!comidas.length) { card.appendChild(el('p', 'rt-vacio', 'Sin comidas aún')); return card; }
  comidas.forEach((c) => card.appendChild(bloqueComida(c)));
  return card;
}

function tarjetaPromedio(dieta) {
  const t = totalesDe(DIAS.flatMap((k) => dieta[k]));
  const con = Object.keys(CATEGORIAS).filter((k) => t[k] > 0);
  const col = el('div', 'col-12 col-md-6 col-xl-3');
  const card = el('article', 'mg-card rt-dia');
  card.appendChild(el('h3', 'rt-titulo', 'Promedio diario'));
  if (!con.length) {
    card.appendChild(el('p', 'rt-vacio', 'Sin datos aún'));
  } else {
    const fila = el('div', 'dt-chips');
    con.forEach((k) => fila.appendChild(chip(k, Math.round(t[k] / 7))));
    card.appendChild(fila);
  }
  col.appendChild(card);
  return col;
}

function campoDt(obj, clave, etiqueta, tipo, max) {
  const inp = el('input', 'form-control form-control-sm');
  inp.type = tipo;
  inp.placeholder = etiqueta;
  inp.setAttribute('aria-label', etiqueta);
  inp.value = obj[clave];
  if (tipo === 'number') { inp.min = 0; inp.max = 2000; } else { inp.maxLength = max; }
  inp.oninput = () => { obj[clave] = inp.value; }; // solo actualiza el borrador
  return inp;
}

function botonQuitar(etiqueta, accion) {
  const b = el('button', 'btn btn-sm rt-quitar', '✕');
  b.type = 'button';
  b.setAttribute('aria-label', etiqueta);
  b.onclick = accion;
  return b;
}

function diaDietaEditable(i, comidas, esHoy) {
  const card = el('article', 'mg-card rt-dia' + (esHoy ? ' rt-hoy' : ''));
  card.appendChild(cabeceraDia(NOMBRES_DIA[i], esHoy));

  comidas.forEach((c, n) => {
    const caja = el('div', 'dt-comida dt-edit');
    const cab = el('div', 'dt-cab');
    const nombre = campoDt(c, 'nombre', 'Comida (ej. Desayuno)', 'text', 30);
    nombre.setAttribute('list', 'dl-comidas');
    cab.append(nombre, botonQuitar('Quitar comida', () => { comidas.splice(n, 1); pintarSemanaDieta(); }));
    caja.append(cab, campoDt(c, 'descripcion', 'Descripción (ej. Avena con plátano)', 'text', 120));
    caja.lastChild.classList.add('mb-2');

    c.items.forEach((x, m) => {
      const fila = el('div', 'dt-fila');
      const sel = el('select', 'form-select form-select-sm');
      sel.setAttribute('aria-label', 'Categoría');
      Object.entries(CATEGORIAS).forEach(([k, v]) => {
        const o = el('option', '', v.nombre);
        o.value = k;
        sel.appendChild(o);
      });
      sel.value = x.categoria;
      sel.onchange = () => { x.categoria = sel.value; };
      fila.append(sel, campoDt(x, 'gramos', 'g', 'number'), botonQuitar('Quitar nutriente', () => { c.items.splice(m, 1); pintarSemanaDieta(); }));
      caja.appendChild(fila);
    });

    const masItem = el('button', 'btn btn-outline-primary btn-sm', '+ Nutriente');
    masItem.type = 'button';
    masItem.onclick = () => { c.items.push({ categoria: 'proteinas', gramos: '' }); pintarSemanaDieta(); };
    caja.appendChild(masItem);
    card.appendChild(caja);
  });

  const masComida = el('button', 'btn btn-outline-primary btn-sm', '+ Agregar comida');
  masComida.type = 'button';
  masComida.onclick = () => { comidas.push({ nombre: '', descripcion: '', items: [] }); pintarSemanaDieta(); };
  card.appendChild(masComida);
  return card;
}

function iniciarEdicionDieta() {
  dtBorrador = cargarDieta();
  dtEditando = true;
  pintarSemanaDieta();
}

function guardarDieta() {
  const limpia = {};
  DIAS.forEach((clave) => {
    limpia[clave] = dtBorrador[clave]
      .map((c) => ({
        nombre: String(c.nombre).trim(),
        descripcion: String(c.descripcion).trim(),
        items: c.items.map((x) => ({ categoria: x.categoria, gramos: Number(x.gramos) || 0 })).filter((x) => x.gramos > 0),
      }))
      .filter((c) => c.nombre || c.descripcion || c.items.length); // descarta comidas totalmente vacías
  });
  const aviso = document.getElementById('dt-aviso');
  try {
    localStorage.setItem(CLAVE_DIETA, JSON.stringify(limpia));
  } catch {
    aviso.textContent = 'No se pudo guardar la dieta en este navegador.';
    return;
  }
  dtEditando = false;
  dtBorrador = null;
  pintarDieta();
  aviso.textContent = 'Dieta guardada.';
  setTimeout(() => { aviso.textContent = ''; }, 3000);
}

// Dieta semanal (lectura o edición)
function pintarSemanaDieta() {
  const cont = document.getElementById('dt-semana-lista');
  const acciones = document.getElementById('dt-acciones');
  const hayDieta = localStorage.getItem(CLAVE_DIETA) !== null;
  const dieta = dtEditando ? dtBorrador : cargarDieta();
  const hoy = new Date().getDay();
  cont.replaceChildren();
  acciones.replaceChildren();

  if (dtEditando) {
    const guardar = el('button', 'btn btn-primary', 'Guardar cambios');
    const cancelar = el('button', 'btn btn-outline-primary', 'Cancelar');
    guardar.type = 'button';
    cancelar.type = 'button';
    guardar.onclick = guardarDieta;
    cancelar.onclick = () => { dtEditando = false; dtBorrador = null; pintarSemanaDieta(); };
    acciones.append(guardar, cancelar);
  } else {
    const editar = el('button', 'btn btn-primary', hayDieta ? 'Editar dieta' : 'Crear mi dieta');
    editar.type = 'button';
    editar.onclick = iniciarEdicionDieta;
    acciones.appendChild(editar);
  }

  ORDEN_SEMANA.forEach((i) => {
    const col = el('div', dtEditando ? 'col-12 col-lg-6' : 'col-12 col-md-6 col-xl-3');
    const comidas = dieta[DIAS[i]];
    col.appendChild(dtEditando ? diaDietaEditable(i, comidas, i === hoy) : diaDietaLectura(i, comidas, i === hoy));
    cont.appendChild(col);
  });
  if (!dtEditando) cont.appendChild(tarjetaPromedio(dieta));
}

// Pinta todo: hoy y gráfica con lo guardado, semana según el modo
function pintarDieta() {
  const guardada = cargarDieta();
  pintarDietaHoy(guardada, localStorage.getItem(CLAVE_DIETA) !== null);
  pintarGrafica(guardada);
  pintarSemanaDieta();
}

// Enlace "Pulsa aquí para registrar una": abre el editor y baja hasta él
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-dieta="editar"]')) return;
  e.preventDefault();
  if (!dtEditando) iniciarEdicionDieta();
  document.getElementById('dt-semana').scrollIntoView({ behavior: 'smooth' });
});

// ===== Mi plan =====
// Los planes y precios son los del index original
const PLANES = {
  basico: { nombre: 'Básico', precio: 399, periodo: 'mes', caracteristicas: ['Acceso a sala de pesas y cardio', 'Horario de 6:00 a 16:00', 'Portal con tu expediente'] },
  plus: { nombre: 'Plus', precio: 599, periodo: 'mes', destacado: true, caracteristicas: ['Todo el horario, sin restricciones', 'Clases grupales incluidas', 'Rutinas y dieta de tu instructor'] },
  anual: { nombre: 'Premium', precio: 899, periodo: 'mes', caracteristicas: ['Todo lo del plan Plus', 'Dos meses gratis', 'Asesoria personalizada' ] },
};
const CLAVE_SUSCRIPCION = PREFIJO + 'suscripcion';
const moneda = (n) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const fechaLarga = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const textoTarjeta = (t) => `${t.marca} •••• ${t.ultimos4}`;

// Forma guardada: { planId, estado: 'activo' | 'baja', proximaFacturacion, tarjetas: [{ id, marca, ultimos4, titular, vence }], predeterminada }
function cargarSuscripcion() {
  const base = {
    planId: 'plus',
    estado: 'activo',
    proximaFacturacion: '2026-11-15',
    tarjetas: [{ id: 't1', marca: 'Visa', ultimos4: '4417', titular: USUARIO.nombre, vence: '09/28' }],
    predeterminada: 't1',
  };
  const s = { ...base, ...(leer(CLAVE_SUSCRIPCION, null) || {}) };
  if (!PLANES[s.planId]) s.planId = 'plus';
  return s;
}

let temporizadorAviso;
function avisoPlan(texto) {
  const t = document.getElementById('mp-toast');
  t.textContent = texto;
  t.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { t.hidden = true; }, 3500);
}

// Guarda, y vuelve a pintar Mi plan y la franja de Inicio
function actualizar(s, mensaje) {
  try {
    localStorage.setItem(CLAVE_SUSCRIPCION, JSON.stringify(s));
  } catch {
    avisoPlan('No se pudo guardar el cambio en este navegador.');
    return;
  }
  pintarSuscripcion();
  pintarMiPlan();
  if (mensaje) avisoPlan(mensaje);
}

// Cuadro de confirmación: devuelve true si la persona acepta
function confirmar(titulo, texto, textoBoton, peligro) {
  const dlg = document.getElementById('mp-dialogo');
  document.getElementById('mp-dlg-titulo').textContent = titulo;
  document.getElementById('mp-dlg-texto').textContent = texto;
  const ok = document.getElementById('mp-dlg-ok');
  ok.textContent = textoBoton;
  ok.className = 'btn ' + (peligro ? 'btn-danger' : 'btn-primary');
  return new Promise((resolver) => {
    dlg.returnValue = '';
    dlg.addEventListener('close', () => resolver(dlg.returnValue === 'ok'), { once: true });
    dlg.showModal();
  });
}

function pintarTarjetas(s) {
  const ul = document.getElementById('mp-tarjetas');
  ul.replaceChildren();
  if (!s.tarjetas.length) ul.appendChild(el('li', 'rt-vacio', 'No tienes tarjetas registradas.'));
  s.tarjetas.forEach((t) => {
    const li = el('li', 'mp-tarjeta');
    const info = el('div');
    info.append(el('strong', '', textoTarjeta(t)), el('small', '', `${t.titular} · Vence ${t.vence}`));
    const acciones = el('div', 'mp-acciones');
    if (t.id === s.predeterminada) {
      acciones.appendChild(el('span', 'mp-badge', 'Predeterminada'));
    } else {
      const usar = el('button', 'btn btn-outline-primary btn-sm', 'Usar para mis pagos');
      usar.type = 'button';
      usar.onclick = () => actualizar({ ...cargarSuscripcion(), predeterminada: t.id }, `Ahora pagas con ${textoTarjeta(t)}.`);
      acciones.appendChild(usar);
    }
    const borrar = el('button', 'btn btn-outline-danger btn-sm', 'Eliminar');
    borrar.type = 'button';
    borrar.onclick = () => eliminarTarjeta(t.id);
    acciones.appendChild(borrar);
    li.append(info, acciones);
    ul.appendChild(li);
  });
}

async function eliminarTarjeta(id) {
  const s = cargarSuscripcion();
  const t = s.tarjetas.find((x) => x.id === id);
  if (s.estado === 'activo' && s.tarjetas.length === 1) {
    avisoPlan('Necesitas al menos una tarjeta para mantener tu plan. Agrega otra antes de eliminar esta.');
    return;
  }
  if (!(await confirmar('¿Eliminar tarjeta?', `Se eliminará ${textoTarjeta(t)}.`, 'Eliminar', true))) return;
  s.tarjetas = s.tarjetas.filter((x) => x.id !== id);
  if (s.predeterminada === id) s.predeterminada = s.tarjetas[0]?.id ?? null;
  actualizar(s, 'Tarjeta eliminada.');
}

function pintarPlanes(s) {
  const cont = document.getElementById('mp-planes');
  const activo = s.estado === 'activo';
  cont.replaceChildren();
  Object.entries(PLANES).forEach(([id, p]) => {
    const esActual = id === s.planId;
    const col = el('div', 'col-12 col-md-6 col-xl-4');
    const card = el('article', 'mg-card mp-plan' + (esActual ? ' mp-plan-actual' : ''));
    if (esActual) card.appendChild(el('span', 'mp-tag', 'Tu plan actual'));
    else if (p.destacado) card.appendChild(el('span', 'mp-tag', 'El más elegido'));
    card.append(el('h3', '', p.nombre), el('p', 'mp-precio', `${moneda(p.precio)} / ${p.periodo}`));
    const ul = el('ul', 'mp-lista');
    p.caracteristicas.forEach((c) => ul.appendChild(el('li', '', c)));
    const boton = el('button', 'btn ' + (esActual ? 'btn-outline-primary' : 'btn-primary'), esActual ? 'Plan actual' : `Cambiar a ${p.nombre}`);
    boton.type = 'button';
    boton.disabled = esActual || !activo;
    boton.onclick = () => cambiarPlan(id);
    card.append(ul, boton);
    col.appendChild(card);
    cont.appendChild(col);
  });
}

async function cambiarPlan(id) {
  const p = PLANES[id];
  const texto = `Pagarás ${moneda(p.precio)} / ${p.periodo}. Podrás volver a cambiarlo cuando quieras.`;
  if (!(await confirmar(`¿Cambiar al plan ${p.nombre}?`, texto, 'Cambiar plan', false))) return;
  actualizar({ ...cargarSuscripcion(), planId: id }, `Ahora tienes el plan ${p.nombre}.`);
}

function pintarMiPlan() {
  const s = cargarSuscripcion();
  const plan = PLANES[s.planId];
  const activo = s.estado === 'activo';
  const tarjeta = s.tarjetas.find((t) => t.id === s.predeterminada);
  const fijar = (id, texto) => { document.getElementById(id).textContent = texto; };

  fijar('mp-nombre', plan.nombre);
  fijar('mp-precio', `${moneda(plan.precio)} / ${plan.periodo}`);
  document.getElementById('mp-caracteristicas').replaceChildren(...plan.caracteristicas.map((c) => el('li', '', c)));
  fijar('mp-usuario', USUARIO.nombre);
  fijar('mp-fecha', activo ? fechaLarga(s.proximaFacturacion) : 'Sin renovación');
  fijar('mp-pago', tarjeta ? textoTarjeta(tarjeta) : 'Sin tarjeta');
  fijar('mp-pago-resumen', tarjeta ? `Pagas con ${textoTarjeta(tarjeta)}.` : 'Aún no tienes una tarjeta registrada.');
  const estado = document.getElementById('mp-estado');
  estado.textContent = activo ? 'Activo' : 'Baja programada';
  estado.classList.toggle('vencido', !activo);

  fijar('mp-planes-nota', activo ? 'Elige el plan que mejor se adapte a ti.' : 'Reactiva tu plan para poder cambiarlo.');
  fijar('mp-baja-texto', activo
    ? `Conservarás el acceso hasta el ${fechaLarga(s.proximaFacturacion)} y no se te volverá a cobrar.`
    : `Tu plan está dado de baja. Tu acceso termina el ${fechaLarga(s.proximaFacturacion)}.`);
  const botonBaja = document.getElementById('mp-btn-baja');
  botonBaja.textContent = activo ? 'Dar de baja mi plan' : 'Reactivar mi plan';
  botonBaja.className = 'btn ' + (activo ? 'btn-danger' : 'btn-primary');

  pintarTarjetas(s);
  pintarPlanes(s);
}

// Dar de baja / reactivar
document.getElementById('mp-btn-baja').addEventListener('click', async () => {
  const s = cargarSuscripcion();
  if (s.estado === 'activo') {
    const texto = `Conservarás el acceso hasta el ${fechaLarga(s.proximaFacturacion)}. Después de esa fecha no se te cobrará y no podrás entrar al gimnasio. Puedes reactivarlo antes.`;
    if (!(await confirmar('¿Dar de baja tu plan?', texto, 'Sí, dar de baja', true))) return;
    actualizar({ ...s, estado: 'baja' }, 'Tu plan quedó dado de baja.');
  } else if (!s.tarjetas.length) {
    avisoPlan('Agrega una tarjeta para reactivar tu plan.');
  } else {
    actualizar({ ...s, estado: 'activo' }, 'Tu plan se reactivó.');
  }
});

// Submenú de método de pago
const botonPago = document.getElementById('mp-btn-pago');
botonPago.addEventListener('click', () => {
  const sub = document.getElementById('mp-submenu');
  sub.hidden = !sub.hidden;
  botonPago.setAttribute('aria-expanded', String(!sub.hidden));
  botonPago.textContent = sub.hidden ? 'Modificar método de pago' : 'Cerrar';
});

// Agregar tarjeta (solo se guardan marca, últimos 4 dígitos, titular y vencimiento)
const formTarjeta = document.getElementById('mp-form');
function cerrarFormTarjeta() {
  formTarjeta.reset();
  formTarjeta.classList.remove('was-validated');
  formTarjeta.hidden = true;
}
document.getElementById('mp-btn-agregar').addEventListener('click', () => {
  formTarjeta.hidden = false;
  formTarjeta.titular.focus();
});
document.getElementById('mp-form-cancelar').addEventListener('click', cerrarFormTarjeta);
formTarjeta.addEventListener('submit', (e) => {
  e.preventDefault();
  const [mm, aa] = formTarjeta.vence.value.split('/').map(Number);
  const hoy = new Date();
  const anio = 2000 + aa;
  const vigente = anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mm >= hoy.getMonth() + 1);
  formTarjeta.vence.setCustomValidity(vigente ? '' : 'Vencida');
  formTarjeta.classList.add('was-validated');
  if (!formTarjeta.checkValidity()) return;
  const s = cargarSuscripcion();
  const nueva = {
    id: 't' + Date.now(),
    marca: formTarjeta.marca.value,
    ultimos4: formTarjeta.ultimos4.value,
    titular: formTarjeta.titular.value.trim(),
    vence: formTarjeta.vence.value,
  };
  s.tarjetas.push(nueva);
  if (!s.predeterminada) s.predeterminada = nueva.id;
  cerrarFormTarjeta();
  actualizar(s, 'Tarjeta agregada.');
});

// ===== Pago por teléfono y asistente de pagos =====
// ⚠ Cambia por el número real del gimnasio (texto = como se ve, enlace = con lada internacional, sin espacios)
const TELEFONO_PAGOS = { texto: '55 0000 0000', enlace: '+525500000000' };

const enlaceTel = document.getElementById('mp-tel');
enlaceTel.href = 'tel:' + TELEFONO_PAGOS.enlace;
enlaceTel.textContent = TELEFONO_PAGOS.texto;
enlaceTel.setAttribute('aria-label', 'Llamar al ' + TELEFONO_PAGOS.texto);
document.getElementById('mp-tel-codigo').textContent = USUARIO.codigoUsuario;

const chatPanel = document.getElementById('mp-chat-panel');
const chatBurbuja = document.getElementById('mp-chat-abrir');
const chatMensajes = document.getElementById('mp-chat-mensajes');
const chatInput = document.getElementById('mp-chat-input');
const RAPIDAS = [
  ['cobro', '¿Cuánto y cuándo pago?'],
  ['tarjeta', 'Pagar con tarjeta'],
  ['telefono', 'Pagar por teléfono'],
  ['plan', 'Cambiar de plan'],
  ['persona', 'Hablar con una persona'],
];

function chatDecir(texto, quien, accion) {
  const m = el('div', `mp-msg mp-msg-${quien}`, texto);
  if (accion) {
    const a = el('a', 'btn btn-primary btn-sm d-block mt-2', accion.texto);
    a.href = accion.href;
    m.appendChild(a);
  }
  chatMensajes.appendChild(m);
  chatMensajes.scrollTop = chatMensajes.scrollHeight;
}

function cerrarChat() {
  chatPanel.hidden = true;
  chatBurbuja.setAttribute('aria-expanded', 'false');
}

// Detecta de qué habla la persona (sin acentos y en minúsculas)
function claveDe(texto) {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/persona|humano|asesor|agente/.test(t)) return 'persona';
  if (/llam|telefon|numero|celular/.test(t)) return 'telefono';
  if (/tarjeta|debito|credito|metodo/.test(t)) return 'tarjeta';
  if (/cuanto|cuando|fecha|costo|precio|factur|vence|debo/.test(t)) return 'cobro';
  if (/cambi|plan|basico|plus|anual/.test(t)) return 'plan';
  if (/pag/.test(t)) return 'pagar';
  return null;
}

function responderChat(clave) {
  const s = cargarSuscripcion();
  const plan = PLANES[s.planId];
  const tarjeta = s.tarjetas.find((t) => t.id === s.predeterminada);
  const llamar = { texto: 'Llamar ahora', href: 'tel:' + TELEFONO_PAGOS.enlace };

  if (clave === 'cobro') {
    chatDecir(s.estado === 'activo'
      ? `Tu plan ${plan.nombre} cuesta ${moneda(plan.precio)} / ${plan.periodo}. Tu próxima facturación es el ${fechaLarga(s.proximaFacturacion)}.`
      : `Tu plan está dado de baja y no se renovará. Tu acceso termina el ${fechaLarga(s.proximaFacturacion)}.`, 'bot');
  } else if (clave === 'tarjeta') {
    chatDecir(tarjeta
      ? `Tu método de pago es ${textoTarjeta(tarjeta)}. Abrí el apartado "Método de pago" para que agregues, cambies o elimines tarjetas.`
      : 'Aún no tienes una tarjeta registrada. Abrí el apartado "Método de pago" para agregar una.', 'bot');
    if (document.getElementById('mp-submenu').hidden) botonPago.click();
    document.getElementById('mp-submenu').scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (window.innerWidth < 768) cerrarChat();
  } else if (clave === 'telefono') {
    chatDecir(`Llama al ${TELEFONO_PAGOS.texto} y un asesor te ayudará a pagar tu plan. Ten a la mano tu código de usuario: ${USUARIO.codigoUsuario}.`, 'bot', llamar);
  } else if (clave === 'persona') {
    chatDecir(`Con gusto te atiende una persona por teléfono: ${TELEFONO_PAGOS.texto}.`, 'bot', llamar);
  } else if (clave === 'plan') {
    chatDecir(`Puedes elegir entre ${Object.values(PLANES).map((p) => p.nombre).join(', ')}. Te llevé a la sección "Cambiar de plan".`, 'bot');
    document.getElementById('mp-planes').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.innerWidth < 768) cerrarChat();
  } else if (clave === 'pagar') {
    chatDecir(`Puedes pagar de dos formas:\n• Con tarjeta: administras la tarjeta en "Método de pago".\n• Por teléfono: llama al ${TELEFONO_PAGOS.texto}.`, 'bot');
  } else {
    chatDecir('No estoy seguro de haber entendido. Elige una opción o escribe cosas como "pagar", "teléfono", "fecha" o "plan".', 'bot');
  }
}

function chatPreguntar(clave, texto) {
  chatDecir(texto, 'yo');
  setTimeout(() => responderChat(clave), 350); // pausa corta para que se sienta como conversación
}

// Botones rápidos
RAPIDAS.forEach(([clave, etiqueta]) => {
  const b = el('button', 'btn btn-outline-primary btn-sm', etiqueta);
  b.type = 'button';
  b.onclick = () => chatPreguntar(clave, etiqueta);
  document.getElementById('mp-chat-rapidas').appendChild(b);
});

// Abrir y cerrar
chatBurbuja.addEventListener('click', () => {
  const abrir = chatPanel.hidden;
  chatPanel.hidden = !abrir;
  chatBurbuja.setAttribute('aria-expanded', String(abrir));
  if (!abrir) return;
  if (!chatMensajes.children.length) chatDecir('¡Hola! Soy el asistente automático de pagos de Pulso Gym. ¿En qué te ayudo?', 'bot');
  chatInput.focus();
});
document.getElementById('mp-chat-cerrar').addEventListener('click', () => { cerrarChat(); chatBurbuja.focus(); });
chatPanel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { cerrarChat(); chatBurbuja.focus(); }
});

// Mensaje escrito
document.getElementById('mp-chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = chatInput.value.trim();
  if (!texto) return;
  chatInput.value = '';
  chatPreguntar(claveDe(texto), texto);
});

pintarSuscripcion();
pintarRutina();
pintarObjetivos();
mostrar('inicio');
setInterval(pintarRutina, 60000);// si pasa la medianoche con la página abierta, cambia sola
pintarCodigos();
pintarPerfil();
pintarSemana();
pintarDieta();
pintarMiPlan();