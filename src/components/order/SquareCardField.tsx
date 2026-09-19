"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Script from "next/script";

// Minimal shape of the Square Web Payments SDK we actually use.
interface SquareCard {
  attach(selector: string): Promise<void>;
  tokenize(): Promise<{
    status: string;
    token?: string;
    errors?: { message: string }[];
  }>;
}
interface SquarePayments {
  card(): Promise<SquareCard>;
}
declare global {
  interface Window {
    Square?: { payments(applicationId: string, locationId: string): SquarePayments };
  }
}

const SQUARE_ENVIRONMENT = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";
const SQUARE_APPLICATION_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
const SQUARE_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
const SQUARE_SDK_SRC =
  SQUARE_ENVIRONMENT === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

export interface SquareCardFieldHandle {
  tokenize(): Promise<{ token?: string; error?: string }>;
}

const MAX_INIT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const SquareCardField = forwardRef<SquareCardFieldHandle, { onReadyChange?: (ready: boolean) => void }>(
  function SquareCardField({ onReadyChange }, ref) {
    const cardRef = useRef<SquareCard | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function initCard(attempt = 1) {
      try {
        setStatus("loading");
        if (!window.Square || !SQUARE_APPLICATION_ID || !SQUARE_LOCATION_ID) {
          throw new Error("Card payment is not configured.");
        }
        // A slow or flaky connection (common on mobile) can make Square's SDK
        // fail its own internal init handshake — that's transient, not fatal,
        // so retry a couple of times before showing an error.
        const container = document.getElementById("square-card-container");
        if (container) container.innerHTML = "";
        const payments = window.Square.payments(SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        await card.attach("#square-card-container");
        cardRef.current = card;
        setStatus("ready");
        onReadyChange?.(true);
      } catch (err) {
        if (attempt < MAX_INIT_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS * attempt);
          return initCard(attempt + 1);
        }
        setStatus("error");
        setErrorMessage(
          "Could not load the card form — this usually means a slow or spotty connection. Please check your connection and tap Try again."
        );
        onReadyChange?.(false);
      }
    }

    useImperativeHandle(ref, () => ({
      async tokenize() {
        if (!cardRef.current) {
          return { error: "Card form is not ready yet. Please wait a moment and try again." };
        }
        const result = await cardRef.current.tokenize();
        if (result.status === "OK" && result.token) {
          return { token: result.token };
        }
        const detail = result.errors?.map((e) => e.message).join(" ");
        return { error: detail || "Card was declined. Please check your card details and try again." };
      },
    }));

    return (
      <div>
        <Script src={SQUARE_SDK_SRC} strategy="afterInteractive" onLoad={() => initCard()} />
        <label className="mb-1 block text-xs font-medium text-stone-600">Card</label>
        <div id="square-card-container" className="rounded-lg border border-stone-300 p-3 min-h-[42px]" />
        {status === "loading" && <p className="mt-1 text-xs text-stone-400">Loading card form…</p>}
        {status === "error" && errorMessage && (
          <div className="mt-1">
            <p className="text-xs text-red-600">{errorMessage}</p>
            <button
              type="button"
              onClick={() => initCard()}
              className="mt-1 text-xs font-medium text-amber-700 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }
);
