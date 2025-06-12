import { createCellId, extractCellId, getMaxCellId, getMinCellId, getQuadCorners, type DataGridPluginOptions, type CellId, type RowData } from '../../host';
import { DataGridDomPlugin } from '../atomic/DataGridDomPlugin';
import type { DataGridCellNode } from '../cores/DataGridLayout';
import { getRect } from '../utils/domRectUtils';

export interface CellFillPluginOptions extends DataGridPluginOptions {
    readonly scrollBehavior?: ScrollBehavior;
}

/**
 * Represents the direction of a fill operation
 */
enum FillDirection {
    DOWN = 'down',
    UP = 'up',
    RIGHT = 'right',
    LEFT = 'left',
    NONE = 'none'
}

/**
 * Represents a range of cells to be filled
 */
interface FillRange {
    readonly start: CellId;
    readonly end: CellId;
}

/**
 * Represents the offset information for the fill handle
 */
interface FillOffset {
    readonly pinnedHorizontal: boolean;
    readonly pinnedVertical: boolean;
    readonly baseLeft: number;
    readonly baseTop: number;
    readonly baseScrollLeft: number;
    readonly baseScrollTop: number;
}

/**
 * Configuration for fill range calculation
 */
interface FillRangeConfig {
    readonly selectedMinRow: number;
    readonly selectedMaxRow: number;
    readonly selectedMinColumn: number;
    readonly selectedMaxColumn: number;
    readonly overRow: number;
    readonly overColumn: number;
}

/**
 * Plugin for handling cell fill operations (drag to fill cells with data)
 */
export class CellFillPlugin<TRow extends RowData> extends DataGridDomPlugin<TRow, CellFillPluginOptions> {
    private _isFilling: boolean = false;
    private _fillOffset: FillOffset | null = null;
    private _fillRange: FillRange | null = null;

    // #region Getters and Utilities

    private get fillHandle() {
        return this.dataGrid.layout.getNode('fillHandle');
    }

    private get currentSelectedRange() {
        return this.dataGrid.state.selectedRanges.value[0];
    }

    /**
     * Determines the fill direction based on cursor position relative to selected range
     */
    private readonly getFillDirection = (config: FillRangeConfig): FillDirection => {
        const { selectedMinRow, selectedMaxRow, selectedMinColumn, selectedMaxColumn, overRow, overColumn } = config;

        if (overRow > selectedMaxRow) return FillDirection.DOWN;
        if (overRow < selectedMinRow) return FillDirection.UP;
        if (overColumn > selectedMaxColumn) return FillDirection.RIGHT;
        if (overColumn < selectedMinColumn) return FillDirection.LEFT;

        return FillDirection.NONE;
    };

    /**
     * Calculates the fill range based on direction and cursor position
     */
    private readonly calculateFillRange = (direction: FillDirection, config: FillRangeConfig): { start: CellId; end: CellId } | null => {
        const { selectedMinRow, selectedMaxRow, selectedMinColumn, selectedMaxColumn, overRow, overColumn } = config;

        switch (direction) {
            case FillDirection.DOWN:
                return {
                    start: createCellId({ rowIndex: selectedMaxRow + 1, columnIndex: selectedMinColumn }),
                    end: createCellId({ rowIndex: overRow, columnIndex: selectedMaxColumn })
                };

            case FillDirection.UP:
                return {
                    start: createCellId({ rowIndex: overRow, columnIndex: selectedMinColumn }),
                    end: createCellId({ rowIndex: selectedMinRow - 1, columnIndex: selectedMaxColumn })
                };

            case FillDirection.RIGHT:
                return {
                    start: createCellId({ rowIndex: selectedMinRow, columnIndex: selectedMaxColumn + 1 }),
                    end: createCellId({ rowIndex: selectedMaxRow, columnIndex: overColumn })
                };

            case FillDirection.LEFT:
                return {
                    start: createCellId({ rowIndex: selectedMinRow, columnIndex: overColumn }),
                    end: createCellId({ rowIndex: selectedMaxRow, columnIndex: selectedMinColumn - 1 })
                };

            default:
                return null;
        }
    };

    // #endregion

    // #region Fill Handle Management

