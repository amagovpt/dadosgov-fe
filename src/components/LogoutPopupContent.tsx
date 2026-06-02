"use client";

import { Button, usePopupContext } from "@ama-pt/agora-design-system";
import { logout } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export function LogoutPopupContent() {
  const { hide } = usePopupContext();
  const { samlLogin } = useAuth();

  const handleConfirm = async () => {
    if (samlLogin) {
      hide();
      window.location.href = "/saml/logout";
      return;
    }

    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    hide();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col">
      <p>Tem a certeza que pretende terminar sessão?</p>
      <div className="flex justify-end gap-16 pt-32">
        <Button appearance="outline" onClick={() => hide()}>
          Cancelar
        </Button>
        <Button appearance="solid" onClick={handleConfirm}>
          Confirmar
        </Button>
      </div>
    </div>
  );
}
