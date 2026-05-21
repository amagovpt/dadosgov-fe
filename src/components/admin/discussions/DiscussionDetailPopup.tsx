"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Avatar, Button, Icon, InputTextArea, usePopupContext } from "@ama-pt/agora-design-system";
import { Discussion, Dataset, Reuse } from "@/service/types/api";
import {
  fetchReuse,
} from "@/app/api/reuses";
import { fetchDataset } from "@/app/api/datasets";
import {
  replyToDiscussion,
  closeDiscussion,
  deleteDiscussion,
} from "@/app/api/discussions-topics";

interface DiscussionDetailPopupProps {
  discussion: Discussion;
  onUpdated: (updated: Discussion) => void;
  onDeleted: () => void;
}

type Subject = Dataset | Reuse | null;

const formatMetric = (value: number | undefined) => {
  if (!value) return "0";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
  if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
  return String(value);
};

function SubjectCard({ subject }: { subject: Subject }) {
  if (!subject) return null;

  const isDataset = "quality" in subject;

  const logo = subject.organization?.logo_thumbnail || subject.organization?.logo || null;
  const href = isDataset
    ? `/pages/datasets/${(subject as Dataset).slug}`
    : `/pages/reuses/${(subject as Reuse).slug}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex overflow-hidden rounded-4 border-2 border-transparent bg-primary-100 transition-colors hover:border-primary-500"
    >
      <div className="flex w-[120px] shrink-0 items-center justify-center bg-primary-100 p-16">
        {logo ? (
          <img
            src={logo}
            alt={subject.organization?.name || "Organização"}
            className="max-h-[56px] w-auto object-contain"
          />
        ) : (
          <Icon name="agora-line-database" className="h-40 w-40 text-primary-500" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 bg-primary-100 p-16">
        <p className="text-xs truncate font-medium text-primary-600">
          {subject.organization?.name || "Sem Organização"}
        </p>
        <p className="text-sm font-bold leading-tight text-neutral-900">{subject.title}</p>
        <p className="text-xs line-clamp-2 text-neutral-700">{subject.description}</p>
        <div className="text-xs mt-4 flex flex-wrap items-center gap-8 text-neutral-600">
          <div className="flex items-center gap-4" title="Visualizações">
            <Icon
              name="agora-solid-eye"
              dimensions="xs"
              className="fill-neutral-600"
              aria-hidden="true"
            />
            <span>{formatMetric(subject.metrics?.views)}</span>
          </div>
          <div className="flex items-center gap-4" title="Downloads">
            <Icon
              name="agora-solid-download"
              dimensions="xs"
              className="fill-neutral-600"
              aria-hidden="true"
            />
            <span>{formatMetric(subject.metrics?.resources_downloads)}</span>
          </div>
          <div className="flex items-center gap-4" title="Reutilizações">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              className="fill-neutral-600"
              aria-hidden="true"
            >
              <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" />
            </svg>
            <span>{subject.metrics?.reuses || 0}</span>
          </div>
          <div className="flex items-center gap-4" title="Favoritos">
            <Icon
              name="agora-solid-star"
              dimensions="xs"
              className="fill-neutral-600"
              aria-hidden="true"
            />
            <span>{formatMetric(subject.metrics?.followers)}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center bg-primary-100 pr-16">
        <Icon
          name="agora-line-arrow-right-circle"
          className="h-32 w-32 text-primary-600"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

export default function DiscussionDetailPopup({
  discussion,
  onUpdated,
  onDeleted,
}: DiscussionDetailPopupProps) {
  const { hide } = usePopupContext();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState<Subject>(null);

  useEffect(() => {
    const { class: cls, id } = discussion.subject ?? {};
    if (!id) return;
    if (cls === "Dataset") {
      fetchDataset(id).then(setSubject).catch(console.error);
    } else if (cls === "Reuse") {
      fetchReuse(id).then(setSubject).catch(console.error);
    }
  }, [discussion.subject]);

  const handleReply = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await replyToDiscussion(discussion.id, comment.trim());
      if (updated) {
        onUpdated(updated);
        setComment("");
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
      <SubjectCard subject={subject} />

      <h3 className="text-base font-bold text-primary-600">{discussion.title}</h3>

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
            <p className="text-sm whitespace-pre-wrap break-words text-neutral-900">
              {msg.content}
            </p>
          </div>
        ))}
      </div>

      {!discussion.closed && (
        <InputTextArea
          label="Escreva o seu comentário"
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
              Eliminar
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
                Adicionar comentário
              </Button>
              <Button
                variant="primary"
                appearance="outline"
                onClick={handleCloseWithComment}
                disabled={isSubmitting || !comment.trim()}
              >
                Comentar e fechar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
