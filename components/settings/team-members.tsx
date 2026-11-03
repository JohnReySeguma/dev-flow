"use client";

import { Ellipsis, Lock, MailPlus, Send, UserMinus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown, MenuItem } from "@/components/ui/dropdown";
import { describedBy, Input, Select } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { ROLES, type Role, type TeamMember } from "@/lib/account-data";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/errors";
import { useNow } from "@/lib/use-now";
import { cn, timeAgo } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Notice = { tone: "success" | "info" | "error"; text: string };

/** How member changes are carried out: locally in demo mode, through the API otherwise. All may reject. */
export type TeamActions = {
  invite: (email: string, role: Role) => Promise<TeamMember>;
  changeRole: (member: TeamMember, role: Role) => Promise<TeamMember>;
  remove: (member: TeamMember) => Promise<void>;
  resend: (member: TeamMember) => Promise<TeamMember>;
};

type TeamMembersProps = {
  team: TeamMember[];
  onTeamChange: (update: (team: TeamMember[]) => TeamMember[]) => void;
  currentUserId: string;
  /** Only admins manage members; everyone else sees the list read-only. */
  canManage: boolean;
  /** Why the list is read-only for an admin too (e.g. the shared demo workspace). */
  lockedReason?: string;
  actions: TeamActions;
  /** Re-fetch the list (e.g. after an invite was saved but its email failed). */
  onReload?: () => void;
};

const replace = (updated: TeamMember) => (team: TeamMember[]) => team.map((m) => (m.id === updated.id ? updated : m));

