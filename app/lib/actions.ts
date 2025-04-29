// データの変更操作を行うための関数を定義します

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import postgres from "postgres"
import { z } from "zod"
import { createClient } from "./supabase/server"
import { encodedRedirect } from "./utils"

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" })

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
})

export type State = {
  errors?: {
    customerId?: string[]
    amount?: string[]
    status?: string[]
  }
  message?: string | null
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  })

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    }
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100
  const date = new Date().toISOString().split("T")[0]

  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice.",
    }
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath("/dashboard/invoices")
  redirect("/dashboard/invoices")
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true })

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  })

  const amountInCents = amount * 100

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("invoices")
      .update({
        customer_id: customerId,
        amount: amountInCents,
        status: status,
      })
      .eq("id", id)

    if (error) {
      console.error("Database Error:", error)
    }
    if (error) {
      console.error("Database Error:", error)
    }
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error)
  }

  revalidatePath("/dashboard/invoices")
  redirect("/dashboard/invoices")
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`
  revalidatePath("/dashboard/invoices")
}

export async function signInAction(
  prevState: string | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log("User:", user)
  if (error) {
    console.error("Login Error:", error)
    return encodedRedirect("error", "/login", error.message)
  }

  return redirect("/dashboard")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect("/")
}
