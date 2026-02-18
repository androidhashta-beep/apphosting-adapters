import { AdminClient } from './AdminClient';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AdminPage() {
  return (
    <SidebarProvider defaultOpen>
      <AdminClient />
    </SidebarProvider>
  );
}
