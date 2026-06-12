"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { Composer, type ChatMode } from "@/components/chat/Composer";
import type { ChatDTO, MessageDTO } from "@/lib/types";

type ChatResponse = { chat: ChatDTO; messages: MessageDTO[] };

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, mutate } = useSWR<ChatResponse>(`/api/chats/${id}`, fetcher);
  const [optimistic, setOptimistic] = useState<MessageDTO[]>([]);

  useEffect(() => {
    setOptimistic([]);
  }, [id]);

  const onSend = useCallback(
    async (text: string, mode: ChatMode) => {
      const tempUser: MessageDTO = {
        _id: `tmp-user-${Date.now()}`,
        chatId: id,
        role: "user",
        content: text,
        artifactIds: [],
        createdAt: new Date().toISOString(),
      };
      const tempAssistant: MessageDTO = {
        _id: `tmp-asst-${Date.now()}`,
        chatId: id,
        role: "assistant",
        content: "Streaming endpoint wires up in CC-03. Your message was captured.",
        artifactIds: [],
        createdAt: new Date().toISOString(),
      };
      setOptimistic((prev) => [...prev, tempUser, tempAssistant]);
      void mode;
    },
    [id],
  );

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

  const messages = [...data.messages, ...optimistic];

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader
        chat={data.chat}
        onUpdate={(c) => mutate({ ...data, chat: c }, { revalidate: false })}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={messages} />
        </div>
        <Composer chatId={id} onSend={onSend} />
      </div>
    </div>
  );
}
