# Sistema de gestión para gimnasio

Proyecto "Desarrollo de software para GYM", FES Aragón, grupo 1009.
App web con HTML, CSS, JavaScript y Node.js (Express). Base de datos y autenticación con Firebase (pendiente).

## Requisitos

- Node.js 18 o superior
- Git

## Cómo correrlo

```bash
npm install
cp .env.example .env
npm run dev
```

Abre http://localhost:3000

## Estructura

```
gym-system/
├── server.js            # Punto de entrada (Express)
├── src/
│   ├── routes/          # API por módulo (A1, A2, A3)
│   ├── middleware/      # Roles y autenticación
│   └── config/          # Firebase
├── public/              # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── css/
│   └── js/
└── docs/                # Diagramas y documentos
```

## Módulos

| Macroproceso | Rutas de la API |
|---|---|
| A1. Socios, accesos y cobranza | /api/socios, /api/accesos, /api/pagos |
| A2. Instalaciones, equipos y contabilidad | /api/salones, /api/equipos, /api/contabilidad |
| A3. Portal, expedientes y rutinas | /api/expedientes, /api/rutinas |
