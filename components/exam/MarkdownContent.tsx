import DOMPurify from "dompurify";
import { marked } from "marked";
import React, { memo, useEffect, useState } from "react";

const MarkdownContent = memo(({ content }: { content: string | Promise<string> }) => {
    const [resolvedContent, setResolvedContent] = useState<string>('Loading...');

    useEffect(() => {
        if (typeof content === 'string') {
            setResolvedContent(content);
        } else if (content instanceof Promise) {
            content.then(setResolvedContent).catch(() => setResolvedContent('Error loading content'));
        }
    }, [content]);

    return <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(resolvedContent || '')) }}></div>;
});

export default MarkdownContent;
