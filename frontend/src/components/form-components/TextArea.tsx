import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '../../hooks/demo.form-context';
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ErrorMessages } from './ErrorMessages';

interface TextAreaProps {
  label: string;
  rows?: number;
}

export function TextArea({ label, rows = 3 }: TextAreaProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
