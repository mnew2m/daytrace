import { redirect } from "next/navigation";

export default async function DatePage({ params }: { params: { date: string } }) {
  redirect(`/timeline/${params.date}`);
}
