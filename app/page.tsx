'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, BarChart3, CalendarDays, ChevronDown, ClipboardList, Download, FileText, LayoutDashboard, Menu, Moon, Save, Sun, Users, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ExcelJS from 'exceljs'
import Employees from '../components/employees'

type Shift = { id: number; date: string; shift: string; supervisor: string; present: number; absent: number; prepared: number; target: number; productivity: number; productionBySector?: Record<string, number> }

export default function Page() {
  const [active, setActive] = useState('dashboard')
  const [dark, setDark] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [history, setHistory] = useState<Shift[]>([])
  const [form, setForm] = useState({ date: '', shift: 'Mañana', supervisor: '', present: '0', absent: '0', prepared: '0', target: '0', rejected: '0' })
  const [storageReady, setStorageReady] = useState(false)
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('exologistica:history')
      const savedForm = localStorage.getItem('exologistica:form')
      if (savedHistory) setHistory(JSON.parse(savedHistory))
      if (savedForm) setForm(current => ({ ...current, ...JSON.parse(savedForm) }))
    } catch {}
    setStorageReady(true)
  }, [])
  useEffect(() => {
    if (!storageReady) return
    try {
      localStorage.setItem('exologistica:history', JSON.stringify(history))
      localStorage.setItem('exologistica:form', JSON.stringify(form))
    } catch {}
  }, [form, history, storageReady])
  const saveShift = () => {
    const present = Number(form.present), prepared = Number(form.prepared), target = Number(form.target)
    let productionBySector: Record<string, number> = {}
    try {
      const draft = JSON.parse(localStorage.getItem('exologistica:draft') || '{}')
      productionBySector = Object.fromEntries(Object.entries(draft.production || {}).map(([sector, values]: [string, any]) => [sector, Number(values.prepared) || 0]))
    } catch {}
    const shift: Shift = { id: Date.now(), ...form, present, absent: Number(form.absent), prepared, target, productivity: present > 0 ? Math.round(prepared / present) : 0, productionBySector }
    setHistory(current => [shift, ...current])
    setActive('dashboard')
  }
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const summary = workbook.addWorksheet('Resumen')
    summary.columns = [{ header: 'Indicador', key: 'indicator', width: 30 }, { header: 'Resultado', key: 'result', width: 28 }]
    const latest = history[0]
    summary.addRows([
      ['Fecha', latest?.date || 'Sin datos'],
      ['Turno', latest?.shift || ''],
      ['Supervisor', latest?.supervisor || ''],
      ['Presentes', latest?.present ?? 0],
      ['Ausentes', latest?.absent ?? 0],
      ['Bultos preparados', latest?.prepared ?? 0],
      ['Objetivo de bultos', latest?.target ?? 0],
      ['Cumplimiento', latest?.target ? `${Math.round((latest.prepared / latest.target) * 100)}%` : '0%'],
      ['Productividad (bultos/persona)', latest?.productivity ?? 0],
      ...Object.entries(latest?.productionBySector || {}).map(([sector, count]) => [`Producción ${sector}`, count]),
    ])
    summary.getRow(1).font = { bold: true }

    const shifts = workbook.addWorksheet('Turnos')
    shifts.columns = [
      { header: 'Fecha', key: 'date', width: 16 },
      { header: 'Turno', key: 'shift', width: 14 },
      { header: 'Supervisor', key: 'supervisor', width: 24 },
      { header: 'Presentes', key: 'present', width: 12 },
      { header: 'Ausentes', key: 'absent', width: 12 },
      { header: 'Preparados', key: 'prepared', width: 14 },
      { header: 'Objetivo', key: 'target', width: 14 },
      { header: 'Cumplimiento', key: 'compliance', width: 16 },
      { header: 'Productividad', key: 'productivity', width: 16 },
      { header: 'Producción por sector', key: 'production', width: 42 },
    ]
    history.forEach(shift => shifts.addRow({
      ...shift,
      compliance: shift.target ? `${Math.round((shift.prepared / shift.target) * 100)}%` : '0%',
      production: Object.entries(shift.productionBySector || {}).map(([sector, count]) => `${sector}: ${count}`).join(', '),
    }))
    shifts.getRow(1).font = { bold: true }

    const file = await workbook.xlsx.writeBuffer()
    const blob = new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-operativo-exologistica-${form.date || 'dashboard'}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const exportPdf = async () => {
    const report = document.querySelector('.content') as HTMLElement | null
    if (!report) return
    const canvas = await html2canvas(report, { scale: 2, backgroundColor: '#f6f8fb', useCORS: true })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const width = 190
    const height = (canvas.height * width) / canvas.width
    let offset = 0
    while (offset < height) {
      if (offset > 0) pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, -offset + 10, width, height)
      pdf.setFontSize(7)
      pdf.setTextColor(125, 135, 145)
      pdf.text('© Diseñado por Ivan Barreto  –  Supervisor de Logística  –  Exologística  –  Todos los derechos reservados', 105, 290, { align: 'center', maxWidth: 185 })
      offset += 277
    }
    pdf.save(`reporte-operativo-peya-${form.date.replaceAll('/', '-')}.pdf`)
  }
  const navItems = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'carga', label: 'Carga de Datos', icon: ClipboardList }, { id: 'empleados', label: 'Empleados', icon: Users }]
  return <div className={dark ? 'app dark-mode' : 'app'}>
    <aside className={mobileNav ? 'sidebar open' : 'sidebar'}>
      <div className="brand"><div className="brand-mark">PX</div><div><strong>PEYA</strong><span>EXOLOGÍSTICA</span></div><button className="close-mobile" onClick={() => setMobileNav(false)}><X /></button></div>
      <div className="status"><span className="live-dot" /> Reportes guardados <b>{history.length}</b></div>
      <nav>{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(item.id); setMobileNav(false) }}><Icon /> {item.label}</button> })}</nav>
      <div className="sidebar-bottom"><div className="support"><div className="avatar">EX</div><div><strong>Exologística</strong><span>Operaciones</span></div><ChevronDown /></div></div>
    </aside>
    <main className="main"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu /></button><div className="breadcrumb"><span>Operaciones</span><b>/</b><strong>{navItems.find(i => i.id === active)?.label}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Cambiar tema" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button><button className="profile">EX</button></div></header>
      {active === 'dashboard' && <Dashboard history={history} onExportExcel={exportExcel} onExportPdf={exportPdf} />}
      {active === 'carga' && <OperationalDataEntry form={form} setForm={setForm} onSave={saveShift} />}
      {active === 'empleados' && <Employees />}
      <footer className="app-footer">© Diseñado por Ivan Barreto  –  Supervisor de Logística  –  Exologística  –  Todos los derechos reservados</footer>
    </main>
  </div>
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div> }
function Dashboard({ history, onExportExcel, onExportPdf }: { history: Shift[]; onExportExcel: () => void; onExportPdf: () => void }) {
  const latest = history[0]
  if (!latest) return <div className="content"><PageTitle eyebrow="Sin datos cargados" title="Resumen operativo" description="El dashboard se completará cuando guardes un reporte de turno." action={<button className="primary-button" onClick={onExportExcel}><Download /> Exportar a Excel</button>} /><div className="table-wrap" style={{ padding: 24 }}>Todavía no hay reportes guardados.</div></div>

  const compliancePercent = latest.target > 0 ? Math.round((latest.prepared / latest.target) * 100) : 0
  const missingBultos = latest.target - latest.prepared
  const productionData = [{ name: 'Bultos', preparados: latest.prepared, objetivo: latest.target }]
  const attendanceData = [{ name: 'Turno', presentes: latest.present, ausentes: latest.absent }]

  return (
    <div className="content">
      <PageTitle 
        eyebrow={`Fecha: ${latest.date}`} 
        title="Resumen operativo" 
        description="Monitorea el rendimiento de tu operación en tiempo real." 
        action={<div className="dashboard-actions"><button className="primary-button" onClick={onExportExcel}><Download /> Exportar a Excel</button><button className="secondary-button" onClick={onExportPdf}><FileText /> Exportar PDF</button></div>}
      />

      <div className="shift-strip">
        <div className="shift-label">
          <span className="live-dot" />
          <div>
            <small>Turno activo</small>
            <strong>{latest.shift}</strong>
          </div>
        </div>
        <div className="shift-detail">
          {latest.supervisor && <span>Supervisor/a: <b>{latest.supervisor}</b></span>}
        </div>
      </div>

      {/* Tarjetas KPI dinámicas */}
      <div className="kpi-grid">
        <Kpi label="Presentes total" value={latest.present} tone="green" icon={<Users />} />
        <Kpi label="Ausentes" value={latest.absent} tone="red" icon={<AlertTriangle />} />
        <Kpi 
          label="Bultos preparados" 
          value={latest.prepared.toLocaleString('es-ES')} 
          sub={`de ${latest.target.toLocaleString('es-ES')} objetivo`} 
          progress={compliancePercent} 
          tone="cyan" 
          icon={<BarChart3 />} 
        />
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
              <Tooltip />
              <Legend iconType="circle" />
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
            <div className="goal-ring">
              <strong>{compliancePercent}%</strong>
              <span>cumplido</span>
            </div>
            <div className="goal-copy">
              <strong>{latest.prepared.toLocaleString('es-ES')} <small>/ {latest.target.toLocaleString('es-ES')}</small></strong>
              <span>Meta del turno</span>
              <div className="progress">
                <i style={{ width: `${Math.min(compliancePercent, 100)}%` }} />
              </div>
              <em>{missingBultos > 0 ? `Faltan ${missingBultos.toLocaleString('es-ES')} bultos` : '¡Objetivo completado!'}</em>
            </div>
          </div>
        </ChartCard>
      </div>

      <section className="recent">
        <div className="section-heading">
          <div>
            <h2>Actividad reciente</h2>
            <p>Últimos turnos registrados en la operación.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Turno</th>
                <th>Supervisor</th>
                <th>Presentes</th>
                <th>Bultos preparados</th>
                <th>Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 3).map(row => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td><span className="badge neutral">{row.shift}</span></td>
                  <td>{row.supervisor}</td>
                  <td>{row.present} <span className="muted">/ {row.present + row.absent}</span></td>
                  <td><strong>{row.prepared.toLocaleString('es-ES')}</strong></td>
                  <td>
                    <span className={row.prepared >= row.target ? 'badge success' : 'badge warning'}>
                      {Math.round((row.prepared / row.target) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
function Kpi({ label, value, delta, sub, tone, icon, progress }: any)
{ 
  return <div className="kpi"><div className={'kpi-icon ' + tone}>{icon}</div><div className="kpi-info"><span>{label}</span><strong>{value}</strong>{progress ? <div className="mini-progress"><i style={{ width: progress + '%' }} /></div> : <small className={delta?.startsWith('-') ? 'down' : 'up'}>{delta || sub}</small>}</div></div> }
function ChartCard({ title, subtitle, children }: any) { return <div className="chart-card"><div className="card-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><button className="more">•••</button></div>{children}</div> }
function OperationalDataEntry({ form, setForm, onSave }: any) {
  const supervisors = ['Abel Cuevas', 'Daiana Corrales', 'Diego Galban', 'Ivan Barreto', 'Martin Cala', 'Martin Fernandez', 'Matias Carbonetti', 'Maximiliano Lugo', 'Sebastian Burnes']
  const operationalGroups = ['JAD', 'SAM', 'SEMANEROS', 'HRS EXTRAS', 'OTROS']
  const operationalSectors = ['OLA', 'PTR', 'PU-9', 'PU-11', 'CADDYS', 'PALLETS', 'CIERRE CAJAS', 'PASILLOS', 'ROTURAS', 'ADMINISTRACIÓN', 'OTRAS OP']
  const clarkSectors = ['GUARDADO', 'REPO TRAD.', 'PTR', 'PU-9', 'PU-11', 'SAMPI', 'OTRAS OP']
  const adminSectors = ['ADMINISTRACIÓN', 'OLA', 'PTR', 'PU-9', 'PU-11', 'ARMADO', 'OTRAS OP']
  const [groups, setGroups] = useState<Record<string, { expected: number; present: number }>>(Object.fromEntries(operationalGroups.map(name => [name, { expected: 0, present: 0 }])))
  const [clarkBase, setClark] = useState({ expected: 0, present: 0 })
  const [clarkOthers, setClarkOthers] = useState([{ expected: 0, present: 0 }, { expected: 0, present: 0 }])
  const clark = { expected: clarkBase.expected + clarkOthers.reduce((sum, row) => sum + row.expected, 0), present: clarkBase.present + clarkOthers.reduce((sum, row) => sum + row.present, 0) }
  const [admin, setAdmin] = useState<Record<string, { expected: number; present: number }>>({ 'ADMINISTRACIÓN': { expected: 0, present: 0 }, 'EFECTIVOS DEPÓSITO': { expected: 0, present: 0 }, 'HRS EXTRAS': { expected: 0, present: 0 }, OTROS: { expected: 0, present: 0 } })
  const [operational, setOperational] = useState<Record<string, number>>(Object.fromEntries(operationalSectors.map(s => [s, 0])))
  const [clarkDistribution, setClarkDistribution] = useState<Record<string, number>>(Object.fromEntries(clarkSectors.map(s => [s, 0])))
  const [adminDistribution, setAdminDistribution] = useState<Record<string, number>>(Object.fromEntries(adminSectors.map(s => [s, 0])))
  const [production, setProduction] = useState({ 'PICKING TRADICIONAL': { prepared: 0, target: 0 }, PU: { prepared: 0, target: 0 }, PTR: { prepared: 0, target: 0 } })
  const [ptrStatus, setPtrStatus] = useState('')
  const [draftReady, setDraftReady] = useState(false)
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('exologistica:draft')
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        if (draft.groups) setGroups(Object.fromEntries(operationalGroups.map(name => [name, draft.groups[name] || { expected: 0, present: 0 }])))
        if (draft.clark) setClark(draft.clark)
        if (draft.clarkOthers) setClarkOthers(draft.clarkOthers)
        if (draft.admin) setAdmin(current => ({ ...current, ...draft.admin, 'EFECTIVOS DEPÓSITO': draft.admin['EFECTIVOS DEPÓSITO'] || current['EFECTIVOS DEPÓSITO'], 'HRS EXTRAS': draft.admin['HRS EXTRAS'] || current['HRS EXTRAS'], OTROS: draft.admin.OTROS || current.OTROS }))
        if (draft.operational) setOperational(draft.operational)
        if (draft.clarkDistribution) setClarkDistribution(draft.clarkDistribution)
        if (draft.adminDistribution) setAdminDistribution(current => ({ ...current, ...draft.adminDistribution, PTR: draft.adminDistribution.PTR ?? current.PTR }))
        if (draft.production) setProduction(draft.production)
        if (draft.ptrStatus) setPtrStatus(draft.ptrStatus)
      }
    } catch {}
    setDraftReady(true)
  }, [])
  useEffect(() => {
    if (!draftReady) return
    try {
      localStorage.setItem('exologistica:draft', JSON.stringify({ groups, clark: clarkBase, clarkOthers, admin, operational, clarkDistribution, adminDistribution, production, ptrStatus }))
    } catch {}
  }, [admin, adminDistribution, clarkBase, clarkOthers, clarkDistribution, draftReady, groups, operational, production, ptrStatus])
  useEffect(() => {
    const formRoot = document.querySelector('.operational-form')
    if (!formRoot) return
    const readControls = () => {
      const times = Array.from(formRoot.querySelectorAll<HTMLInputElement>('.field-grid.four input[type="time"]'))
      const supervisors = Array.from(formRoot.querySelectorAll<HTMLElement>('.form-card')).flatMap(card => {
        const heading = card.querySelector('.form-card-title h2')?.textContent
        return heading === 'Supervisores del turno' ? Array.from(card.querySelectorAll<HTMLSelectElement>('select'), select => select.value) : []
      })
      const dates = Array.from(formRoot.querySelectorAll<HTMLInputElement>('.production-table input[type="date"]'), input => input.value)
      try {
        localStorage.setItem('exologistica:extraDraft', JSON.stringify({ times: times.map(input => input.value), supervisors, dates }))
      } catch {}
    }
    try {
      const saved = JSON.parse(localStorage.getItem('exologistica:extraDraft') || '{}')
      const times = formRoot.querySelectorAll<HTMLInputElement>('.field-grid.four input[type="time"]')
      const supervisorCard = Array.from(formRoot.querySelectorAll<HTMLElement>('.form-card')).find(card => card.querySelector('.form-card-title h2')?.textContent === 'Supervisores del turno')
      const supervisors = supervisorCard?.querySelectorAll<HTMLSelectElement>('select')
      const dates = formRoot.querySelectorAll<HTMLInputElement>('.production-table input[type="date"]')
      saved.times?.forEach((value: string, index: number) => { if (times[index]) times[index].value = value })
      saved.supervisors?.forEach((value: string, index: number) => { if (supervisors?.[index]) supervisors[index].value = value })
      saved.dates?.forEach((value: string, index: number) => { if (dates[index]) dates[index].value = value })
    } catch {}
    formRoot.addEventListener('change', readControls)
    return () => formRoot.removeEventListener('change', readControls)
  }, [])
  const total = (rows: Record<string, { expected: number; present: number }>) => Object.values(rows).reduce((a, row) => ({ expected: a.expected + row.expected, present: a.present + row.present }), { expected: 0, present: 0 })
  const opTotal = total(groups), adminTotal = total(admin), opAssigned = Object.values(operational).reduce((a, n) => a + n, 0), clarkTotal = clark.present, clarkAssigned = Object.values(clarkDistribution).reduce((a, n) => a + n, 0), adminAssigned = Object.values(adminDistribution).reduce((a, n) => a + n, 0)
  const productionTotal = Object.values(production).reduce((a, row) => ({ prepared: a.prepared + row.prepared, target: a.target + row.target }), { prepared: 0, target: 0 })
  const clampAssignments = (current: Record<string, number>, sectors: string[], present: number) => {
    let remaining = present
    let changed = false
    const next = { ...current }
    for (const sector of sectors) {
      const allowed = Math.min(next[sector], remaining)
      changed ||= allowed !== next[sector]
      next[sector] = allowed
      remaining -= allowed
    }
    return changed ? next : current
  }
  useEffect(() => {
    setForm((current: typeof form) => ({
      ...current,
      present: String(opTotal.present + clark.present + adminTotal.present),
      absent: String(opTotal.expected - opTotal.present + (clark.expected - clark.present) + (adminTotal.expected - adminTotal.present)),
      prepared: String(productionTotal.prepared),
      target: String(productionTotal.target),
    }))
    setOperational(current => clampAssignments(current, operationalSectors, opTotal.present))
    setClarkDistribution(current => clampAssignments(current, clarkSectors, clark.present))
    setAdminDistribution(current => clampAssignments(current, adminSectors, adminTotal.present))
  }, [groups, clarkBase, clarkOthers, admin, production])
  const numberInput = (value: number, onChange: (value: number) => void, readOnly = false, max?: number) => <input className={readOnly ? 'calculated-input' : ''} type='number' min='0' max={max} value={value} readOnly={readOnly} onChange={e => onChange(Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(0, Number(e.target.value))))} />
  const updateParent = (key: string, value: string) => setForm((current: typeof form) => ({ ...current, [key]: value }))
  const setGroupValue = (name: string, key: 'expected' | 'present', value: number) => setGroups(prev => ({ ...prev, [name]: { ...prev[name], [key]: value } }))
  const rosterTable = (title: string, rows: Record<string, { expected: number; present: number }>, setter: (name: string, key: 'expected' | 'present', value: number) => void) => {
    const isClarkRoster = title === 'Clarkistas'
    const tableRows = isClarkRoster ? { ...rows, TURNO: clarkBase, 'OTROS 1': clarkOthers[0], 'OTROS 2': clarkOthers[1] } : rows
    const updateRow = (name: string, key: 'expected' | 'present', value: number) => {
      if (isClarkRoster && name.startsWith('OTROS ')) {
        const index = Number(name.slice(-1)) - 1
        setClarkOthers(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
      } else {
        setter(name, key, value)
      }
    }
    const summary = total(tableRows)
    return <div className='data-table-wrap'><table className='data-table'><thead><tr><th>Grupo</th><th>Esperados</th><th>Presentes</th><th>Faltas</th></tr></thead><tbody>{Object.entries(tableRows).map(([name, row]) => <tr key={name}><td>{isClarkRoster && name.startsWith('OTROS ') ? 'OTROS' : name}</td><td>{numberInput(row.expected, value => updateRow(name, 'expected', value))}</td><td>{numberInput(row.present, value => updateRow(name, 'present', value))}</td><td><span className='calc-pill'>{row.expected - row.present}</span></td></tr>)}</tbody><tfoot><tr><th>TOTAL</th><th>{summary.expected}</th><th>{summary.present}</th><th>{summary.expected - summary.present}</th></tr></tfoot></table></div>
  }
  const distributionTable = (sectors: string[], values: Record<string, number>, setValues: React.Dispatch<React.SetStateAction<Record<string, number>>>, present: number, label: string) => { const assigned = Object.values(values).reduce((a, n) => a + n, 0); const unassigned = Math.max(0, present - assigned); return <div className='data-table-wrap'><table className='data-table compact'><thead><tr><th>Destino / sector</th><th>Asignados</th></tr></thead><tbody>{sectors.map(sector => { const assignedElsewhere = assigned - values[sector]; const max = Math.max(0, present - assignedElsewhere); return <tr key={sector}><td>{sector}</td><td>{numberInput(values[sector], value => setValues(prev => ({ ...prev, [sector]: value })), false, max)}</td></tr> })}</tbody><tfoot><tr><th>🟢 {label} (automático)</th><th><span className='calc-pill'>{unassigned}</span></th></tr><tr><th>TOTAL DISTRIBUIDOS</th><th>{assigned}</th></tr></tfoot></table><div className={unassigned === 0 ? 'validation success' : 'validation warning'}>{unassigned === 0 ? '✅ Todo el personal asignado' : `⚠️ Diferencia: ${Math.abs(unassigned)} personas`}</div></div> }
  const productionRows = Object.entries(production)
  return <div className='content'><PageTitle eyebrow='Registro de operación' title='Carga de datos' description='Completa la información del turno con cálculos automáticos y validaciones en tiempo real.' action={<button className='primary-button' onClick={() => { updateParent('present', String(opTotal.present + clark.present + adminTotal.present)); updateParent('absent', String(opTotal.expected - opTotal.present + (clark.expected - clark.present) + (adminTotal.expected - adminTotal.present))); updateParent('prepared', String(productionTotal.prepared)); updateParent('target', String(productionTotal.target)); onSave() }}><Save /> Guardar reporte del turno</button>} /><div className='operational-form'><FormCard title='Identificación del turno' icon={<CalendarDays />}><div className='field-grid four'><Field label='Fecha'><input type='date' value={form.date} onChange={e => updateParent('date', e.target.value)} /></Field><Field label='Turno'><select value={form.shift} onChange={e => updateParent('shift', e.target.value)}><option>Mañana</option><option>Tarde</option><option>Noche</option></select></Field><Field label='Hora inicio'><input type='time' defaultValue='06:00' /></Field><Field label='Hora cierre'><input type='time' defaultValue='14:00' /></Field></div></FormCard><FormCard title='Supervisores del turno' icon={<Users />}><div className='field-grid three'>{[1, 2, 3].map(index => <Field key={index} label={`Supervisor ${index}`}><select defaultValue={index === 1 ? supervisors[0] : ''}><option value=''>Seleccionar supervisor</option>{supervisors.map(name => <option key={name}>{name}</option>)}</select></Field>)}</div></FormCard><RosterSection title='Dotación y distribución – Operativos' groups={rosterTable('Operativos', groups, setGroupValue)} distribution={distributionTable(operationalSectors, operational, setOperational, opTotal.present, 'PICKING')} /><RosterSection title='Dotación y distribución – Clarkistas' groups={rosterTable('Clarkistas', { TURNO: clark }, (name, key, value) => setClark(prev => ({ ...prev, [key]: value })))} distribution={distributionTable(clarkSectors, clarkDistribution, setClarkDistribution, clarkTotal, 'SIN ASIGNAR')} /><RosterSection title='Dotación y distribución – Efectivos / Administración' groups={rosterTable('Administración', admin, (name, key, value) => setAdmin(prev => ({ ...prev, [name]: { ...prev[name], [key]: value } })))} distribution={distributionTable(adminSectors, adminDistribution, setAdminDistribution, adminTotal.present, 'SIN ASIGNAR')} /><div className='general-summary'><span>🏭 TOTAL GENERAL</span><strong>{opTotal.present + clark.present + adminTotal.present} <small>personas presentes de {opTotal.expected + clark.expected + adminTotal.expected} esperadas</small></strong></div><FormCard title='Producción y despacho (Total general bultos)' icon={<BarChart3 />}><div className='data-table-wrap'><table className='data-table production-table'><thead><tr><th>Sector</th><th>Bultos prep.</th><th>Objetivo</th><th>% cumplimiento</th><th>Fecha</th></tr></thead><tbody>{productionRows.map(([name, row]) => <tr key={name}><td>{name}</td><td>{numberInput(row.prepared, value => setProduction(prev => ({ ...prev, [name]: { ...prev[name as keyof typeof prev], prepared: value } })) )}</td><td>{numberInput(row.target, value => setProduction(prev => ({ ...prev, [name]: { ...prev[name as keyof typeof prev], target: value } })) )}</td><td><span className='calc-pill'>{row.target ? Math.round(row.prepared / row.target * 100) : 0}%</span></td><td><input type='date' defaultValue={form.date} /></td></tr>)}</tbody><tfoot><tr><th>TOTAL GRAL. BULTOS</th><th>{productionTotal.prepared}</th><th>{productionTotal.target}</th><th>{productionTotal.target ? Math.round(productionTotal.prepared / productionTotal.target * 100) : 0}%</th><th /></tr></tfoot></table></div><div className='field-grid two production-extra'><Field label='Estado PTR'><select value={ptrStatus} onChange={e => setPtrStatus(e.target.value)}><option>Falta armar Stage</option><option>Stage lleno</option><option>Sacar Stage</option></select></Field></div></FormCard></div><div className='sticky-save'><button className='primary-button' onClick={() => { updateParent('present', String(opTotal.present + clark.present + adminTotal.present)); updateParent('absent', String(opTotal.expected - opTotal.present + (clark.expected - clark.present) + (adminTotal.expected - adminTotal.present))); updateParent('prepared', String(productionTotal.prepared)); updateParent('target', String(productionTotal.target)); onSave() }}><Save /> Guardar reporte del turno</button></div></div>
}
function RosterSection({ title, groups, distribution }: { title: string; groups: React.ReactNode; distribution: React.ReactNode }) { return <FormCard title={title} icon={<Users />}><div className='roster-grid'><div><h3 className='subsection-title'>Grupos</h3>{groups}</div><div><h3 className='subsection-title'>Destino / sector</h3>{distribution}</div></div></FormCard>}
function DataEntry({ form, setForm, onSave, compliance }: any) { const update = (key: string, value: string) => setForm({ ...form, [key]: value }); const present = Number(form.present), absent = Number(form.absent), prepared = Number(form.prepared), target = Number(form.target); return <div className="content"><PageTitle eyebrow="Registro de operación" title="Carga de datos" description="Ingresa los resultados del turno para mantener el histórico actualizado." action={<button className="primary-button" onClick={onSave}><Save /> Guardar en histórico</button>} /><div className="form-layout"><div className="form-main"><FormCard title="Identificación del turno" icon={<CalendarDays />}><div className="field-grid three"><Field label="Fecha"><input value={form.date} onChange={e => update('date', e.target.value)} /></Field><Field label="Turno"><select value={form.shift} onChange={e => update('shift', e.target.value)}><option>Mañana</option><option>Tarde</option><option>Noche</option></select></Field><Field label="Supervisor principal"><select value={form.supervisor} onChange={e => update('supervisor', e.target.value)}><option>María Rojas</option><option>Carlos Fuentes</option><option>Ana Silva</option></select></Field></div></FormCard><FormCard title="Dotación y asistencia" icon={<Users />}><div className="field-grid four"><Field label="JAD"><input type="number" defaultValue="24" /></Field><Field label="SAM"><input type="number" defaultValue="19" /></Field><Field label="Semaneros"><input type="number" defaultValue="18" /></Field><Field label="Efectivos"><input type="number" defaultValue="13" /></Field><Field label="Presentes total"><input type="number" value={form.present} onChange={e => update('present', e.target.value)} /></Field><Field label="Ausentismo"><input type="number" value={form.absent} onChange={e => update('absent', e.target.value)} /></Field><Field label="Clarkistas"><input type="number" defaultValue="8" /></Field><Field label="Administrativos"><input type="number" defaultValue="3" /></Field></div></FormCard><FormCard title="Producción y objetivos" icon={<BarChart3 />}><div className="field-grid three"><Field label="Picking tradicional"><input type="number" defaultValue="6840" /></Field><Field label="Bultos PU"><input type="number" defaultValue="4320" /></Field><Field label="Bultos PTR"><input type="number" defaultValue="2960" /></Field><Field label="Total preparados"><input type="number" value={form.prepared} onChange={e => update('prepared', e.target.value)} /></Field><Field label="Objetivo del turno"><input type="number" value={form.target} onChange={e => update('target', e.target.value)} /></Field><Field label="Movimientos faltantes"><input type="number" defaultValue="0" /></Field></div></FormCard><FormCard title="No conformidades e incidentes" icon={<AlertTriangle />}><div className="field-grid three"><Field label="Rechazos PTR"><input type="number" value={form.rejected} onChange={e => update('rejected', e.target.value)} /></Field><Field label="Motivo de rechazo"><select><option>Daño en empaque</option><option>Producto faltante</option><option>Error de picking</option></select></Field><Field label="Estado PTR"><select><option>Operativo</option><option>En revisión</option><option>Detenido</option></select></Field></div></FormCard></div><aside className="form-summary"><div className="summary-header"><span>Vista previa</span><strong>KPIs calculados</strong></div><div className="summary-kpi"><span>Presentes total</span><strong>{present}</strong><small>tasa de asistencia {Math.round(present / (present + absent) * 100)}%</small></div><div className="summary-kpi"><span>Bultos preparados</span><strong>{prepared.toLocaleString('es-ES')}</strong><small>objetivo {target.toLocaleString('es-ES')}</small></div><div className="summary-kpi"><span>Cumplimiento</span><strong className="teal">{compliance}%</strong><div className="progress"><i style={{ width: Math.min(compliance, 100) + '%' }} /></div></div><div className="summary-kpi"><span>Productividad</span><strong>{Math.round(prepared / present)}</strong><small>bultos por persona</small></div><div className="summary-note"><AlertTriangle /><span>Verifica los datos antes de guardar el turno.</span></div></aside></div></div> }
function FormCard({ title, icon, children }: any) { return <section className="form-card"><div className="form-card-title">{icon}<div><h2>{title}</h2><p>Completa la información solicitada</p></div></div>{children}</section> }
function Field({ label, children }: any) { return <label className="field"><span>{label}</span>{children}</label> }
function History({ history }: { history: Shift[] }) { const [search, setSearch] = useState(''); const filtered = history.filter(h => h.supervisor.toLowerCase().includes(search.toLowerCase()) || h.date.includes(search)); const trendData = history.slice().reverse().map(row => ({ fecha: row.date, preparados: row.prepared, objetivo: row.target })); return <div className="content"><PageTitle eyebrow="Trazabilidad operativa" title="Histórico de turnos" description="Consulta y analiza el rendimiento de todos los turnos registrados." action={<button className="secondary-button"><Download /> Exportar CSV</button>} /><div className="history-tools"><div className="search"><span>⌕</span><input placeholder="Buscar por fecha o supervisor..." value={search} onChange={e => setSearch(e.target.value)} /></div><button className="filter-button">Últimos 30 días <ChevronDown /></button></div><div className="history-table table-wrap"><table><thead><tr><th>Fecha</th><th>Turno</th><th>Supervisor</th><th>Presentes</th><th>Ausentes</th><th>Preparados</th><th>Objetivo</th><th>Cumplimiento</th><th>Productividad</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><strong>{row.date}</strong></td><td><span className="badge neutral">{row.shift}</span></td><td>{row.supervisor}</td><td>{row.present}</td><td className="red-text">{row.absent}</td><td>{row.prepared.toLocaleString('es-ES')}</td><td>{row.target.toLocaleString('es-ES')}</td><td><span className={row.prepared >= row.target ? 'badge success' : 'badge warning'}>{row.target > 0 ? Math.round(row.prepared / row.target * 100) : 0}%</span></td><td>{row.productivity} b/p</td></tr>)}</tbody></table></div><ChartCard title="Evolución histórica" subtitle="Bultos preparados vs objetivo"><ResponsiveContainer width="100%" height={270}><LineChart data={trendData}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="fecha" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Legend /><Line type="monotone" dataKey="preparados" name="Preparados" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} /><Line type="monotone" dataKey="objetivo" name="Objetivo" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} /></LineChart></ResponsiveContainer></ChartCard></div> }
