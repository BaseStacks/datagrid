import type { MaybePromise } from '../types';
import type { DataGridEvents } from './DataGridEvents';

export interface DataGridCommand<TPayload = any> {
    readonly id: string;
    readonly source: string;
    readonly type?: string;
    readonly label?: any;
    readonly group?: string;
    readonly execute: (payload?: TPayload) => MaybePromise<any>;
}

export class DataGridCommands {
    private _commands: Map<string, DataGridCommand> = new Map();

    constructor(private events: DataGridEvents) {
    }

    public register = (commands: DataGridCommand[]) => {
        for (const command of commands) {
            if (this._commands.has(command.id)) {
                throw new Error(`Command with id ${command.id} already exists`);
            }
            this._commands.set(command.id, command);
        };
    };

    public unregister = (commandId: string) => {
        if (!this._commands.has(commandId)) {
            throw new Error(`Command with id ${commandId} does not exist`);
        }
        this._commands.delete(commandId);
    };

    public unregisterAll = (source: string) => {
        const commandsToDelete = Array.from(this._commands.values()).filter(command => command.source === source);
        commandsToDelete.forEach(command => this._commands.delete(command.id));
    };

    public get = (commandId: string) => {
        return this._commands.get(commandId);
    };

    public getAll = (type?: string) => {
        if (type) {
            return Array.from(this._commands.values()).filter(command => command.type === type);
        }
        return Array.from(this._commands.values());
    };

    public execute = async (commandId: string, ...args: any[]) => {
        const command = this._commands.get(commandId);
        if (!command) {
            throw new Error(`Command with id ${commandId} does not exist`);
        }

        this.events.emit('command-executing', {
            id: command.id,
        });

        await command.execute(...args);

        this.events.emit('command-executed', {
            id: command.id,
        });

        return true;
    };
};
