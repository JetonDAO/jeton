import { getTablesInfo } from "@jeton/ts-sdk";
import { LaunchGameButton } from "@src/components/LaunchGameButton";

// I used button here to show case client components
// otherwise it makes more sense to use Link
export default async function GamePage() {
  const tables = await getTablesInfo();
  return (
    <div>
      this is game page
      {tables.map((table) => (
        <div key={table.id}>
          this is table {table.id}
          <LaunchGameButton tableId={table.id} />
        </div>
      ))}
    </div>
  );
}
