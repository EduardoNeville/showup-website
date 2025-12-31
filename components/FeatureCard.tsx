interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="p-6 neumorphic max-w-sm mx-auto rounded-lg text-center">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <h3 className="text-lg font-serif font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}