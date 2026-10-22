// ===== Cuentas con Firebase Authentication + Firestore =====
// Es la única pieza que habla con Firebase para las cuentas. El resto de las páginas sigue usando Cuentas.*
const FIREBASE_VERSION = '13.1.0';
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBvV1KFSereG75XTptMNwHzeqBHLtyQD3E',
  authDomain: 'pulsogym-eaac2.firebaseapp.com',
  projectId: 'pulsogym-eaac2',
  storageBucket: 'pulsogym-eaac2.firebasestorage.app',
  messagingSenderId: '986709201526',
  appId: '1:986709201526:web:c3830d93d69db433c6c557',
};

const Cuentas = (() => {
  const SESION = 'pg_sesion';
  const DESTINOS = { socio: 'mygym.html', instructor: 'mygym.html', administrador: 'admin.html', recepcionista: 'admin.html' };
  const CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
  const MENSAJES = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
    'auth/user-disabled': 'Esta cuenta está desactivada.',
    'permission-denied': 'No se pudo crear tu perfil. Inténtalo de nuevo.',
  };
  const mensaje = (e) => MENSAJES[e?.code] || 'No se pudo completar. Inténtalo de nuevo.';
  const dig = (n) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, '0');

  // Carga Firebase una sola vez, solo cuando hace falta
  let cargado = null;
  function cargarFirebase() {
    cargado ??= (async () => {
      const [app, auth, store] = await Promise.all([
        import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore.js'),
      ]);
      const miApp = app.initializeApp(FIREBASE_CONFIG);
      return { ...auth, ...store, auth: auth.getAuth(miApp), db: store.getFirestore(miApp) };
    })().catch((e) => { cargado = null; throw e; });
    return cargado;
  }

  // ----- Sesión de esta pestaña (copia del perfil para que las páginas la lean al instante) -----
  const sesion = () => { try { return JSON.parse(sessionStorage.getItem(SESION)); } catch { return null; } };
  const destino = () => DESTINOS[sesion()?.rol];

  function guardarSesion(uid, perfil) {
    const s = { id: uid, ...perfil };
    sessionStorage.setItem(SESION, JSON.stringify(s));
    sessionStorage.setItem('rol', s.rol); // compatibilidad con admin.js y entrenador.js
    if (s.instructorId) sessionStorage.setItem('instructorId', s.instructorId);
    else sessionStorage.removeItem('instructorId');
  }
  function limpiarSesion() {
    [SESION, 'rol', 'instructorId'].forEach((k) => sessionStorage.removeItem(k));
  }

  async function leerPerfil(F, uid) {
    const snap = await F.getDoc(F.doc(F.db, 'usuarios', uid));
    return snap.exists() ? snap.data() : null;
  }

  // ----- Páginas protegidas -----
  // Confirma con Firebase que la sesión sigue abierta; si se cerró (aquí o en otra pestaña), regresa al inicio
  async function verificar() {
    try {
      const F = await cargarFirebase();
      await F.auth.authStateReady();
      const salir = () => { limpiarSesion(); location.replace('index.html'); };
      if (!F.auth.currentUser || F.auth.currentUser.uid !== sesion()?.id) return salir();
      F.onAuthStateChanged(F.auth, (u) => { if (!u) salir(); });
    } catch { /* sin conexión: se mantiene la sesión local */ }
  }

  // Úsalo al inicio de cada página protegida
  function exigir(roles) {
    const s = sesion();
    if (!s) location.replace('index.html');
    else if (!roles.includes(s.rol)) location.replace(DESTINOS[s.rol]);
    else verificar();
    return s;
  }

  // ¿Firebase ya tiene una sesión abierta en este navegador? Reconstruye la sesión de la pestaña
  async function restaurar() {
    try {
      const F = await cargarFirebase();
      await F.auth.authStateReady();
      const user = F.auth.currentUser;
      if (!user) return null;
      const perfil = await leerPerfil(F, user.uid);
      if (!perfil || !DESTINOS[perfil.rol]) return null;
      guardarSesion(user.uid, perfil);
      return DESTINOS[perfil.rol];
    } catch { return null; }
  }

  // ----- Entrar, registrarse, salir -----
  async function iniciarSesion(correo, pass) {
    try {
      const F = await cargarFirebase();
      const { user } = await F.signInWithEmailAndPassword(F.auth, correo.trim(), pass);
      const perfil = await leerPerfil(F, user.uid);
      if (!perfil || !DESTINOS[perfil.rol]) {
        await F.signOut(F.auth);
        return { error: 'Tu cuenta aún no tiene un tipo asignado. Pide ayuda al administrador.' };
      }
      guardarSesion(user.uid, perfil);
      return { destino: DESTINOS[perfil.rol] };
    } catch (e) { return { error: mensaje(e) }; }
  }

  // El tipo de cuenta lo asigna el sistema: el registro público SOLO crea socios (y las reglas de Firestore lo exigen)
  async function registrarSocio({ nombre, correo, pass }) {
    if (nombre.trim().length < 3) return { error: 'Escribe tu nombre completo.' };
    let F;
    let user = null;
    try {
      F = await cargarFirebase();
      user = (await F.createUserWithEmailAndPassword(F.auth, correo.trim(), pass)).user;
      const datos = { nombre: nombre.trim(), correo: user.email, rol: 'socio', codigo: 'PG-' + dig(6), codigoBarras: `${dig(4)} ${dig(4)} ${dig(4)}` };
      await F.setDoc(F.doc(F.db, 'usuarios', user.uid), { ...datos, creadoEn: F.serverTimestamp() });
      guardarSesion(user.uid, datos);
      return { destino: DESTINOS.socio };
    } catch (e) {
      if (user) await F.deleteUser(user).catch(() => {}); // sin perfil no se deja la cuenta a medias
      return { error: mensaje(e) };
    }
  }

  async function cerrarSesion() {
    limpiarSesion();
    try { const F = await cargarFirebase(); await F.signOut(F.auth); } catch { /* sin conexión: ya se limpió la sesión local */ }
  }

  // Enlaces con data-salir: se cierra la sesión de Firebase ANTES de navegar
  document.addEventListener('click', async (e) => {
    const enlace = e.target.closest('[data-salir]');
    if (!enlace) return;
    e.preventDefault();
    await cerrarSesion();
    location.href = enlace.getAttribute('href') || 'index.html';
  });

  return { sesion, destino, exigir, restaurar, cerrarSesion, iniciarSesion, registrarSocio };
})();