// src/components/projects/ProjectPhotosSheet.tsx
import { Modal } from '@/components/ui/modal'
import { PhotoGallery } from './PhotoGallery'
import { PhotoUpload } from './PhotoUpload'
import { useProjectPhotos } from '@/hooks/useProjectPhotos'

interface ProjectPhotosSheetProps {
  projectId: string
  projectName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectPhotosSheet({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ProjectPhotosSheetProps) {
  const { data: photos = [] } = useProjectPhotos(projectId)

  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title={`Fotos — ${projectName}`}>
      <div className="flex flex-col gap-4">
        <PhotoUpload projectId={projectId} sortOrderStart={photos.length} />
        <PhotoGallery projectId={projectId} />
      </div>
    </Modal>
  )
}
