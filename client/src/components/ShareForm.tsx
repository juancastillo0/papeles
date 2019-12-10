import { Form, Formik } from "formik";
import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components";
import * as yup from "yup";
import { TextField } from "../auth/TextField";
import { PaperPermissionType, useCreatePaperMutation, useCreatePaperPermissionMutation } from "../generated/graphql";
import { useStore } from "../services/Store";
import { SelectField } from "./SelectField";

type Props = {};

// VALIDATION SCHEMA
const schema = yup.object({
  peerEmail: yup
    .string()
    .required("Requerido")
    .email("El correo no es una dirección válida"),
  permission: yup
    .string()
    .required("Requerido")
    .oneOf(Object.values(PaperPermissionType))
});

const StyledForm = styled(Form)`
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
  const store = useStore();
  const [createPaper] = useCreatePaperMutation();
  const [createPermission] = useCreatePaperPermissionMutation();
  const [error, setError] = React.useState("");

  if (!store.currentCanvas) {
    store.setModal(null);
    return <span />;
  }
  const canvasName = store.currentCanvas.name;

  return (
    <Formik
      initialValues={{ peerEmail: "", permission: "" }}
      validate={() => {
        setError("");
      }}
      onSubmit={async ({ peerEmail, permission }, h) => {
        h.setSubmitting(true);
        if (permission && store.currentCanvas) {
          if (store.currentCanvas.sequenceNumber === -1) {
            const ans = await createPaper({
              variables: {
                name: store.currentCanvas.name,
                id: store.currentCanvas.id,
                createdDate: store.currentCanvas.createdDate.toISOString()
              }
            });
            if (ans.data && ans.data.createPaper) {
              store.currentCanvas.updateCanvas(ans.data.createPaper);
            } else {
              return h.setSubmitting(false);
            }
          }
          const permissionType = permission as PaperPermissionType;
          const { data } = await createPermission({
            variables: {
              paperId: store.currentCanvas.id,
              peerEmail: peerEmail.trim().toLowerCase(),
              permissionType
            }
          });
          if (data) {
            if ("error" in data.createPaperPermission) {
              setError(data.createPaperPermission.error);
            } else {
              store.createPermission(data.createPaperPermission);
            }
          } else {
            setError("Server Error");
          }
        }
        h.setSubmitting(false);
      }}
      validationSchema={schema}
      children={({ isSubmitting, isValid }) => (
        <StyledForm>
          <h2>Crear Permiso</h2>
          <h3>{canvasName}</h3>

          <TextField name="peerEmail" type="email" label="Correo Electrónico" />

          <SelectField
            name="permission"
            label="Permiso" 
            options={Object.values(PaperPermissionType)}
            placeholder="Selecciona un Permiso"
          />

          <div id="buttons">
            <button type="button" onClick={() => store.setModal(null)}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !isValid}>
              Crear Permiso
            </button>
          </div>
          <div className="error">{error}</div>
        </StyledForm>
      )}
    ></Formik>
  );
});
