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
        this.dataGrid.commands.register([{
            id: 'undo',
            source: 'HistoryPlugin',
            type: 'history',
            label: 'Undo',
            execute: this.handleUndo,
        }, {
            id: 'redo',
            source: 'HistoryPlugin',
            type: 'history',
            label: 'Redo',
            execute: this.handleRedo,
        }]);
        this.dataGrid.keyBindings.add(this, {
            'undo': '$mod+Z',
            'redo': '$mod+Y',
        });

        this.unsubscribes.push(() => {
            this.dataGrid.commands.unregisterAll(this.toString());
            this.dataGrid.keyBindings.removeAll(this.toString());
        });
    };
}
