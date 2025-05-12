import { extractCellId, type DataGridPluginOptions } from '../../host';
import type { RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import { formatCopyData, readClipboard, writeToClipboard } from '../utils/clipboardUtils';

export interface CopyPastePluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class CopyPastePlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CopyPastePluginOptions> {
    private getRange = () => {
        const { selectedRanges } = this.dataGrid.state;
        if (!selectedRanges.value.length) {
            return null;
        }

        if (selectedRanges.value.length !== 1) {
            throw new Error('Only one range is supported for copy operation.');
        }

        const range = selectedRanges.value[0];

        return range;
    };

    private handleCopy = async () => {
        const range = this.getRange();
        if (!range) {
            return;
        }
        const clipboardData = this.dataGrid.helper.getRangeData(range);
        const { textHtml, textPlain } = formatCopyData(clipboardData);
        await writeToClipboard(textPlain, textHtml);
    };

    private handlePaste = async () => {
        const clipboardData = await readClipboard();
        this.dataGrid.modifier.applyPasteData(clipboardData);
    };

    private handleCut = async () => {
        const range = this.getRange();
        if (!range) {
            return;
        }
        const clipboardData = this.dataGrid.helper.getRangeData(range);
        const { textHtml, textPlain } = formatCopyData(clipboardData);
        await writeToClipboard(textPlain, textHtml);
        this.dataGrid.modifier.emptyRange(range);
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
