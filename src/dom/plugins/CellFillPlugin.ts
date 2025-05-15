import { createCellId, extractCellId, getMaxCellId, getMinCellId, getQuadCorners, type DataGridPluginOptions } from '../../host';
import type { CellId, RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import type { DataGridCellNode } from '../cores/DataGridLayout';
import { getRect } from '../utils/domRectUtils';

export interface CellFillPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

interface FillRange {
    readonly start: CellId;
    readonly end: CellId;
}

interface FillOffset {
    readonly pinnedHorizontal: boolean;
    readonly pinnedVertical: boolean;
    readonly baseLeft: number;
    readonly baseTop: number;
    readonly baseScrollLeft: number;
    readonly baseScrollTop: number;
}

export class CellFillPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CellFillPluginOptions> {
    private _fill: boolean = false;
    private _fillOffset: FillOffset | null = null;
    private _fillRange: FillRange | null = null;

    private get fillHandle() {
        return this.dataGrid.layout.getNode('fillHandle');
    }

    private hideFillHandle = () => {
        if (!this.fillHandle) {
            return;
        }

        this.dataGrid.layout.updateNode('fillHandle', {
            visible: false,
        });
    };

    private setHandleOffset = (cellId: CellId) => {
        const cellNode = this.dataGrid.layout.getNode(cellId) as DataGridCellNode;
        if (!cellNode) {
            return;
        }

        const fillHandleNode = this.dataGrid.layout.getNode('fillHandle');
        if (!fillHandleNode) {
            return;
        }

        const cellRect = getRect(this.scrollArea!, cellNode.element);

        this.dataGrid.layout.updateNode('fillHandle', {
            visible: true,
        });

        const handlerWidth = fillHandleNode.element.offsetHeight;
        const handlerHeight = fillHandleNode.element.offsetHeight;

        const baseLeft = cellRect.left + cellRect.width - handlerWidth;
        const baseTop = cellRect.top + cellRect.height - handlerHeight;

        this.dataGrid.layout.updateNode('fillHandle', {
            offset: {
                left: baseLeft + this.scrollArea!.scrollLeft,
                top: baseTop + this.scrollArea!.scrollTop,
            }
        });

        const rowNode = this.dataGrid.layout.getNode(cellNode.rowId)!;

        this._fillOffset = {
            pinnedHorizontal: cellNode.pinned?.side === 'left' || cellNode.pinned?.side === 'right',
            pinnedVertical: rowNode.pinned?.side === 'top' || rowNode.pinned?.side === 'bottom',
            baseLeft: baseLeft,
            baseTop: baseTop,
            baseScrollLeft: this.scrollArea!.scrollLeft,
            baseScrollTop: this.scrollArea!.scrollTop
        };
    };

    private updateHandleOffset = () => {
        if (!this._fillOffset) {
            return;
        }

        const { pinnedHorizontal, pinnedVertical, baseLeft, baseTop, baseScrollLeft, baseScrollTop } = this._fillOffset;

        this.dataGrid.layout.updateNode('fillHandle', {
            offset: {
                left: pinnedHorizontal ? baseLeft + this.scrollArea!.scrollLeft : baseLeft + baseScrollLeft,
                top: pinnedVertical ? baseTop + this.scrollArea!.scrollTop : baseTop + baseScrollTop
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
            start: fillRangeStart <= fillRangeEnd ? fillRangeStart : fillRangeEnd,
            end: fillRangeStart >= fillRangeEnd ? fillRangeStart : fillRangeEnd,
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
        this.dataGrid.layout.updateNode('fillHandle', {
            visible: false
        });

        const selectedRange = this.dataGrid.state.selectedRanges.value[0];

        this.dataGrid.modifier.cloneRangeData(selectedRange, this._fillRange);

        const {
            topLeft: selectedTopLeft,
            bottomRight: selectedBottomRight,
        } = getQuadCorners(selectedRange.start, selectedRange.end);
        const {
            topLeft: fillTopLeft,
            bottomRight: fillBottomRight,
        } = getQuadCorners(this._fillRange.start, this._fillRange.end);

        this.dataGrid.selection.selectRange(
            getMinCellId(selectedTopLeft, fillTopLeft),
            getMaxCellId(selectedBottomRight, fillBottomRight)
        );

        this._fill = false;
        this._fillRange = null;
        this._fillOffset = null;

        event.preventDefault();
    };

    public handleActivate = () => {
        const unwatchFillHandle = this.dataGrid.layout.layoutNodesState.watchItem('fillHandle', ({ operation, item }) => {
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
                this.hideFillHandle();
                return;
            }

            const range = ranges[0];

            const cells = Array.from(range.cells.keys());
            const cellId = cells[cells.length - 1];
            this.setHandleOffset(cellId);
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

        this.scrollArea!.addEventListener('scroll', this.updateHandleOffset);
        document.addEventListener('mouseup', this.endFill);

        this.unsubscribes.push(() => {
            unwatchFillHandle();
            unwatchRanges();
            unwatchCells();
            this.scrollArea!.removeEventListener('scroll', this.updateHandleOffset);
            document.removeEventListener('mouseup', this.endFill);
        });
    };
}