export function TeamMembers({ team, onTeamChange, currentUserId, canManage, lockedReason, actions, onReload }: TeamMembersProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [inviteError, setInviteError] = useState<string>();
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Removal is permanent, so it's confirmed first instead of offering an undo. */
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const now = useNow();

  const adminCount = team.filter((m) => m.role === "admin" && m.status === "active").length;
  const activeCount = team.filter((m) => m.status === "active").length;
  const pendingCount = team.length - activeCount;

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) return setInviteError("Enter a valid email address.");
    if (team.some((m) => m.email === address)) return setInviteError(`${address} is already on this workspace.`);

    setInviting(true);
    setNotice(null);
    try {
      const member = await actions.invite(address, role);
      onTeamChange((t) => [...t, member]);
      setEmail("");
      setInviteError(undefined);
      setNotice({ tone: "success", text: `Invite sent to ${address}.` });
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_DELIVERY_FAILED") {
        // The invite exists; only its email failed. Show it in the list and point at Resend.
        setEmail("");
        onReload?.();
        setNotice({ tone: "error", text: `${errorMessage(error)} (${address})` });
      } else {
        setInviteError(fieldErrors(error).email ?? errorMessage(error));
      }
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(member: TeamMember, next: Role) {
    setBusyId(member.id);
    setNotice(null);
    try {
      const updated = await actions.changeRole(member, next);
      onTeamChange(replace(updated));
      setNotice({ tone: "success", text: `${member.name} is now ${ROLES.find((r) => r.id === next)?.label}.` });
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function resend(member: TeamMember) {
    setBusyId(member.id);
    setNotice(null);
    try {
      onTeamChange(replace(await actions.resend(member)));
      setNotice({ tone: "success", text: `Invite re-sent to ${member.email}. The previous link no longer works.` });
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(member: TeamMember) {
    setRemoving(true);
    try {
      await actions.remove(member);
      onTeamChange((t) => t.filter((m) => m.id !== member.id));
      setNotice({
        tone: "info",
        text:
          member.status === "invited"
            ? `The invite for ${member.email} was revoked.`
            : `${member.name} was removed from the workspace.`,
      });
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setRemoving(false);
      setConfirmRemove(null);
    }
  }

  return (
    <Section
      id="members"
      title="Team members"
      description={`${activeCount} active${pendingCount ? ` · ${pendingCount} pending invite${pendingCount > 1 ? "s" : ""}` : ""}`}
      bodyClassName="p-0"
    >
      {canManage ? (
        <form noValidate onSubmit={invite} className="flex flex-col gap-2 border-b border-line p-5 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor="invite-email" className="sr-only">
              Email address to invite
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@company.com"
              value={email}
              disabled={inviting}
              onChange={(e) => {
                setEmail(e.target.value);
                setInviteError(undefined);
              }}
              {...describedBy("invite-email", { error: inviteError })}
            />
            {inviteError && (
              <p id="invite-email-error" role="alert" className="mt-1.5 text-[12px] text-red-400">
                {inviteError}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <div className="w-32">
              <label htmlFor="invite-role" className="sr-only">
                Role for new member
              </label>
              <Select id="invite-role" value={role} disabled={inviting} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="primary" className="h-9" loading={inviting}>
              {!inviting && <MailPlus aria-hidden className="size-3.5" />}
              Invite
            </Button>
          </div>
        </form>
      ) : (
        <p className="flex items-center gap-2 border-b border-line px-5 py-3 text-[12.5px] text-zinc-500">
          <Lock aria-hidden className="size-3.5" />
          {lockedReason ?? "Only admins can invite people, change roles or remove members."}
        </p>
      )}

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center gap-3 border-b border-line px-5 py-2.5 text-[12.5px]",
            notice.tone === "success" && "bg-emerald-500/[0.05] text-emerald-300",
            notice.tone === "info" && "bg-raised/40 text-zinc-300",
            notice.tone === "error" && "bg-red-500/[0.06] text-red-300",
          )}
        >
          <span className="flex-1">{notice.text}</span>
        </div>
      )}

      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] tracking-wide text-zinc-500 uppercase">
              <th scope="col" className="px-5 py-2.5 font-medium">Member</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Role</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-3 py-2.5 font-medium">Last active</th>
              <th scope="col" className="w-12 px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {team.map((member) => {
              const isSelf = member.id === currentUserId;
              const isLastAdmin = member.role === "admin" && member.status === "active" && adminCount === 1;
              const roleLocked = isSelf || isLastAdmin;
              const busy = busyId === member.id;
              const roleLabel = ROLES.find((r) => r.id === member.role)?.label ?? member.role;
              return (
                <tr key={member.id} className="transition-colors hover:bg-elevated/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        member={{ ...member, handle: member.email, presence: "offline" }}
                        size="md"
                        className={cn(member.status === "invited" && "opacity-60")}
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-medium text-zinc-100">
                          {member.name}
                          {isSelf && (
                            <span className="rounded bg-raised px-1 py-px text-[10px] font-medium text-zinc-400 ring-1 ring-line-strong">
                              You
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[12px] text-zinc-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {canManage ? (
                      <div
                        className="w-28"
                        title={roleLocked ? (isSelf ? "You can't change your own role" : "A workspace needs at least one admin") : undefined}
                      >
                        <label htmlFor={`role-${member.id}`} className="sr-only">
                          Role for {member.name}
                        </label>
                        <Select
                          id={`role-${member.id}`}
                          value={member.role}
                          disabled={roleLocked || busy}
                          aria-busy={busy || undefined}
                          onChange={(e) => void changeRole(member, e.target.value as Role)}
                          className="h-8 text-[12.5px]"
                        >
                          {ROLES.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ) : (
                      <span className="text-[12.5px] text-zinc-300">{roleLabel}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {member.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-300">
                        <span className="size-1.5 rounded-full bg-emerald-400" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11.5px] font-medium text-amber-300 ring-1 ring-amber-500/20 ring-inset">
                        Invited
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[12px] whitespace-nowrap text-zinc-500 tabular-nums">
                    {member.lastActiveAt ? timeAgo(member.lastActiveAt, now) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {canManage && !isSelf && (
                      <Dropdown
                        align="end"
                        triggerLabel={`Actions for ${member.name}`}
                        triggerClassName="rounded-md border border-transparent p-1.5 text-zinc-500 outline-none transition-colors hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
                        trigger={<Ellipsis className="size-4" />}
                      >
                        {(close) => (
                          <>
                            {member.status === "invited" && (
                              <MenuItem
                                icon={<Send className="size-3.5" />}
                                onSelect={() => {
                                  close();
                                  void resend(member);
                                }}
                              >
                                Resend invite
                              </MenuItem>
                            )}
                            <MenuItem
                              destructive
                              icon={<UserMinus className="size-3.5 text-red-400" />}
                              onSelect={() => {
                                close();
                                if (isLastAdmin) {
                                  setNotice({ tone: "info", text: "Promote another admin before removing the last one." });
                                  return;
                                }
                                setConfirmRemove(member);
                              }}
                            >
                              {member.status === "invited" ? "Revoke invite" : "Remove from workspace"}
                            </MenuItem>
                          </>
                        )}
                      </Dropdown>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <RemoveMemberDialog
        member={confirmRemove}
        pending={removing}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={(member) => void remove(member)}
      />
    </Section>
  );
}

function RemoveMemberDialog({
  member,
  pending,
  onCancel,
  onConfirm,
}: {
  member: TeamMember | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (member: TeamMember) => void;
}) {
  const invite = member?.status === "invited";
  return (
    <Dialog
      open={member !== null}
      onClose={onCancel}
      size="sm"
      title={invite ? "Revoke this invite?" : `Remove ${member?.name ?? "member"}?`}
      footer={
        <>
          <Button variant="ghost" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" autoFocus loading={pending} onClick={() => member && onConfirm(member)}>
            {invite ? "Revoke invite" : "Remove member"}
          </Button>
        </>
      }
    >
      {member && (
        <p className="text-[13px] leading-relaxed text-zinc-400">
          {invite ? (
            <>
              The link sent to <span className="text-zinc-200">{member.email}</span> stops working. You can invite them
              again later.
            </>
          ) : (
            <>
              <span className="text-zinc-200">{member.name}</span> ({member.email}) loses access to this workspace
              immediately, and their access tokens for it are deleted. Their account and other workspaces stay; you can
              invite them back later.
            </>
          )}
        </p>
      )}
    </Dialog>
  );
}
