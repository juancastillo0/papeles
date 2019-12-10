import React from "react";
import { useField } from "formik";
import { PaperPermissionType } from "../generated/graphql";
import { placeholder } from "@babel/types";

type SelectFieldProps = {
  label: string;
  placeholder?: string;
  row?: boolean;
  name: string;
  options: (string | { value: string; label: string })[];
  [key: string]: any;
};

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  options,
  placeholder
}) => {
  const [field, meta] = useField({ name });

  const id = `${name}-input`;
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select {...field} id={id}>
        {options.map(v => {
          const value = typeof v === "string" ? v : v.value;
          const label = typeof v === "string" ? v : v.label;
          return (
            <option value={value} key={value}>
              {label}
            </option>
          );
        })}
        {placeholder !== undefined && field.value === "" && (
          <option value="">{placeholder}</option>
        )}
      </select>
      <div className="error">{meta.touched && meta.error}</div>
    </div>
  );
};
