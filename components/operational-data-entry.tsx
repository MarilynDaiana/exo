'use client'

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { BarChart3, CalendarDays, Save, Users } from 'lucide-react'

type RosterRow = { expected: number; present: number }
export type OperationalForm = {
  date: string
  shift: string
  supervisor: string
  present: string
  absent: string
  prepared: string
  target: string
  rejected: string
}

type OperationalDataEntryProps = {
  form: OperationalForm
  setForm: Dispatch<SetStateAction<OperationalForm>>
  onSave: () => void
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function FormCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="form-card"><div className="form-card-title">{icon}<div><h2>{title}</h2><p>Completa la información solicitada</p></div></div>{children}</section>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

function RosterSection({ title, groups, distribution }: { title: string; groups: ReactNode; distribution: ReactNode }) {
  return <FormCard title={title} icon={<Users />}><div className="roster-grid"><div><h3 className="subsection-title">Grupos</h3>{groups}</div><div><h3 className="subsection-title">Destino / sector</h3>{distribution}</div></div></FormCard>
}

export default function OperationalDataEntry({ form, setForm, onSave }: OperationalDataEntryProps) {
  const supervisors = ['Abel Cuevas', 'Daiana Corrales', 'Diego Galban', 'Ivan Barreto', 'Martin Cala', 'Martin Fernandez', 'Matias Carbonetti', 'Maximiliano Lugo', 'Sebastian Burnes']
  const operationalGroups = ['JAD', 'SAM', 'SEMANEROS', 'HRS EXTRAS', 'OTROS']
  const operationalSectors = ['OLA', 'PTR', 'PU-9', 'PU-11', 'CADDYS', 'PALLETS', 'CIERRE CAJAS', 'PASILLOS', 'ROTURAS', 'ADMINISTRACIÓN', 'OTRAS OP']
  const clarkSectors = ['GUARDADO', 'REPO TRAD.', 'PTR', 'PU-9', 'PU-11', 'SAMPI', 'OTRAS OP']
  const adminSectors = ['ADMINISTRACIÓN', 'OLA', 'PTR', 'PU-9', 'PU-11', 'ARMADO', 'OTRAS OP']
  const [groups, setGroups] = useState<Record<string, RosterRow>>(Object.fromEntries(operationalGroups.map(name => [name, { expected: 0, present: 0 }])))
  const [clarkBase, setClark] = useState<RosterRow>({ expected: 0, present: 0 })
  const [clarkOthers, setClarkOthers] = useState<RosterRow[]>([{ expected: 0, present: 0 }, { expected: 0, present: 0 }])
  const clark = { expected: clarkBase.expected + clarkOthers.reduce((sum, row) => sum + row.expected, 0), present: clarkBase.present + clarkOthers.reduce((sum, row) => sum + row.present, 0) }
  const [admin, setAdmin] = useState<Record<string, RosterRow>>({ 'ADMINISTRACIÓN': { expected: 0, present: 0 }, 'EFECTIVOS DEPÓSITO': { expected: 0, present: 0 }, 'HRS EXTRAS': { expected: 0, present: 0 }, OTROS: { expected: 0, present: 0 } })
  const [operational, setOperational] = useState<Record<string, number>>(Object.fromEntries(operationalSectors.map(sector => [sector, 0])))
  const [clarkDistribution, setClarkDistribution] = useState<Record<string, number>>(Object.fromEntries(clarkSectors.map(sector => [sector, 0])))
  const [adminDistribution, setAdminDistribution] = useState<Record<string, number>>(Object.fromEntries(adminSectors.map(sector => [sector, 0])))
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
      const supervisorsInForm = Array.from(formRoot.querySelectorAll<HTMLElement>('.form-card')).flatMap(card => {
        const heading = card.querySelector('.form-card-title h2')?.textContent
        return heading === 'Supervisores del turno' ? Array.from(card.querySelectorAll<HTMLSelectElement>('select'), select => select.value) : []
      })
      const dates = Array.from(formRoot.querySelectorAll<HTMLInputElement>('.production-table input[type="date"]'), input => input.value)
      try {
        localStorage.setItem('exologistica:extraDraft', JSON.stringify({ times: times.map(input => input.value), supervisors: supervisorsInForm, dates }))
      } catch {}
    }
    try {
      const saved = JSON.parse(localStorage.getItem('exologistica:extraDraft') || '{}')
      const times = formRoot.querySelectorAll<HTMLInputElement>('.field-grid.four input[type="time"]')
      const supervisorCard = Array.from(formRoot.querySelectorAll<HTMLElement>('.form-card')).find(card => card.querySelector('.form-card-title h2')?.textContent === 'Supervisores del turno')
      const supervisorsInForm = supervisorCard?.querySelectorAll<HTMLSelectElement>('select')
      const dates = formRoot.querySelectorAll<HTMLInputElement>('.production-table input[type="date"]')
      saved.times?.forEach((value: string, index: number) => { if (times[index]) times[index].value = value })
      saved.supervisors?.forEach((value: string, index: number) => { if (supervisorsInForm?.[index]) supervisorsInForm[index].value = value })
      saved.dates?.forEach((value: string, index: number) => { if (dates[index]) dates[index].value = value })
    } catch {}
    formRoot.addEventListener('change', readControls)
    return () => formRoot.removeEventListener('change', readControls)
  }, [])

  const total = (rows: Record<string, RosterRow>) => Object.values(rows).reduce((result, row) => ({ expected: result.expected + row.expected, present: result.present + row.present }), { expected: 0, present: 0 })
  const opTotal = total(groups)
  const adminTotal = total(admin)
  const productionTotal = Object.values(production).reduce((result, row) => ({ prepared: result.prepared + row.prepared, target: result.target + row.target }), { prepared: 0, target: 0 })

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
    setForm(current => ({
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

  const numberInput = (value: number, onChange: (value: number) => void, readOnly = false, max?: number) => <input className={readOnly ? 'calculated-input' : ''} type="number" min="0" max={max} value={value} readOnly={readOnly} onChange={event => onChange(Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(0, Number(event.target.value))))} />
  const updateParent = (key: keyof OperationalForm, value: string) => setForm(current => ({ ...current, [key]: value }))
  const setGroupValue = (name: string, key: keyof RosterRow, value: number) => setGroups(previous => ({ ...previous, [name]: { ...previous[name], [key]: value } }))

  const rosterTable = (title: string, rows: Record<string, RosterRow>, setter: (name: string, key: keyof RosterRow, value: number) => void) => {
    const isClarkRoster = title === 'Clarkistas'
    const tableRows = isClarkRoster ? { ...rows, TURNO: clarkBase, 'OTROS 1': clarkOthers[0], 'OTROS 2': clarkOthers[1] } : rows
    const updateRow = (name: string, key: keyof RosterRow, value: number) => {
      if (isClarkRoster && name.startsWith('OTROS ')) {
        const index = Number(name.slice(-1)) - 1
        setClarkOthers(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
      } else {
        setter(name, key, value)
      }
    }
    const summary = total(tableRows)
    return <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Grupo</th><th>Esperados</th><th>Presentes</th><th>Faltas</th></tr></thead><tbody>{Object.entries(tableRows).map(([name, row]) => <tr key={name}><td>{isClarkRoster && name.startsWith('OTROS ') ? 'OTROS' : name}</td><td>{numberInput(row.expected, value => updateRow(name, 'expected', value))}</td><td>{numberInput(row.present, value => updateRow(name, 'present', value))}</td><td><span className="calc-pill">{row.expected - row.present}</span></td></tr>)}</tbody><tfoot><tr><th>TOTAL</th><th>{summary.expected}</th><th>{summary.present}</th><th>{summary.expected - summary.present}</th></tr></tfoot></table></div>
  }

  const distributionTable = (sectors: string[], values: Record<string, number>, setValues: Dispatch<SetStateAction<Record<string, number>>>, present: number, label: string) => {
    const assigned = Object.values(values).reduce((sum, count) => sum + count, 0)
    const unassigned = Math.max(0, present - assigned)
    return <div className="data-table-wrap"><table className="data-table compact"><thead><tr><th>Destino / sector</th><th>Asignados</th></tr></thead><tbody>{sectors.map(sector => {
      const assignedElsewhere = assigned - values[sector]
      const max = Math.max(0, present - assignedElsewhere)
      return <tr key={sector}><td>{sector}</td><td>{numberInput(values[sector], value => setValues(previous => ({ ...previous, [sector]: value })), false, max)}</td></tr>
    })}</tbody><tfoot><tr><th>🟢 {label} (automático)</th><th><span className="calc-pill">{unassigned}</span></th></tr><tr><th>TOTAL DISTRIBUIDOS</th><th>{assigned}</th></tr></tfoot></table><div className={unassigned === 0 ? 'validation success' : 'validation warning'}>{unassigned === 0 ? '✅ Todo el personal asignado' : `⚠️ Diferencia: ${Math.abs(unassigned)} personas`}</div></div>
  }

  const saveReport = () => {
    updateParent('present', String(opTotal.present + clark.present + adminTotal.present))
    updateParent('absent', String(opTotal.expected - opTotal.present + (clark.expected - clark.present) + (adminTotal.expected - adminTotal.present)))
    updateParent('prepared', String(productionTotal.prepared))
    updateParent('target', String(productionTotal.target))
    onSave()
  }
  const productionRows = Object.entries(production)

  return <div className="content">
    <PageTitle eyebrow="Registro de operación" title="Carga de datos" description="Completa la información del turno con cálculos automáticos y validaciones en tiempo real." action={<button className="primary-button" onClick={saveReport}><Save /> Guardar reporte del turno</button>} />
    <div className="operational-form">
      <div className="form-main">
        <FormCard title="Identificación del turno" icon={<CalendarDays />}><div className="field-grid four">
          <Field label="Fecha"><input type="date" value={form.date} onChange={event => updateParent('date', event.target.value)} /></Field>
          <Field label="Turno"><select value={form.shift} onChange={event => updateParent('shift', event.target.value)}><option>Mañana</option><option>Tarde</option><option>Noche</option></select></Field>
          <Field label="Hora inicio"><input type="time" defaultValue="06:00" /></Field>
          <Field label="Hora cierre"><input type="time" defaultValue="14:00" /></Field>
        </div></FormCard>
        <FormCard title="Supervisores del turno" icon={<Users />}><div className="field-grid three">{[1, 2, 3].map(index => <Field key={index} label={`Supervisor ${index}`}><select defaultValue={index === 1 ? supervisors[0] : ''}><option value="">Seleccionar supervisor</option>{supervisors.map(name => <option key={name}>{name}</option>)}</select></Field>)}</div></FormCard>
        <RosterSection title="Dotación y distribución – Operativos" groups={rosterTable('Operativos', groups, setGroupValue)} distribution={distributionTable(operationalSectors, operational, setOperational, opTotal.present, 'PICKING')} />
        <RosterSection title="Dotación y distribución – Clarkistas" groups={rosterTable('Clarkistas', { TURNO: clark }, (_name, key, value) => setClark(previous => ({ ...previous, [key]: value })))} distribution={distributionTable(clarkSectors, clarkDistribution, setClarkDistribution, clark.present, 'SIN ASIGNAR')} />
        <RosterSection title="Dotación y distribución – Efectivos / Administración" groups={rosterTable('Administración', admin, (name, key, value) => setAdmin(previous => ({ ...previous, [name]: { ...previous[name], [key]: value } })))} distribution={distributionTable(adminSectors, adminDistribution, setAdminDistribution, adminTotal.present, 'SIN ASIGNAR')} />
        <div className="general-summary"><span>🏭 TOTAL GENERAL</span><strong>{opTotal.present + clark.present + adminTotal.present} <small>personas presentes de {opTotal.expected + clark.expected + adminTotal.expected} esperadas</small></strong></div>
        <FormCard title="Producción y despacho (Total general bultos)" icon={<BarChart3 />}>
          <div className="data-table-wrap"><table className="data-table production-table"><thead><tr><th>Sector</th><th>Bultos prep.</th><th>Objetivo</th><th>% cumplimiento</th><th>Fecha</th></tr></thead><tbody>{productionRows.map(([sector, row]) => <tr key={sector}>
            <td>{sector}</td>
            <td>{numberInput(row.prepared, value => setProduction(previous => ({ ...previous, [sector]: { ...previous[sector as keyof typeof previous], prepared: value } })))}</td>
            <td>{numberInput(row.target, value => setProduction(previous => ({ ...previous, [sector]: { ...previous[sector as keyof typeof previous], target: value } })))}</td>
            <td><span className="calc-pill">{row.target ? Math.round((row.prepared / row.target) * 100) : 0}%</span></td>
            <td><input type="date" defaultValue={form.date} /></td>
          </tr>)}</tbody><tfoot><tr><th>TOTAL GRAL. BULTOS</th><th>{productionTotal.prepared}</th><th>{productionTotal.target}</th><th>{productionTotal.target ? Math.round((productionTotal.prepared / productionTotal.target) * 100) : 0}%</th><th /></tr></tfoot></table></div>
          <div className="field-grid two production-extra"><Field label="Estado PTR"><select value={ptrStatus} onChange={event => setPtrStatus(event.target.value)}><option>Falta armar Stage</option><option>Stage lleno</option><option>Sacar Stage</option></select></Field></div>
        </FormCard>
      </div>
      <div className="sticky-save"><button className="primary-button" onClick={saveReport}><Save /> Guardar reporte del turno</button></div>
    </div>
  </div>
}
