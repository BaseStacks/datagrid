import { type DataGridPluginOptions } from '../../host';
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
        const range = this.getRange();
        if (!range) {
            return;
        }

        this.dataGrid.modifier.setRangeData(range, clipboardData);
    };

    private handleCut = async () => {
        const range = this.getRange();
        if (!range) {
            return;
        }
        const clipboardData = this.dataGrid.helper.getRangeData(range);
        const { textHtml, textPlain } = formatCopyData(clipboardData);
        await writeToClipboard(textPlain, textHtml);
        await this.dataGrid.modifier.emptyRange(range);
    };


    public handleActivate = () => {
        this.dataGrid.commands.register([{
            id: 'copy',
            source: 'CopyPastePlugin',
            type: 'copy',
            label: 'Copy',
            execute: this.handleCopy,
        }, {
            id: 'cut',
            source: 'CopyPastePlugin',
            type: 'cut',
            label: 'Cut',
            execute: this.handleCut,
        }, {
            id: 'paste',
            source: 'CopyPastePlugin',
            type: 'paste',
            label: 'Paste',
            execute: this.handlePaste,
        }]);

        this.dataGrid.keyBindings.add(this, {
            'copy': '$mod+C',
            'cut': '$mod+X',
            'paste': '$mod+V',
        });

        this.unsubscribes.push(() => {
            this.dataGrid.commands.unregisterAll(this.constructor.name);
            this.dataGrid.keyBindings.removeAll(this.constructor.name);
        });
    };
}
