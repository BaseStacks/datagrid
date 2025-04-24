import { DataGridPlugin, type DataGridPluginOptions } from '../instances/atomic/DataGridPlugin';
import type { DataGridEventTypes } from '../types';
export interface StayInViewPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class StayInViewPlugin extends DataGridPlugin<StayInViewPluginOptions> {
    private handleActionExecuted = ({ action }: DataGridEventTypes['action-executed']) => {
        let cellId = this.dataGrid.state.activeCell.value?.id;

        const isExpandSelected = ['expandUpper', 'expandLower', 'expandRight', 'expandLeft'].includes(action);
        if (isExpandSelected) {
            cellId = this.dataGrid.state.selectedRanges.value[0].end;
        }

        if (!cellId) {
            return;
        }

        const scrollDelta = this.dataGrid.layout.calculateScrollToCell(cellId);

        if (!scrollDelta) {
            return;
        }

        this.scrollArea.scrollTo({
            left: scrollDelta.left,
            top: scrollDelta.top,
            behavior: 'smooth',
        });
    };

    public handleActivate = () => {
        this.dataGrid.events.addListener('action-executed', this.handleActionExecuted);
        this.unsubscribes.push(() => this.dataGrid.events.removeListener('action-executed', this.handleActionExecuted));
    };
}
