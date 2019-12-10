import React from "react";
import { useField, useFormikContext } from "formik";
import { InputDiv } from "./FormContainer";

type TextFieldProps = {
  label: string;
  row?: boolean;
  type?: string;
  name: string;
  onChange?: (value: string) => string | void;
  [key: string]: any;
};

function useFieldMod(
  name: string,
  onChange?: (value: string) => string | void
) {
  const form = useFormikContext<any>();

  const [hasChanged, setHasChanged] = React.useState(false);
  const [_ref, ref] = React.useState<HTMLInputElement | null>(null);

  const [field, meta] = useField(name);
  React.useEffect(() => {
    if (!hasChanged) {
      if (field.value !== meta.initialValue) {
        setHasChanged(true);
      } else if (meta.touched) {
        form.setFieldTouched(name, false);
      }
    }

    if (onChange !== undefined) {
      const ans = onChange(field.value);
      if (ans && ans !== field.value) {
        form.setFieldValue(name, ans);
      }
    }
  }, [field.value, meta.touched, meta.initialValue]);

  React.useEffect(() => {
    if (form.submitCount > 0 && _ref && Object.keys(form.errors)[0] === name) {
      _ref.focus();
    }
  }, [form.submitCount, form.errors[name]]);

  return {
    field: { ...field, ref },
    meta: {
      ...meta,
      hasChanged,
      showError:
        meta.error && ((meta.touched && hasChanged) || form.submitCount > 0)
    }
  };
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  row = false,
  name,
  onChange,
  ...rest
}) => {
  const { field, meta } = useFieldMod(name, onChange);
  // const hasError = meta.touched && meta.hasChanged && !!meta.error;

  const id = `${name}-input`;
  return (
    <InputDiv key={id}>
      <div className={row ? "input-div" : ""}>
        <label htmlFor={id}>{label}</label>
        <input
          {...field}
          id={id}
          {...rest}
          className={meta.showError ? "error" : ""}
        />
      </div>
      <div className="error">{meta.showError && meta.error}</div>
    </InputDiv>
  );
};
