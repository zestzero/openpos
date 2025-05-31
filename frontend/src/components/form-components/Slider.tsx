import { useStore } from '@tanstack/react-form';
import { useFieldContext } from '../../hooks/demo.form-context';
import { Slider as ShadcnSlider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ErrorMessages } from './ErrorMessages';

interface SliderProps {
  label: string;
}

export function Slider({ label }: SliderProps) {
  const field = useFieldContext<number>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <Label htmlFor={label} className="mb-2 text-xl font-bold">
        {label}
      </Label>
      <ShadcnSlider
        id={label}
        onBlur={field.handleBlur}
        value={[field.state.value]}
        onValueChange={(value) => field.handleChange(value[0])}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
