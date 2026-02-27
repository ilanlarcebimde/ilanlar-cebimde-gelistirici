import { Mark, mergeAttributes } from "@tiptap/core";

/** Küçük metin için <small> mark. Inline style yok. */
export const Small = Mark.create({
  name: "small",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  parseHTML() {
    return [{ tag: "small" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["small", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});
