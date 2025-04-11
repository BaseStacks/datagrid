import React, { useEffect } from 'react';
import { transformerNotationHighlight } from '@shikijs/transformers';
import {
    codeToHtml,
} from 'shiki';

interface CodeBlockProps {
    readonly example?: React.ReactNode;
    readonly code?: string;
}

export function ExampleBlock(props: CodeBlockProps) {
    const {
        example,
        code,
    } = props;

    const [highlightedCode, setHighlightedCode] = React.useState<string>('');

    useEffect(() => {
        if (code) {
            codeToHtml(code ?? '', {
                lang: 'tsx',
                theme: 'github-dark',
                transformers: [
                    transformerNotationHighlight({
                        classActiveLine: 'line relative bg-blue-300/15',
                    }),
                ],
            }).then((html) => {
                setHighlightedCode(html);
            });
        }
    }, [code]);

    return (
        <div className="not-prose isolate">
            <figure className="flex flex-col gap-1 rounded-xl bg-gray-950/5 p-1 inset-ring inset-ring-gray-950/5 dark:bg-white/10 dark:inset-ring-white/10">
                <div className="not-prose overflow-auto rounded-lg bg-white outline outline-white/5 dark:bg-gray-950/50">
                    <div className="my-8 overflow-hidden">
                        {example}
                    </div>
                </div>
                <div className="rounded-xl bg-gray-950 in-data-stack:mt-0 in-data-stack:rounded-none in-[figure]:-mx-1 in-[figure]:-mb-1 in-data-stack:[:first-child>&]:rounded-t-xl in-data-stack:[:first-child>&]:*:rounded-t-xl in-data-stack:[:last-child>&]:rounded-b-xl in-data-stack:[:last-child>&]:*:rounded-b-xl">
                    <div className="rounded-xl p-1 text-sm scheme-dark in-data-stack:rounded-none dark:bg-white/5 dark:inset-ring dark:inset-ring-white/10 in-data-stack:dark:inset-ring-0 not-prose">
                        <div
                            className="*:flex *:*:max-w-none *:*:shrink-0 *:*:grow *:overflow-auto *:rounded-lg *:bg-white/10! *:p-5 dark:*:bg-white/5! **:[.line]:isolate **:[.line]:not-last:min-h-[1lh] *:inset-ring *:inset-ring-white/10 dark:*:inset-ring-white/5"
                            dangerouslySetInnerHTML={{ __html: highlightedCode }}
                        />
                    </div>
                </div>
            </figure>
        </div>
    );
}
