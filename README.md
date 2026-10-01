# 📦 ExoLogística - Sistema de Gestión Operativa y Control de Turnos

Sistema web para el control, registro y análisis en tiempo real de la operación logística, dotación de personal, distribución por sectores y métricas de producción por turno.

---

## 🚀 Características Principales

- **📝 Carga de Datos Operativos (`operational-data.tsx`)**:
  - Registro parametrizado por fecha, turno, rango horario y supervisores a cargo.
  - Gestión de asistencia y ausentismo multinivel (Operativos, Clarkistas, Administración/Efectivos).
  - Distribución dinámica y reactiva de personal por sectores (`OLA`, `PTR`, `PU-9`, `PU-11`, `CADDYS`, `PALLETS`, `GUARDADO`, etc.).
  - Validación automática de personas sin asignar y límites máximos según el total de presentes.
  - Registro de producción en bultos por sector (`PICKING TRADICIONAL`, `PU`, `PTR`) con cálculo dinámico de % de cumplimiento.
  - Guardado automático de borradores en el almacenamiento local (`localStorage`).

- **📊 Dashboard y Métricas de Control (`dashboard.tsx`)**:
  - Indicadores clave (KPIs): Total Presentes, % Ausentismo, Bultos Preparados, Cumplimiento de Objetivo.
  - Visualización gráfica de la distribución de personal por sector.
  - Tabla interactiva de ausentismo detallado por grupo.
  - Monitoreo del estado de etapas críticas (ej. Estado PTR: *Stage Lleno*, *Falta armar Stage*, etc.).

- **📄 Exportación e Informes (`export.tsx`)**:
  - Generación de reportes formateados para impresión o descarga.
  - Exportación de datos operativos a formato **PDF** y Microsoft **Excel** (`.xlsx`).
  - Histórico de reportes guardados con opciones de visualización y filtrado.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18+)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: Tailwind CSS / CSS Modules
- **Iconos**: [Lucide React](https://lucide.dev/)
- **Almacenamiento Local**: Web Storage API (`localStorage`)

---

## 📂 Estructura del Proyecto

```text
src/
├── components/
│   ├── operational-data.tsx   # Formulario principal de carga de datos y asistencia
│   ├── dashboard.tsx          # Panel principal de KPIs y gráficos
│   └── export.tsx             # Módulo de exportación a PDF / Excel
├── app/
│   ├── page.tsx               # Vista principal e integración de módulos
│   └── layout.tsx             # Layout global de la aplicación
└── types/
    └── index.ts               # Definición de interfaces TypeScript