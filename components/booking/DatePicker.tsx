'use client'

import { useState, useMemo } from 'react'
import { getCurrentCostaRicaDate, isPastDate, isBeyondBookingWindow, getDayOfWeek } from '@/lib/utils/timezone'
import { getMonthName } from '@/lib/utils/formatting'
import { Button } from '@/components/ui/Button'

interface DatePickerProps {
  selectedDate: string | null
  workingDays: number[]    // días de la semana en que trabaja el barbero: [1,2,3,4,5,6]
  onSelect: (date: string) => void
  onNext: () => void
  onBack: () => void
}

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDay).fill(null)

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day)
    if (week.length === 7) {
      rows.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    rows.push(week)
  }
  return rows
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function DatePicker({ selectedDate, workingDays, onSelect, onNext, onBack }: DatePickerProps) {
  const today = getCurrentCostaRicaDate()
  const todayDate = new Date(today + 'T12:00:00')
  const [viewYear, setViewYear] = useState(todayDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth())

  const weeks = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth])

  const canGoPrev = () => {
    const todayM = todayDate.getMonth()
    const todayY = todayDate.getFullYear()
    return viewYear > todayY || (viewYear === todayY && viewMonth > todayM)
  }

  const canGoNext = () => {
    const maxDate = new Date(todayDate)
    maxDate.setDate(maxDate.getDate() + 20)
    return new Date(viewYear, viewMonth + 1, 1) <= maxDate
  }

  const prevMonth = () => {
    if (!canGoPrev()) return
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (!canGoNext()) return
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isDayDisabled = (day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth, day)
    if (isPastDate(dateStr)) return true
    if (isBeyondBookingWindow(dateStr)) return true
    const dow = getDayOfWeek(dateStr)
    if (!workingDays.includes(dow)) return true
    return false
  }

  const DAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Elegí la fecha</h2>
      <p className="text-gray-400 text-sm mb-6">
        Solo se muestran los días disponibles de tu barbero
      </p>

      {/* Navegación del mes */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev()}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <span className="font-semibold text-gray-900">
          {getMonthName(viewMonth)} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          disabled={!canGoNext()}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      {/* Cabecera días */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-xs text-brand-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1 mb-8">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            if (day === null) return <div key={`${wi}-${di}`} />

            const dateStr = toDateStr(viewYear, viewMonth, day)
            const disabled = isDayDisabled(day)
            const isSelected = dateStr === selectedDate
            const isToday = dateStr === today

            return (
              <button
                key={dateStr}
                onClick={() => !disabled && onSelect(dateStr)}
                disabled={disabled}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150
                  ${isSelected
                    ? 'bg-brand-gold text-white font-bold'
                    : isToday && !disabled
                      ? 'border border-brand-gold text-brand-gold hover:bg-brand-gold/10'
                      : disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                {day}
              </button>
            )
          })
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} size="lg" className="flex-1">
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!selectedDate} size="lg" className="flex-grow-[2] min-w-0">
          Continuar
        </Button>
      </div>
    </div>
  )
}
