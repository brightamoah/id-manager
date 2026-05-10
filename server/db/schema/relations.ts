import { defineRelations } from "drizzle-orm";
import * as schema from "./index";

export const relations = defineRelations(schema, r => ({
  idRanges: {
    assignments: r.many.idAssignments(),
    createdByUser: r.one.users({
      from: r.idRanges.createdBy,
      to: r.users.id,
    }),
  },
  idAssignments: {
    range: r.one.idRanges({
      from: r.idAssignments.rangeId,
      to: r.idRanges.id,
    }),
    assignedByUser: r.one.users({
      from: r.idAssignments.assignedBy,
      to: r.users.id,
    }),
  },
  users: {
    accounts: r.many.accounts({
      from: r.users.id,
      to: r.accounts.userId,
    }),
    ranges: r.many.idRanges({
      from: r.users.id,
      to: r.idRanges.createdBy,
    }),
    assignments: r.many.idAssignments({
      from: r.users.id,
      to: r.idAssignments.assignedBy,
    }),
  },
  accounts: {
    user: r.one.users({
      from: r.accounts.userId,
      to: r.users.id,
    }),
  },
  auditLog: {
    actorUser: r.one.users({
      from: r.auditLog.actorUserId,
      to: r.users.id,
    }),
  },
}));
