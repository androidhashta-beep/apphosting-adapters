import { DisplayClient } from './DisplayClient';
import { PageWrapper } from '@/components/PageWrapper';

export default function DisplayPage() {
  return (
    <PageWrapper title="Public Display">
      <DisplayClient />
    </PageWrapper>
  );
}
