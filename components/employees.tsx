'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Pencil, Trash2, UserPlus, X } from 'lucide-react'

type Employee = { id: number; name: string; present: boolean }
const STORAGE_KEY = 'exologistica:employees'

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [status, setStatus] = useState('')
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    try {
      const savedEmployees = localStorage.getItem(STORAGE_KEY)
      if (savedEmployees) setEmployees(JSON.parse(savedEmployees))
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
    setEmployees(current => [...current, { id: Date.now(), name: trimmedName, present: false }])
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

  const presentCount = employees.filter(employee => employee.present).length

  return <div className="content employees-content">
    <div className="page-title">
      <div><div className="eyebrow">Personal operativo</div><h1>Empleados</h1><p>Gestiona el equipo y marca la asistencia.</p></div>
      <div className="employee-attendance-summary"><strong>{presentCount} / {employees.length}</strong><span>presentes</span></div>
    </div>
    <form className="employee-add-form" onSubmit={addEmployee}>
      <label className="field"><span>Nombre del empleado</span><input value={name} onChange={event => setName(event.target.value)} maxLength={100} placeholder="Ingresar nombre y apellido" /></label>
      <button className="primary-button" type="submit"><UserPlus /> Agregar empleado</button>
    </form>
    {status && <p className="employee-status" role="status">{status}</p>}
    <div className="table-wrap employee-table-wrap">
      <table className="employee-table">
        <thead><tr><th>Asistencia</th><th>Empleado</th><th>Acciones</th></tr></thead>
        <tbody>
          {employees.map(employee => <tr key={employee.id}>
            <td><label className="attendance-toggle"><input type="checkbox" checked={employee.present} onChange={event => setEmployees(current => current.map(item => item.id === employee.id ? { ...item, present: event.target.checked } : item))} /><span>Presente</span></label></td>
            <td>{editingId === employee.id
              ? <input className="employee-name-input" value={editingName} onChange={event => setEditingName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); saveEdit(employee) } }} maxLength={100} aria-label={`Editar nombre de ${employee.name}`} />
              : <strong>{employee.name}</strong>}</td>
            <td><div className="employee-actions">{editingId === employee.id
              ? <><button className="icon-button" type="button" title="Guardar nombre" aria-label="Guardar nombre" onClick={() => saveEdit(employee)}><Check /></button><button className="icon-button" type="button" title="Cancelar edición" aria-label="Cancelar edición" onClick={() => { setEditingId(null); setStatus('') }}><X /></button></>
              : <><button className="icon-button" type="button" title="Editar empleado" aria-label={`Editar a ${employee.name}`} onClick={() => { setEditingId(employee.id); setEditingName(employee.name); setStatus('') }}><Pencil /></button><button className="icon-button danger-button" type="button" title="Eliminar empleado" aria-label={`Eliminar a ${employee.name}`} onClick={() => deleteEmployee(employee)}><Trash2 /></button></>}</div></td>
          </tr>)}
          {employees.length === 0 && <tr><td className="employee-empty" colSpan={3}>Todavía no hay empleados cargados.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
}
