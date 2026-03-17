import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  photos: string[]
  open: boolean
  initialIndex?: number
  onClose: () => void
}

export function PropertyLightbox({ photos, open, initialIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex)
  const touchStart = useRef(0)
  const thumbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setCurrent(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    if (!open) return
    // Scroll active thumbnail into view
    const el = thumbRef.current?.children[current] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [current, open])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  function prev() { setCurrent(c => (c - 1 + photos.length) % photos.length) }
  function next() { setCurrent(c => (c + 1) % photos.length) }

  if (!open || photos.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col select-none"
      onTouchStart={e => { touchStart.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const diff = touchStart.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/50 text-sm tabular-nums">{current + 1} / {photos.length}</span>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        <button
          onClick={prev}
          className="absolute left-2 z-10 p-2 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <img
          key={current}
          src={photos[current]}
          alt={`Foto ${current + 1}`}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
        <button
          onClick={next}
          className="absolute right-2 z-10 p-2 text-white/60 hover:text-white transition-colors"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div
          ref={thumbRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${
                i === current
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-40 hover:opacity-70'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Mosaic grid for property detail page
interface MosaicProps {
  photos: string[]
  onPhotoClick: (index: number) => void
}

export function PropertyPhotoMosaic({ photos, onPhotoClick }: MosaicProps) {
  if (photos.length === 0) {
    return (
      <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300">
        <span className="text-sm">Sin fotos</span>
      </div>
    )
  }

  if (photos.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => onPhotoClick(0)}>
        <img src={photos[0]} alt="Foto principal" className="w-full h-72 object-cover" />
      </div>
    )
  }

  const shown = photos.slice(0, 5)
  const extra = photos.length - 5

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer"
      style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gridTemplateRows: '200px 200px',
        gap: 4,
      }}
    >
      {/* Main large image */}
      <div
        className="row-span-2 overflow-hidden"
        onClick={() => onPhotoClick(0)}
      >
        <img src={shown[0]} alt="Foto 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
      </div>

      {/* 4 small images */}
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="overflow-hidden relative"
          onClick={() => onPhotoClick(Math.min(i, photos.length - 1))}
        >
          {shown[i] ? (
            <>
              <img src={shown[i]} alt={`Foto ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              {/* "+X more" overlay on last cell */}
              {i === 4 && extra > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{extra + 1}</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>
      ))}
    </div>
  )
}
