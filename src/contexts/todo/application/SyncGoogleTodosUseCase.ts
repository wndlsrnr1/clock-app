import type { TodoRepository, TodoSyncPort, TodoSyncResult } from "./ports";

export class SyncGoogleTodosUseCase {
  public constructor(
    private readonly todoRepository: TodoRepository,
    private readonly todoSync: TodoSyncPort,
  ) {}

  public async execute(): Promise<Omit<TodoSyncResult, "todos">> {
    const result = await this.todoSync.sync(await this.todoRepository.getAll());
    await this.todoRepository.saveAll(result.todos);

    return {
      deleted: result.deleted,
      imported: result.imported,
      updated: result.updated,
      uploaded: result.uploaded,
    };
  }
}
