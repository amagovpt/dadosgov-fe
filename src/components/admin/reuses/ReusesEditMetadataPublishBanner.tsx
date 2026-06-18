import React from "react";
import { Button, StatusCard } from "@ama-pt/agora-design-system";

interface ReusesEditMetadataPublishBannerProps {
  isSubmitting: boolean;
  onPublishReuse: () => void | Promise<void>;
}

export default function ReusesEditMetadataPublishBanner({
  isSubmitting,
  onPublishReuse,
}: ReusesEditMetadataPublishBannerProps) {
  return (
    <div className="dataset-edit-visibility-banner">
      <StatusCard
        variant="informative"
        showIcon
        description={
          <>
            <strong>Modifique a visibilidade da reutilização.</strong>
            <br />
            Esta reutilização encontra-se atualmente em <strong>modo rascunho</strong>. Apenas o
            produtor e os membros da organização a podem visualizar e editar.
          </>
        }
      />
      <div>
        <Button
          variant="primary"
          appearance="outline"
          onClick={onPublishReuse}
          disabled={isSubmitting}
        >
          Publicar reutilização
        </Button>
      </div>
    </div>
  );
}
