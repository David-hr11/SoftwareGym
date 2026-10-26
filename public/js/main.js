// Aviso emergente (Toast de Bootstrap)
function avisar(mensaje) {
  document.getElementById('toast-text').textContent = mensaje;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('toast'), { delay: 2500 }).show();
}

// Menú lateral derecho
function configurarMenu() {
  const panel = document.getElementById('menuLateral');
  const boton = document.getElementById('btnMenu');
  const menu = bootstrap.Offcanvas.getOrCreateInstance(panel);
  const UMBRAL_SCROLL = 40;
  const ANCHO_MINIMO = 992;
  let abiertoSolo = false;

  if (window.innerWidth >= ANCHO_MINIMO) {
    abiertoSolo = true;
    menu.show();
  }

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

// Inicio de sesión y registro
function configurarLogin(menu) {
  const form = document.getElementById('loginForm');
  const modalEl = document.getElementById('loginModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const $ = (id) => document.getElementById(id);
  const error = $('loginError');
  let registro = false;

  function modo(esRegistro) {
    registro = esRegistro;
    $('loginTitulo').textContent = registro ? 'Crear cuenta' : 'Iniciar sesión';
    $('loginDescripcion').textContent = registro
      ? 'Crea tu cuenta de socio. Si eres entrenador o parte del personal, tu cuenta la crea el administrador.'
      : 'Entra con tu correo y contraseña. Te llevamos a tu panel automáticamente.';
    $('loginEnviar').textContent = registro ? 'Crear cuenta' : 'Entrar a MyGym';
    $('loginCambiar').textContent = registro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
    $('grupoNombre').hidden = !registro;
    $('grupoPass2').hidden = !registro;
    $('loginNombre').required = registro;
    $('loginPass2').required = registro;
    $('loginPass').autocomplete = registro ? 'new-password' : 'current-password';
    error.hidden = true;
    form.classList.remove('was-validated');
  }

  $('btnLogin').addEventListener('click', async () => {
    menu.hide();
    const ir = Cuentas.sesion() ? Cuentas.destino() : await Cuentas.restaurar();
    if (ir) { location.href = ir; return; }
    modo(false);
    modal.show();
  });
  
  // Redirige al flujo de inscripción completo
  $('loginCambiar').addEventListener('click', () => {
    window.location.href = 'inscripcion.html';
  });
  
  modalEl.addEventListener('hidden.bs.modal', () => { form.reset(); modo(false); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.hidden = true;
    $('loginPass2').setCustomValidity(registro && $('loginPass2').value !== $('loginPass').value ? 'No coinciden' : '');
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const boton = $('loginEnviar');
    boton.disabled = true;
    try {
      const correo = $('loginCorreo').value;
      const pass = $('loginPass').value;
      const r = registro
        ? await Cuentas.registrarSocio({ nombre: $('loginNombre').value, correo, pass })
        : await Cuentas.iniciarSesion(correo, pass);
      if (r.error) { error.textContent = r.error; error.hidden = false; return; }
      location.href = r.destino;
    } catch {
      error.textContent = 'No se pudo completar. Abre el sitio desde localhost o https e inténtalo de nuevo.';
      error.hidden = false;
    } finally {
      boton.disabled = false;
    }
  });
}

configurarLogin(configurarMenu());