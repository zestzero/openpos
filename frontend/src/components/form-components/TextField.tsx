import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '../../hooks/demo.form-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorMessages } from './ErrorMessages';

interface TextFieldProps {
  label: string;
  placeholder?: string;
}

export function TextField({ label, placeholder }: TextFieldProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <Input
        id={label}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
