"use client";

import React, { useState } from "react";
import { Avatar, Button, RadioButton, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { Discussion } from "@/service/types/discussion";
import { deleteDiscussion, deleteDiscussionComment } from "@/service/api/discussions-topics";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface DeleteDiscussionPopupProps {
  discussion: Discussion;
  commentIndex: number;
  onDeleted: () => void;
}

export default function DeleteDiscussionPopup({
  discussion,
  commentIndex,
  onDeleted,
}: DeleteDiscussionPopupProps) {
  const { hide } = usePopupContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationType, setNotificationType] = useState("automatic");
  const isMainPost = commentIndex === 0;
  const msg = discussion.discussion[commentIndex];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      let success = false;
      if (isMainPost) {
        success = await deleteDiscussion(discussion.id);
      } else {
        success = await deleteDiscussionComment(discussion.id, commentIndex);
      }
      if (success) {
        onDeleted();
        hide();
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <div>
        {isMainPost && (
          <h4 className="font-bold text-neutral-900 text-base mb-8">
            {discussion.title}
          </h4>
        )}
        <div className="flex items-center gap-16">
          <Avatar
            avatarType={msg?.posted_by.avatar_thumbnail ? "image" : "initials"}
            srcPath={
              (msg?.posted_by.avatar_thumbnail ||
                `${msg?.posted_by.first_name?.charAt(0).toUpperCase() ?? ""}${msg?.posted_by.last_name?.charAt(0).toUpperCase() ?? ""}`) as unknown as undefined
            }
            alt={`${msg?.posted_by.first_name} ${msg?.posted_by.last_name}`}
          />
          <p className="text-sm text-neutral-900">
            <span className="text-primary-600 font-medium underline">
              {msg?.posted_by.first_name} {msg?.posted_by.last_name}
            </span>
            {" — Publicado em "}
            {format(
              new Date(msg?.posted_on || discussion.created),
              "d 'de' MMMM 'de' yyyy",
              { locale: pt }
            )}
          </p>
        </div>
        {msg && (
          <p className="text-neutral-900 text-sm mt-8">{msg.content}</p>
        )}
      </div>

      <StatusCard
        variant="informative"
        showIcon
        description={
          isMainPost
            ? "Essa ação é irreversível. Todos os comentários nesta discussão também serão apagados."
            : "Essa ação é irreversível."
        }
      />

      <div>
        <p className="text-neutral-900 text-sm font-medium mb-12">
          Notificação por e-mail
        </p>
        <div className="flex flex-col gap-24">
          <RadioButton
            label="Enviar um e-mail automático (opções de recurso)"
            name="notification-type"
            value="automatic"
            checked={notificationType === "automatic"}
            onChange={() => setNotificationType("automatic")}
          />
          <RadioButton
            label="Enviar um e-mail personalizado"
            name="notification-type"
            value="custom"
            checked={notificationType === "custom"}
            onChange={() => setNotificationType("custom")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-16">
        <Button variant="primary" appearance="outline" onClick={hide}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          appearance="solid"
          onClick={handleDelete}
          disabled={isDeleting}
          hasIcon
          leadingIcon="agora-line-trash"
          leadingIconHover="agora-solid-trash"
        >
          {isDeleting ? "A apagar..." : "Eliminar"}
        </Button>
      </div>
    </div>
  );
}
