import { type DataGridPluginOptions } from '../../host';
import type { RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';

export interface HistoryPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class HistoryPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, HistoryPluginOptions> {

    private handleUndo = () => {
        this.dataGrid.history.undo();
    };

    private handleRedo = () => {
        this.dataGrid.history.redo();
    };

    public handleActivate = () => {
        this.dataGrid.keyBindings.add(this, {
            'undo': '$mod+Z',
            'redo': '$mod+Y',
        }, {
            'undo': this.handleUndo,
            'redo': this.handleRedo
        });

        this.unsubscribes.push(() => {
            this.dataGrid.keyBindings.remove(this);
        });
    };
}
