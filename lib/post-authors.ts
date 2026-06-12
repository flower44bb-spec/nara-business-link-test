import { supabase } from "@/lib/supabase";
import type { PostAuthor } from "@/types";

export async function fetchPostAuthors(userIds: Array<string | null | undefined>) {
  const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return new Map<string, PostAuthor>();

  const { data, error } = await supabase.rpc("get_post_authors", {
    author_ids: ids,
  });
  if (error) throw error;

  return new Map(
    ((data as PostAuthor[] | null) ?? []).map((author) => [author.id, author]),
  );
}
