// src/lib/actions/revalidation-actions.ts

"use server"; // <-- IMPORTANT: Marks this entire file as server-only

import { revalidatePath } from "next/cache";

/**
 * Executes path revalidation for the worker UI.
 * This function should ONLY be imported by other Server Components or Server Actions.
 */
export async function revalidateWorkerPaths(productionOrderId: string) {
    // Revalidate the specific task page
    revalidatePath(`/worker/tasks/${productionOrderId}`);
    
    // Revalidate the main tasks list page
    revalidatePath(`/worker/tasks`);
}