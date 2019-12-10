import React from "react";
import { FormContainer } from "./FormContainer"; 
import { useStores } from "../services/Store";
import { Redirect, useHistory } from "react-router-dom";
import { observer } from "mobx-react-lite";
import * as yup from "yup";
import { TextField } from "./TextField";
import { Formik, Form } from "formik"; 

export const SIGNUP_PATHS = ["/signup", "/register", "/registrarse"];
export const AUTH_PATHS = [
  "/signin",
  "/login",
  "/ingresar",
  "/auth",
  ...SIGNUP_PATHS
];

// VALIDATION SCHEMAS
const _logInSquema = {
  email: yup
    .string()
    .required("Requerido")
    .email("El correo no es una dirección válida"),
  password: yup.string().required("Requerido")
};
const logInSquema = yup.object(_logInSquema);

const signUpSquema = yup.object({
  name: yup.string().required("Requerido"),
  ..._logInSquema,
  password2: yup
    .string()
    .required("Requerido")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden")
});

const isSigningUpFn = (path: string[]) => {
  return SIGNUP_PATHS.some(p => path[path.length - 1] == p.slice(1));
};

// COMPONENT
export const Auth: React.FC = observer(() => {
  const history = useHistory();
  const path = history.location.pathname.split("/");
  const [error, setError] = React.useState<null | string>(null);

  const [isSigningUp, setIsSigningUp] = React.useState(isSigningUpFn(path));
  React.useEffect(() => setIsSigningUp(isSigningUpFn(path)), [path]);

  const { authStore } = useStores();

  if (authStore.user !== null) return <Redirect to="/" />;
  return (
    <Formik
      initialValues={{ name: "", email: "", password: "", password2: "" }}
      validate={() => {
        setError(null);
      }}
      onSubmit={async (values, h) => {
        h.setSubmitting(true);
        try {
          if (isSigningUp) {
            const result = await authStore.register(values);
            if (result) {
              setError(result);
            }
          } else {
            const result = await authStore.login(values);
            if (result) {
              setError(result);
            }
          }
        } catch {
          setError(
            "Error en el servidor, por favor intenta de nuevo más tarde."
          );
        }
        h.setSubmitting(false);
      }}
      validationSchema={isSigningUp ? signUpSquema : logInSquema}
    >
      {({ isSubmitting, isValid }) => (
        <FormContainer>
          <Form>
            <h1>{isSigningUp ? "Regístrate" : "Ingresa"}</h1>

            {isSigningUp && <TextField label="Nombre" name="name" row />}

            <TextField label="Correo Electrónico" name="email" row />
            <TextField label="Contraseña" name="password" type="password" row />

            {isSigningUp && (
              <TextField
                label="Contraseña"
                name="password2"
                type="password"
                row
              />
            )}

            <div id="button-div">
              <button type="submit">
                {isSigningUp ? "Registrarse" : "Ingresar"}
              </button>
            </div>
            <div className="error">{error}</div>
            <hr />
            <footer>
              {isSigningUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
              <button
                type="button"
                className="anchor"
                onClick={() =>
                  history.replace(isSigningUp ? AUTH_PATHS[0] : SIGNUP_PATHS[0])
                }
              >
                {!isSigningUp ? "Regístrate" : "Ingresa"}
              </button>
            </footer>
          </Form>
        </FormContainer>
      )}
    </Formik>
  );
});
