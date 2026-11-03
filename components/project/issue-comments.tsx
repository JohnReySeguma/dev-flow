"use client";

import { CircleAlert, MessageSquare } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Textarea } from "@/components/ui/field";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";
import { errorMessage, fieldErrors } from "@/lib/api/errors";
import { usePermissions } from "@/lib/api/permissions";
import { addComment, listComments } from "@/lib/api/tracker";
import type { Comment } from "@/lib/api/types";
import { countComment, useIssueSaved } from "@/lib/tracker/store";
import { useNow } from "@/lib/use-now";
import { timeAgo } from "@/lib/utils";

const BODY_MAX = 10_000;

type Loaded = { status: "loading" } | { status: "ready"; comments: Comment[] } | { status: "error"; error: unknown };

/** API mode: an issue's comments, oldest first; members and admins can add one. */
export function IssueComments({ issueKey }: { issueKey: string }) {
  const { slug } = useWorkspaceRoute();
  const { canWrite } = usePermissions();
  const now = useNow();
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string>();
  // A just-created issue reaches the server a moment later; ask for its comments once it has.
  const saved = useIssueSaved(issueKey);

  useEffect(() => {
    if (!saved) return;
    let active = true;
    listComments(slug, issueKey)
      .then((comments) => active && setLoaded({ status: "ready", comments }))
      .catch((error: unknown) => active && setLoaded({ status: "error", error }));
    return () => {
      active = false;
    };
  }, [slug, issueKey, attempt, saved]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setPostError(undefined);
    try {
      const comment = await addComment(slug, issueKey, body.trim());
      setLoaded((l) => (l.status === "ready" ? { status: "ready", comments: [...l.comments, comment] } : l));
      setBody("");
      countComment(issueKey);
    } catch (error) {
      setPostError(fieldErrors(error).body ?? errorMessage(error));
    } finally {
      setPosting(false);
    }
  }

  return (
    <section aria-labelledby="issue-comments-title" className="flex flex-col gap-3">
      <h3 id="issue-comments-title" className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-300">
        <MessageSquare aria-hidden className="size-3.5" /> Comments
      </h3>

      {loaded.status === "loading" ? (
        <div role="status" aria-busy="true" className="h-14 animate-pulse rounded-lg bg-surface">
          <span className="sr-only">Loading comments…</span>
        </div>
      ) : loaded.status === "error" ? (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <p role="alert" className="flex items-center gap-1.5 text-red-300">
            <CircleAlert aria-hidden className="size-3.5 shrink-0" /> {errorMessage(loaded.error)}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setLoaded({ status: "loading" });
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : loaded.comments.length === 0 ? (
        <p className="text-[12.5px] text-zinc-500">No comments yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {loaded.comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              {c.author ? (
                <Avatar member={{ ...c.author, handle: "", presence: "offline" }} size="sm" className="mt-0.5" />
              ) : (
                <span aria-hidden className="mt-0.5 size-6 shrink-0 rounded-full bg-raised" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-zinc-500">
                  <span className="font-medium text-zinc-200">{c.author?.name ?? "Former member"}</span> ·{" "}
                  <time dateTime={c.createdAt}>{timeAgo(c.createdAt, now)}</time>
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap text-zinc-300">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canWrite && loaded.status === "ready" && (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <Field id="new-comment" label={<span className="sr-only">Add a comment</span>} error={postError}>
            <Textarea
              id="new-comment"
              rows={2}
              maxLength={BODY_MAX}
              value={body}
              disabled={posting}
              placeholder="Add a comment…"
              onChange={(e) => {
                setBody(e.target.value);
                setPostError(undefined);
              }}
              onKeyDown={(e) => {
                // ⌘/Ctrl+Enter posts, like most trackers.
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
              }}
              {...describedBy("new-comment", { error: postError })}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="secondary" disabled={!body.trim()} loading={posting}>
              Comment
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
