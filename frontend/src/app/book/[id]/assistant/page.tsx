import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssistantRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/book/${id}?tab=assistant`);
}
