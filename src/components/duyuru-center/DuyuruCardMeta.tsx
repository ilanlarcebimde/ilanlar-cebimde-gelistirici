import { formatDateTR } from "./helpers";
import { DuyuruPost } from "./types";

type DuyuruCardMetaProps = {
  post: DuyuruPost;
  compact?: boolean;
};

export function DuyuruCardMeta({ post, compact = false }: DuyuruCardMetaProps) {
  const source = post.source_name?.trim() || "Resmi kaynak";

  return (
    <div className={compact ? "min-w-0 text-xs text-slate-500" : "text-xs text-slate-500"}>
      <p>{formatDateTR(post.published_at)}</p>
      <p className={compact ? "mt-1 truncate font-medium text-slate-600" : "mt-1 font-medium text-slate-600"}>{source}</p>
    </div>
  );
}
