declare module 'bun:sqlite' {
  export type SQLQueryBindings = Record<string, unknown> | unknown[];

  export type Changes = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  export class Statement<T = unknown> {
    all(bindings?: SQLQueryBindings): T[];
    get(bindings?: SQLQueryBindings): T | undefined;
    run(bindings?: SQLQueryBindings): Changes;
  }

  export class Database {
    constructor(filename: string, options?: { readonly?: boolean; create?: boolean; readwrite?: boolean; strict?: boolean });
    close(): void;
    prepare<T = unknown>(query: string): Statement<T>;
    query<T = unknown>(query: string): Statement<T>;
    run(query: string, bindings?: SQLQueryBindings): Changes;
  }
}
