import { RoutineEditor } from "@/components/routines/RoutineEditor";

export default function RoutineEditorPage({
  params,
}: {
  params: { id: string };
}) {
  return <RoutineEditor id={params.id} />;
}
