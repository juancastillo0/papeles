import React from "react";
import formik from "formik";

type TextFieldProps = {
  label: string;
  name: string;
  form: {
    getFieldProps: (name: string) => formik.FieldInputProps<any>;
    getFieldMeta: (name: string) => formik.FieldMetaProps<any>;
  };
  type?: string;
};

export const TextField: React.FC<TextFieldProps> = ({
  label,
  name,
  form,
  type = "text"
}) => {
  const field = form.getFieldProps(name);
  const meta = form.getFieldMeta(name);

  const hasError = !!meta.error && meta.touched;
  const id = `${name}-input`;
  return (
    <section key={id}>
      <label htmlFor={id}>{label}</label>
      <div className="input-div">
        <input {...field} id={id} type={type} />
        {hasError && <div className="error">{meta.error}</div>}
      </div>
    </section>
  );
};
