# 📦 Dashboard Operativo - ExoLogística

Aplicación web interactiva para la gestión, monitoreo en tiempo real y registro histórico de métricas operativas en depósitos de logística. Diseñada para supervisores y equipos de operaciones.

---

## 🚀 Características Principales

- **📊 Resumen Operativo en Tiempo Real:** Visualización de KPIs clave como bultos preparados, cumplimiento de metas, productividad por persona, ausentismo y rechazos.
- **📈 Gráficos Dinámicos:**
  - Distribución de personal por sector (OLA, PTR, PU-9, Caddys, Pallets, Cierre) mediante gráficos de torta.
  - Producción por tipo de picking y control de asistencia mediante gráficos de barras.
- **📝 Carga de Datos del Turno:** Formulario intuitivo para el ingreso diario de la dotación y métricas de producción por supervisor/a.
- **📁 Histórico de Turnos:** Registro y consulta de turnos pasados con badges de estado según el porcentaje de cumplimiento de objetivos.
- **📄 Exportación a PDF:** Generación e impresión instantánea de reportes ejecutivos en formato PDF.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** [React](https://react.dev/) / [Next.js](https://nextjs.org/)
- **Lenguaje:** TypeScript
- **Estilos:** CSS3 / Tailwind CSS
- **Visualización de Datos:** [Recharts](https://recharts.org/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Exportación de Reportes:** `html2canvas` + `jspdf`
- **Control de Versiones:** Git & GitHub

---

## 🔧 Instalación y Configuración Local

Sigue estos pasos para clonar y ejecutar el proyecto en tu máquina local:

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/MarilynDaiana/exo.git](https://github.com/MarilynDaiana/exo.git)
   cd exo