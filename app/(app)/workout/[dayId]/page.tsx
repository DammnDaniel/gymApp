import { WorkoutSession } from "@/components/workout/WorkoutSession";

export default function WorkoutPage({
  params,
}: {
  params: { dayId: string };
}) {
  return <WorkoutSession dayId={params.dayId} />;
}
