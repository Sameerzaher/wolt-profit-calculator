import AppChrome from "@/components/layout/AppChrome";

export const metadata = {
  title: "לוח ניתוחים"
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppChrome>{children}</AppChrome>;
}
