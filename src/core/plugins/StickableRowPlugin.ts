import { DataGridPlugin } from '../instances/atomic/DataGridPlugin';
import type { RowKey } from '../types';

export interface StickableRowPluginOptions {
    readonly stickedTopRows?: RowKey[];
    readonly stickedBottomRows?: RowKey[];
}

export class StickableRowPlugin extends DataGridPlugin<StickableRowPluginOptions> {
    public handleActivate = () => {
    };
}
