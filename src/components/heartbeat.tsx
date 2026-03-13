"use client";

import { useEffect } from "react";

export function Heartbeat() {
  useEffect(() => {
    const sendHeartbeat = async () => {
      await fetch("/api/heartbeat", { method: "POST" });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
