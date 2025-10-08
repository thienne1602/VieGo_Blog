import ProfileLayout from "../../components/ProfileLayout";

export default function ProfileLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileLayout>{children}</ProfileLayout>;
}
