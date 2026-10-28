"use client";

import { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Avatar, Button, InputTextArea, usePopupContext } from "@ama-pt/agora-design-system";
import { Discussion } from "@/service/types/discussion";
import {
  replyToDiscussion,
  closeDiscussion,
  deleteDiscussion,
} from "@/service/api/discussions-topics";
import { LocalizedLink } from "@/components/Shared/LocalizedLink";
import { getDiscussionHref } from "@/utils/discussionLinks";

interface DiscussionDetailPopupProps {
  discussion: Discussion;
  onUpdated: (updated: Discussion) => void;
  onDeleted: () => void;
}

export default function DiscussionDetailPopup({
  discussion: initialDiscussion,
  onUpdated,
  onDeleted,
}: DiscussionDetailPopupProps) {
  const { t } = useTranslation("admin-discussions");
  const { hide } = usePopupContext();
  const [discussion, setDiscussion] = useState(initialDiscussion);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const discussionHref = getDiscussionHref(discussion);

  const handleReply = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await replyToDiscussion(discussion.id, comment.trim());
      if (updated) {
        setDiscussion(updated);
        setComment("");
        onUpdated(updated);
      }
    } catch (error) {
      console.error("Error replying to discussion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseWithComment = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await closeDiscussion(discussion.id, comment.trim());
      if (updated) {
        setDiscussion(updated);
        onUpdated(updated);
        hide();
      }
    } catch (error) {
      console.error("Error closing discussion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await deleteDiscussion(discussion.id);
      if (success) {
        onDeleted();
        hide();
      }
    } catch (error) {
      console.error("Error deleting discussion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <h3 className="text-base font-bold text-primary-600">{discussion.title}</h3>
        {discussionHref && (
          <LocalizedLink
            href={discussionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 underline"
          >
            {t("actions.goToDiscussion")}
          </LocalizedLink>
        )}
      </div>

      <div className="flex flex-col gap-16">
        {discussion.discussion.map((msg, idx) => (
          <div key={idx}>
            <div className="mb-4 flex items-center gap-8">
              <Avatar
                avatarType={msg.posted_by.avatar_thumbnail ? "image" : "initials"}
                srcPath={
                  (msg.posted_by.avatar_thumbnail ||
                    `${msg.posted_by.first_name?.charAt(0).toUpperCase() ?? ""}${msg.posted_by.last_name?.charAt(0).toUpperCase() ?? ""}`) as unknown as undefined
                }
                alt={`${msg.posted_by.first_name} ${msg.posted_by.last_name}`}
              />
              <p className="text-sm">
                <span className="font-medium text-primary-600">
                  {msg.posted_by.first_name} {msg.posted_by.last_name}
                </span>
                <span className="ml-8 text-neutral-500">
                  {format(new Date(msg.posted_on), "d 'de' MMMM 'de' yyyy HH:mm", { locale: pt })}
                </span>
              </p>
            </div>
            <p className="text-sm break-words whitespace-pre-wrap text-neutral-900">
              {msg.content}
            </p>
          </div>
        ))}
      </div>

      {!discussion.closed && (
        <InputTextArea
          label={t("commentLabel")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          disabled={isSubmitting}
        />
      )}

      <div className="flex flex-wrap items-center justify-end gap-12">
        <div className="flex flex-wrap items-center gap-12">
          {discussion.permissions?.delete && (
            <Button
              variant="danger"
              appearance="solid"
              onClick={handleDelete}
              disabled={isSubmitting}
              hasIcon
              leadingIcon="agora-line-trash"
              leadingIconHover="agora-solid-trash"
            >
              {t("actions.delete")}
            </Button>
          )}
          {!discussion.closed && (
            <>
              <Button
                variant="primary"
                appearance="solid"
                onClick={handleReply}
                disabled={isSubmitting || !comment.trim()}
              >
                {t("actions.addComment")}
              </Button>
              <Button
                variant="primary"
                appearance="outline"
                onClick={handleCloseWithComment}
                disabled={isSubmitting || !comment.trim()}
              >
                {t("actions.commentAndClose")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
