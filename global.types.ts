import { Database } from "./database.types"
/*
https://stackoverflow.com/questions/77520175/how-to-use-types-provided-by-supabase-in-my-typescript-project
*/

export type Customers = Database["public"]["Tables"]["customers"]["Row"]
export type Revenue = Database["public"]["Tables"]["revenue"]["Row"]
