"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import { Button, InputTextArea, usePopupContext } from "@ama-pt/agora-design-system";
import { refuseMembership } from "@/service/api/organizations";
import type { MembershipRequest } from "@/service/types/identity";

interface RefuseMembershipPopupContentProps {
  orgId: string;
  request: MembershipRequest;
  onRefused: () => void;
}

export function RefuseMembershipPopupContent({
  orgId,
  request,
  onRefused,
}: RefuseMembershipPopupContentProps) {
  const { hide } = usePopupContext();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRefuse = async () => {
    setIsSubmitting(true);
    try {
      await refuseMembership(orgId, request.id, comment);
      onRefused();
      hide();
    } catch (error) {
      console.error("Error refusing membership:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-24"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleRefuse();
      }}
    >
      <p className="text-neutral-900">
        Recusar o pedido de adesão de{" "}
        <strong>
          {request.user.first_name} {request.user.last_name}
        </strong>
        ?
      </p>

      <InputTextArea
        label="Motivo da recusa"
        id="refuse-comment"
        rows={3}
        placeholder="Indique o motivo da recusa (opcional)"
        value={comment}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value)}
      />

      <div className="flex gap-16">
        <Button type="button" appearance="outline" variant="primary" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button type="submit" variant="danger" disabled={isSubmitting}>
          {isSubmitting ? "A recusar..." : "Recusar"}
        </Button>
      </div>
    </form>
  );
}
