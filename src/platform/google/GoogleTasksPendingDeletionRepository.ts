import { storage } from "@neutralinojs/lib";
import type { TodoClock, TodoDeletionSyncPort } from "../../contexts/todo/application/ports";
import type { TodoItem } from "../../contexts/todo/domain/TodoItem";
import type { NeutralinoStoragePort } from "../neutralino/NeutralinoSettingsRepository";
import type { GoogleTasksPendingDeletion, GoogleTasksPendingDeletionPort, GoogleTasksSettingsPort } from "./GoogleTasksSyncAdapter";

export class GoogleTasksPendingDeletionRepository implements TodoDeletionSyncPort, GoogleTasksPendingDeletionPort {
  private readonly key = "google-tasks-pending-deletions";

  public constructor(
    private readonly settings: GoogleTasksSettingsPort,
    private readonly clock: TodoClock,
    private readonly neutralinoStorage: NeutralinoStoragePort = storage,
  ) {}

  public async recordDeletedTodo(todo: TodoItem): Promise<void> {
    const snapshot = todo.snapshot();

    if (!snapshot.googleTaskId) {
      return;
    }

    const taskListId = await this.settings.getTaskListId();

    if (!taskListId) {
      throw new Error("Google Tasks 목록을 먼저 선택해주세요.");
    }

    const deletion: GoogleTasksPendingDeletion = {
      deletedAt: this.clock.now().toISOString(),
      googleTaskId: snapshot.googleTaskId,
      taskListId,
    };
    const deletions = await this.getAll();
    const remainingDeletions = deletions.filter((candidate: GoogleTasksPendingDeletion): boolean => (
      candidate.taskListId !== deletion.taskListId || candidate.googleTaskId !== deletion.googleTaskId
    ));

    await this.saveAll([...remainingDeletions, deletion]);
  }

  public async listPendingDeletions(taskListId: string): Promise<Array<GoogleTasksPendingDeletion>> {
    return (await this.getAll()).filter((deletion: GoogleTasksPendingDeletion): boolean => deletion.taskListId === taskListId);
  }

  public async removePendingDeletion(taskListId: string, googleTaskId: string): Promise<void> {
    const remainingDeletions = (await this.getAll()).filter((deletion: GoogleTasksPendingDeletion): boolean => (
      deletion.taskListId !== taskListId || deletion.googleTaskId !== googleTaskId
    ));

    await this.saveAll(remainingDeletions);
  }

  private async getAll(): Promise<Array<GoogleTasksPendingDeletion>> {
    try {
      return GoogleTasksPendingDeletionRepository.restore(JSON.parse(await this.neutralinoStorage.getData(this.key)) as Array<Partial<GoogleTasksPendingDeletion>>);
    } catch {
      return [];
    }
  }

  private async saveAll(deletions: Array<GoogleTasksPendingDeletion>): Promise<void> {
    await this.neutralinoStorage.setData(this.key, JSON.stringify(deletions));
  }

  private static restore(deletions: Array<Partial<GoogleTasksPendingDeletion>>): Array<GoogleTasksPendingDeletion> {
    return deletions.filter((deletion: Partial<GoogleTasksPendingDeletion>): deletion is GoogleTasksPendingDeletion => (
      typeof deletion.taskListId === "string"
      && typeof deletion.googleTaskId === "string"
      && typeof deletion.deletedAt === "string"
    ));
  }
}
