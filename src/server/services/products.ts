import { supabase } from "../../lib/supabase";

export async function getProducts(organization_id: string) {
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
