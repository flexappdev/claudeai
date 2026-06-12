"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import type { ChatMode } from "@/lib/chatModes";
import type { ChatDTO, MessageDTO } from "@/lib/types";

type ChatResponse = { chat: ChatDTO; messages: MessageDTO[] };

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, mutate } = useSWR<ChatResponse>(`/api/chats/${id}`, fetcher);
  const [transient, setTransient] = useState<MessageDTO[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setTransient([]);
    setStreaming(false);
    setStreamError(null);
  }, [id]);

  const onSend = useCallback(
    async (text: string, mode: ChatMode) => {
      const tempUserId = `tmp-user-${Date.now()}`;
      const tempAssistantId = `tmp-asst-${Date.now()}`;
      const tempUser: MessageDTO = {
        _id: tempUserId,
        chatId: id,
        role: "user",
        content: text,
        artifactIds: [],
        createdAt: new Date().toISOString(),
      };
      const tempAssistant: MessageDTO = {
        _id: tempAssistantId,
        chatId: id,
        role: "assistant",
        content: "",
        artifactIds: [],
        createdAt: new Date().toISOString(),
      };
      setTransient([tempUser, tempAssistant]);
      setStreaming(true);
      setStreamError(null);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: id, message: text, mode }),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setTransient((prev) =>
            prev.map((m) => (m._id === tempAssistantId ? { ...m, content: acc } : m)),
          );
        }

        // Streaming done — revalidate to load persisted versions + auto-title.
        setStreaming(false);
        abortRef.current = null;
        setTimeout(() => {
          void mutate();
          setTransient([]);
        }, 400);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setStreaming(false);
          return;
        }
        setStreaming(false);
        setStreamError((err as Error).message);
      }
    },
    [id, mutate],
  );

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
        <h2 className="font-display text-2xl">Chat not found</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          It may have been deleted, or the id is invalid.
        </p>
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="focus-ring mt-6 inline-flex items-center rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-2)]"
        >
          Back
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="h-10 animate-pulse rounded-md bg-[var(--color-surface-2)]" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="h-16 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
          <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
        </div>
      </div>
    );
  }

  // Don't show transient stand-ins for messages that have already been persisted.
  const persistedCount = data.messages.length;
  const messages = streaming || transient.length ? [...data.messages, ...transient] : data.messages;

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader
        chat={data.chat}
        onUpdate={(c) => mutate({ ...data, chat: c }, { revalidate: false })}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={messages} />
          {streamError && (
            <div className="mx-2 my-4 rounded-[var(--radius-card)] border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {streamError}{" "}
              <button
                type="button"
                onClick={() => setStreamError(null)}
                className="ml-2 underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        <Composer
          chatId={id}
          onSend={onSend}
          streaming={streaming}
          onStop={onStop}
        />
        {/* Re-key by persisted count to ensure auto-scroll triggers on revalidate */}
        <span className="hidden" data-persisted-count={persistedCount} />
      </div>
    </div>
  );
}
