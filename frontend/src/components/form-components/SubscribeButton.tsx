import { useFormContext } from '../../hooks/demo.form-context';
import { Button } from '@/components/ui/button';

interface SubscribeButtonProps {
  label: string;
}

export function SubscribeButton({ label }: SubscribeButtonProps) {
  const form = useFormContext();
  
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
}
