export const runtime = "edge";

import { TableComponent } from "./components/Table";

export default function TablePage({ params }: { params: { id: string } }) {
  return <TableComponent id={params.id} />;
}
