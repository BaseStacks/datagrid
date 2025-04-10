import React from 'react';
import ShikiHighlighter, { ShikiHighlighterProps } from 'react-shiki';

interface CodeBlockProps extends Omit<ShikiHighlighterProps, 'theme'> {
    readonly title?: string;
}

export function CodeBlock(props: React.PropsWithChildren<CodeBlockProps>) {
    const {
        title,
        language,
        ...rest
    } = props;

    return (
        <div className="rounded-xl p-1 text-sm scheme-dark in-data-stack:rounded-none dark:bg-white/5 dark:inset-ring dark:inset-ring-white/10 in-data-stack:dark:inset-ring-0">
            <div className="px-3 pt-0.5 pb-1.5 text-xs/5 text-gray-400 dark:text-white/50">{title ?? (language as string)}</div>
            <ShikiHighlighter
                theme="github-dark"
                language={language}
                showLanguage={false}
                as="div"
                className="background-color:transparent;color:var(--color-slate-50)"
                {...rest}
            />
        </div>
    );
}
