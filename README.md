# 5S ZF — Evaluación 5S

Aplicación web para auditorías 5S en planta y en oficinas. El auditor responde las preguntas en formato de chat y al terminar obtiene el puntaje, la calificación (0–100) y el resultado. Todas las evaluaciones quedan registradas.

## Funcionalidades

- **Dos tipos de evaluación**
  - **Piso de planta:** preguntas **Sí / No** organizadas por las 5S. Cada **No** requiere una desviación.
  - **Oficina:** empieza con una **foto del área**; después cada punto se califica *Cumple* (2), *Cumple parcialmente* (1) o *No cumple* (0, requiere desviación).
- **Inicio:** solo se elige el **área**; se muestran su centro de coste y su responsable (la persona evaluada). El supervisor es el usuario de la sesión.
- **Chat:** una pregunta a la vez, con barra de progreso. Una evaluación sin terminar se puede continuar después.
- **Fotos:** se toman con la cámara o se suben desde el dispositivo (máx. 25 MB); se reducen a 1280 px en JPEG y se guardan en la evaluación. La vista de cámara del navegador solo funciona con **HTTPS** o en `localhost`; en HTTP, los teléfonos abren su app de cámara y las computadoras solo el selector de archivos.
- **Resultado y detalle:** calificación, puntos por sección y cada respuesta con su desviación o foto.
- **Registro** (`/registro`, administrador): pestañas Piso / Oficina, filtros por campo, paginación y el **enlace para Power BI** (CSV) de cada tipo.
- **Historial** (`/historial`): evaluaciones en las que el usuario fue la persona evaluada, por periodo (un año por defecto), con gráfica.
- **Perfil** (`/perfil`): nombre, foto y rol.
- **Usuarios** (`/usuarios`, administrador): alta, cambio de rol y eliminación. Desde el inicio de sesión también es posible registrarse (`/usuarios/nuevo`).
- **Áreas** (`/personas`, administrador): alta, edición y eliminación de áreas (nombre, centro de coste opcional y responsable). Las evaluaciones de un área eliminada se conservan. Cada responsable recibe un usuario con rol **Usuario** para ver su Historial.

### Roles

- **Administrador:** realiza evaluaciones y administra registros, usuarios y áreas.
- **Usuario:** solo consulta su Historial y el detalle de sus evaluaciones.

## Tecnologías

| Parte    | Tecnologías |
|----------|-------------|
| Frontend | React 19, React Router 8, Vite 8, Tailwind CSS 4, lucide-react |
| Backend  | Node.js 24, Express 5, Mongoose 9 |
| Base de datos | MongoDB |

Versiones exactas en [requirements.txt](requirements.txt).

## Estructura

```
5S_Project/
├── backend/app/
│   ├── app.js          # Servidor Express y rutas /api
│   ├── config/         # Conexión a MongoDB
│   ├── constants/      # Roles y campos del encabezado
│   ├── controllers/    # Endpoints
│   ├── services/       # Lógica de evaluaciones y cálculo del resultado
│   ├── models/         # Area, Audit, Questionnaire, Setting, User
│   ├── routes/
│   ├── middleware/     # Sesión y errores
│   ├── utils/          # Tareas de arranque (admin, áreas, usuarios de responsables)
│   └── seed/           # floor.json, office.json, default_areas.json y script de carga
├── frontend/src/
│   ├── pages/          # Inicio, formularios, chat, resultado, registro, usuarios, perfil
│   ├── components/     # Formularios, chat (cámara y fotos), layout, modales
│   ├── api/            # Llamadas al backend
│   ├── auth/           # Sesión y rutas protegidas
│   ├── constants/
│   └── hooks/
├── ecosystem.config.js # PM2
└── requirements.txt
```

## Instalación

Requiere Node.js 24+, npm 11+ y MongoDB.

```bash
cd backend && npm install
cd ../frontend && npm install
```

Crear `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/5s_project
PORT=3011
CLIENT_ORIGIN=http://localhost:5175
# Opcional: ADMIN_NAME, ADMIN_EMAIL (cuenta de control)
```

`PORT` es obligatorio y debe coincidir con el proxy `/api` de [frontend/vite.config.js](frontend/vite.config.js).

