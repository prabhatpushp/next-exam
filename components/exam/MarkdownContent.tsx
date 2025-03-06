import DOMPurify from "dompurify";
import { marked } from "marked";
import React, { memo, useEffect, useState } from "react";

const MarkdownContent = memo(({ content }: { content: string }) => {
    const [parsedHtml, setParsedHtml] = useState<string>("");

    useEffect(() => {
        // Make sure we're working with strings at this point
        const htmlContent = marked.parse(content || "");

        // Ensure we're passing a string to DOMPurify
        if (typeof htmlContent === "string") {
            setParsedHtml(DOMPurify.sanitize(htmlContent));
        }
    }, [content]);

    return <div className="prose max-w-full" dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
});

export default MarkdownContent;
