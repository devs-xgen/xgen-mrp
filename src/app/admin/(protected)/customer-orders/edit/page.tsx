 import { redirect } from "next/navigation";

 // Legacy route removed: redirect to listing to avoid client API usage
 export default function Page() {
   redirect("/admin/customer-orders");
   return null;
 }