Al arrancar, el backend crea la cuenta de control, agrega las áreas por defecto (solo en una instalación nueva) y crea los usuarios de los responsables. `npm run seed` en `backend` carga los cuestionarios.

## Ejecución

```bash
cd backend && npm run dev     # API en http://localhost:3011
cd frontend && npm run dev    # App en http://localhost:5175 (también en la red local)
```

| Carpeta  | Comando         | Descripción |
|----------|-----------------|-------------|
| backend  | `npm run dev`   | API con recarga automática |
| backend  | `npm start`     | API sin recarga |
| backend  | `npm run seed`  | Carga cuestionarios y áreas por defecto |
| frontend | `npm run dev`   | Servidor de desarrollo |
| frontend | `npm run build` | Compilación a `frontend/dist` |
| frontend | `npm run lint`  | oxlint |

## Despliegue (PM2)

[ecosystem.config.js](ecosystem.config.js) ejecuta el backend y `vite preview` (sirve `frontend/dist` en `0.0.0.0:5175` y redirige `/api`) como una sola app, `5s-evaluation-app`. Requiere `bash` y PM2.

```bash
cd frontend && npm run build
cd .. && pm2 start ecosystem.config.js
```

Tras cambiar el frontend: `npm run build` y `pm2 restart 5s-evaluation-app`. Para usar la cámara del navegador en otros dispositivos, sirve la app por HTTPS (por ejemplo, con un proxy inverso y certificado interno).

## Cálculo del resultado

- **Piso:** Sí = 1 punto, No = 0. **Oficina:** 2, 1 o 0 puntos. Las preguntas de foto no suman.
- **Calificación** = puntos ÷ puntos máximos × 100 (redondeado).
- **Resultado:** el nivel más alto cuyo mínimo se alcanza (campo `results` de cada cuestionario).

Para cambiar las preguntas: editar `backend/app/seed/floor.json` u `office.json`, incrementar `"version"` (las evaluaciones anteriores conservan la suya) y ejecutar `npm run seed`. El cuestionario de piso debe tener las 5 secciones en orden (`seiri`, `seiton`, `seiso`, `seiketsu`, `shitsuke`).

## API

Base: `/api`. Salvo `/auth/login`, `POST /users` y `/export/:key/...`, todas las rutas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST   | `/auth/login` | `{ email }` → `{ token, user }` |
| GET    | `/auth/me` | Usuario de la sesión |
| GET    | `/users` | Lista de usuarios (admin) |
| POST   | `/users` | Crear usuario `{ name, email, role? }`; solo un admin asigna roles |
| PATCH  | `/users/me` | Perfil propio `{ name?, email?, avatar? }` |
| PATCH  | `/users/:id` | Perfil de un usuario (admin) |
| PATCH  | `/users/:id/role` | Cambiar rol `{ role }` (admin) |
| DELETE | `/users/:id` | Eliminar usuario (admin); no la cuenta de control, el propio, el último admin ni un responsable |
| GET    | `/questionnaires` | Cuestionarios disponibles |
| GET    | `/areas` | Áreas |
| POST · PATCH · DELETE | `/areas[/:id]` | Crear, editar o eliminar áreas (admin) |
| GET    | `/audits?questionnaireKey=piso\|oficina` | Todas las evaluaciones (admin) |
| GET    | `/audits/mine?from=&to=` | Evaluaciones completadas del usuario evaluado |
| POST   | `/audits` | Iniciar `{ questionnaireKey, areaId }` (admin) |
| GET    | `/audits/:id` | Estado de una evaluación (admin o persona evaluada) |
| POST   | `/audits/:id/answers` | `{ index, answer, deviation? }` · `{ index, points, deviation? }` · `{ index, photo }` (admin) |
| GET    | `/export/key` | Clave para el enlace de Power BI (admin) |
| GET    | `/export/:key/piso.csv` · `oficina.csv` | Evaluaciones para Power BI (también `.json` y `.html`) |

Errores: `{ "error": "mensaje" }` con el código HTTP correspondiente.

**Sesión:** solo con el correo, sin contraseña (el token es el id del usuario). Correo y nombre son únicos. Siempre queda al menos un administrador. La **cuenta de control** `Admin 01` (`admin@zf.test`) siempre existe como administrador; solo ella puede cambiar su nombre y foto.
