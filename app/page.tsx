'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ClipboardList, LayoutDashboard, Menu, Moon, Sun, Users, X } from 'lucide-react'


import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import ExcelJS from 'exceljs'
import Employees from '../components/employees'
import DashboardView, { type Shift } from '../components/dashboard'
import OperationalDataEntryView, { type OperationalForm } from '../components/operational-data-entry'

export default function Page() {
  const [active, setActive] = useState('dashboard')
  const [dark, setDark] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [history, setHistory] = useState<Shift[]>([])
  const [form, setForm] = useState<OperationalForm>({ date: '', shift: 'Mañana', supervisor: '', present: '0', absent: '0', prepared: '0', target: '0', rejected: '0' })
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
      {active === 'dashboard' && <DashboardView history={history} onExportExcel={exportExcel} onExportPdf={exportPdf} />}
      {active === 'carga' && <OperationalDataEntryView form={form} setForm={setForm} onSave={saveShift} />}
      {active === 'empleados' && <Employees />}
      <footer className="app-footer">© Diseñado por Ivan Barreto  –  Supervisor de Logística  –  Exologística  –  Todos los derechos reservados</footer>
    </main>
  </div>
}











