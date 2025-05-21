import type { RowData, RowOperation } from '../types';
import type { DataGridStates } from './DataGridStates';

interface HistoryItem<TRow> {
    type: RowOperation['type'];
    fromRowIndex: number;
    toRowIndex: number;
    data: TRow[];
}

export class DataGridHistory<TRow extends RowData> {
    private undoItems: HistoryItem<TRow>[] = [];
    private redoItems: HistoryItem<TRow>[] = [];

    constructor(private state: DataGridStates<TRow>) { }

    public addUndo = (operation: RowOperation) => {
        const { data: oldData } = this.state.options;

        this.undoItems.push({
            type: operation.type,
            fromRowIndex: operation.fromRowIndex,
            toRowIndex: operation.toRowIndex,
            data: oldData.slice(operation.fromRowIndex, operation.toRowIndex + 1),
        });

        this.redoItems = [];
    };

    public undo = () => {
        if (this.undoItems.length === 0) {
            return;
        }

        const { onChange, data: currentData } = this.state.options;
        if (!onChange) {
            return;
        }

        const lastUndoItem = this.undoItems.pop()!;
        const { fromRowIndex, toRowIndex, data: undoData, type } = lastUndoItem;

        if (type === 'DELETE') {
            const operation: RowOperation = {
                type: 'RESTORE',
                fromRowIndex,
                toRowIndex,
            };

            const restoredData = [
                ...currentData.slice(0, fromRowIndex),
                ...undoData,
                ...currentData.slice(toRowIndex),
            ];

            onChange?.(restoredData, [operation]);

            this.redoItems.push({
                type: 'DELETE',
                fromRowIndex,
                toRowIndex: fromRowIndex + undoData.length - 1,
                data: undoData,
            });
        }
        else if (type === 'UPDATE') {
            const operation: RowOperation = {
                type: 'REVERT',
                fromRowIndex,
                toRowIndex,
            };

            const restoredData = [
                ...currentData.slice(0, fromRowIndex),
                ...undoData,
                ...currentData.slice(toRowIndex + 1),
            ];
            onChange?.(restoredData, [operation]);
            this.redoItems.push({
                type: 'UPDATE',
                fromRowIndex,
                toRowIndex,
                data: currentData.slice(fromRowIndex, toRowIndex + 1),
            });
        }
        else if (type === 'CREATE') {
            const operation: RowOperation = {
                type: 'DELETE',
                fromRowIndex,
                toRowIndex,
            };

            const restoredData = [
                ...currentData.slice(0, fromRowIndex),
                ...currentData.slice(toRowIndex),
            ];
            onChange?.(restoredData, [operation]);
            this.redoItems.push({
                type: 'CREATE',
                fromRowIndex,
                toRowIndex,
                data: currentData.slice(fromRowIndex, toRowIndex + 1),
            });
        }
    };

    public redo = () => {
        if (this.redoItems.length === 0) {
            return;
        }
        
        const { onChange, data: currentData } = this.state.options;
        if (!onChange) {
            return;
        }

        const lastRedoItem = this.redoItems.pop()!;
        const { fromRowIndex, toRowIndex, data: redoData, type } = lastRedoItem;

        if (type === 'DELETE') {
            const operation: RowOperation = {
                type: 'RESTORE',
                fromRowIndex,
                toRowIndex,
            };

            const restoredData = [
                ...currentData.slice(0, fromRowIndex),
                ...redoData,
                ...currentData.slice(toRowIndex),
            ];

            onChange?.(restoredData, [operation]);

            this.undoItems.push({
                type: 'DELETE',
                fromRowIndex,
                toRowIndex: fromRowIndex + redoData.length - 1,
                data: redoData,
            });
        }
        else if (type === 'UPDATE') {
            const operation: RowOperation = {
                type: 'REVERT',
                fromRowIndex,
                toRowIndex,
            };

            const restoredData = [
                ...currentData.slice(0, fromRowIndex),
                ...redoData,
                ...currentData.slice(toRowIndex + 1),
            ];
            onChange?.(restoredData, [operation]);
            this.undoItems.push({
                type: 'UPDATE',
                fromRowIndex,
                toRowIndex,
                data: currentData.slice(fromRowIndex, toRowIndex + 1),
            });
        }
        else if (type === 'CREATE') {
            const operation: RowOperation = {
                type: 'DELETE',
                fromRowIndex,
                toRowIndex,
            };

            const restoredData = [
                ...currentData.slice(0, fromRowIndex),
                ...currentData.slice(toRowIndex),
            ];
            onChange?.(restoredData, [operation]);
            this.undoItems.push({
                type: 'CREATE',
                fromRowIndex,
                toRowIndex,
                data: currentData.slice(fromRowIndex, toRowIndex + 1),
            });
        }
    };
};
