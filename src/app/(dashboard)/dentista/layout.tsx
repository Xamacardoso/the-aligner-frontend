import DashboardLayout from "@/components/DashboardLayout";

export default function DentistaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout role="dentista">{children}</DashboardLayout>;
}
