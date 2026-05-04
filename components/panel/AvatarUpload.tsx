'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface AvatarUploadProps {
  currentUrl?: string | null
  currentPosition?: string | null
  onFileSelected: (file: File) => void
  onPositionChange: (position: string) => void
  onRemove: () => void
}

function parsePos(pos: string): { x: number; y: number } {
  const parts = pos.replace(/%/g, '').split(' ')
  return { x: parseFloat(parts[0] ?? '50'), y: parseFloat(parts[1] ?? '50') }
}

export function AvatarUpload({
  currentUrl,
  currentPosition,
  onFileSelected,
  onPositionChange,
  onRemove,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const initial = parsePos(currentPosition ?? '50% 50%')
  const posRef = useRef(initial)
  const [pos, setPos] = useState(initial)
  const isDragging = useRef(false)
  const lastClient = useRef({ x: 0, y: 0 })

  const displayed = preview ?? currentUrl

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFileSelected(file)
  }

  const handleRemove = () => {
    setPreview(null)
    posRef.current = { x: 50, y: 50 }
    setPos({ x: 50, y: 50 })
    onRemove()
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true
    lastClient.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastClient.current.x
    const dy = e.clientY - lastClient.current.y
    lastClient.current = { x: e.clientX, y: e.clientY }
    posRef.current = {
      x: Math.max(0, Math.min(100, posRef.current.x - dx * 0.5)),
      y: Math.max(0, Math.min(100, posRef.current.y - dy * 0.5)),
    }
    setPos({ ...posRef.current })
  }

  const onPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const { x, y } = posRef.current
    onPositionChange(`${Math.round(x)}% ${Math.round(y)}%`)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {displayed ? (
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 cursor-grab active:cursor-grabbing select-none touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Image
            src={displayed}
            alt="Avatar"
            fill
            className="object-cover pointer-events-none"
            style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
            unoptimized
            draggable={false}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-500 transition-colors bg-gray-50 flex items-center justify-center group"
        >
          <CameraIcon />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <CameraIcon className="text-white" />
          </div>
        </button>
      )}

      {displayed ? (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-gray-400">Arrastrá para centrar</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              Cambiar foto
            </button>
            <span className="text-gray-300 text-xs">·</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Quitar foto
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Toca para subir foto</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

function CameraIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-6 h-6 text-gray-400 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
