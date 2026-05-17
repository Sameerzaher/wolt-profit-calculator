import { redirect } from "next/navigation";

export default function OcrRedirectPage() {
  redirect("/import-screenshot");
}