    /**
     * Hides the fill handle
     */
    private readonly hideFillHandle = (): void => {
        const handle = this.fillHandle;
        if (!handle) {
            return;
        }

        this.dataGrid.layout.updateNode('fillHandle', {
            visible: false,
        });
    };

    /**
     * Sets the position of the fill handle based on the given cell
     */
    private readonly setHandleOffset = (cellId: CellId): void => {
        const cellNode = this.dataGrid.layout.getNode(cellId) as DataGridCellNode;
        const fillHandleNode = this.fillHandle;

        if (!cellNode || !fillHandleNode) {
            return;
        }

        const attributes = this.dataGrid.state.getCellAttributes(cellId);
        if(!attributes || attributes.fillable === false) {
            this.hideFillHandle();
            return;
        };

        const cellRect = getRect(this.scrollArea!, cellNode.element);
        const rowNode = this.dataGrid.layout.getNode(cellNode.rowId)!;

        const baseLeft = cellRect.left + cellRect.width;
        const baseTop = cellRect.top + cellRect.height;
        
        // Calculate z-index
        const cellZ = +getComputedStyle(cellNode.element).zIndex || 0;
        const rowZ = +getComputedStyle(rowNode.element).zIndex || 0;
        const z = Math.max(cellZ, rowZ) + 1 || 1;

        // Update handle visibility and position
        this.dataGrid.layout.updateNode('fillHandle', {
            visible: true,
            offset: {
                z,
                left: baseLeft + this.scrollArea!.scrollLeft,
                top: baseTop + this.scrollArea!.scrollTop,
            }
        });

        // Store offset information for later updates
        this._fillOffset = {
            pinnedHorizontal: cellNode.pinned?.side === 'left' || cellNode.pinned?.side === 'right',
            pinnedVertical: rowNode.pinned?.side === 'top' || rowNode.pinned?.side === 'bottom',
            baseLeft,
            baseTop,
            baseScrollLeft: this.scrollArea!.scrollLeft,
            baseScrollTop: this.scrollArea!.scrollTop
        };
    };

    /**
     * Updates the fill handle position when scrolling
     */
    private readonly updateHandleOffset = (): void => {
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

    // #endregion

    // #region Fill Operations

    /**
     * Starts a fill operation
     */
    private readonly startFill = (event: MouseEvent): void => {
        const range = this.currentSelectedRange;
        if (!range) {
            return;
        }

        this._isFilling = true;
        event.preventDefault();
        event.stopPropagation();
    };

    /**
     * Updates the fill range during drag operation
     */
    private readonly moveFill = (event: MouseEvent): void => {
        event.preventDefault();

        if (!this._isFilling) {
            return;
        }

        const selectedRange = this.currentSelectedRange;
        const overCell = this.dataGrid.layout.getNodeByElement(event.target as HTMLElement);

        if (!selectedRange || !overCell) {
            return;
        }

        // Extract cell positions
        const selectedStart = extractCellId(selectedRange.start);
        const selectedEnd = extractCellId(selectedRange.end);
        const overPosition = extractCellId(overCell.id as CellId);

        const config: FillRangeConfig = {
            selectedMinRow: selectedStart.rowIndex,
            selectedMaxRow: selectedEnd.rowIndex,
            selectedMinColumn: selectedStart.columnIndex,
            selectedMaxColumn: selectedEnd.columnIndex,
            overRow: overPosition.rowIndex,
            overColumn: overPosition.columnIndex
        };

        // Determine fill direction and calculate range
        const direction = this.getFillDirection(config);

        if (direction === FillDirection.NONE) {
            this.hideFillRange();
            return;
        }

        const fillRange = this.calculateFillRange(direction, config);
        if (!fillRange) {
            return;
        }

        this.updateFillRangeDisplay(fillRange);
    };

    /**
     * Hides the fill range display
     */
    private readonly hideFillRange = (): void => {
        this.dataGrid.layout.updateNode('fillRange', {
            visible: false,
        });
        this._fillRange = null;
    };

    /**
     * Updates the visual display of the fill range
     */
    private readonly updateFillRangeDisplay = (fillRange: { start: CellId; end: CellId }): void => {
        const { start: fillRangeStart, end: fillRangeEnd } = fillRange;

        const fillRangeStartCell = this.dataGrid.layout.getNode(fillRangeStart);
        const fillRangeEndCell = this.dataGrid.layout.getNode(fillRangeEnd);

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
            start: getMinCellId(fillRangeStart, fillRangeEnd),
            end: getMaxCellId(fillRangeStart, fillRangeEnd),
        };
    };

