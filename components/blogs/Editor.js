// src/components/Editor.js
"use client";
import { useState, useEffect } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { TRANSFORMERS } from "@lexical/markdown";
import ToolbarPlugin from './ToolbarPlugin';

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HashtagNode } from "@lexical/hashtag";

export const editorConfig = {
    namespace: "PlaygroundEditor",
    nodes: [
        HeadingNode, QuoteNode, ListNode, ListItemNode,
        TableNode, TableCellNode, TableRowNode,
        CodeNode, CodeHighlightNode, LinkNode, AutoLinkNode,
        HorizontalRuleNode, HashtagNode
    ],
    onError: (error) => console.error(error),
    theme: {
        paragraph: "mb-2",
        text: { bold: "font-bold", italic: "italic", underline: "underline" },
        list: { ul: "list-disc ml-5", ol: "list-decimal ml-5" },
        heading: { h1: "text-3xl font-bold", h2: "text-2xl font-semibold" }
    }
};

export default function Editor() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="p-4 border">Loading...</div>;

    return (
        <div className="mx-auto container mt-15 max-w-5xl border rounded-lg shadow-sm overflow-hidden">
            <LexicalComposer initialConfig={editorConfig}>
                <ToolbarPlugin />
                <div className="relative">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="min-h-[400px] p-4 outline-none focus:ring-1 ring-blue-100" />}
                        placeholder={<div className="absolute top-4 left-4 text-gray-400 pointer-events-none">Start writing...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <TablePlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                </div>
            </LexicalComposer>
        </div>
    );
}