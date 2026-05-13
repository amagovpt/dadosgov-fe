import React from "react";
import {
  Button,
  CardNoResults,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import DragAndDropUploader from "@/components/Primitives/DragAndDropUploader/DragAndDropUploader";
import StatusDot from "@/components/admin/StatusDot";
import type { Dataset, Resource } from "@/types/api";

type DatasetsEditResourcesTabProps = {
  dataset: Dataset;
  uploaderKey: number;
  fileUploadError: string | null;
  isSubmitting: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onSecurityError: () => void;
  onResourceClick: (resource: Resource) => void;
  onResourceEdit: (resource: Resource) => void;
  onDeleteResource: (resource: Resource) => void;
};

export default function DatasetsEditResourcesTab({
  dataset,
  uploaderKey,
  fileUploadError,
  isSubmitting,
  onFileUpload,
  onSecurityError,
  onResourceClick,
  onResourceEdit,
  onDeleteResource,
}: DatasetsEditResourcesTabProps) {
  return (
    <div className="mt-24">
      <div className="flex items-end gap-16 mb-16 [&_.instructions]:items-center [&_.instructions]:text-center [&_.drag-and-drop-area_.agora-btn]:w-fit">
        <DragAndDropUploader
          key={uploaderKey}
          label="Ficheiros"
          dragAndDropLabel="Arraste e largue os ficheiros aqui"
          inputLabel="Selecione ou arraste os ficheiros"
          selectedFilesLabel="ficheiros selecionados"
          removeFileButtonLabel="Remover ficheiro"
          replaceFileButtonLabel="Substituir ficheiro"
          maxSizeExceededErrorLabel="O ficheiro excede o tamanho máximo permitido."
          forbiddenExtensionErrorLabel="Formato de ficheiro não permitido."
          hasError={!!fileUploadError}
          hasFeedback={!!fileUploadError}
          feedbackState="danger"
          feedbackText={fileUploadError ?? undefined}
          multiple
          onChange={onFileUpload}
          onSecurityError={onSecurityError}
        />
        <Button appearance="outline" variant="primary" className="mb-32">
          Reordene os ficheiros
        </Button>
      </div>

      <h2 className="font-medium text-neutral-900 text-base mb-16">
        {dataset.resources.length} {dataset.resources.length === 1 ? "FICHEIRO" : "FICHEIROS"}
      </h2>

      {dataset.resources.length === 0 && (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-document" className="w-12 h-12 text-primary-500 icon-xl" />}
          title="Sem ficheiros"
          description="Este conjunto de dados ainda não tem ficheiros. Adicione ficheiros ou links para começar."
          hasAnchor={false}
        />
      )}

      {dataset.resources.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Nome do ficheiro</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Formato</TableHeaderCell>
              <TableHeaderCell>Criado em</TableHeaderCell>
              <TableHeaderCell>Atualizado em</TableHeaderCell>
              <TableHeaderCell>Ação</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataset.resources.map((resource) => (
              <TableRow key={resource.id}>
                <TableCell headerLabel="Nome do ficheiro">
                  <button
                    className="text-primary-600 underline text-left cursor-pointer"
                    onClick={() => onResourceClick(resource)}
                  >
                    {resource.title}
                  </button>
                </TableCell>
                <TableCell headerLabel="Estado">
                  <StatusDot variant="success">DISPONÍVEL</StatusDot>
                </TableCell>
                <TableCell headerLabel="Tipo">
                  {resource.type === "main" ? "Ficheiros principais" : resource.type || "-"}
                </TableCell>
                <TableCell headerLabel="Formato">
                  {resource.format ? resource.format.toUpperCase() : "-"}
                </TableCell>
                <TableCell headerLabel="Criado em">
                  {format(new Date(resource.created_at), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                </TableCell>
                <TableCell headerLabel="Atualizado em">
                  {format(new Date(resource.last_modified || resource.created_at), "d 'de' MMMM 'de' yyyy", {
                    locale: pt,
                  })}
                </TableCell>
                <TableCell headerLabel="Ação">
                  <div className="flex items-center gap-8">
                    <button
                      className="text-primary-500 hover:text-primary-700"
                      title="Ver detalhes"
                      onClick={() => onResourceClick(resource)}
                    >
                      <Icon name="agora-line-eye" className="w-[20px] h-[20px]" />
                    </button>
                    <button
                      className="text-primary-500 hover:text-primary-700"
                      title="Editar recurso"
                      onClick={() => onResourceEdit(resource)}
                    >
                      <Icon name="agora-line-edit" className="w-[20px] h-[20px]" />
                    </button>
                    <button
                      className="text-danger-500 hover:text-danger-700"
                      title="Eliminar ficheiro"
                      onClick={() => onDeleteResource(resource)}
                      disabled={isSubmitting}
                    >
                      <Icon name="agora-line-trash" className="w-[20px] h-[20px]" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
