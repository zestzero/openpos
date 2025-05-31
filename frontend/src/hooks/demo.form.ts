import { createFormHook } from '@tanstack/react-form';

import { Select, TextArea, TextField } from '../components/form-components';
import { SubscribeButton } from '../components/form-components/SubscribeButton';
import { fieldContext, formContext } from './demo.form-context';

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
});
