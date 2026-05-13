import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function RootPage() {
  const userType = cookies().get("user_type")?.value;
  if (userType === "Admin") {
    redirect("/admin");
  }
  redirect("/general");
}
