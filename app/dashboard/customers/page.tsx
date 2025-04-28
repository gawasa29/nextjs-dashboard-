import { createClient } from "@/app/lib/supabase/server"

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from("users").select()

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
