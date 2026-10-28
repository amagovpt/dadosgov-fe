"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from "react";
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
import {
  createDiscussion,
  fetchDiscussions,
  replyToDiscussion,
} from "@/service/api/discussions-topics";
import { useAuth } from "@/context/AuthContext";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import EditDiscussionPopup from "@/components/discussions/EditDiscussionPopup";
import DeleteDiscussionPopup from "@/components/discussions/DeleteDiscussionPopup";
import { format } from "date-fns";
import { enGB, pt } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useDiscussionDeepLink } from "@/hooks/useDiscussionDeepLink";
import { getDiscussionAnchorId } from "@/utils/discussionLinks";

interface DiscussionSectionProps {
  entityId: string;
  entityClass: "Reuse" | "Dataset" | "Organization" | "Dataservice";
  onCountChange?: (count: number) => void;
  initialData?: { data: Discussion[]; total: number };
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
        {/* One child, not three: the dropdown renders its option through
            `children.toString()`, and an array of children stringifies with commas
            between them -- "Gonça, ,Pinho, ,(utilizador)". */}
        <DropdownOption value="user">
          {`${user.first_name} ${user.last_name} ${t("discussions.userIdentitySuffix")}`}
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
    [user, t]
  );
  return (
    <div className="mt-48 pt-32">
      <div className="mb-24 flex items-center justify-between">
        <h4 className="text-sm font-bold text-neutral-900 uppercase">{t("discussions.reply")}</h4>
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
          <span className="text-sm mb-8 block font-medium text-neutral-900">
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
  initialData,
}: DiscussionSectionProps) {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { show } = usePopupContext();
  const sectionId = useId();
  const [discussions, setDiscussions] = useState<Discussion[]>(initialData?.data ?? []);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(!initialData);
  const addLinkedDiscussion = useCallback((discussion: Discussion) => {
    setDiscussions((previous) =>
      previous.some((item) => item.id === discussion.id) ? previous : [...previous, discussion]
    );
  }, []);
  const { targetId, targetRef, isUnavailable } = useDiscussionDeepLink({
    entityId,
    entityClass,
    discussions,
    isLoading: isLoadingDiscussions,
    onDiscussionLoaded: addLinkedDiscussion,
  });
  const [discussionCount, setDiscussionCount] = useState(initialData?.total ?? 0);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newDiscTitle, setNewDiscTitle] = useState("");
  const [newDiscMessage, setNewDiscMessage] = useState("");
  const selectedIdentityRef = useRef("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchState, setSearchState] = useState({ targetId, value: "" });
  const discussionSearch = searchState.targetId === targetId ? searchState.value : "";

  const updateDiscussionCount = useCallback(
    (count: number) => {
      setDiscussionCount(count);
      onCountChange?.(count);
    },
    [onCountChange]
  );

  useEffect(() => {
    if (initialData) {
      onCountChange?.(initialData.total);
      return;
    }
    let cancelled = false;
    async function load() {
      setIsLoadingDiscussions(true);
      try {
        // Every entity class, organizations included, lists the discussions whose subject
        // IS this entity. `fetchOrgDiscussions` answers a different question -- every
        // discussion on everything the organization published -- which is what the admin
        // dashboard wants and the organization's own tab never did.
        const response = await fetchDiscussions(entityId);
        if (!cancelled) {
          setDiscussions(response.data ?? []);
          updateDiscussionCount(response.total ?? 0);
        }
      } catch (error) {
        console.error("Error loading discussions:", error);
      } finally {
        if (!cancelled) setIsLoadingDiscussions(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [entityId, entityClass, updateDiscussionCount, initialData, onCountChange]);

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
    disc.title.toLowerCase().includes(discussionSearch.toLowerCase())
  );

  return (
    <div>
      <div className="mb-24 flex items-center justify-between">
        <h3 className="text-base font-medium text-neutral-900">
          {t("discussions.count", { count: discussionCount })}
        </h3>
        <div className="flex items-center gap-24">
          <InputSearchBar
            hasVoiceActionButton={false}
            placeholder={t("search.label")}
            aria-label={t("discussions.searchAria")}
            value={discussionSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchState({ targetId, value: e.target.value })
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
        <div className="mb-24 rounded-8 bg-white p-32">
          <div className="mb-16 flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">
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
          <p className="text-sm mb-16 text-neutral-900">
            {t("discussions.requiredFieldsBefore")}
            <span className="text-red-500">*</span>
            {t("discussions.requiredFieldsAfter")}
          </p>
          {(user?.organizations ?? []).length > 0 && (
            <div className="mb-24">
              <span className="text-sm mb-8 block font-medium text-neutral-900">
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
                  {/* Single child -- see the note in ReplyForm. */}
                  <DropdownOption value="user">
                    {`${user?.first_name} ${user?.last_name} ${t("discussions.userIdentitySuffix")}`}
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

      {isUnavailable && (
        <p role="status" className="mb-24 text-neutral-700">
          {t("discussions.linkUnavailable")}
        </p>
      )}

      {discussionCount === 0 && discussions.length === 0 ? (
        <CardNoResults
          position="center"
          icon={<Icon name="agora-line-chat" className="icon-xl h-40 w-40 text-primary-500" />}
          title={t("discussions.noDiscussionsTitle")}
          description={t("discussions.noDiscussionsDescription")}
          hasAnchor={false}
        />
      ) : (
        <div className="mt-24 flex flex-col gap-32">
          {filteredDiscussions.map((disc) => (
            <article
              key={disc.id}
              id={getDiscussionAnchorId(disc.id, sectionId)}
              data-discussion-id={disc.id}
              ref={disc.id === targetId ? targetRef : undefined}
              tabIndex={-1}
              aria-labelledby={`${getDiscussionAnchorId(disc.id, sectionId)}-title`}
              className={`scroll-mt-96 rounded-8 bg-white p-32 ${disc.id === targetId ? "ring-2 ring-primary-600" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4
                    id={`${getDiscussionAnchorId(disc.id, sectionId)}-title`}
                    className="mb-16 text-base font-bold [overflow-wrap:anywhere] text-neutral-900"
                  >
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
                      <span className="font-medium text-primary-600">
                        {disc.user.first_name} {disc.user.last_name}
                      </span>
                      {` — ${t("discussions.postedOn")} `}
                      {format(new Date(disc.created), "PPP", {
                        locale: i18n.language === "en" ? enGB : pt,
                      })}
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
                                prev.map((d) => (d.id === updated.id ? updated : d))
                              )
                            }
                          />,
                          {
                            title: t("discussions.editMessage"),
                            closeAriaLabel: t("close"),
                            dimensions: "m",
                          }
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
                          }
                        )
                      }
                    >
                      {" "}
                    </Button>
                  )}
                </div>
              </div>
              {disc.discussion.length > 0 && (
                <p className="text-sm mt-16 mb-16 max-w-[100ch] [overflow-wrap:anywhere] text-neutral-900">
                  {disc.discussion[0].content}
                </p>
              )}
              {disc.discussion.length > 1 && (
                <div className="mt-16 flex flex-col gap-24 border-l-2 border-primary-600 pt-16 pl-32">
                  {disc.discussion.slice(1).map((msg, idx) => (
                    <div key={idx}>
                      <div className="flex items-start justify-between">
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
                            <span className="font-medium text-primary-600">
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
                                        prev.map((d) => (d.id === updated.id ? updated : d))
                                      )
                                    }
                                  />,
                                  {
                                    title: t("discussions.editMessage"),
                                    closeAriaLabel: t("close"),
                                    dimensions: "m",
                                  }
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
                                                  (_, i) => i !== idx + 1
                                                ),
                                              }
                                            : d
                                        )
                                      )
                                    }
                                  />,
                                  {
                                    title: t("discussions.deleteMessageConfirm"),
                                    closeAriaLabel: t("close"),
                                    dimensions: "l",
                                  }
                                )
                              }
                            >
                              {" "}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mt-4 max-w-[100ch] [overflow-wrap:anywhere] text-neutral-900">
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
                    setDiscussions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
