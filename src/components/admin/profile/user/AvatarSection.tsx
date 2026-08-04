import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("admin-profile");

  return (
    <div>
      <span className="text-base font-medium leading-7 text-primary-900">
        {t("avatar.label")}
      </span>
      <div className="mt-2 [&_.drag-and-drop-area_.agora-btn]:w-fit [&_.instructions]:items-center [&_.instructions]:text-center">
        <DragAndDropUploader
          key={avatarUploaderKey}
          label={t("avatar.filesLabel")}
          dragAndDropLabel={t("avatar.dragAndDropLabel")}
          inputLabel={t("avatar.inputLabel")}
          selectedFilesLabel={t("avatar.selectedFilesLabel")}
          removeFileButtonLabel={t("avatar.removeFileButtonLabel")}
          replaceFileButtonLabel={t("avatar.replaceFileButtonLabel")}
          extensionsInstructions={t("avatar.extensionsInstructions")}
          accept=".jpg,.jpeg,.png"
          maxSize={4194304}
          maxCount={1}
          maxSizeExceededErrorLabel={t("avatar.maxSizeExceededErrorLabel")}
          forbiddenExtensionErrorLabel={t("avatar.forbiddenExtensionErrorLabel")}
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
