# 5S ZF — Evaluación 5S

Aplicación web para realizar auditorías 5S (Seiri, Seiton, Seiso, Seiketsu, Shitsuke) en planta y en oficinas.
El auditor responde preguntas de **Sí / No** en formato de chat; cada **No** requiere describir la desviación.
Al terminar se obtiene el puntaje, la calificación (0–100) y el resultado, y todas las evaluaciones quedan registradas para consulta.

## Funcionalidades

- **Dos tipos de evaluación**
  - **Piso de planta:** cuestionario organizado por las 5S.
  - **Oficina:** cuestionario propio (limpieza y orden, visualización, funcionalidad, seguridad, artículos privados).
- **Formulario de inicio por tipo**, con datos que se eligen de listas:
  - Piso: Centro de coste, Área, Supervisor.
  - Oficina: Área/Departamento, Taller, Supervisor. Requiere que el usuario tenga foto en su perfil.
  - La **persona evaluada** es siempre el usuario que inició sesión; no se elige.
- **Evaluación tipo chat:** una pregunta a la vez, agrupadas por sección, con barra de progreso. Una evaluación sin terminar puede continuarse después.
- **Resultado:** puntos obtenidos, calificación 0–100 y nivel (p. ej. *Puntaje Objetivo*).
- **Registro de evaluaciones** (`/registro`, solo administrador): pestañas Piso / Oficina, filtros por cada campo, 10 / 25 / 50 / 100 / todas las filas por página.
- **Detalle de cada evaluación:** calificación, puntos por sección y todas las preguntas con su respuesta y desviación.
- **Perfil** (`/perfil`): nombre, foto y rol del usuario. El rol es de solo lectura; un administrador puede cambiar el suyo tras confirmar.
- **Historial** (`/historial`): evaluaciones realizadas por el usuario en un periodo (un año por defecto), con gráfica de calificaciones.
- **Usuarios** (`/usuarios`, solo administrador): lista de usuarios, cambio de rol y alta de usuarios.
- **Elementos de auditoría** (`/personas`): catálogo de valores por tipo y campo, con búsqueda y paginación. **Solo los valores registrados aquí aparecen en los formularios**, y el backend rechaza cualquier otro.

## Tecnologías

| Parte    | Tecnologías |
|----------|-------------|
| Frontend | React 19, React Router 8, Vite 8, Tailwind CSS 4, lucide-react |
| Backend  | Node.js 24, Express 5, Mongoose 9 |
| Base de datos | MongoDB |

Las versiones exactas están en [requirements.txt](requirements.txt).

## Estructura

```
5S_Project/
├── backend/
│   ├── app/
│   │   ├── app.js              # Servidor Express y rutas /api
│   │   ├── config/db.js        # Conexión a MongoDB
│   │   ├── constants/          # Campos del encabezado por tipo de evaluación
│   │   ├── controllers/        # Manejo de cada endpoint
│   │   ├── services/           # Lógica de auditorías y cálculo del resultado
│   │   ├── models/             # Esquemas Mongoose (Audit, Questionnaire, CatalogEntry, Area)
│   │   ├── routes/
│   │   ├── middleware/         # Manejo de errores
│   │   └── seed/               # Cuestionarios (floor.json, office.json) y script de carga
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Inicio, formularios, chat, resultado, registros, detalle
│   │   ├── components/         # Formularios, chat, layout, selects del catálogo
│   │   ├── api/                # Llamadas al backend
│   │   ├── constants/          # Tipos de evaluación y campos (etiquetas)
│   │   └── hooks/              # useAudit (estado de una evaluación)
│   ├── public/                 # Íconos
│   └── package.json
├── requirements.txt
└── README.md
```

## Requisitos

- Node.js 24 o superior y npm 11 o superior
- MongoDB (local o remoto)

## Instalación

### 1. Backend

```bash
cd backend
npm install
```

Crear el archivo `backend/.env` (no se sube al repositorio):

```env
MONGO_URI=mongodb://localhost:27017/5s_project
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```

Cargar los cuestionarios en la base de datos:

```bash
npm run seed
```

### 2. Frontend

```bash
cd frontend
npm install
```

## Ejecución

En dos terminales:

```bash
# Terminal 1 — API en http://localhost:3000
cd backend
npm run dev

# Terminal 2 — aplicación en http://localhost:5173
cd frontend
npm run dev
```

En desarrollo, Vite redirige las peticiones `/api` al backend (puerto 3000).

