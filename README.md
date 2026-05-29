# NeuroLive Frontend

Interfaz web de NeuroLive para pacientes, cuidadores, médicos y usuarios personales.
Permite visualizar el estado biométrico del paciente, consultar historial de crisis, gestionar vínculos y acceder a dashboards según el rol autenticado.

## Producción

* URL de la interfaz: https://neuro-live-frontend.vercel.app/

## Funcionalidades principales

* Registro e inicio de sesión de usuarios.
* Dashboards por rol:

  * Paciente
  * Médico
  * Cuidador
  * Usuario personal
* Visualización de telemetría biométrica.
* Consulta de historial de crisis.
* Visualización de estado de bienestar.
* Vinculación entre paciente, médico y cuidador.
* Configuración de perfil y preferencias.
* Exportación de datos clínicos cuando aplica.

## Tecnologías utilizadas

* Next.js
* React
* TypeScript
* CSS / Tailwind CSS
* Vercel para despliegue
* Consumo de API REST del backend NeuroLive

## Integración con backend

El frontend consume la API pública del backend desplegado en Azure:

```text
https://neurolive-backend.azurewebsites.net
```

Los endpoints protegidos utilizan autenticación mediante JWT:

```text
Authorization: Bearer <token>
```

## Variables de entorno

Crear un archivo `.env.local` para desarrollo local:

```env
NEXT_PUBLIC_API_URL=https://neurolive-backend.azurewebsites.net
```

No subir archivos `.env` con secretos al repositorio.

## Ejecución local

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Compilar para producción:

```bash
npm run build
```

Ejecutar versión compilada:

```bash
npm run start
```

## Verificación

Comandos recomendados antes de subir cambios:

```bash
npm run typecheck
npm run build
```

## Rutas principales

```text
/login
/register
/dashboard/patient
/dashboard/doctor
/dashboard/caregiver
/dashboard/personal
/profile
```

## Estado del despliegue

El frontend se encuentra desplegado en Vercel y conectado al backend de producción en Azure.


