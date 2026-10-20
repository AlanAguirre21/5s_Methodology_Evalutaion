# 5S ZF — Evaluación 5S

Aplicación web para realizar auditorías 5S (Seiri, Seiton, Seiso, Seiketsu, Shitsuke) en planta y en oficinas.
El auditor responde preguntas de **Sí / No** en formato de chat; cada **No** requiere describir la desviación.
Al terminar se obtiene el puntaje, la calificación (0–100) y el resultado, y todas las evaluaciones quedan registradas para consulta.

## Funcionalidades

- **Dos tipos de evaluación**
  - **Piso de planta:** cuestionario organizado por las 5S.
  - **Oficina:** cuestionario propio (limpieza y orden, visualización, funcionalidad, seguridad, artículos privados).
- **Formulario de inicio:** en piso y en oficina solo se elige el **área**. Se muestran su centro de coste (si tiene) y su responsable, que es la persona evaluada.
  - El **supervisor** es siempre el usuario que inició sesión; no se elige.
- **Evaluación tipo chat:** una pregunta a la vez, agrupadas por sección, con barra de progreso. Una evaluación sin terminar puede continuarse después.
- **Resultado:** puntos obtenidos, calificación 0–100 y nivel (p. ej. *Puntaje Objetivo*).
- **Registro de evaluaciones** (`/registro`, solo administrador): pestañas Piso / Oficina, filtros por cada campo, 10 / 25 / 50 / 100 / todas las filas por página.
- **Detalle de cada evaluación:** calificación, puntos por sección y todas las preguntas con su respuesta y desviación.
- **Perfil** (`/perfil`): nombre, foto y rol del usuario. El rol es de solo lectura; un administrador puede cambiar el suyo tras confirmar.
- **Historial** (`/historial`): evaluaciones completadas en las que el usuario fue la persona evaluada, en un periodo (un año por defecto), con gráfica de calificaciones.
- **Usuarios** (`/usuarios`, solo administrador): lista de usuarios, cambio de rol, alta y eliminación de usuarios.
- **Áreas** (`/personas`, solo administrador): alta, edición y eliminación de áreas (nombre, centro de coste opcional y responsable con nombre y correo), con búsqueda. Eliminar un área pide confirmación y no se puede deshacer; sus evaluaciones se conservan con el área, el centro de coste y la persona evaluada que tenían. Las áreas de `backend/app/seed/default_areas.json` se agregan al arrancar el backend o con `npm run seed` solo en una instalación nueva (sin áreas ni evaluaciones), así que las que se eliminan no vuelven. Cada responsable de un área (las que se agregan o editan en esta página) recibe un usuario con rol **Usuario** con su nombre y correo, si no tiene uno, para que vea en su **Historial** las evaluaciones en las que fue la persona evaluada.

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
│   │   └── seed/               # Cuestionarios (floor.json, office.json), áreas por defecto (default_areas.json) y script de carga
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Inicio, formularios, chat, resultado, registros, detalle
│   │   ├── components/         # Formularios, chat, layout, modales
│   │   ├── api/                # Llamadas al backend
│   │   ├── constants/          # Tipos de evaluación y campos (etiquetas)
│   │   └── hooks/              # useAudit (estado de una evaluación)
│   ├── public/                 # Íconos
│   └── package.json
├── ecosystem.config.js         # Configuración de PM2 para el despliegue
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
CLIENT_ORIGIN=http://localhost:5173
```

`PORT` es obligatorio: el backend no tiene puerto por defecto. `CLIENT_ORIGIN` es el origen del frontend permitido por CORS.

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
| backend  | `npm run seed`  | Carga los cuestionarios y las áreas por defecto de `app/seed` |
| frontend | `npm run dev`   | Servidor de desarrollo |
| frontend | `npm run build` | Compilación para producción (`frontend/dist`) |
| frontend | `npm run lint`  | Revisión de código (oxlint) |

## Despliegue (PM2)

En el servidor, [ecosystem.config.js](ecosystem.config.js) levanta una sola aplicación de PM2 (`5s-evaluation-app`) que ejecuta el backend y `vite preview` (que sirve `frontend/dist`) juntos; si uno de los dos termina, se detiene el otro y PM2 reinicia la aplicación. `vite preview` escucha en todas las interfaces (`0.0.0.0`) y también redirige `/api` al backend.

Requiere `bash` y PM2 instalados en el servidor.

```bash
# 1. Compilar el frontend
cd frontend
npm run build

