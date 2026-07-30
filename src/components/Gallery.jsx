import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import cx from '../lib/cx'
import { SHOT_LABELS, SHOTS } from '../data/colorways.mjs'

/**
 * Product gallery. Embla drives it, so swipe on touch and drag on desktop come
 * free. A vertical thumb rail sits alongside on large screens; dots and a shot
 * label carry the same information on mobile.
 */
export default function Gallery({ images, alt, shotLabels = true }) {
  const [ref, embla] = useEmblaCarousel({ loop: true, duration: 26 })
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)

  const onSelect = useCallback(() => {
    if (embla) setIndex(embla.selectedScrollSnap())
  }, [embla])

  useEffect(() => {
    if (!embla) return
    onSelect()
    embla.on('select', onSelect).on('reInit', onSelect)
    return () => {
      embla.off('select', onSelect).off('reInit', onSelect)
    }
  }, [embla, onSelect])

  // A colourway change replaces the image set — jump back to the first shot
  // rather than leaving the viewer on slide 3 of a different colour.
  useEffect(() => {
    if (embla) embla.scrollTo(0, true)
  }, [embla, images])

  useEffect(() => {
    if (!zoom) return
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false)
      if (e.key === 'ArrowRight') embla?.scrollNext()
      if (e.key === 'ArrowLeft') embla?.scrollPrev()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [zoom, embla])

  if (!images?.length) {
    return <div className="aspect-[3/4] w-full bg-blush-warm" aria-hidden="true" />
  }

  const label = shotLabels ? SHOT_LABELS[SHOTS[index % SHOTS.length]] : null

  return (
    <div className="flex gap-4">
      {/* Thumb rail — desktop only; the carousel itself is the control on mobile. */}
      <div className="hidden w-16 shrink-0 flex-col gap-2.5 lg:flex">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => embla?.scrollTo(i)}
            aria-label={`View image ${i + 1} of ${images.length}`}
            aria-current={i === index}
            className={cx(
              'relative aspect-[3/4] overflow-hidden bg-blush-warm transition-opacity duration-300',
              i === index ? 'opacity-100' : 'opacity-55 hover:opacity-85'
            )}
          >
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            {i === index && <span className="absolute inset-0 border-2 border-ink" />}
          </button>
        ))}
      </div>

      <div className="group/gallery relative min-w-0 flex-1">
        <div className="overflow-hidden bg-blush-warm" ref={ref}>
          <div className="flex">
            {images.map((src, i) => (
              <div className="embla__slide" key={`${src}-${i}`}>
                <div className="aspect-[3/4] w-full">
                  <img
                    src={src}
                    alt={`${alt} — ${SHOT_LABELS[SHOTS[i % SHOTS.length]] || `view ${i + 1}`}`}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Arrow side="left" onClick={() => embla?.scrollPrev()} />
        <Arrow side="right" onClick={() => embla?.scrollNext()} />

        <button
          type="button"
          onClick={() => setZoom(true)}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-blush/85 text-ink backdrop-blur transition-colors hover:bg-blush"
          aria-label="View larger"
        >
          <Maximize2 size={14} />
        </button>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/50 to-transparent px-3 pb-3 pt-10">
          {label && (
            <span className="font-mono text-2xs uppercase tracking-[0.14em] text-blush">{label}</span>
          )}
          <div className="flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => embla?.scrollTo(i)}
                aria-label={`Go to image ${i + 1}`}
                className={cx(
                  'h-1 transition-all duration-300',
                  i === index ? 'w-6 bg-blush' : 'w-2.5 bg-blush/45 hover:bg-blush/70'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {zoom && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
          >
            <img
              src={images[index]}
              alt={alt}
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setZoom(false)}
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center text-blush"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Arrow({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={cx(
        'absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center bg-blush/85 text-ink opacity-0 backdrop-blur transition-all duration-300 hover:bg-blush focus-visible:opacity-100 max-md:opacity-100',
        'group-hover/gallery:opacity-100',
        side === 'left' ? 'left-3' : 'right-3'
      )}
    >
      <Icon size={17} />
    </button>
  )
}
