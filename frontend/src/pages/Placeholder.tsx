import { Building2 } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-apple-blue/5 flex items-center justify-center mb-4">
        <Building2 className="w-8 h-8 text-apple-blue/40" />
      </div>
      <h2 className="text-heading text-apple-black mb-2">{title}</h2>
      {description && (
        <p className="text-body text-apple-secondary max-w-md">{description}</p>
      )}
    </div>
  );
}