# 2. Iniciar desde la raíz del proyecto
cd ..
pm2 start ecosystem.config.js
```

Los puertos están en `backend/.env` (`PORT`) y en [frontend/vite.config.js](frontend/vite.config.js) (`server`, `preview` y el destino del proxy `/api`), que deben coincidir. Tras cambiar el frontend, volver a ejecutar `npm run build` y `pm2 restart 5s-evaluation-app`.

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
| POST   | `/auth/login` | Identificarse con `{ email }`; devuelve `{ token, user }` |
| GET    | `/auth/me` | Usuario de la sesión actual |
| GET    | `/users` | Lista de usuarios (solo administrador) |
| POST   | `/users` | Crear usuario `{ name, email, role? }`; con sesión, solo un administrador puede crear usuarios; solo un administrador puede asignar `role: "admin"` |
| PATCH  | `/users/me` | Editar el perfil propio `{ name?, email?, avatar? }`; `avatar` es una imagen como data URL, o `null` para quitarla |
| PATCH  | `/users/:id` | Editar el perfil de cualquier usuario `{ name?, email?, avatar? }` (solo administrador) |
| PATCH  | `/users/:id/role` | Cambiar el rol `{ role }` (solo administrador; siempre debe quedar al menos uno) |
| DELETE | `/users/:id` | Eliminar usuario (solo administrador). Sus evaluaciones se conservan. No se puede eliminar la cuenta de control, el propio usuario, el último administrador ni el responsable de un área |
| GET    | `/questionnaires` | Tipos de cuestionario disponibles |
| GET    | `/areas` | Áreas, para los formularios |
| POST   | `/areas` | Crear área `{ name, costCenter?, manager: { name, email } }` (solo administrador) |
| PATCH  | `/areas/:id` | Editar área `{ name?, costCenter?, manager? }` (solo administrador) |
| DELETE | `/areas/:id` | Eliminar área (solo administrador; sus evaluaciones se conservan) |
| GET    | `/audits?questionnaireKey=piso\|oficina` | Lista de evaluaciones de todos los usuarios, más recientes primero (solo administrador) |
| GET    | `/export/key` | Clave de solo lectura para el enlace de Power BI (solo administrador) |
| GET    | `/export/:key/piso.csv` · `/export/:key/oficina.csv` | Evaluaciones del tipo con los puntos por sección, para Power BI. No usa sesión: se autoriza con la clave del enlace. Devuelve CSV; con `.json` o `.html` al final devuelve JSON o una página con la tabla |
| GET    | `/audits/mine?from=&to=` | Evaluaciones del periodo (por defecto, el último año): las completadas en las que el usuario fue la persona evaluada |
| POST   | `/audits` | Iniciar evaluación `{ questionnaireKey, areaId }` (solo administrador) |
| GET    | `/audits/:id` | Estado completo de una evaluación (un administrador o la persona evaluada) |
| POST   | `/audits/:id/answers` | Responder `{ index, answer, deviation }` (solo administrador) |

Salvo `/auth/login` y `POST /users`, todas las rutas requieren el encabezado `Authorization: Bearer <token>`.
El inicio de sesión es solo **identificación** (solo el correo, sin contraseña): el token es el id del usuario.
El correo es único y se compara sin distinguir mayúsculas. El nombre también es único (sin distinguir mayúsculas ni acentos). Los usuarios creados antes de que existiera el correo no pueden iniciar sesión hasta que un administrador les asigne uno en **Usuarios**.
Siempre debe haber al menos un administrador: no se puede quitar el rol al último.
La **cuenta de control** `Admin 01` (correo `admin@zf.test`) existe siempre: el backend (al arrancar) y `npm run seed` la crean si falta y la dejan activa, como administrador y con ese correo (`ADMIN_NAME` y `ADMIN_EMAIL` en `backend/.env` cambian los valores por defecto). Nadie más puede editarla: ni su perfil, ni su foto, ni su rol. Ella misma solo puede cambiar su nombre y su foto; su correo y su rol no se pueden cambiar.

Para iniciar una evaluación solo se envía el `areaId` de un área activa con responsable. El backend guarda en la evaluación el nombre del área (`area`), su centro de coste (`costCenter`) y el responsable (`evaluatedPerson` y su correo). Si el correo del responsable es de un usuario registrado, ese usuario ve la evaluación en su **Historial**. `supervisor` no se envía: el backend guarda el nombre del usuario de la sesión.

Los errores se devuelven como `{ "error": "mensaje" }` con el código HTTP correspondiente.
