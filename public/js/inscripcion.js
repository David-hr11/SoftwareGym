// Detección del plan desde la URL o selección visual
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const planPreseleccionado = urlParams.get('plan'); // 'basico', 'plus', 'anual'

  if (planPreseleccionado) {
    marcarPlanSeleccionado(planPreseleccionado);
    
    const contenedorElegido = document.querySelector(`.contenedor-plan[data-plan="${planPreseleccionado}"]`);
    if (contenedorElegido) {
      document.getElementById('tituloPaso1').textContent = "¡Has seleccionado tu membresía!";
      document.getElementById('subtituloPaso1').textContent = "Estás a un paso de comenzar tu cambio con Pulso Gym";

      document.querySelectorAll('.contenedor-plan').forEach(el => {
        if (el.dataset.plan !== planPreseleccionado) el.style.display = 'none';
        else el.classList.remove('col-md-4'); 
      });
    }
  }
});

function seleccionarPlan(valorPlan) {
  marcarPlanSeleccionado(valorPlan);
}

function marcarPlanSeleccionado(valorPlan) {
  const radio = document.querySelector(`input[name="plan"][value="${valorPlan}"]`);
  if (radio) radio.checked = true;

  document.querySelectorAll('.plan-card-wizard').forEach(card => {
    card.classList.remove('border-success', 'bg-black');
    card.classList.add('border-secondary');
  });

  const cardSeleccionada = document.querySelector(`.contenedor-plan[data-plan="${valorPlan}"] .plan-card-wizard`);
  if (cardSeleccionada) {
    cardSeleccionada.classList.remove('border-secondary');
    cardSeleccionada.classList.add('border-success', 'bg-black');
  }
}

function validarPaso1() {
  const seleccionado = document.querySelector('input[name="plan"]:checked');
  if (!seleccionado) {
    alert('Por favor, selecciona un plan para continuar.');
    return;
  }
  siguientePaso(2);
}

function siguientePaso(paso) {
  document.querySelectorAll('.paso-wizard').forEach(el => el.classList.add('d-none'));
  document.getElementById(`paso${paso}`).classList.remove('d-none');
}

function validarPaso2() {
  const chk = document.getElementById('aceptoTerminos');
  if (!chk.checked) {
    alert('Debes aceptar los términos y condiciones del contrato para continuar.');
    return;
  }
  siguientePaso(3);
}

function validarPaso3() {
  const nombre = document.getElementById('tarjetaNombre').value.trim();
  const numero = document.getElementById('tarjetaNumero').value.trim();
  const vence = document.getElementById('tarjetaVence').value.trim();
  const cvv = document.getElementById('tarjetaCvv').value.trim();

  if (!nombre || !numero || !vence || !cvv) {
    alert('Por favor, completa todos los datos de la tarjeta para continuar.');
    return;
  }
  siguientePaso(4);
}

// Control del envío final, registro en Firebase y generación del PDF
document.getElementById('formInscripcion').addEventListener('submit', async (e) => {
  e.preventDefault();

  const planElegido = document.querySelector('input[name="plan"]:checked').value;
  const contratoAceptado = document.getElementById('aceptoTerminos').checked;
  const nombre = document.getElementById('regNombre').value;
  const correo = document.getElementById('regCorreo').value;
  const pass = document.getElementById('regPass').value;
  const numTarjeta = document.getElementById('tarjetaNumero').value;
  const terminacionTarjeta = numTarjeta ? numTarjeta.slice(-4) : '****';
  
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Creando cuenta y generando PDF...';

  // 1. Enviar a Firebase usando tu módulo Cuentas
  const respuesta = await Cuentas.registrarSocio({ 
    nombre: nombre, 
    correo: correo, 
    pass: pass,
    plan: planElegido,
    contratoAceptado: contratoAceptado
  });

  if (respuesta.error) {
    alert(respuesta.error);
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Finalizar e Inscribirme';
    return;
  }

  // 2. Definir fechas y beneficios
  const hoy = new Date();
  const fechaPagoStr = hoy.toLocaleDateString('es-MX');
  const fechaCorte = new Date();
  fechaCorte.setMonth(fechaCorte.getMonth() + 1);
  const fechaCorteStr = fechaCorte.toLocaleDateString('es-MX');

  const infoPlanes = {
    basico: { nombre: 'Básico', precio: '$399 / mes', beneficios: 'Acceso al gimnasio, Área de pesas y cardio, Entrenamiento en horario regular.' },
    plus: { nombre: 'Plus', precio: '$599 / mes', beneficios: 'Acceso ilimitado al gimnasio, Área de pesas y cardio, Clases grupales seleccionadas, Rutina de entrenamiento inicial.' },
    anual: { nombre: 'Premium', precio: '$899 / mes', beneficios: 'Acceso ilimitado al gimnasio, Área de pesas y cardio, Clases grupales incluidas, Asesoría personalizada, Acceso a todas las instalaciones.' }
  };

  const planInfo = infoPlanes[planElegido] || infoPlanes.basico;

  // 3. Crear contenedor oculto con el diseño formal del PDF
  const contenedorPdf = document.createElement('div');
  contenedorPdf.style.padding = '30px';
  contenedorPdf.style.fontFamily = 'Arial, sans-serif';
  contenedorPdf.style.color = '#000';
  contenedorPdf.style.background = '#fff';
  
  contenedorPdf.innerHTML = `
    <div style="text-align: center; border-bottom: 2px solid #2dff72; padding-bottom: 15px; margin-bottom: 20px;">
      <h1 style="color: #111; margin: 0;">PULSO GYM</h1>
      <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">Comprobante de Inscripción y Contrato de Servicio</p>
    </div>

    <h2 style="font-size: 18px; color: #333;">¡Bienvenido a la familia, ${nombre}!</h2>
    <p style="font-size: 13px; color: #555;">Nos da mucho gusto tenerte con nosotros. A continuación, los detalles de tu membresía:</p>

    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0; font-size: 13px;">
      <p><strong>Correo registrado:</strong> ${correo}</p>
      <p><strong>Plan Contratado:</strong> ${planInfo.nombre} (${planInfo.precio})</p>
      <p><strong>Beneficios incluidos:</strong> ${planInfo.beneficios}</p>
      <p><strong>Fecha de pago / inscripción:</strong> ${fechaPagoStr}</p>
      <p><strong>Próxima fecha de corte:</strong> ${fechaCorteStr}</p>
      <p><strong>Método de pago (Tarjeta terminación):</strong> •••• ${terminacionTarjeta}</p>
    </div>

    <h3 style="font-size: 14px; color: #333; margin-top: 20px;">Términos y Condiciones del Contrato</h3>
    <p style="font-size: 11px; color: #666; line-height: 1.4;">
      El usuario se compromete a hacer uso adecuado de las instalaciones y equipo de Pulso Gym. El cobro de la membresía se realizará de forma mensual de manera recurrente a la tarjeta registrada. Pulso Gym no se hace responsable por pertenencias extraviadas fuera de los casilleros asignados. El presente contrato entra en vigor a partir de la fecha de firma digital y registro en plataforma.
    </p>

    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #aaa;">
      <p>Pulso Gym CDMX · Este documento es un comprobante digital válido.</p>
    </div>
  `;

  // 4. Descargar el PDF y redirigir al panel MyGym
  const opciones = {
    margin:       10,
    filename:     `Contrato_PulsoGym_${nombre.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(contenedorPdf).set(opciones).save().then(() => {
    window.location.href = respuesta.destino;
  });
});