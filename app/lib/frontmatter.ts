// Frontmatter is author-written YAML, so its shape is untyped by nature.
// This is the single place where `any` is allowed for it.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type FrontmatterData = Record<string, any>;
export type FrontmatterValue = any;
