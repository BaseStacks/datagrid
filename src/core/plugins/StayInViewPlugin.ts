import { DataGridPlugin, type DataGridPluginOptions } from '../instances/atomic/DataGridPlugin';
export interface StayInViewPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class StayInViewPlugin extends DataGridPlugin<StayInViewPluginOptions> {
    private get scrollArea() {
        return this.dataGrid.layout.scrollAreaState.value!;
    }

    public handleActivate = () => {
        const actionExecListener = this.dataGrid.events.addListener('execute-action', ({ action }) => {
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
        });

        this.unsubscribes.push(actionExecListener);
    };
}
