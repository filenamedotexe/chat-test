import { Navigation } from '@chat/ui';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <div className="pt-16">
        {children}
      </div>
    </>
  );
}