import React from "react";
import { observer } from "mobx-react-lite";
import { useField, useFormik, Field, Formik, FieldArray } from "formik";
import * as yup from "yup";
import {
  useCreatePaperPermissionMutation,
  PaperPermissionType,
  useCreatePaperMutation
} from "../generated/graphql";
import { TextField } from "../auth/TextField";
import styled from "styled-components";
import { storeContext } from "../services/Store";

type Props = {};

const schema = yup.object({
  peerEmail: yup
    .string()
    .required("Requerido")
    .email("El correo no es una dirección válida"),
  permission: yup.string().required("Requerido")
});

const StyledForm = styled.form`
  padding: 1em 3em 3em;
  max-width: 450px;
  min-width: 300px;
  background: white;
  display: flex;
  flex-direction: column;
  h2 {
    font-size: 2em;
  }
  h3 {
    margin-top: 0;
    font-size: 1.4em;
  }
  label {
    font-size: 1.2em;
    margin-bottom: 0.2em;
  }
  input {
    padding: 0.45em;
    font-size: 1.05em;
  }
  select {
    padding: 0.45em;
    font-size: 1.05em;
    width: 100%;
  }
  #buttons {
    margin-top: 1em;
    display: flex;
    justify-content: space-between;
    button {
      font-size: 1.1em;
      padding: 0.3em;
    }
  }
  .error {
    min-height: 1.4em;
    color: red;
    margin-bottom: 0.6em;
  }
`;

export const ShareForm: React.FC<Props> = observer(() => {
  const store = React.useContext(storeContext);
  const [createPaper] = useCreatePaperMutation();
  const [createPermission] = useCreatePaperPermissionMutation();
  const [error, setError] = React.useState("");
  const form = useFormik({
    initialValues: { peerEmail: "", permission: "" },
    validate: (values) => {
      setError("");
      const errors:{
        peerEmail?: string;
        permission?: string;
    } = {}
      if (!values.peerEmail){
        errors.peerEmail = "rewuerido"
      }
      return errors;
    },
    onSubmit: async ({ peerEmail, permission }, h) => {
      h.setSubmitting(true);
      if (permission && store.currentCanvas) {
        if (store.currentCanvas.sequenceNumber === -1) {
          const ans = await createPaper({
            variables: { 
              name: store.currentCanvas.name,
              id: store.currentCanvas.id
            }
          });
          if (ans.data && ans.data.createPaper) {
            store.currentCanvas.updateCanvas(ans.data.createPaper);
          } else {
            return h.setSubmitting(false);
          }
        }
        if (store.currentCanvas.id) {
          const permissionType = permission as PaperPermissionType;
          const ans = await createPermission({
            variables: {
              paperId: store.currentCanvas.id,
              peerEmail: peerEmail.trim().toLowerCase(),
              permissionType
            }
          });

          if (ans.data && ans.data.createPaperPermission) {
            setError(ans.data.createPaperPermission.error);
          }else{
            store.currentCanvas.updateCanvas({permissions: [...store.currentCanvas.permissions, ]});
          }
        }
      }
      h.setSubmitting(false);
    },
    validationSchema: schema
  });

  if (!store.currentCanvas) {
    store.setModal(null);
    return <span />;
  }

  const emailField = form.getFieldProps("peerEmail");
  const permField = form.getFieldProps("permission");
  const emailFieldM = form.getFieldMeta("peerEmail");
  const permFieldM = form.getFieldMeta("permission");
  emailField.
  return (
    <StyledForm onSubmit={form.handleSubmit}>
      <Formik initialValues={}>
        <Form>
        </Form>
      </Formik>
      <h2>Crear Permiso</h2>
      <h3>{store.currentCanvas.name}</h3>
      <Field name="peerEmail" as={} />

      <label htmlFor="peer-email-input">Correo Electrónico</label>
      <input {...emailField} type="email" id="peer-email-input" />
      <div className="error">
        {emailFieldM.touched ? emailFieldM.error : ""}
      </div>

      <label htmlFor="permission-input">Permiso</label>
      <select {...permField} id="permission-input">
        {[
          PaperPermissionType.Admin,
          PaperPermissionType.Read,
          PaperPermissionType.Write
        ].map(v => {
          return (
            <option value={v} key={v}>
              {v}
            </option>
          );
        })}
        {form.values.permission === "" && (
          <option value="">Selecciona el permiso</option>
        )}
      </select>
      <div className="error">{permFieldM.touched ? permFieldM.error : ""}</div>

      <div id="buttons">
        <button type="button" onClick={() => store.setModal(null)}>
          Cancelar
        </button>
        <button type="submit" disabled={form.isSubmitting}>
          Crear Permiso
        </button>
        <div className="error">{error}</div>
      </div>
    </StyledForm>
  );
});
