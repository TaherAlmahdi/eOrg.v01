import { compileMDX } from "next-mdx-remote/rsc";

function normalizeHtml(source: string): string {
  return source
    // HTML → React
    .replace(/\bclass=/gi, "className=")
    .replace(/\bfor=/gi, "htmlFor=")

    // Optional legacy attributes
    .replace(/\btabindex=/gi, "tabIndex=")
    .replace(/\breadonly=/gi, "readOnly=")
    .replace(/\bmaxlength=/gi, "maxLength=")
    .replace(/\bcellpadding=/gi, "cellPadding=")
    .replace(/\bcellspacing=/gi, "cellSpacing=")
    .replace(/\bcolspan=/gi, "colSpan=")
    .replace(/\browspan=/gi, "rowSpan=");
}

export async function compileLibraryMDX<T = Record<string, unknown>>(
  source: string,
  components = {}
) {
  const normalized = normalizeHtml(source);

  return compileMDX<T>({
    source: normalized,
    options: {
      parseFrontmatter: true,
    },
    components,
  });
}