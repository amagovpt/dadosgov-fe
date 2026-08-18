"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Avatar,
  Button,
  CardNoResults,
  DropdownOption,
  DropdownSection,
  Icon,
  InputSearchBar,
  InputText,
  InputTextArea,
  usePopupContext,
} from "@ama-pt/agora-design-system";
import type { Discussion, DiscussionCreatePayload } from "@/service/types/discussion";
import { createDiscussion, fetchDiscussions, fetchOrgDiscussions, replyToDiscussion } from "@/service/api/discussions-topics";
import { useAuth } from "@/context/AuthContext";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import EditDiscussionPopup from "@/components/discussions/EditDiscussionPopup";
import DeleteDiscussionPopup from "@/components/discussions/DeleteDiscussionPopup";
import { format } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface DiscussionSectionProps {
  entityId: string;
  entityClass: "Reuse" | "Dataset" | "Organization" | "Dataservice";
  onCountChange?: (count: number) => void;
}

interface ReplyFormProps {
  discId: string;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onClose: () => void;
  onSubmitted: (updated: Discussion) => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ discId, user, onClose, onSubmitted }) => {
  const { t } = useTranslation("common");
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const identityRef = useRef("");
  const identityOptions = useMemo(
    () => (
      <DropdownSection name="identity">
        <DropdownOption value="user">
          {user.first_name} {user.last_name} {t("discussions.userIdentitySuffix")}
        </DropdownOption>
        <>
          {(user.organizations ?? []).map((org) => (
            <DropdownOption key={org.id} value={org.id}>
              {org.name}
            </DropdownOption>
          ))}
        </>
      </DropdownSection>
    ),
    [user, t],
  );
  return (
    <div className="mt-48 pt-32">
      <div className="flex justify-between items-center mb-24">
        <h4 className="font-bold text-neutral-900 text-sm uppercase">
          {t("discussions.reply")}
        </h4>
        <Button
          variant="primary"
          appearance="outline"
          hasIcon
          leadingIcon="agora-line-x"
          leadingIconHover="agora-solid-x"
          onClick={onClose}
        >
          {t("close")}
        </Button>
      </div>
      {(user.organizations ?? []).length > 0 && (
        <div className="mb-32">
          <span className="block text-sm font-medium text-neutral-900 mb-8">
            {t("discussions.identityLabel")}
          </span>
          <IsolatedSelect
            label=""
            hideLabel
            placeholder={t("discussions.identitySearchPlaceholder")}
            id={`reply-identity-${discId}`}
            onChangeRef={identityRef}
            searchable
            searchInputPlaceholder={t("discussions.identitySearchPlaceholder")}
            searchNoResultsText={t("discussions.noResults")}
          >
            {identityOptions}
          </IsolatedSelect>
        </div>
      )}
      <div className="mb-32">
        <InputTextArea
          label={t("discussions.yourMessage")}
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          rows={3}
          placeholder={t("discussions.messagePlaceholder")}
        />
      </div>
      <div className="flex justify-end gap-16">
        <Button
          variant="primary"
          appearance="solid"
          disabled={isReplying || !replyMessage.trim()}
          onClick={async () => {
            setIsReplying(true);
            const org =
              identityRef.current && identityRef.current !== "user"
                ? identityRef.current
                : undefined;
            const updated = await replyToDiscussion(discId, replyMessage.trim(), {
              organization: org,
            });
            if (updated) onSubmitted(updated);
            setIsReplying(false);
          }}
        >
          {t("discussions.reply")}
        </Button>
      </div>
    </div>
  );
};

