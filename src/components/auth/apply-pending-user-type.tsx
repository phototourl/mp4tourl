"use client";

import { useEffect } from "react";
import {
  PENDING_USER_TYPE_STORAGE_KEY,
  USER_TYPE_ART_FIGHT,
} from "@/lib/constants/user-type";

/** After Google OAuth signup, apply Art Fight user type saved before redirect. */
export function ApplyPendingUserType() {
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_USER_TYPE_STORAGE_KEY);
    if (!pending || pending !== USER_TYPE_ART_FIGHT) return;
    sessionStorage.removeItem(PENDING_USER_TYPE_STORAGE_KEY);

    void fetch("/api/user/user-type", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userType: pending }),
    }).catch(() => {
      sessionStorage.setItem(PENDING_USER_TYPE_STORAGE_KEY, pending);
    });
  }, []);

  return null;
}
