import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireSession() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
