import { type DataGridPluginOptions } from '../../host';
import type { RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
export interface StayInViewPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class StayInViewPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, StayInViewPluginOptions> {
    private handleActionExecuted = ({ id }: { id: string; }) => {
        let cellId = this.dataGrid.state.activeCell.value?.id;

        const isExpandSelected = ['expandUpper', 'expandLower', 'expandRight', 'expandLeft'].includes(id);
        if (isExpandSelected) {
            cellId = this.dataGrid.state.selectedRanges.value[0].end;
        }

        if (!cellId) {
            return;
        }

        const scrollDelta = this.dataGrid.layout.calculateCellScrollOffsets(cellId);

        if (!scrollDelta) {
            return;
        }

        this.scrollArea!.scrollTo({
            left: scrollDelta.left,
            top: scrollDelta.top,
            behavior: this.options.scrollBehavior || 'smooth',
        });
    };

    public handleActivate = () => {
        this.dataGrid.events.addListener('command-executed', this.handleActionExecuted);
        this.unsubscribes.push(() => {
            this.dataGrid.events.removeListener('command-executed', this.handleActionExecuted);
        });
    };
}
