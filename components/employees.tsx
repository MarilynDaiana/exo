'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Download, Pencil, Trash2, UserPlus, X } from 'lucide-react'
import ExcelJS from 'exceljs'

type Attendance = { present: boolean; overtimeExit: string }
type Employee = { id: number; name: string; attendance: Record<string, Attendance> }
type StoredEmployee = { id: number; name: string; present?: boolean; attendance?: Record<string, boolean | Attendance> }
const STORAGE_KEY = 'exologistica:employees'
const shifts = ['Mañana', 'Tarde', 'Noche']
const shiftHours: Record<string, { start: string; end: string }> = {
  Mañana: { start: '06:00', end: '14:00' },
  Tarde: { start: '14:00', end: '22:00' },
  Noche: { start: '22:00', end: '06:00' },
}

function localDate() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

function getExtraMinutes(exitTime: string, shiftEnd: string) {
  if (!exitTime) return null
  const [endHours, endMinutes] = shiftEnd.split(':').map(Number)
  const [exitHours, exitMinutes] = exitTime.split(':').map(Number)
  let minutes = exitHours * 60 + exitMinutes - (endHours * 60 + endMinutes)
  if (minutes < 0) minutes += 24 * 60
  return minutes <= 12 * 60 ? minutes : null
}

function formatExtraTime(minutes: number | null) {
  if (minutes === null) return 'Verificar hora de salida'
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours} h ${remainingMinutes.toString().padStart(2, '0')} min extra`
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [date, setDate] = useState('')
  const [shift, setShift] = useState(shifts[0])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [status, setStatus] = useState('')
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    setDate(localDate())
    try {
      const savedEmployees = localStorage.getItem(STORAGE_KEY)
      if (savedEmployees) {
        const legacyAttendanceKey = `${localDate()}|${shifts[0]}`
        const saved = JSON.parse(savedEmployees) as StoredEmployee[]
        setEmployees(saved.map(employee => ({
          id: employee.id,
          name: employee.name,
          attendance: employee.attendance
            ? Object.fromEntries(Object.entries(employee.attendance).map(([key, value]) => [key, typeof value === 'boolean' ? { present: value, overtimeExit: '' } : { present: value.present === true, overtimeExit: value.overtimeExit || '' }]))
            : employee.present ? { [legacyAttendanceKey]: { present: true, overtimeExit: '' } } : {},
        })))
      }
    } catch {}
    setStorageReady(true)
  }, [])

  useEffect(() => {
    if (!storageReady) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
    } catch {}
  }, [employees, storageReady])

  const isDuplicate = (candidate: string, exceptId?: number) => employees.some(employee =>
    employee.id !== exceptId && employee.name.toLocaleLowerCase() === candidate.toLocaleLowerCase()
  )

  const addEmployee = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (isDuplicate(trimmedName)) {
      setStatus('Ya existe un empleado con ese nombre.')
      return
    }
    setEmployees(current => [...current, { id: Date.now(), name: trimmedName, attendance: {} }])
    setName('')
    setStatus('')
  }

  const saveEdit = (employee: Employee) => {
    const trimmedName = editingName.trim()
    if (!trimmedName) {
      setStatus('El nombre no puede quedar vacío.')
      return
    }
    if (isDuplicate(trimmedName, employee.id)) {
      setStatus('Ya existe un empleado con ese nombre.')
      return
    }
    setEmployees(current => current.map(item => item.id === employee.id ? { ...item, name: trimmedName } : item))
    setEditingId(null)
    setEditingName('')
    setStatus('')
  }

  const deleteEmployee = (employee: Employee) => {
    if (!window.confirm(`¿Eliminar a ${employee.name}?`)) return
    setEmployees(current => current.filter(item => item.id !== employee.id))
    setStatus('')
  }

  const attendanceKey = `${date}|${shift}`
  const schedule = shiftHours[shift]
  const presentCount = employees.filter(employee => employee.attendance[attendanceKey]?.present === true).length
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const currentAttendance = workbook.addWorksheet('Asistencia')
    currentAttendance.columns = [
      { header: 'Fecha', key: 'date', width: 16 },
      { header: 'Turno', key: 'shift', width: 16 },
      { header: 'Horario', key: 'hours', width: 18 },
      { header: 'Empleado', key: 'name', width: 32 },
      { header: 'Asistencia', key: 'status', width: 16 },
      { header: 'Hora de salida extra', key: 'exit', width: 22 },
      { header: 'Horas extra', key: 'overtime', width: 22 },
    ]
    employees.forEach(employee => currentAttendance.addRow({
      date,
      shift,
      hours: `${schedule.start} a ${schedule.end}`,
      name: employee.name,
      status: employee.attendance[attendanceKey]?.present ? 'Presente' : 'Ausente',
      exit: employee.attendance[attendanceKey]?.overtimeExit || '',
      overtime: employee.attendance[attendanceKey]?.overtimeExit ? formatExtraTime(getExtraMinutes(employee.attendance[attendanceKey].overtimeExit, schedule.end)) : '',
    }))
    currentAttendance.getRow(1).font = { bold: true }

    const attendanceHistory = workbook.addWorksheet('Historial')
    attendanceHistory.columns = [
      { header: 'Fecha', key: 'date', width: 16 },
      { header: 'Turno', key: 'shift', width: 16 },
      { header: 'Horario', key: 'hours', width: 18 },
      { header: 'Empleado', key: 'name', width: 32 },
      { header: 'Asistencia', key: 'status', width: 16 },
      { header: 'Hora de salida extra', key: 'exit', width: 22 },
      { header: 'Horas extra', key: 'overtime', width: 22 },
    ]
    employees.forEach(employee => Object.entries(employee.attendance).forEach(([key, attendance]) => {
      const [attendanceDate, attendanceShift] = key.split('|')
      const attendanceSchedule = shiftHours[attendanceShift]
      attendanceHistory.addRow({
        date: attendanceDate,
        shift: attendanceShift,
        hours: attendanceSchedule ? `${attendanceSchedule.start} a ${attendanceSchedule.end}` : '',
        name: employee.name,
        status: attendance.present ? 'Presente' : 'Ausente',
        exit: attendance.overtimeExit,
        overtime: attendance.overtimeExit && attendanceSchedule ? formatExtraTime(getExtraMinutes(attendance.overtimeExit, attendanceSchedule.end)) : '',
      })
    }))
    attendanceHistory.getRow(1).font = { bold: true }

    const file = await workbook.xlsx.writeBuffer()
    const blob = new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `asistencia-${date}-${shift.toLowerCase()}.xlsx`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="content employees-content">
    <div className="page-title">
      <div><div className="eyebrow">Personal operativo</div><h1>Empleados</h1><p>Gestiona el equipo y marca la asistencia.</p></div>
      <div className="employee-attendance-summary"><strong>{presentCount} / {employees.length}</strong><span>presentes · {employees.length - presentCount} ausentes</span></div>
    </div>
    <div className="employee-toolbar">
      <div className="field-grid two employee-filters">
        <label className="field"><span>Fecha</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
        <label className="field"><span>Turno</span><select value={shift} onChange={event => setShift(event.target.value)}>{shifts.map(item => <option key={item}>{item}</option>)}</select><small className="employee-shift-hours">Horario: {schedule.start} a {schedule.end}</small></label>
      </div>
      <button className="secondary-button" type="button" onClick={exportExcel} disabled={!date}><Download /> Exportar asistencia a Excel</button>
    </div>
    <form className="employee-add-form" onSubmit={addEmployee}>
      <label className="field"><span>Nombre del empleado</span><input value={name} onChange={event => setName(event.target.value)} maxLength={100} placeholder="Ingresar nombre y apellido" /></label>
      <button className="primary-button" type="submit"><UserPlus /> Agregar empleado</button>
    </form>
    {status && <p className="employee-status" role="status">{status}</p>}
    <div className="table-wrap employee-table-wrap">
      <table className="employee-table">
        <thead><tr><th>Asistencia</th><th>Empleado</th><th>Hora de salida extra</th><th>Acciones</th></tr></thead>
        <tbody>
          {employees.map(employee => <tr key={employee.id}>
            <td><label className="attendance-toggle"><input type="checkbox" checked={employee.attendance[attendanceKey]?.present === true} onChange={event => setEmployees(current => current.map(item => item.id === employee.id ? { ...item, attendance: { ...item.attendance, [attendanceKey]: { present: event.target.checked, overtimeExit: item.attendance[attendanceKey]?.overtimeExit || '' } } } : item))} /><span>{employee.attendance[attendanceKey]?.present ? 'Presente' : 'Ausente'}</span></label></td>
            <td>{editingId === employee.id
              ? <input className="employee-name-input" value={editingName} onChange={event => setEditingName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); saveEdit(employee) } }} maxLength={100} aria-label={`Editar nombre de ${employee.name}`} />
              : <strong>{employee.name}</strong>}</td>
            <td><div className="employee-overtime"><input type="time" value={employee.attendance[attendanceKey]?.overtimeExit || ''} onChange={event => setEmployees(current => current.map(item => item.id === employee.id ? { ...item, attendance: { ...item.attendance, [attendanceKey]: { present: item.attendance[attendanceKey]?.present || false, overtimeExit: event.target.value } } } : item))} aria-label={`Hora de salida extra de ${employee.name}`} /><small>{employee.attendance[attendanceKey]?.overtimeExit ? formatExtraTime(getExtraMinutes(employee.attendance[attendanceKey].overtimeExit, schedule.end)) : 'Sin horas extra'}</small></div></td>
            <td><div className="employee-actions">{editingId === employee.id
              ? <><button className="icon-button" type="button" title="Guardar nombre" aria-label="Guardar nombre" onClick={() => saveEdit(employee)}><Check /></button><button className="icon-button" type="button" title="Cancelar edición" aria-label="Cancelar edición" onClick={() => { setEditingId(null); setStatus('') }}><X /></button></>
              : <><button className="icon-button" type="button" title="Editar empleado" aria-label={`Editar a ${employee.name}`} onClick={() => { setEditingId(employee.id); setEditingName(employee.name); setStatus('') }}><Pencil /></button><button className="icon-button danger-button" type="button" title="Eliminar empleado" aria-label={`Eliminar a ${employee.name}`} onClick={() => deleteEmployee(employee)}><Trash2 /></button></>}</div></td>
          </tr>)}
          {employees.length === 0 && <tr><td className="employee-empty" colSpan={4}>Todavía no hay empleados cargados.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
