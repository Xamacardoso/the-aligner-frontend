import DashboardLayout from "@/components/DashboardLayout";

export default function GerenteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout role="gerente">{children}</DashboardLayout>;
}
