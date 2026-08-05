import { MainLayout } from '@/components/layout/MainLayout';
import { Hammer } from 'lucide-react';

export default function ComingSoon() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-6 bg-primary/10 rounded-full">
          <Hammer className="w-16 h-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Module Under Construction</h1>
          <p className="text-muted-foreground max-w-[500px] text-lg mx-auto">
            This analytics and reporting module is currently under active development. Our data team is wiring up the real-time metrics! Check back soon.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
