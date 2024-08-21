import { getTables } from "@jeton/sdk-js";
import { LaunchGameButton } from "./components/LaunchGameButton";

// I used button here to show case client components
// otherwise it makes more sense to use Link
export default async function GamePage() {
  const tables = await getTables();
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
