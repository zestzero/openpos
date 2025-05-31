import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '../../hooks/demo.form-context';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ErrorMessages } from './ErrorMessages';

interface SwitchProps {
  label: string;
}

export function Switch({ label }: SwitchProps) {
  const field = useFieldContext<boolean>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShadcnSwitch
          id={label}
          onBlur={field.handleBlur}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={label}>{label}</Label>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
