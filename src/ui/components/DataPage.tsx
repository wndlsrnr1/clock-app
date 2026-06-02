import type { TextCatalog } from "../textCatalog";
import type { TodoAppViewModel } from "../useTodoApp";
import { DataManagementPanel } from "./DataManagementPanel";

interface DataPageProps {
  todo: TodoAppViewModel;
  text: TextCatalog;
}

export function DataPage({ text, todo }: DataPageProps): React.JSX.Element {
  return (
    <section className="data-page" aria-labelledby="data-management-title">
      <DataManagementPanel text={text} todo={todo} />
    </section>
  );
}
