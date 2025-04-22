import type { DataGrid } from '../instances/DataGrid';
import type { RowData, DataGridPlugin, DataGridPluginOptions } from '../types';

export interface StayInViewPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

export class StayInViewPlugin<TRow extends RowData = RowData> implements DataGridPlugin<StayInViewPluginOptions> {
    private get scrollArea() {
        return this.dataGrid.layout.scrollAreaState.value!;
    }

    private doActivate = () => {
        this.active = true;

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

    constructor(dataGrid: DataGrid<TRow>) {
        this.dataGrid = dataGrid;
    }

    public readonly dataGrid: DataGrid<TRow>;
    public unsubscribes: (() => void)[] = [];
    public options: StayInViewPluginOptions = {};
    public active: boolean = false;

    public activate = (_opts?: StayInViewPluginOptions) => {
        this.options = {...this.options, ..._opts};

        this.dataGrid.layout.containerState.watch((container) => {
            if (this.active) {
                this.deactivate();
            }

            if (!container) {
                return;
            }

            this.doActivate();
        });
    };

    public deactivate = () => {
        if (!this.active) {
            return;
        }

        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];
    };
}