**Antes de la primera evaluación**, registra al menos un valor de cada campo en **Elementos de auditoría**; si no, los formularios no tienen opciones.

### Scripts

| Carpeta  | Comando         | Descripción |
|----------|-----------------|-------------|
| backend  | `npm run dev`   | API con recarga automática |
| backend  | `npm start`     | API sin recarga |
| backend  | `npm run seed`  | Carga los cuestionarios de `app/seed` |
| frontend | `npm run dev`   | Servidor de desarrollo |
| frontend | `npm run build` | Compilación para producción (`frontend/dist`) |
| frontend | `npm run lint`  | Revisión de código (oxlint) |

## Cálculo del resultado

- Cada respuesta **Sí** vale 1 punto; **No** vale 0 y requiere una desviación.
- **Calificación** = puntos ÷ número de preguntas × 100 (redondeado).
- El **resultado** es el nivel más alto cuyo mínimo de puntos se alcanza. Los niveles están en el campo `results` de cada cuestionario (`backend/app/seed/*.json`).

### Cambiar las preguntas

1. Editar `backend/app/seed/floor.json` u `office.json`.
2. Incrementar `"version"` (las evaluaciones anteriores conservan su versión).
3. Ejecutar `npm run seed` en `backend`.

El cuestionario de piso debe tener exactamente las 5 secciones en orden (`seiri`, `seiton`, `seiso`, `seiketsu`, `shitsuke`); el de oficina puede tener secciones propias.

## API

Base: `http://localhost:3000/api`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | `/auth/login` | Identificarse con `{ name }`; devuelve `{ token, user }` |
| GET    | `/auth/me` | Usuario de la sesión actual |
| GET    | `/users` | Lista de usuarios (solo administrador) |
| POST   | `/users` | Crear usuario `{ name, role? }`; solo un administrador puede asignar `role: "admin"` |
| PATCH  | `/users/me` | Editar el perfil propio `{ name?, avatar? }`; `avatar` es una imagen como data URL, o `null` para quitarla |
| PATCH  | `/users/:id/role` | Cambiar el rol `{ role }` (solo administrador; siempre debe quedar al menos uno) |
| GET    | `/questionnaires` | Tipos de cuestionario disponibles |
| GET    | `/catalog?questionnaireKey=piso\|oficina` | Valores registrados por campo |
| POST   | `/catalog` | Registrar un valor `{ questionnaireKey, field, value }` |
| DELETE | `/catalog/:id` | Eliminar un valor (las evaluaciones anteriores no cambian) |
| GET    | `/audits?questionnaireKey=piso\|oficina` | Lista de evaluaciones de todos los usuarios, más recientes primero (solo administrador) |
| GET    | `/export/key` | Clave de solo lectura para el enlace de Power BI (solo administrador) |
| GET    | `/export/audits.csv?questionnaireKey=piso\|oficina&key=` | Evaluaciones del tipo en CSV, con los puntos por sección. No usa sesión: se autoriza con la clave, para pegarlo en Power BI (Obtener datos → Web) |
| GET    | `/audits/mine?from=&to=` | Evaluaciones realizadas por el usuario de la sesión en el periodo (por defecto, el último año) |
| POST   | `/audits` | Iniciar evaluación con `questionnaireKey` y los campos del tipo |
| GET    | `/audits/:id` | Estado completo de una evaluación (quien la realizó o un administrador) |
| POST   | `/audits/:id/answers` | Responder `{ index, answer, deviation }` |

Salvo `/auth/login` y `/users`, todas las rutas requieren el encabezado `Authorization: Bearer <token>`.
El inicio de sesión es solo **identificación** (solo el nombre, sin contraseña): el token es el id del usuario.
El nombre es único y se compara sin distinguir mayúsculas ni acentos (`juan perez` = `Juan Pérez`).
Siempre debe haber al menos un administrador: no se puede quitar el rol al último, y si no existe ninguno el backend (al arrancar) y `npm run seed` crean o promueven a `Admin 01` (o el valor de `ADMIN_NAME` en `backend/.env`).

Campos para iniciar una evaluación:

- **piso:** `costCenter`, `area`, `supervisor`
- **oficina:** `department`, `workshop`, `supervisor` (el usuario debe tener foto de perfil)

`evaluatedPerson` no se envía: el backend guarda el nombre del usuario de la sesión.

Todos son obligatorios y deben estar registrados en el catálogo. Los errores se devuelven como `{ "error": "mensaje" }` con el código HTTP correspondiente.

> `/api/areas` es un endpoint anterior que la interfaz ya no usa.
