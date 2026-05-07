"use client";

import type { Document } from "@/lib/types";
import { EditorShell } from "@/components/editor/EditorShell";

export function DocumentEditorClient({ document }: { document: Document }) {
  return <EditorShell document={document} />;
}
