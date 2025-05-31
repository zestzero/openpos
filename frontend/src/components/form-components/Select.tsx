import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '../../hooks/demo.form-context';
import * as ShadcnSelect from '@/components/ui/select';
import { ErrorMessages } from './ErrorMessages';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  values: SelectOption[];
  placeholder?: string;
}

export function Select({ label, values, placeholder }: SelectProps) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <ShadcnSelect.SelectTrigger className="w-full">
          <ShadcnSelect.SelectValue placeholder={placeholder} />
        </ShadcnSelect.SelectTrigger>
        <ShadcnSelect.SelectContent>
          <ShadcnSelect.SelectGroup>
            <ShadcnSelect.SelectLabel>{label}</ShadcnSelect.SelectLabel>
            {values.map((value) => (
              <ShadcnSelect.SelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelect.SelectItem>
            ))}
          </ShadcnSelect.SelectGroup>
        </ShadcnSelect.SelectContent>
      </ShadcnSelect.Select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
