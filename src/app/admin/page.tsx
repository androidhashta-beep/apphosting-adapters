'use client';

import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function AdminPage() {
  return (
    <PageWrapper title="Admin Panel" showBackButton={true}>
        <div className="flex items-center justify-center py-20">
            <Card className="max-w-lg text-center">
            <CardHeader>
                <CardTitle className="flex flex-col items-center gap-4">
                <Construction className="h-12 w-12 text-primary" />
                <span>Admin Panel Under Construction</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <p className="text-muted-foreground">
                This feature is temporarily disabled and will be added back later.
                </p>
            </CardContent>
            </Card>
      </div>
    </PageWrapper>
  );
}
