import { AppCard, type AppCardProps } from 'alambre/ui';

export interface TestCardProps extends Omit<AppCardProps, 'title' | 'subtitle'> {
  title: string;
  description?: string;
}

export function TestCard({ title, description, children, ...props }: TestCardProps) {
  return (
    <AppCard
      title={title}
      subtitle={description}
      {...props}
    >
      {children}
    </AppCard>
  );
}
