import ProfileLayout from "../../components/ProfileLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileLayout>{children}</ProfileLayout>;
}
