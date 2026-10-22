// ===== Panel del entrenador: pupilos, salones y clases, fallas =====
// Usa los mismos datos de ejemplo que admin.js ('admin_datos_v2'), así el administrador ve lo que se registra aquí.
(() => {
  if (!ES_ENTRENADOR) return;

  const CLAVE_DB = 'admin_datos_v2';
  const SALONES = ['Salón de yoga', 'Salón funcional', 'Salón de baile']; // los mismos de admin.js
  const iso = (d) => d.toLocaleDateString('sv-SE');
  const hoy = () => iso(new Date());
  const fecha = (f) => new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const minutos = (h) => { const [a, b] = h.split(':'); return +a * 60 + +b; };
  const rango = (h) => h.split('-').map(minutos);
  const $ = (s) => document.querySelector(s);

  const datos = () => leer(CLAVE_DB, null);
  // Entrenador de prueba: el primero de la lista (después vendrá del login con Firebase)
  const quien = (d) => d.instructores.find((i) => i.id === sessionStorage.getItem('instructorId')) || d.instructores[0];
  // Lee, modifica y guarda sin pisar lo que haya cambiado el administrador
  function cambiar(fn) {
    const d = datos();
    if (!d) return;
    fn(d);
    localStorage.setItem(CLAVE_DB, JSON.stringify(d));
  }

  // ----- Piezas de interfaz -----
  const tarjeta = (...n) => { const c = el('article', 'mg-card mb-4'); c.append(...n); return c; };
  const insignia = (texto, extra = '') => el('span', 'estado ' + extra, texto);
  const boton = (texto, clase, fn) => { const b = el('button', 'btn ' + clase, texto); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const acciones = (...b) => { const d = el('div', 'en-acc'); d.append(...b); return d; };

  function tabla(cols, filas, vacio) {
    if (!filas.length) return el('p', 'mg-vacio', vacio);
    const t = el('table', 'table mg-tabla');
    const cab = el('tr');
    cols.forEach((c) => cab.appendChild(el('th', '', c)));
    const th = el('thead');
    th.appendChild(cab);
    const tb = el('tbody');
    filas.forEach((f) => {
      const tr = el('tr');
      f.forEach((c) => { const td = el('td'); td.append(c instanceof Node ? c : String(c ?? '')); tr.appendChild(td); });
      tb.appendChild(tr);
    });
    t.append(th, tb);
    const w = el('div', 'en-tabla');
    w.appendChild(t);
    return w;
  }

  function campoForm(nombre, etiqueta, tipo, attrs = {}, clase = '') {
    const w = el('div', clase);
    const l = el('label', 'form-label', etiqueta);
    const i = el(tipo === 'textarea' ? 'textarea' : tipo === 'select' ? 'select' : 'input', tipo === 'select' ? 'form-select' : 'form-control');
    if (tipo !== 'textarea' && tipo !== 'select') i.type = tipo;
    i.id = 'en-' + nombre;
    i.name = nombre;
    l.htmlFor = i.id;
    Object.entries(attrs).forEach(([k, v]) => i.setAttribute(k, v));
    w.append(l, i);
    return w;
  }
  function opciones(nodo, lista) {
    const s = nodo.querySelector('select');
    lista.forEach((t) => { const o = el('option', '', t); o.value = t; s.appendChild(o); });
    return nodo;
  }
  const enviar = (texto) => { const b = el('button', 'btn btn-primary', texto); b.type = 'submit'; return b; };

  // Título + datos; si el panel de administración nunca se ha abierto, avisa
  function montar(id, titulo, construir) {
    const cont = $('#' + id);
    const d = datos();
    cont.replaceChildren(el('h2', 'mg-h2', titulo));
    if (!d || !d.instructores?.length) {
      cont.appendChild(el('p', 'mg-vacio', 'Aún no hay datos cargados. Abre una vez el panel de administración para generar los datos de ejemplo y vuelve aquí.'));
      return;
    }
    cont.append(...construir(d, quien(d)));
  }

  // ===== Pupilos =====
  function editarTexto(id, dato, titulo, ejemplo) {
    const s = datos().socios.find((x) => x.id === id);
    const dlg = $('#en-dialogo');
    const area = el('textarea', 'form-control');
    area.maxLength = 3000;
    area.value = s[dato] || '';
    area.placeholder = ejemplo;
    area.setAttribute('aria-label', titulo);
    const menu = el('menu');
    menu.append(boton('Cerrar', 'btn-outline-primary', () => dlg.close()), enviar('Guardar'));
    const form = el('form');
    form.append(area, menu);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      cambiar((d) => { d.socios.find((x) => x.id === id)[dato] = area.value.trim(); });
      dlg.close();
      avisoPlan(`${titulo} guardada.`);
      vistaPupilos();
    });
    dlg.replaceChildren(el('h2', '', `${titulo} · ${s.nombre}`), el('p', 'text-body-secondary', 'Escribe un día o una comida por línea.'), form);
    dlg.showModal();
  }

  async function quitar(s) {
    const ok = await confirmar(`¿Dar de baja a ${s.nombre}?`, 'Dejará de ser tu pupilo. Su membresía en el gimnasio no se afecta.', 'Dar de baja', true);
    if (!ok) return;
    cambiar((d) => { const i = quien(d); i.pupilos = (i.pupilos || []).filter((x) => x !== s.id); });
    avisoPlan(`${s.nombre} ya no es tu pupilo.`);
    vistaPupilos();
  }

  function vistaPupilos() {
    montar('pupilos', 'Mis pupilos', (d, yo) => {
      const form = el('form', 'en-form');
      form.append(campoForm('codigo', 'Código único del socio', 'text', { placeholder: 'PG-000000', maxlength: 12, autocomplete: 'off' }), enviar('Agregar pupilo'));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dd = datos();
        const mio = quien(dd);
        const codigo = form.elements.codigo.value.trim().toUpperCase();
        const s = dd.socios.find((x) => x.codigo.toUpperCase() === codigo);
        if (!codigo) return avisoPlan('Escribe el código del socio.');
        if (!s) return avisoPlan('No existe ningún socio con ese código.');
        if (s.estado === 'baja') return avisoPlan('Ese socio está dado de baja del gimnasio.');
        if ((mio.pupilos || []).includes(s.id)) return avisoPlan('Ese socio ya es tu pupilo.');
        if (dd.instructores.some((i) => (i.pupilos || []).includes(s.id))) return avisoPlan('Ese socio ya tiene otro entrenador.');
        cambiar((x) => { const i = quien(x); i.pupilos = [...(i.pupilos || []), s.id]; });
        avisoPlan(`${s.nombre} ahora es tu pupilo.`);
        vistaPupilos();
      });

      const mios = (yo.pupilos || []).map((id) => d.socios.find((s) => s.id === id)).filter(Boolean);
      const filas = mios.map((s) => [
        s.codigo,
        s.nombre,
        s.asistencia?.length ? fecha(s.asistencia[0]) : 'Sin registro',
        s.rutina ? 'Registrada' : 'Sin registrar',
        s.dieta ? 'Registrada' : 'Sin registrar',
        acciones(
          boton('Rutina', 'btn-outline-primary btn-sm', () => editarTexto(s.id, 'rutina', 'Rutina', 'Lunes: Pierna – Sentadilla 4x8\nMiércoles: Pecho – Press banca 4x10')),
          boton('Dieta', 'btn-outline-primary btn-sm', () => editarTexto(s.id, 'dieta', 'Dieta', 'Desayuno: avena con huevo\nComida: pollo, arroz y verduras')),
          boton('Dar de baja', 'btn-danger btn-sm', () => quitar(s)),
        ),
      ]);
      return [
        tarjeta(el('h2', '', 'Agregar pupilo'), el('p', 'text-body-secondary', 'Pide al socio su código único: lo ve en su perfil.'), form),
        tarjeta(el('h2', '', `Lista de pupilos (${mios.length})`), tabla(['Código', 'Pupilo', 'Última asistencia', 'Rutina', 'Dieta', ''], filas, 'Aún no tienes pupilos. Agrega el primero con su código.')),
      ];
    });
  }

  // ===== Salones y clases =====
  const COLOR_RESERVA = { pendiente: 'pend', aprobada: '', rechazada: 'vencido' };
  const TEXTO_RESERVA = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' };

  async function cancelar(r) {
    const ok = await confirmar('¿Cancelar la reservación?', `${r.actividad} · ${fecha(r.dia)} · ${r.horario.replace('-', ' – ')}`, 'Cancelar reservación', true);
    if (!ok) return;
    cambiar((d) => { d.reservas = d.reservas.filter((o) => o.id !== r.id); });
    avisoPlan('Reservación cancelada.');
    vistaSalones();
  }

  function vistaSalones() {
    montar('salones', 'Salones y clases', (d, yo) => {
      const form = el('form', 'en-form');
      const ocupado = el('p', 'form-text en-ancho mb-0');
      form.append(
        opciones(campoForm('tipo', 'Tipo', 'select'), ['Clase', 'Reservación de salón']),
        opciones(campoForm('salon', 'Salón', 'select'), SALONES),
        campoForm('dia', 'Día', 'date', { required: '', min: hoy(), value: hoy() }),
        campoForm('inicio', 'Inicio', 'time', { required: '', value: '08:00' }),
        campoForm('fin', 'Fin', 'time', { required: '', value: '09:00' }),
        campoForm('actividad', 'Nombre de la clase o actividad', 'text', { required: '', maxlength: 60, placeholder: 'Ej. Yoga para principiantes' }, 'en-ancho'),
        ocupado,
        enviar('Enviar solicitud'),
      );

      // Muestra lo ya aprobado ese día para elegir un horario libre
      const verDisponibilidad = () => {
        const f = form.elements;
        const lista = datos().reservas
          .filter((r) => r.salon === f.salon.value && r.dia === f.dia.value && r.estado === 'aprobada')
          .map((r) => `${r.horario.replace('-', ' – ')} (${r.actividad})`);
        ocupado.textContent = lista.length ? 'Ocupado ese día: ' + lista.join(' · ') : 'Sin reservaciones aprobadas ese día en este salón.';
      };
      form.addEventListener('change', verDisponibilidad);
      verDisponibilidad();

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = form.elements;
        const horario = `${f.inicio.value}-${f.fin.value}`;
        const [a, b] = rango(horario);
        if (b <= a) return avisoPlan('La hora de fin debe ser después de la de inicio.');
        if (new Date(`${f.dia.value}T${f.inicio.value}`) < new Date()) return avisoPlan('Esa hora ya pasó.');
        const choque = datos().reservas.find((r) => r.estado === 'aprobada' && r.salon === f.salon.value && r.dia === f.dia.value && a < rango(r.horario)[1] && rango(r.horario)[0] < b);
        if (choque) return avisoPlan(`Se empalma con ${choque.actividad} (${choque.horario.replace('-', ' – ')}).`);
        cambiar((x) => x.reservas.push({
          id: uid(), instructor: quien(x).nombre, salon: f.salon.value, dia: f.dia.value, horario,
          actividad: f.actividad.value.trim(), tipo: f.tipo.value, estado: 'pendiente',
        }));
        avisoPlan('Solicitud enviada. El administrador la revisará.');
        vistaSalones();
      });

      const mias = d.reservas.filter((r) => r.instructor === yo.nombre).sort((a, b) => (a.dia + a.horario).localeCompare(b.dia + b.horario));
      const filas = mias.map((r) => [
        fecha(r.dia), r.salon, r.horario.replace('-', ' – '), r.actividad, r.tipo || 'Reservación de salón',
        insignia(TEXTO_RESERVA[r.estado], COLOR_RESERVA[r.estado]),
        r.estado === 'rechazada' ? '' : boton('Cancelar', 'btn-outline-danger btn-sm', () => cancelar(r)),
      ]);
      return [
        tarjeta(el('h2', '', 'Reservar salón o agendar clase'), form),
        tarjeta(el('h2', '', 'Mis reservaciones y clases'), tabla(['Día', 'Salón', 'Horario', 'Actividad', 'Tipo', 'Estado', ''], filas, 'Aún no has enviado solicitudes.')),
      ];
    });
  }

  // ===== Fallas =====
  const COLOR_FALLA = { pendiente: 'pend', revision: 'rev', completado: '' };
  const TEXTO_FALLA = { pendiente: 'Pendiente', revision: 'En revisión', completado: 'Completado' };

  function vistaFallas() {
    montar('fallas', 'Reporte de fallas', (d, yo) => {
      const form = el('form', 'en-form');
      const lista = el('datalist');
      lista.id = 'en-equipos';
      d.equipos.filter((e) => e.estado !== 'Baja').forEach((e) => { const o = el('option'); o.value = e.nombre; lista.appendChild(o); });
      form.append(
        campoForm('equipo', 'Equipo o área con la falla', 'text', { list: 'en-equipos', required: '', maxlength: 60, placeholder: 'Ej. Caminadora 3' }, 'en-ancho'),
        campoForm('descripcion', 'Describe la falla', 'textarea', { required: '', maxlength: 300, rows: 3 }, 'en-ancho'),
        enviar('Enviar reporte'),
        lista,
      );
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const f = form.elements;
        cambiar((x) => x.fallas.unshift({
          id: uid(), equipo: f.equipo.value.trim(), reporta: quien(x).nombre,
          descripcion: f.descripcion.value.trim(), fecha: hoy(), estado: 'pendiente',
        }));
        avisoPlan('Reporte enviado. Gracias por avisar.');
        vistaFallas();
      });

      const mias = d.fallas.filter((f) => f.reporta === yo.nombre).sort((a, b) => b.fecha.localeCompare(a.fecha));
      const filas = mias.map((f) => [f.equipo, el('span', 'en-wrap', f.descripcion), fecha(f.fecha), insignia(TEXTO_FALLA[f.estado], COLOR_FALLA[f.estado])]);
      return [
        tarjeta(el('h2', '', 'Nuevo reporte'), form),
        tarjeta(el('h2', '', 'Mis reportes'), tabla(['Equipo', 'Descripción', 'Fecha', 'Estado'], filas, 'Aún no has reportado fallas.')),
      ];
    });
  }

  // ----- Arranque -----
  const VISTAS = { pupilos: vistaPupilos, salones: vistaSalones, fallas: vistaFallas };
  document.addEventListener('click', (e) => {
    const enlace = e.target.closest('[data-seccion]');
    if (enlace && VISTAS[enlace.dataset.seccion]) VISTAS[enlace.dataset.seccion](); // se vuelve a pintar con los datos al día
  });
  document.title = 'MyGYM / Entrenador · Pulso Gym';
  const titulo = document.querySelector('.mg-titulo');
  if (titulo) titulo.append(' ', el('span', 'mg-titulo-rol', '/ Entrenador'));
  const sub = document.querySelector('.mg-titulo + p');
  if (sub) sub.textContent = 'Panel del entrenador · Acompaña el proceso de tus pupilos';
})();