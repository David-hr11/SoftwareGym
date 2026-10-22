// Aviso emergente (Toast de Bootstrap)
function avisar(mensaje) {
  document.getElementById('toast-text').textContent = mensaje;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('toast'), { delay: 2500 }).show();
}

// Menú lateral derecho:
// - Al entrar se muestra solo (si la pantalla es ancha).
// - Al hacer scroll se esconde.
// - Después solo se abre con el botón de hamburguesa.
function configurarMenu() {
  const panel = document.getElementById('menuLateral');
  const boton = document.getElementById('btnMenu');
  const menu = bootstrap.Offcanvas.getOrCreateInstance(panel);
  const UMBRAL_SCROLL = 40;      // píxeles de scroll para esconderlo
  const ANCHO_MINIMO = 992;      // en celular/tablet empieza cerrado
  let abiertoSolo = false;       // true = lo abrió la página, no la persona

  if (window.innerWidth >= ANCHO_MINIMO) {
    abiertoSolo = true;
    menu.show();
  }

  // Si la persona lo abre con el botón, ya no se esconde con el scroll
  boton.addEventListener('click', () => { abiertoSolo = false; });
  panel.addEventListener('hide.bs.offcanvas', () => { abiertoSolo = false; });

  window.addEventListener('scroll', () => {
    if (abiertoSolo && window.scrollY > UMBRAL_SCROLL) {
      abiertoSolo = false;
      menu.hide();
    }
  }, { passive: true });

  return menu;
}

// Inicio de sesión (solo validación de ejemplo; después se conectará con Firebase Auth)
function configurarLogin(menu) {
  const form = document.getElementById('loginForm');
  const modalEl = document.getElementById('loginModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById('btnLogin').addEventListener('click', () => {
    menu.hide();
    modal.show();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;
    const rol = form.loginRol.options[form.loginRol.selectedIndex].text.toLowerCase();
    sessionStorage.setItem('rol', form.loginRol.value); // el panel lee el rol de aquí (luego: Firebase Auth)
    const destino = { socio: 'mygym.html', administrador: 'admin.html', recepcionista: 'admin.html' }[form.loginRol.value];
    if (destino) { location.href = destino; return; }
    modal.hide();
    avisar(`Sesión iniciada como ${rol} (ejemplo)`);
    form.reset();
    form.classList.remove('was-validated');
  });
}

configurarLogin(configurarMenu());