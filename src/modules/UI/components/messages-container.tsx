import type { Fragment } from "@/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-from";
import { useEffect, useRef } from "react";
import { MessageLoading } from "./message-loading";

interface Props {
  projectId: string;
  onFragmentClick: (fragment: Fragment) => void;
  activeFragment: Fragment | null;
}

export const MessageContainer = ({
  projectId,
  onFragmentClick,
  activeFragment,
}: Props) => {
  const trpc = useTRPC();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    ...trpc.messages.getMany.queryOptions({ projectId }),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const lastAssistantMessage = messages.findLast(
      (message) => message.role?.toUpperCase?.() === "ASSISTANT"
    );

    if (
      lastAssistantMessage?.fragment &&
      lastAssistantMessage.id !== lastAssistantMessageIdRef.current
    ) {
      onFragmentClick(lastAssistantMessage.fragment);
      lastAssistantMessageIdRef.current = lastAssistantMessage.id;
    }
  }, [messages, onFragmentClick]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages.length]);

  const lastMessage = messages[messages.length - 1];
  const isLastMessageUser = lastMessage?.role?.toUpperCase?.() === "USER";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1 space-y-2">
          {isError && (
            <div className="text-red-500 pl-2">
              Failed to load messages: {error.message}
            </div>
          )}

          {messages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragment}
              createdAt={new Date(message.createdAt)}
              isActiveFragment={message.fragment?.id === activeFragment?.id}
              onFragmentClick={onFragmentClick}
              type={message.type}
            />
          ))}

          {isLastMessageUser && !isError && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};
