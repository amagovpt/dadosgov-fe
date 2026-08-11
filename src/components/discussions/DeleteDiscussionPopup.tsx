"use client";

import React, { useState } from "react";
import { Avatar, Button, RadioButton, StatusCard, usePopupContext } from "@ama-pt/agora-design-system";
import { Discussion } from "@/service/types/discussion";
import { deleteDiscussion, deleteDiscussionComment } from "@/service/api/discussions-topics";
import { format } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation("common");
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
              "PPP",
              { locale: i18n.language === "en" ? enGB : pt }
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
            ? t("discussions.deleteDiscussionWarning")
            : t("discussions.deleteWarning")
        }
      />

      <div>
        <p className="text-neutral-900 text-sm font-medium mb-12">
          {t("discussions.emailNotification")}
        </p>
        <div className="flex flex-col gap-24">
          <RadioButton
            label={t("discussions.automaticEmail")}
            name="notification-type"
            value="automatic"
            checked={notificationType === "automatic"}
            onChange={() => setNotificationType("automatic")}
          />
          <RadioButton
            label={t("discussions.customEmail")}
            name="notification-type"
            value="custom"
            checked={notificationType === "custom"}
            onChange={() => setNotificationType("custom")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-16">
        <Button variant="primary" appearance="outline" onClick={hide}>
          {t("discussions.cancel")}
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
          {isDeleting ? t("discussions.deleting") : t("discussions.delete")}
        </Button>
      </div>
    </div>
  );
}
