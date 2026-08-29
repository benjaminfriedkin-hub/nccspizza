"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface MockEmail {
  id: string;
  to: string;
  subject: string;
  text: string;
  sentAt: string;
}

export default function MockInboxPage() {
  const [usingMockTransport, setUsingMockTransport] = useState(true);
  const [messages, setMessages] = useState<MockEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/mock-inbox")
      .then((r) => r.json())
      .then((data) => {
        setUsingMockTransport(data.usingMockTransport);
        setMessages(data.messages || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-stone-900">Mock Inbox</h1>
      {!usingMockTransport ? (
        <p className="text-sm text-stone-500">
          Real SMTP is configured — emails are being sent for real, so the mock inbox is empty.
        </p>
      ) : (
        <>
          <p className="text-sm text-stone-500">
            No email account is configured yet, so confirmation emails are recorded here instead of sent.
          </p>
          {loading ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-stone-500">No emails yet.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <Card key={m.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-stone-800">{m.subject}</p>
                    <p className="text-xs text-stone-400">{new Date(m.sentAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">To: {m.to}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-stone-600">{m.text}</pre>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
