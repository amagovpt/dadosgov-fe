export const dynamic = "force-dynamic";

export default function TopicsAreaLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {children}
        </>
    );
}