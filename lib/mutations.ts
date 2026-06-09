import { supabase } from "@/lib/supabase";
import { isMissingColumnError, missingColumn } from "@/lib/records";

type Payload = Record<string, unknown>;

async function withCompatibleColumns<T>(
  payload: Payload,
  action: (value: Payload) => PromiseLike<{ data: T; error: { message: string } | null }>,
) {
  const compatiblePayload = { ...payload };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await action(compatiblePayload);
    if (!result.error) return result;

    const column = missingColumn(result.error.message);
    if (!column || !isMissingColumnError(result.error.message) || !(column in compatiblePayload)) {
      return result;
    }
    delete compatiblePayload[column];
  }

  return action(compatiblePayload);
}

export function insertRecord(table: string, payload: Payload) {
  return withCompatibleColumns(payload, (value) =>
    supabase.from(table).insert(value).select().single(),
  );
}

export function updateRecord(table: string, id: string, payload: Payload) {
  return withCompatibleColumns(payload, (value) =>
    supabase.from(table).update(value).eq("id", id).select().single(),
  );
}
