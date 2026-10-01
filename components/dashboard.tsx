'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, BarChart3, ClipboardList, Download, FileText, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export type Shift = {
  id: number
  date: string
  shift: string
  supervisor: string
  present: number
  absent: number
  prepared: number
  target: number
  productivity: number
  productionBySector?: Record<string, number>
}

type DashboardProps = {
  history: Shift[]
  onExportExcel: () => void
  onExportPdf: () => void
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Kpi({ label, value, delta, sub, tone, icon, progress }: { label: string; value: ReactNode; delta?: string; sub?: string; tone: string; icon: ReactNode; progress?: number }) {
  return <div className="kpi"><div className={`kpi-icon ${tone}`}>{icon}</div><div className="kpi-info"><span>{label}</span><strong>{value}</strong>{progress !== undefined ? <div className="mini-progress"><i style={{ width: `${progress}%` }} /></div> : <small className={delta?.startsWith('-') ? 'down' : 'up'}>{delta || sub}</small>}</div></div>
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="chart-card"><div className="card-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><button className="more" aria-label={`Más opciones: ${title}`}>•••</button></div>{children}</div>
}

export default function Dashboard({ history, onExportExcel, onExportPdf }: DashboardProps) {
  const latest = history[0]
  if (!latest) return <div className="content"><PageTitle eyebrow="Sin datos cargados" title="Resumen operativo" description="El dashboard se completará cuando guardes un reporte de turno." action={<button className="primary-button" onClick={onExportExcel}><Download /> Exportar a Excel</button>} /><div className="table-wrap" style={{ padding: 24 }}>Todavía no hay reportes guardados.</div></div>

  const compliancePercent = latest.target > 0 ? Math.round((latest.prepared / latest.target) * 100) : 0
  const missingBultos = latest.target - latest.prepared
  const productionData = [{ name: 'Bultos', preparados: latest.prepared, objetivo: latest.target }]
  const attendanceData = [{ name: 'Turno', presentes: latest.present, ausentes: latest.absent }]

  return <div className="content">
    <PageTitle
      eyebrow={`Fecha: ${latest.date}`}
      title="Resumen operativo"
      description="Monitorea el rendimiento de tu operación en tiempo real."
      action={<div className="dashboard-actions"><button className="primary-button" onClick={onExportExcel}><Download /> Exportar a Excel</button><button className="secondary-button" onClick={onExportPdf}><FileText /> Exportar PDF</button></div>}
    />

    <div className="shift-strip">
      <div className="shift-label"><span className="live-dot" /><div><small>Turno activo</small><strong>{latest.shift}</strong></div></div>
      <div className="shift-detail">{latest.supervisor && <span>Supervisor/a: <b>{latest.supervisor}</b></span>}</div>
    </div>

    <div className="kpi-grid">
      <Kpi label="Presentes total" value={latest.present} tone="green" icon={<Users />} />
      <Kpi label="Ausentes" value={latest.absent} tone="red" icon={<AlertTriangle />} />
      <Kpi label="Bultos preparados" value={latest.prepared.toLocaleString('es-ES')} sub={`de ${latest.target.toLocaleString('es-ES')} objetivo`} progress={compliancePercent} tone="cyan" icon={<BarChart3 />} />
      <Kpi label="Cumplimiento" value={`${compliancePercent}%`} tone="gold" icon={<ClipboardList />} />
      <Kpi label="Productividad" value={latest.productivity} sub="bultos / persona" tone="purple" icon={<BarChart3 />} />
      <Kpi label="Picking tradicional" value={(latest.productionBySector?.['PICKING TRADICIONAL'] ?? 0).toLocaleString('es-ES')} tone="cyan" icon={<BarChart3 />} />
      <Kpi label="Bultos PU" value={(latest.productionBySector?.PU ?? 0).toLocaleString('es-ES')} tone="green" icon={<BarChart3 />} />
      <Kpi label="Bultos PTR" value={(latest.productionBySector?.PTR ?? 0).toLocaleString('es-ES')} tone="gold" icon={<BarChart3 />} />
    </div>

    <div className="chart-grid">
      <ChartCard title="Producción del turno" subtitle="Bultos preparados y objetivo cargado">
        <ResponsiveContainer width="100%" height={245}>
          <BarChart data={productionData} barSize={34}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} width={45} />
            <Tooltip /><Legend iconType="circle" />
            <Bar dataKey="preparados" name="Preparados" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            <Bar dataKey="objetivo" name="Objetivo" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Asistencia del turno" subtitle="Valores registrados en la carga">
        <ResponsiveContainer width="100%" height={245}>
          <BarChart data={attendanceData} barSize={34}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} width={45} />
            <Tooltip />
            <Bar dataKey="presentes" name="Presentes" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ausentes" name="Ausentes" fill="#fb7185" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Objetivo del turno" subtitle="Avance de bultos preparados">
        <div className="goal-panel">
          <div className="goal-ring"><strong>{compliancePercent}%</strong><span>cumplido</span></div>
          <div className="goal-copy">
            <strong>{latest.prepared.toLocaleString('es-ES')} <small>/ {latest.target.toLocaleString('es-ES')}</small></strong>
            <span>Meta del turno</span>
            <div className="progress"><i style={{ width: `${Math.min(compliancePercent, 100)}%` }} /></div>
            <em>{missingBultos > 0 ? `Faltan ${missingBultos.toLocaleString('es-ES')} bultos` : '¡Objetivo completado!'}</em>
          </div>
        </div>
      </ChartCard>
    </div>

    <section className="recent">
      <div className="section-heading"><div><h2>Actividad reciente</h2><p>Últimos turnos registrados en la operación.</p></div></div>
      <div className="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Turno</th><th>Supervisor</th><th>Presentes</th><th>Bultos preparados</th><th>Cumplimiento</th></tr></thead>
        <tbody>{history.slice(0, 3).map(row => (
          <tr key={row.id}>
            <td>{row.date}</td><td><span className="badge neutral">{row.shift}</span></td><td>{row.supervisor}</td>
            <td>{row.present} <span className="muted">/ {row.present + row.absent}</span></td>
            <td><strong>{row.prepared.toLocaleString('es-ES')}</strong></td>
            <td><span className={row.prepared >= row.target ? 'badge success' : 'badge warning'}>{row.target > 0 ? Math.round((row.prepared / row.target) * 100) : 0}%</span></td>
          </tr>
        ))}</tbody>
      </table></div>
    </section>
  </div>
}
