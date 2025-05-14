import { createCellId, extractCellId, type DataGridPluginOptions } from '../../host';
import type { CellId, RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import { getRect } from '../utils/domRectUtils';

export interface CellFillPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

interface FillRange {
    readonly start: CellId;
    readonly end: CellId;
}

export class CellFillPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CellFillPluginOptions> {
    private _fill: boolean = false;
    private _fillRange: FillRange | null = null;

    private get fillHandler() {
        return this.dataGrid.layout.getNode('fillHandler');
    }

    private hideFillHandler = () => {
        if (!this.fillHandler) {
            return;
        }

        this.dataGrid.layout.updateNode('fillHandler', {
            visible: false,
        });
    };

    private setHandlerOffset = (cellId: CellId) => {
        const cellNode = this.dataGrid.layout.getNode(cellId);
        if (!cellNode) {
            return;
        }

        const fillHandlerNode = this.dataGrid.layout.getNode('fillHandler');
        if (!fillHandlerNode) {
            return;
        }

        const cellRect = getRect(this.scrollArea!, cellNode.element);

        this.dataGrid.layout.updateNode('fillHandler', {
            visible: true,
        });

        const handlerWidth = fillHandlerNode.element.offsetHeight;
        const handlerHeight = fillHandlerNode.element.offsetHeight;

        const scrollTop = (cellNode.pinned?.side === 'top' || cellNode.pinned?.side === 'bottom') ? 0 : this.scrollArea!.scrollTop;
        
        this.dataGrid.layout.updateNode('fillHandler', {
            offset: {
                left: cellRect.left + cellRect.width - handlerWidth + this.scrollArea!.scrollLeft,
                top: cellRect.top + cellRect.height - handlerHeight + scrollTop
            }
        });
    };

    private startFill = (event: MouseEvent) => {
        const range = this.dataGrid.state.selectedRanges.value[0];
        if (!range) {
            return;
        }

        this._fill = true;

        event.preventDefault();
        event.stopPropagation();
    };

    private moveFill = (event: MouseEvent) => {
        event.preventDefault();
        if (!this._fill) {
            return;
        }

        const selectedRange = this.dataGrid.state.selectedRanges.value[0]!;
        const overCell = this.dataGrid.layout.getNodeByElement(event.target as HTMLElement);
        if (!overCell) {
            return;
        }

        const {
            rowIndex: selectedMinRow,
            columnIndex: selectedMinColumn,
        } = extractCellId(selectedRange.start);

        const {
            rowIndex: selectedMaxRow,
            columnIndex: selectedMaxColumn,
        } = extractCellId(selectedRange.end);

        const {
            rowIndex: overRow,
            columnIndex: overColumn,
        } = extractCellId(overCell.id as CellId);

        const isDraggingDown = overRow > selectedMaxRow;
        const isDraggingUp = overRow < selectedMinRow;
        const isDraggingRight = overColumn > selectedMaxColumn;
        const isDraggingLeft = overColumn < selectedMinColumn;

        let fillRangeStart: CellId | null = null;
        let fillRangeEnd: CellId | null = null;

        if (isDraggingDown) {
            fillRangeStart = createCellId({ rowIndex: selectedMaxRow + 1, columnIndex: selectedMinColumn });
            fillRangeEnd = createCellId({ rowIndex: overRow, columnIndex: selectedMaxColumn });
        }
        else if (isDraggingUp) {
            fillRangeStart = createCellId({ rowIndex: selectedMinRow - 1, columnIndex: selectedMinColumn });
            fillRangeEnd = createCellId({ rowIndex: overRow, columnIndex: selectedMaxColumn });
        }
        else if (isDraggingRight) {
            fillRangeStart = createCellId({ rowIndex: selectedMinRow, columnIndex: selectedMaxColumn + 1 });
            fillRangeEnd = createCellId({ rowIndex: selectedMaxRow, columnIndex: overColumn });
        }
        else if (isDraggingLeft) {
            fillRangeStart = createCellId({ rowIndex: selectedMinRow, columnIndex: selectedMinColumn });
            fillRangeEnd = createCellId({ rowIndex: overRow, columnIndex: selectedMinColumn - 1 });
        }
        else {
            this.dataGrid.layout.updateNode('fillRange', {
                visible: false,
            });
            this._fillRange = null;
            return;
        }

        if (!fillRangeStart || !fillRangeEnd) {
            return;
        }

        const fillRangeStartCell = this.dataGrid.layout.getNode(fillRangeStart)!;
        const fillRangeEndCell = this.dataGrid.layout.getNode(fillRangeEnd)!;

        if (!fillRangeStartCell || !fillRangeEndCell) {
            return;
        }

        const fillRect = getRect(this.scrollArea!, fillRangeStartCell.element, fillRangeEndCell.element);

        this.dataGrid.layout.updateNode('fillRange', {
            visible: true,
            offset: {
                left: fillRect.left + this.scrollArea!.scrollLeft,
                top: fillRect.top + this.scrollArea!.scrollTop,
            },
            size: {
                width: fillRect.width,
                height: fillRect.height,
            }
        });

        this._fillRange = {
            start: fillRangeStart,
            end: fillRangeEnd,
        };
    };

    private endFill = (event: MouseEvent) => {
        if (!this._fill || !this._fillRange) {
            return;
        }

        // Clean
        this.dataGrid.layout.updateNode('fillRange', {
            visible: false
        });
        this._fill = false;

        this.dataGrid.selection.selectRange(this._fillRange!.start, this._fillRange!.end);
        event.preventDefault();
    };

    public handleActivate = () => {
        const unwatchFillHandler = this.dataGrid.layout.layoutNodesState.watchItem('fillHandler', ({ operation, item }) => {
            if (!item) {
                return;
            }

            if (operation === 'remove') {
                item.element.removeEventListener('mousedown', this.startFill);
                return;
            }

            item.element.addEventListener('mousedown', this.startFill);
        });

        const unwatchRanges = this.dataGrid.state.selectedRanges.watch((ranges) => {
            if (ranges.length != 1) {
                this.hideFillHandler();
                return;
            }

            const range = ranges[0];
            const endCell = range.end;
            this.setHandlerOffset(endCell);
        });

        const unwatchCells = this.dataGrid.layout.layoutNodesState.watchItems(({ operation, item }) => {
            if (item?.type !== 'cell') {
                return;
            }

            if (operation === 'remove') {
                item.element.removeEventListener('mouseenter', this.moveFill);
                return;
            }

            item.element.addEventListener('mouseenter', this.moveFill);
        });

        document.addEventListener('mouseup', this.endFill);

        this.unsubscribes.push(() => {
            unwatchFillHandler();
            unwatchRanges();
            unwatchCells();
            document.removeEventListener('mouseup', this.endFill);
        });
    };
}
