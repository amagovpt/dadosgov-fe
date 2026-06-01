"use client";

import React, { useState } from "react";
import { Avatar, Button, InputText, InputTextArea, usePopupContext } from "@ama-pt/agora-design-system";
import type { Discussion } from '@/service/types/discussion';
import { updateDiscussion, editDiscussionComment } from "@/app/api/discussions-topics";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface EditDiscussionPopupProps {
  discussion: Discussion;
  commentIndex: number;
  onUpdated: (updated: Discussion) => void;
}

export default function EditDiscussionPopup({
  discussion,
  commentIndex,
  onUpdated,
}: EditDiscussionPopupProps) {
  const { hide } = usePopupContext();
  const msg = discussion.discussion[commentIndex];
  const isMainPost = commentIndex === 0;

  const [title, setTitle] = useState(discussion.title);
  const [message, setMessage] = useState(msg?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    if (isMainPost && !title.trim()) return;
    setIsSubmitting(true);
    try {
      let updated: Discussion | null = null;
      if (isMainPost && title.trim() !== discussion.title) {
        updated = await updateDiscussion(discussion.id, title.trim());
      }
      if (message.trim() !== msg?.content) {
        updated = await editDiscussionComment(
          discussion.id,
          commentIndex,
          message.trim()
        );
      }
      if (updated) onUpdated(updated);
      hide();
    } catch (error) {
      console.error("Error updating discussion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <div>
        <div className="flex items-center gap-8">
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
        <p className="text-neutral-900 text-sm mt-4">{msg?.content}</p>
      </div>
      {isMainPost && (
        <div>
          <InputText
            label="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
      )}
      <div>
        <InputTextArea
          label="Mensagem *"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />
      </div>
      <div className="flex justify-end gap-16">
        <Button variant="primary" appearance="outline" onClick={hide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          appearance="solid"
          onClick={handleSubmit}
          disabled={isSubmitting || !message.trim() || (isMainPost && !title.trim())}
        >
          {isSubmitting ? "A atualizar..." : "Atualizar"}
        </Button>
      </div>
    </div>
  );
}
