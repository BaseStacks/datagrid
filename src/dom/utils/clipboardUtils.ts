const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : { parseFromString: () => null as unknown as Document };

export const parseDom = (html: string): Document => {
    return parser.parseFromString(html, 'text/html');
};

export const parseTextHtmlData = (data: string): string[][] => {
    const doc = parseDom(data.replace(/<br\/?>/g, '\n'));
    const table = doc.getElementsByTagName('table')[0];

    if (table) {
        const rows: string[][] = [];

        for (let i = 0; i < table.rows.length; i++) {
            const row: string[] = [];
            rows.push(row);

            for (let j = 0; j < table.rows[i].cells.length; j++) {
                row.push(table.rows[i].cells[j].textContent ?? '');
            }
        }

        return rows;
    }

    const span = doc.getElementsByTagName('span')[0];

    if (span) {
        return [[span.textContent ?? '']];
    }

    return [['']];
};

export const parseTextPlainData = (data: string): string[][] => {
    const cleanData = data.replace(/\r|\n$/g, '');
    const output: string[][] = [[]];
    let cursor = 0;
    let startCell = 0;
    let quoted = false;
    let lastRowIndex = 0;

    const saveCell = () => {
        let str = cleanData.slice(startCell, cursor);
        if (str[0] === '"' && str[str.length - 1] === '"') {
            quoted = true;
        }

        if (quoted && str[str.length - 1] === '"' && str.includes('\n')) {
            str = str.slice(1, str.length - 1).replace(/""/g, '"');
            quoted = false;
        }

        if (quoted && str[str.length - 1] !== '"') {
            str.split('\n').forEach((cell, i, { length }) => {
                output[lastRowIndex].push(cell);

                if (i < length - 1) {
                    output.push([]);
                    lastRowIndex++;
                }
            });
        } else {
            output[lastRowIndex].push(str);
        }
    };

    while (cursor < cleanData.length) {
        if (
            quoted &&
            cleanData[cursor] === '"' &&
            ![undefined, '\t', '"'].includes(cleanData[cursor + 1])
        ) {
            quoted = false;
        }

        if (quoted && cleanData[cursor] === '"' && cleanData[cursor + 1] === '"') {
            cursor++;
        }

        if (cursor === startCell && cleanData[cursor] === '"') {
            quoted = true;
        }

        if (cleanData[cursor] === '\t') {
            saveCell();
            startCell = cursor + 1;
            quoted = false;
        }

        if (cleanData[cursor] === '\n' && !quoted) {
            saveCell();
            output.push([]);
            startCell = cursor + 1;
            lastRowIndex++;
        }

        cursor++;
    }

    saveCell();

    return output;
};

export const encodeHtml = (str: string) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

export const isPrintableUnicode = (str: string): boolean => {
    return str.match(/^[^\x00-\x20\x7F-\x9F]$/) !== null;
};

// Format copy data as plain text and HTML
export const formatCopyData = (
    copyData: Array<Array<number | string | null>>
): { textPlain: string; textHtml: string } => {
    const textPlain = copyData.map((row) => row.join('\t')).join('\n');
    const textHtml = `<table>${copyData
        .map(
            (row) =>
                `<tr>${row
                    .map(
                        (cell) =>
                            `<td>${encodeHtml(String(cell ?? '')).replace(
                                /\n/g,
                                '<br/>'
                            )}</td>`
                    )
                    .join('')}</tr>`
        )
        .join('')}</table>`;

    return { textPlain, textHtml };
};

export const readClipboard = async (): Promise<string[][]> => {
    if (navigator.clipboard.read !== undefined) {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                let pasteData = [['']];

                if (item.types.includes('text/html')) {
                    const htmlTextData = await item.getType('text/html');
                    pasteData = parseTextHtmlData(await htmlTextData.text());
                    return pasteData;
                } else if (item.types.includes('text/plain')) {
                    const plainTextData = await item.getType('text/plain');
                    pasteData = parseTextPlainData(await plainTextData.text());
                    return pasteData;
                } else if (item.types.includes('text')) {
                    const htmlTextData = await item.getType('text');
                    pasteData = parseTextHtmlData(await htmlTextData.text());
                    return pasteData;
                }

                return pasteData;
            }
        } catch (error) {
            console.error('Failed to read clipboard contents', error);
        }
    } else if (navigator.clipboard.readText !== undefined) {
        try {
            const text = await navigator.clipboard.readText();
            return parseTextPlainData(text);
        } catch (error) {
            console.error('Failed to read clipboard text', error);
        }
    }

    return [['']];
};

// Handle clipboard operations
export const writeToClipboard = async (
    textPlain: string,
    textHtml: string,
    event?: ClipboardEvent
): Promise<boolean> => {
    if (event !== undefined) {
        event.clipboardData?.setData('text/plain', textPlain);
        event.clipboardData?.setData('text/html', textHtml);
        event.preventDefault();
        return true;
    }

    try {
        if (navigator.clipboard.write !== undefined) {
            const textBlob = new Blob([textPlain], { type: 'text/plain' });
            const htmlBlob = new Blob([textHtml], { type: 'text/html' });
            const clipboardData = [
                new ClipboardItem({
                    'text/plain': textBlob,
                    'text/html': htmlBlob,
                }),
            ];
            await navigator.clipboard.write(clipboardData);
            return true;
        } else if (navigator.clipboard.writeText !== undefined) {
            await navigator.clipboard.writeText(textPlain);
            return true;
        } else if (document.execCommand !== undefined) {
            return document.execCommand('copy');
        }
        return false;
    } catch (error) {
        console.error('Failed to write to clipboard:', error);
        return false;
    }
};
