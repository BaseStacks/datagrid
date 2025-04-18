// import type { DataGrid } from '../instances/DataGrid';
// import type { RowData, DataGridPlugin, DataGridPluginOptions } from '../types';

// interface CellSelectionPluginOptions extends DataGridPluginOptions {
// }

// export class CellEditablePlugin<TRow extends RowData> implements DataGridPlugin<CellSelectionPluginOptions> {
//     private dataGrid: DataGrid<TRow>;
    
//     private get container() {
//         return this.dataGrid.layout.containerState.value;
//     }

//     private startFocus = (event: MouseEvent) => {
//         const { activeCell, editing } = this.dataGrid.state;
//         const { cleanSelection } = this.dataGrid.selection;
//         const clickOutside = !this.container?.contains(event.target as Node);
//         if (clickOutside) {
//             cleanSelection();
//             return;
//         }

//         const rectInfo = this.dataGrid.layout.getIntersectionRect(event);
//         if (rectInfo?.cell.isActive) {
//             return;
//         }

//         if (activeCell.value) {
//             cleanSelection({ maintainActiveCell: true });
//             editing.set(true);
//             event.preventDefault();
//         }
//     };

//     constructor(dataGrid: DataGrid<TRow>) {
//         this.dataGrid = dataGrid;
//     }

//     public active: boolean = false;

//     public activate = (_opts: CellSelectionPluginOptions) => {
//         // Implementation of the activate method
//     };

//     public deactivate = () => {
//         // Implementation of the deactivate method
//     };
// };
