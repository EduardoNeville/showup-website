interface StepCardProps {
  step: number;
  title: string;
  description: string;
  details?: string[];
}

export function StepCard({ step, title, description, details }: StepCardProps) {
  return (
    <div className="p-6 neumorphic-inset max-w-md mx-auto rounded-lg">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
          {step}
        </div>
        <h3 className="text-xl font-serif font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {details && (
          <ul className="text-left text-sm space-y-1">
            {details.map((detail, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary mr-2">•</span>
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}