export function DiscussionSection({
  entityId,
  entityClass,
  onCountChange,
}: DiscussionSectionProps) {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { show } = usePopupContext();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionCount, setDiscussionCount] = useState(0);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [newDiscMessage, setNewDiscMessage] = useState("");
  const selectedIdentityRef = useRef("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [discussionSearch, setDiscussionSearch] = useState("");

  const updateDiscussionCount = useCallback(
    (count: number) => {
      setDiscussionCount(count);
      onCountChange?.(count);
    },
    [onCountChange],
  );

  useEffect(() => {
    async function load() {
      try {
        const response =
          entityClass === "Organization"
            ? await fetchOrgDiscussions(entityId)
            : await fetchDiscussions(entityId);
        setDiscussions(response.data ?? []);
        updateDiscussionCount(response.total ?? 0);
      } catch (error) {
        console.error("Error loading discussions:", error);
      }
    }
    load();
  }, [entityId, entityClass, updateDiscussionCount]);

  const handleCreateDiscussion = async () => {
    if (!newDiscTitle.trim() || !newDiscMessage.trim()) return;
    setIsSubmitting(true);
    try {
      const payload: DiscussionCreatePayload = {
        title: newDiscTitle.trim(),
        comment: newDiscMessage.trim(),
        subject: { class: entityClass, id: entityId },
        ...(selectedIdentityRef.current && selectedIdentityRef.current !== "user"
          ? { organization: selectedIdentityRef.current }
          : {}),
      };
      const created = await createDiscussion(payload);
      if (created) {
        setDiscussions((prev) => [created, ...prev]);
        updateDiscussionCount(discussionCount + 1);
        setNewDiscTitle("");
        setNewDiscMessage("");
        setShowNewDiscussion(false);
      }
    } catch (error) {
      console.error("Error creating discussion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDiscussions = discussions.filter((disc) =>
    disc.title.toLowerCase().includes(discussionSearch.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-24">
        <h3 className="font-medium text-neutral-900 text-base">
          {t("discussions.count", { count: discussionCount })}
        </h3>
        <div className="flex items-center gap-24">
          <InputSearchBar
            hasVoiceActionButton={false}
            placeholder={t("search.label")}
            aria-label={t("discussions.searchAria")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDiscussionSearch(e.target.value)
            }
          />
          <Button
            variant="primary"
            appearance="outline"
            hasIcon
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            className="self-stretch"
            onClick={() => {
              if (!user) {
                window.location.href = "/login";
              } else {
                setShowNewDiscussion(!showNewDiscussion);
              }
            }}
          >
            {t("discussions.newDiscussion")}
          </Button>
        </div>
      </div>

      {showNewDiscussion && (
        <div className="bg-white rounded-8 p-32 mb-24">
          <div className="flex justify-between items-center mb-16">
            <h3 className="font-bold text-neutral-900 text-base">
              {t("discussions.newDiscussion")}
            </h3>
            <Button
              variant="primary"
              appearance="outline"
              hasIcon
              leadingIcon="agora-line-x"
              leadingIconHover="agora-solid-x"
              onClick={() => setShowNewDiscussion(false)}
            >
              {t("close")}
            </Button>
          </div>
          <p className="text-sm text-neutral-900 mb-16">
            {t("discussions.requiredFieldsBefore")}
            <span className="text-red-500">*</span>
            {t("discussions.requiredFieldsAfter")}
          </p>
          {(user?.organizations ?? []).length > 0 && (
            <div className="mb-24">
              <span className="block text-sm font-medium text-neutral-900 mb-8">
                {t("discussions.identityLabel")}
              </span>
              <IsolatedSelect
                label=""
                hideLabel
                placeholder={t("discussions.identitySearchPlaceholder")}
                id={`discussion-identity-${entityClass}-${entityId}`}
                onChangeRef={selectedIdentityRef}
                searchable
                searchInputPlaceholder={t("discussions.identitySearchPlaceholder")}
                searchNoResultsText={t("discussions.noResults")}
              >
                <DropdownSection name="identity">
                  <DropdownOption value="user">
                    {user?.first_name} {user?.last_name} {t("discussions.userIdentitySuffix")}
                  </DropdownOption>
                  <>
                    {(user?.organizations ?? []).map((org) => (
                      <DropdownOption key={org.id} value={org.id}>
                        {org.name}
                      </DropdownOption>
                    ))}
                  </>
                </DropdownSection>
              </IsolatedSelect>
            </div>
          )}
          <div className="mb-24">
            <InputText
              label={`${t("discussions.titleLabel")} *`}
              value={newDiscTitle}
              onChange={(e) => setNewDiscTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-24">
            <InputTextArea
              label={`${t("discussions.yourMessage")} *`}
              value={newDiscMessage}
              onChange={(e) => setNewDiscMessage(e.target.value)}
              rows={4}
              placeholder={t("discussions.messagePlaceholder")}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              appearance="solid"
              onClick={handleCreateDiscussion}
              disabled={isSubmitting || !newDiscTitle.trim() || !newDiscMessage.trim()}
            >
              {isSubmitting ? t("discussions.sending") : t("discussions.submit")}
            </Button>
          </div>
        </div>
      )}

      {discussionCount === 0 ? (
        <CardNoResults
          position="center"
          icon={
            <Icon name="agora-line-chat" className="w-40 h-40 text-primary-500 icon-xl" />
          }
          title={t("discussions.noDiscussionsTitle")}
          description={t("discussions.noDiscussionsDescription")}
          hasAnchor={false}
        />
      ) : (
        <div className="flex flex-col gap-32 mt-24">
          {filteredDiscussions.map((disc) => (
            <div key={disc.id} className="bg-white rounded-8 p-32">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-neutral-900 text-base mb-16 [overflow-wrap:anywhere]">
                    {disc.title}
                  </h4>
                  <div className="flex items-center gap-8">
                    <Avatar
                      avatarType={disc.user.avatar_thumbnail ? "image" : "initials"}
                      srcPath={
                        (disc.user.avatar_thumbnail ||
                          `${disc.user.first_name?.charAt(0).toUpperCase() ?? ""}${disc.user.last_name?.charAt(0).toUpperCase() ?? ""}`) as unknown as undefined
                      }
                      alt={`${disc.user.first_name} ${disc.user.last_name}`}
                    />
                    <p className="text-sm text-neutral-900">
                      <span className="text-primary-600 font-medium">
                        {disc.user.first_name} {disc.user.last_name}
                      </span>
                      {` — ${t("discussions.postedOn")} `}
                      {format(new Date(disc.created), "PPP", { locale: i18n.language === "en" ? enGB : pt })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-[18px]">
                  {disc.permissions.edit && (
                    <Button
                      variant="primary"
                      appearance="outline"
                      hasIcon
                      iconOnly
                      leadingIcon="agora-line-edit"
                      leadingIconHover="agora-solid-edit"
                      aria-label={t("discussions.editDiscussion")}
                      onClick={() =>
                        show(
                          <EditDiscussionPopup
                            discussion={disc}
                            commentIndex={0}
                            onUpdated={(updated) =>
                              setDiscussions((prev) =>
                                prev.map((d) => (d.id === updated.id ? updated : d)),
                              )
                            }
                          />,
                          {
                            title: t("discussions.editMessage"),
                            closeAriaLabel: t("close"),
                            dimensions: "m",
                          },
                        )
                      }
                    >
                      {" "}
                    </Button>
                  )}
                  {disc.permissions.delete && (
                    <Button
                      variant="danger"
                      appearance="outline"
                      hasIcon
                      iconOnly
                      leadingIcon="agora-line-trash"
                      leadingIconHover="agora-solid-trash"
                      aria-label={t("discussions.deleteDiscussion")}
                      onClick={() =>
                        show(
                          <DeleteDiscussionPopup
                            discussion={disc}
                            commentIndex={0}
                            onDeleted={() => {
                              setDiscussions((prev) => prev.filter((d) => d.id !== disc.id));
                              updateDiscussionCount(Math.max(0, discussionCount - 1));
                            }}
                          />,
                          {
                            title: t("discussions.deleteDiscussionConfirm"),
                            closeAriaLabel: t("close"),
                            dimensions: "l",
                          },
                        )
                      }
                    >
                      {" "}
                    </Button>
                  )}
                </div>
              </div>
              {disc.discussion.length > 0 && (
                <p className="text-neutral-900 text-sm mt-16 mb-16 max-w-[100ch] [overflow-wrap:anywhere]">
                  {disc.discussion[0].content}
                </p>
              )}
              {disc.discussion.length > 1 && (
                <div className="mt-16 pt-16 border-l-2 border-primary-600 pl-32 flex flex-col gap-24">
                  {disc.discussion.slice(1).map((msg, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-8">
                          <Avatar
                            avatarType={msg.posted_by.avatar_thumbnail ? "image" : "initials"}
                            srcPath={
                              (msg.posted_by.avatar_thumbnail ||
                                `${msg.posted_by.first_name?.charAt(0).toUpperCase() ?? ""}${msg.posted_by.last_name?.charAt(0).toUpperCase() ?? ""}`) as unknown as undefined
                            }
                            alt={`${msg.posted_by.first_name} ${msg.posted_by.last_name}`}
                          />
                          <p className="text-sm text-neutral-900">
                            <span className="text-primary-600 font-medium">
                              {msg.posted_by.first_name} {msg.posted_by.last_name}
                            </span>
                            {" — "}
                            {format(new Date(msg.posted_on), "PPP", {
                              locale: i18n.language === "en" ? enGB : pt,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-[18px]">
                          {msg.permissions.edit && (
                            <Button
                              variant="primary"
                              appearance="outline"
                              hasIcon
                              iconOnly
                              leadingIcon="agora-line-edit"
                              leadingIconHover="agora-solid-edit"
                              aria-label={t("discussions.editComment")}
                              onClick={() =>
                                show(
                                  <EditDiscussionPopup
                                    discussion={disc}
                                    commentIndex={idx + 1}
                                    onUpdated={(updated) =>
                                      setDiscussions((prev) =>
                                        prev.map((d) => (d.id === updated.id ? updated : d)),
                                      )
                                    }
                                  />,
                                  {
                                    title: t("discussions.editMessage"),
                                    closeAriaLabel: t("close"),
                                    dimensions: "m",
                                  },
                                )
                              }
                            >
                              {" "}
                            </Button>
                          )}
                          {msg.permissions.delete && (
                            <Button
                              variant="danger"
                              appearance="outline"
                              hasIcon
                              iconOnly
                              leadingIcon="agora-line-trash"
                              leadingIconHover="agora-solid-trash"
                              aria-label={t("discussions.deleteComment")}
                              onClick={() =>
                                show(
                                  <DeleteDiscussionPopup
                                    discussion={disc}
                                    commentIndex={idx + 1}
                                    onDeleted={() =>
                                      setDiscussions((prev) =>
                                        prev.map((d) =>
                                          d.id === disc.id
                                            ? {
                                                ...d,
                                                discussion: d.discussion.filter(
                                                  (_, i) => i !== idx + 1,
                                                ),
                                              }
                                            : d,
                                        ),
                                      )
                                    }
                                  />,
                                  {
                                    title: t("discussions.deleteMessageConfirm"),
                                    closeAriaLabel: t("close"),
                                    dimensions: "l",
                                  },
                                )
                              }
                            >
                              {" "}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-neutral-900 text-sm mt-4 max-w-[100ch] [overflow-wrap:anywhere]">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {replyingTo === disc.id && user ? (
                <ReplyForm
                  discId={disc.id}
                  user={user}
                  onClose={() => setReplyingTo(null)}
                  onSubmitted={(updated) => {
                    setDiscussions((prev) =>
                      prev.map((d) => (d.id === updated.id ? updated : d)),
                    );
                    setReplyingTo(null);
                  }}
                />
              ) : user ? (
                <div className="flex justify-end" style={{ marginTop: "32px" }}>
                  <Button
                    variant="primary"
                    appearance="outline"
                    onClick={() => setReplyingTo(disc.id)}
                  >
                    {t("discussions.reply")}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
