import type { TextCatalog } from "../../../shared/i18n/catalog";
import { DataManagementPanel } from "./DataManagementPanel";
import type { DataTransferViewModel } from "./useDataTransfer";

interface DataPageProps {
  dataTransfer: DataTransferViewModel;
  text: TextCatalog;
}

export function DataPage({ dataTransfer, text }: DataPageProps): React.JSX.Element {
  return (
    <section className="data-page" aria-labelledby="data-management-title">
      <DataManagementPanel dataTransfer={dataTransfer} text={text} />
    </section>
  );
}
