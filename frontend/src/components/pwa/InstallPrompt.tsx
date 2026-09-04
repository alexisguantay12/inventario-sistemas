"use client";

import {
  useEffect,
  useState,
} from "react";

interface BeforeInstallPromptEvent
  extends Event {
  prompt: () => Promise<void>;

  userChoice: Promise<{
    outcome:
      | "accepted"
      | "dismissed";

    platform: string;
  }>;
}

export default function InstallPrompt() {
  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<
      BeforeInstallPromptEvent | null
    >(null);

  const [
    visible,
    setVisible,
  ] =
    useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(
      event: Event,
    ) {
      event.preventDefault();

      setDeferredPrompt(
        event as BeforeInstallPromptEvent,
      );

      setVisible(true);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  async function instalar() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();

    const choice =
      await deferredPrompt.userChoice;

    if (
      choice.outcome === "accepted"
    ) {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">

      <div className="flex items-start gap-3">

        <img
          src="/logo-santa-clara.jpg"
          alt=""
          className="h-11 w-11 rounded-xl object-contain"
        />

        <div className="min-w-0 flex-1">

          <p className="text-sm font-semibold text-slate-900">
            Instalar Inventario Sistemas
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Podés instalar el sistema en este dispositivo
            para acceder más rápido.
          </p>

        </div>

      </div>

      <div className="mt-4 flex gap-2">

        <button
          type="button"
          onClick={() =>
            setVisible(false)
          }
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
        >
          Ahora no
        </button>

        <button
          type="button"
          onClick={instalar}
          className="flex-1 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Instalar
        </button>

      </div>

    </div>
  );
}