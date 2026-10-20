// Datos de ejemplo. Más adelante vendrán de Firestore a través de la API.
const CLASES = {
  Lun: [
    { hora: '07:00', nombre: 'Funcional', instructor: 'Marcos', salon: 'Salón 1', cupo: 12 },
    { hora: '18:00', nombre: 'Spinning', instructor: 'Andrea', salon: 'Salón 2', cupo: 8 },
    { hora: '20:00', nombre: 'Box', instructor: 'Luis', salon: 'Salón 1', cupo: 5 },
  ],
  Mar: [
    { hora: '06:30', nombre: 'Yoga', instructor: 'Paola', salon: 'Salón 3', cupo: 15 },
    { hora: '19:00', nombre: 'CrossFit', instructor: 'Marcos', salon: 'Salón 1', cupo: 10 },
  ],
  Mié: [
    { hora: '07:00', nombre: 'Spinning', instructor: 'Andrea', salon: 'Salón 2', cupo: 9 },
    { hora: '18:30', nombre: 'Zumba', instructor: 'Daniela', salon: 'Salón 3', cupo: 20 },
    { hora: '20:00', nombre: 'Box', instructor: 'Luis', salon: 'Salón 1', cupo: 6 },
  ],
  Jue: [
    { hora: '06:30', nombre: 'Funcional', instructor: 'Marcos', salon: 'Salón 1', cupo: 11 },
    { hora: '19:00', nombre: 'Yoga', instructor: 'Paola', salon: 'Salón 3', cupo: 14 },
  ],
  Vie: [
    { hora: '07:00', nombre: 'CrossFit', instructor: 'Marcos', salon: 'Salón 1', cupo: 7 },
    { hora: '18:00', nombre: 'Zumba', instructor: 'Daniela', salon: 'Salón 3', cupo: 18 },
  ],
  Sáb: [
    { hora: '09:00', nombre: 'Spinning', instructor: 'Andrea', salon: 'Salón 2', cupo: 12 },
    { hora: '10:30', nombre: 'Funcional', instructor: 'Luis', salon: 'Salón 1', cupo: 16 },
  ],
};

const RUTINA = [
  { ejercicio: 'Sentadilla con barra', series: '4 × 8' },
  { ejercicio: 'Prensa de pierna', series: '4 × 10' },
  { ejercicio: 'Peso muerto rumano', series: '3 × 10' },
  { ejercicio: 'Zancadas con mancuernas', series: '3 × 12' },
  { ejercicio: 'Elevación de talones', series: '4 × 15' },
];

const ASISTENCIA = [3, 4, 2, 5, 4, 3, 5, 4]; // visitas por semana

// Aviso emergente (Toast de Bootstrap)
function avisar(mensaje) {
  document.getElementById('toast-text').textContent = mensaje;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('toast'), { delay: 2500 }).show();
}

// Código de barras decorativo con anchos variables
function dibujarCodigo() {
  const cont = document.getElementById('barcode');
  const patron = [2,1,3,1,1,2,3,1,2,2,1,1,3,2,1,2,1,1,3,1,2,1,2,3,1,1,2,2,1,3,1,2,1,1,2,3,2,1,1,2,1,3,1,2];
  patron.forEach((ancho, i) => {
    const barra = document.createElement('i');
    barra.style.flex = ancho;
    if (i % 2 === 1) barra.style.background = 'transparent';
    cont.appendChild(barra);
  });
}

// Clases por día con pestañas y reservación
function dibujarClases() {
  const tabs = document.getElementById('tabs');
  const lista = document.getElementById('classes');
  const reservadas = new Set();
  const dias = Object.keys(CLASES);
  const mapaJS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  let activo = dias.includes(mapaJS[new Date().getDay()]) ? mapaJS[new Date().getDay()] : 'Lun';

  function pintarLista() {
    lista.innerHTML = '';
    CLASES[activo].forEach((c, i) => {
      const id = activo + i;
      const reservada = reservadas.has(id);
      const li = document.createElement('li');
      li.className = 'list-group-item class-row';
      li.innerHTML = `
        <span class="class-time">${c.hora}</span>
        <div class="class-info">
          <p class="fw-semibold fs-5 mb-0">${c.nombre}</p>
          <p class="text-body-secondary mb-0">${c.instructor}, ${c.salon}. Quedan ${c.cupo - (reservada ? 1 : 0)} lugares</p>
        </div>
        <button class="btn btn-sm ${reservada ? 'btn-primary' : 'btn-outline-primary'}" type="button">
          ${reservada ? 'Reservado' : 'Reservar'}
        </button>`;
      li.querySelector('button').addEventListener('click', () => {
        if (reservada) {
          reservadas.delete(id);
        } else {
          reservadas.add(id);
          avisar(`Reservaste ${c.nombre} a las ${c.hora}`);
        }
        pintarLista();
      });
      lista.appendChild(li);
    });
  }

  function pintarTabs() {
    tabs.innerHTML = '';
    dias.forEach((dia) => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.role = 'presentation';
      const b = document.createElement('button');
      b.className = 'nav-link' + (dia === activo ? ' active' : '');
      b.type = 'button';
      b.role = 'tab';
      b.textContent = dia;
      b.setAttribute('aria-selected', dia === activo);
      b.addEventListener('click', () => { activo = dia; pintarTabs(); pintarLista(); });
      li.appendChild(b);
      tabs.appendChild(li);
    });
  }

  pintarTabs();
  pintarLista();
}

// Rutina del día con avance
function dibujarRutina() {
  const ul = document.getElementById('routine');
  const texto = document.getElementById('routine-progress');
  const medidor = document.getElementById('routine-meter');
  const barra = document.getElementById('routine-progressbar');

  RUTINA.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" id="ej${i}">
        <label class="form-check-label" for="ej${i}">
          <span>${r.ejercicio}</span>
          <span class="text-body-secondary">${r.series}</span>
        </label>
      </div>`;
    ul.appendChild(li);
  });

  function actualizar() {
    const hechos = ul.querySelectorAll('input:checked').length;
    const porcentaje = Math.round(hechos / RUTINA.length * 100);
    texto.textContent = `${hechos} de ${RUTINA.length} completados`;
    medidor.style.width = porcentaje + '%';
    barra.setAttribute('aria-valuenow', porcentaje);
  }
  ul.addEventListener('change', actualizar);
  actualizar();
}

// Gráfica de asistencia
function dibujarAsistencia() {
  const cont = document.getElementById('bars');
  const max = Math.max(...ASISTENCIA);
  ASISTENCIA.forEach((v, i) => {
    const b = document.createElement('div');
    b.className = 'bar' + (v === max ? ' is-top' : '');
    b.style.height = (v / max * 100) + '%';
    b.innerHTML = `<span>S${i + 1}</span>`;
    b.title = `${v} visitas`;
    cont.appendChild(b);
  });
}

// Inicio de sesión (solo validación de ejemplo; después se conectará con Firebase Auth)
function configurarLogin() {
  const form = document.getElementById('loginForm');
  const modal = document.getElementById('loginModal');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;
    bootstrap.Modal.getInstance(modal).hide();
    avisar('Sesión iniciada (ejemplo)');
    form.reset();
    form.classList.remove('was-validated');
  });
}

dibujarCodigo();
dibujarClases();
dibujarRutina();
dibujarAsistencia();
configurarLogin();