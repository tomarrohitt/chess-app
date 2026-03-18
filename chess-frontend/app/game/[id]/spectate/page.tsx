import { SpectateComponent } from "./_components/spectate";

export default async function SpectatePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  return <SpectateComponent id={id} />;
}
