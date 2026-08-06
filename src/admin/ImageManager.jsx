import { useRef, useState } from 'react'
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Trash2, Plus, Star, ImageOff, RotateCcw, UploadCloud, Loader2, Link2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import cx from '../lib/cx'
import { imagesFor, SHOT_LABELS, SHOTS } from '../data/colorways.mjs'
import {
  ACCEPT, MAX_BYTES, uploadImages, isUploadedUrl, deleteUploadedImage,
} from '../lib/storage'

/**
 * Multi-image manager for one colourway.
 *
 * Order is meaningful: image 1 is the card thumbnail and the first carousel
 * slide, so "make primary" is just a move-to-front. Drag, keyboard and the
 * arrow-free reorder buttons all go through the same handler.
 */
export default function ImageManager({ images = [], onChange, colorwayCode, productId }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(null) // { done, total }
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const from = images.indexOf(active.id)
    const to = images.indexOf(over.id)
    if (from < 0 || to < 0) return
    onChange(arrayMove(images, from, to))
  }

  const add = (e) => {
    e.preventDefault()
    const next = url.trim()
    if (!next) return
    if (images.includes(next)) {
      toast.error('That image is already on this colourway.')
      return
    }
    onChange([...images, next])
    setUrl('')
  }

  const makePrimary = (src) => onChange([src, ...images.filter((s) => s !== src)])

  const remove = async (src) => {
    onChange(images.filter((s) => s !== src))
    // Only files we host get cleaned up; a pasted third-party URL is not ours
    // to delete. Best-effort, so a failed cleanup never blocks the edit.
    if (isUploadedUrl(src)) await deleteUploadedImage(src)
  }

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    if (!productId) {
      toast.error('Save the product once before uploading images.')
      return
    }

    setBusy({ done: 0, total: files.length })
    const { urls, failures } = await uploadImages(
      files,
      { productId, colorwayCode },
      setBusy
    )
    setBusy(null)

    if (urls.length) {
      onChange([...images, ...urls])
      toast.success(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded`)
    }
    // Report each rejection individually — "3 failed" tells you nothing useful.
    failures.forEach((f) => toast.error(f))
  }

  const restoreGenerated = () => {
    if (!colorwayCode) return
    onChange(imagesFor(colorwayCode))
    toast.success(`Restored the four generated shots for ${colorwayCode}`)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="spec-key">
          Images — {images.length} {images.length === 1 ? 'shot' : 'shots'}
        </p>
        {colorwayCode && (
          <button
            type="button"
            onClick={restoreGenerated}
            className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.1em] text-taupe hover:text-ink"
          >
            <RotateCcw size={12} />
            Restore generated set
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center border border-dashed border-ink/20 px-4 py-10 text-center">
          <ImageOff size={20} strokeWidth={1.5} className="mb-3 text-taupe" />
          <p className="text-sm text-taupe">No images on this colourway yet.</p>
          <p className="mt-1 max-w-xs font-mono text-2xs leading-relaxed text-taupe-light">
            Paste an image URL below, or restore the generated set and swap them out one at a time.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <SortableContext items={images} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((src, i) => (
                <Tile
                  key={src}
                  src={src}
                  index={i}
                  onRemove={() => remove(src)}
                  onMakePrimary={() => makePrimary(src)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* ---------------------------------------------------------- upload --- */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cx(
          'mt-3 border border-dashed p-5 text-center transition-colors',
          dragOver ? 'border-rose bg-rose-wash' : 'border-ink/25 bg-blush-warm/50'
        )}
      >
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = '' // so picking the same file twice still fires
          }}
        />

        {busy ? (
          <div>
            <Loader2 size={20} className="mx-auto mb-2 animate-spin text-rose" />
            <p className="font-mono text-2xs text-taupe">
              Uploading {busy.done} of {busy.total}…
            </p>
            <div className="mx-auto mt-2 h-1 w-40 bg-ink/10">
              <div
                className="h-full bg-rose transition-all duration-300"
                style={{ width: `${(busy.done / busy.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <UploadCloud size={20} strokeWidth={1.5} className="mx-auto mb-2 text-gold-deep" />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="btn-outline px-4 py-2 text-2xs uppercase tracking-[0.1em]"
            >
              Choose photos
            </button>
            <p className="mt-2 font-mono text-2xs leading-relaxed text-taupe">
              or drop them here · JPEG, PNG, WebP, AVIF or SVG · up to{' '}
              {Math.round(MAX_BYTES / 1048576)} MB each
            </p>
          </>
        )}
      </div>

      {/* ------------------------------------------------------- or a URL --- */}
      <p className="mt-4 flex items-center gap-1.5 spec-key">
        <Link2 size={12} />
        Or paste a URL
      </p>
      <form onSubmit={add} className="mt-2 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/img/fabric/ha-04-drape.svg  or  https://…"
          className="field-boxed font-mono text-2xs"
          aria-label="Image URL"
        />
        <button type="submit" className="btn-outline shrink-0 px-3.5 py-2.5">
          <Plus size={15} />
        </button>
      </form>
      <p className="mt-1.5 font-mono text-2xs leading-relaxed text-taupe">
        Drag to reorder. The first image is the card thumbnail and the first carousel slide. Removing
        an uploaded photo deletes it from storage too; a pasted URL is only unlinked.
      </p>
    </div>
  )
}

function Tile({ src, index, onRemove, onMakePrimary }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: src,
  })
  const uploaded = isUploadedUrl(src)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx(
        'group relative border bg-blush-warm',
        isDragging ? 'z-10 border-rose shadow-liftlg' : 'border-ink/10'
      )}
    >
      <img
        src={src}
        alt=""
        className="aspect-[3/4] w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.opacity = '0.25'
        }}
      />

      <span className="absolute left-1.5 top-1.5 bg-ink/85 px-1.5 py-0.5 font-mono text-[10px] leading-none text-blush">
        {index === 0 ? 'PRIMARY' : String(index + 1).padStart(2, '0')}
      </span>

      <span className="absolute inset-x-1.5 bottom-1.5 truncate bg-blush/85 px-1.5 py-0.5 font-mono text-[10px] leading-none text-ink backdrop-blur">
        {uploaded ? 'Uploaded' : SHOTS[index] ? SHOT_LABELS[SHOTS[index]] : 'Linked'}
      </span>

      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {index !== 0 && (
          <button
            type="button"
            onClick={onMakePrimary}
            title="Make this the primary image"
            aria-label="Make this the primary image"
            className="grid h-6 w-6 place-items-center bg-blush/90 text-ink hover:bg-blush"
          >
            <Star size={11} />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          title="Remove image"
          aria-label="Remove image"
          className="grid h-6 w-6 place-items-center bg-blush/90 text-clay hover:bg-blush"
        >
          <Trash2 size={11} />
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          aria-label="Drag to reorder"
          className="grid h-6 w-6 cursor-grab place-items-center bg-blush/90 text-ink hover:bg-blush active:cursor-grabbing"
        >
          <GripVertical size={11} />
        </button>
      </div>
    </li>
  )
}
