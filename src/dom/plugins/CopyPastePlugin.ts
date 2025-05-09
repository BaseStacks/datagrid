import { extractCellId, type DataGridPluginOptions } from '../../host';
import type { RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import { formatCopyData, readClipboard, writeToClipboard } from '../utils/clipboardUtils';

export interface CopyPastePluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class CopyPastePlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CopyPastePluginOptions> {
    private handleCopy = async () => {
        const { selectedRanges } = this.dataGrid.state;
        if (!selectedRanges.value.length) {
            return;
        }

        if (selectedRanges.value.length !== 1) {
            console.warn('Only one range is supported for copy operation.');
            return;
        }

        const range = selectedRanges.value[0];
        const rowDataMap = new Map<number, string[]>();

        for (const [cellId] of range.cells) {
            const { rowIndex, columnIndex } = extractCellId(cellId);

            const rowData = rowDataMap.get(rowIndex) ?? [];
            const column = this.dataGrid.state.headers.value[columnIndex]?.column;
            const cellData = this.dataGrid.options.data[rowIndex][column.key];
            rowData[columnIndex] = cellData ?? null;

            rowDataMap.set(rowIndex, rowData);
        }

        const clipboardData: string[][] = [];
        for (const rowData of rowDataMap.values()) {
            clipboardData.push(rowData.filter((cellData) => cellData !== undefined));
        }

        const { textHtml, textPlain } = formatCopyData(clipboardData);

        await writeToClipboard(textPlain, textHtml);
    };

    private handlePaste = async () => {
        const clipboardData = await readClipboard();
        this.dataGrid.modifier.applyPasteData(clipboardData);
    };

    private handleCut = () => {
        const { activeCell } = this.dataGrid.state;
    };

    public handleActivate = () => {
        this.dataGrid.keyBindings.add(this, {
            'copy': '$mod+C',
            'cut': '$mod+X',
            'paste': '$mod+V',
        }, {
            'copy': this.handleCopy,
            'cut': this.handleCut,
            'paste': this.handlePaste,
        });

        this.unsubscribes.push(() => {
            this.dataGrid.keyBindings.remove(this);
        });
    };
}
