"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircleIcon, SendIcon, XIcon, CarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const HISTORY_LIMIT = 20;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError(null);
    const historyForRequest = messages.slice(-HISTORY_LIMIT);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history: historyForRequest }),
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          typeof body?.error === "string"
            ? body.error
            : "Something went wrong. Please try again.";
        throw new Error(message);
      }

      setMessages((prev) => [...prev, { role: "model", text: body.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        className="fixed right-5 bottom-5 z-40 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open car assistant chat"}
      >
        {open ? <XIcon /> : <MessageCircleIcon />}
      </Button>

      {open && (
        <div className="fixed right-5 bottom-20 z-40 flex h-[28rem] w-[calc(100vw-2.5rem)] max-w-80 flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-xl sm:max-w-96">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <CarIcon size={18} className="text-primary shrink-0" />
            <p className="text-sm font-semibold">Car Assistant</p>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask me anything about your vehicles or car maintenance in general.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
            {isSending && (
              <div className="self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Typing…
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your car..."
              disabled={isSending}
              className="flex-1"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSending || !input.trim()}
              aria-label="Send message"
            >
              <SendIcon />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
