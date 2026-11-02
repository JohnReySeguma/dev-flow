"use client";

import { Ellipsis, MailPlus, Send, UserMinus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown, MenuItem } from "@/components/ui/dropdown";
import { describedBy, Input, Select } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { ROLES, type Role, type TeamMember } from "@/lib/account-data";
import { useNow } from "@/lib/use-now";
import { cn, timeAgo } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Notice = { tone: "success" | "info"; text: string };

type TeamMembersProps = {
  team: TeamMember[];
  onTeamChange: (update: (team: TeamMember[]) => TeamMember[]) => void;
  currentUserId: string;
};

export function TeamMembers({ team, onTeamChange, currentUserId }: TeamMembersProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [inviteError, setInviteError] = useState<string>();
  const [notice, setNotice] = useState<Notice | null>(null);
  /** Removal is permanent, so it's confirmed first instead of offering an undo. */
  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);
  const now = useNow();

  const adminCount = team.filter((m) => m.role === "admin" && m.status === "active").length;
  const activeCount = team.filter((m) => m.status === "active").length;
  const pendingCount = team.length - activeCount;

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) return setInviteError("Enter a valid email address.");
    if (team.some((m) => m.email === address)) return setInviteError(`${address} is already on this workspace.`);

    const local = address.split("@")[0];
    onTeamChange((t) => [
      ...t,
      {
        id: `inv-${address}`,
        name: local,
        email: address,
        initials: local.slice(0, 2).toUpperCase(),
        gradient: "from-zinc-600 to-zinc-700",
        role,
        status: "invited",
        lastActiveAt: null,
      },
    ]);
    setEmail("");
    setInviteError(undefined);
    setNotice({ tone: "success", text: `Invite sent to ${address}.` });
  }

  function remove(member: TeamMember) {
    onTeamChange((t) => t.filter((m) => m.id !== member.id));
    setConfirmRemove(null);
    setNotice({
      tone: "info",
      text:
        member.status === "invited"
          ? `The invite for ${member.email} was revoked.`
          : `${member.name} was removed from the workspace.`,
    });
  }

  return (
    <Section
      id="members"
      title="Team members"
      description={`${activeCount} active${pendingCount ? ` · ${pendingCount} pending invite${pendingCount > 1 ? "s" : ""}` : ""}`}
      bodyClassName="p-0"
    >
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
            <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="primary" className="h-9">
            <MailPlus aria-hidden className="size-3.5" />
            Invite
          </Button>
        </div>
      </form>

      {notice && (
        <div
          role="status"
          className={cn(
            "flex items-center gap-3 border-b border-line px-5 py-2.5 text-[12.5px]",
            notice.tone === "success" ? "bg-emerald-500/[0.05] text-emerald-300" : "bg-raised/40 text-zinc-300",
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
                    <div className="w-28" title={roleLocked ? (isSelf ? "You can't change your own role" : "A workspace needs at least one admin") : undefined}>
                      <label htmlFor={`role-${member.id}`} className="sr-only">
                        Role for {member.name}
                      </label>
                      <Select
                        id={`role-${member.id}`}
                        value={member.role}
                        disabled={roleLocked}
                        onChange={(e) => {
                          const next = e.target.value as Role;
                          onTeamChange((t) => t.map((m) => (m.id === member.id ? { ...m, role: next } : m)));
                          setNotice({ tone: "success", text: `${member.name} is now ${ROLES.find((r) => r.id === next)?.label}.` });
                        }}
                        className="h-8 text-[12.5px]"
                      >
                        {ROLES.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </Select>
                    </div>
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
                    {!isSelf && (
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
                                  setNotice({ tone: "success", text: `Invite re-sent to ${member.email}.` });
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

      <RemoveMemberDialog member={confirmRemove} onCancel={() => setConfirmRemove(null)} onConfirm={remove} />
    </Section>
  );
}

function RemoveMemberDialog({
  member,
  onCancel,
  onConfirm,
}: {
  member: TeamMember | null;
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
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" autoFocus onClick={() => member && onConfirm(member)}>
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
              <span className="text-zinc-200">{member.name}</span> ({member.email}) loses access immediately. Their account,
              sessions and access tokens are deleted. This can&apos;t be undone.
            </>
          )}
        </p>
      )}
    </Dialog>
  );
}
