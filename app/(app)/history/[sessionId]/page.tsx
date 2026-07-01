import { SessionEditor } from "@/components/workout/SessionEditor";

export default function SessionEditPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <SessionEditor id={params.sessionId} />;
}