    /**
     * Completes the fill operation
     */
    private readonly endFill = (event: MouseEvent): void => {
        if (!this._isFilling || !this._fillRange) {
            return;
        }

        // Hide UI elements
        this.dataGrid.layout.updateNode('fillRange', { visible: false });
        this.dataGrid.layout.updateNode('fillHandle', { visible: false });

        // Perform the actual data cloning
        const selectedRange = this.currentSelectedRange;
        if (selectedRange) {
            this.dataGrid.modifier.cloneRangeData(selectedRange, this._fillRange);
            this.updateSelectionAfterFill(selectedRange);
        }

        // Reset state
        this.resetFillState();
        event.preventDefault();
    };

    /**
     * Updates the selection to include both original and filled ranges
     */
    private readonly updateSelectionAfterFill = (selectedRange: any): void => {
        if (!this._fillRange) {
            return;
        }

        const selectedCorners = getQuadCorners(selectedRange.start, selectedRange.end);
        const fillCorners = getQuadCorners(this._fillRange.start, this._fillRange.end);

        this.dataGrid.selection.selectRange(
            getMinCellId(selectedCorners.topLeft, fillCorners.topLeft),
            getMaxCellId(selectedCorners.bottomRight, fillCorners.bottomRight)
        );
    };

    /**
     * Resets the fill operation state
     */
    private readonly resetFillState = (): void => {
        this._isFilling = false;
        this._fillRange = null;
        this._fillOffset = null;
    };

    // #endregion

    // #region Event Handlers and Activation

    /**
     * Sets up watcher for fill handle node changes
     */
    private readonly setupFillHandleWatcher = () => {
        return this.dataGrid.layout.layoutNodesState.watchItem('fillHandle', ({ operation, item }) => {
            if (!item) {
                return;
            }

            if (operation === 'remove') {
                this.removeEventListener(item.element, 'mousedown', this.startFill);
                return;
            }

            this.addEventListener(item.element, 'mousedown', this.startFill);
        });
    };

    /**
     * Sets up watcher for selected ranges changes
     */
    private readonly setupSelectedRangesWatcher = () => {
        return this.dataGrid.state.selectedRanges.watch((ranges) => {
            if (ranges.length !== 1) {
                this.hideFillHandle();
                return;
            }

            const range = ranges[0];
            const cells = Array.from(range.cells.keys());
            const lastCellId = cells[cells.length - 1];

            if (lastCellId) {
                this.setHandleOffset(lastCellId);
            }
        });
    };

    /**
     * Sets up event listeners for cell mouse events
     */
    private readonly setupCellEventListeners = () => {
        return this.dataGrid.layout.layoutNodesState.watchItems(({ operation, item }) => {
            if (item?.type !== 'cell') {
                return;
            }

            if (operation === 'remove') {
                this.removeEventListener(item.element, 'mouseenter', this.moveFill);
                return;
            }

            this.addEventListener(item.element, 'mouseenter', this.moveFill);
        });
    };

    /**
     * Sets up scroll event listener
     */
    private readonly setupScrollListener = () => {
        this.addEventListener(this.scrollArea!, 'scroll', this.updateHandleOffset);

        return () => {
            this.removeEventListener(this.scrollArea!, 'scroll', this.updateHandleOffset);
        };
    };

    /**
     * Sets up document-level event listeners
     */
    private readonly setupDocumentListeners = () => {
        document.addEventListener('mouseup', this.endFill);

        return () => {
            document.removeEventListener('mouseup', this.endFill);
        };
    };

    // #endregion

    /**
     * Activates the cell fill plugin by setting up event listeners and watchers
     */
    public handleActivate = (): void => {
        const cleanupFunctions = [
            this.setupFillHandleWatcher(),
            this.setupSelectedRangesWatcher(),
            this.setupCellEventListeners(),
            this.setupScrollListener(),
            this.setupDocumentListeners()
        ];

        this.unsubscribes.push(() => {
            cleanupFunctions.forEach(cleanup => cleanup());
        });
    };
}
