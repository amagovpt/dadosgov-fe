import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";

interface AvatarSectionProps {
  avatarError: string | null;
  avatarUploaderKey: number;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSecurityError: () => void;
}

export function AvatarSection({
  avatarError,
  avatarUploaderKey,
  onAvatarChange,
  onSecurityError,
}: AvatarSectionProps) {
  return (
    <div>
      <span className="text-base font-medium leading-7 text-primary-900">Foto de perfil</span>
      <div className="mt-2 [&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
        <DragAndDropUploader
          key={avatarUploaderKey}
          label="Ficheiros"
          dragAndDropLabel="Arraste e largue o ficheiro aqui"
          inputLabel="Selecione ou arraste o ficheiro"
          selectedFilesLabel="ficheiro selecionado"
          removeFileButtonLabel="Remover ficheiro"
          replaceFileButtonLabel="Substituir ficheiro"
          extensionsInstructions="Tamanho máximo: 4 MB. Formatos aceites: JPG, JPEG, PNG."
          accept=".jpg,.jpeg,.png"
          maxSize={4194304}
          maxCount={1}
          maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo de 4 MB."
          forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
          hasError={!!avatarError}
          hasFeedback={!!avatarError}
          feedbackState="danger"
          feedbackText={avatarError ?? undefined}
          onChange={onAvatarChange}
          onSecurityError={onSecurityError}
        />
      </div>
    </div>
  );
}
