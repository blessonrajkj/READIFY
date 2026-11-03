import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FlashcardsRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/book/${id}?tab=flashcards`);
}
