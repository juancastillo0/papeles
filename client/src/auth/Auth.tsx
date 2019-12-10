import React, { useContext } from "react";
import StyledForm from "./StyledForm";
import { storeContext } from "../services/Store";
import { Redirect, useHistory } from "react-router-dom";
import { observer } from "mobx-react-lite";
import * as formik from "formik";
import * as yup from "yup";
import { TextField } from "./TextField";
import { useLoginMutation, useRegisterMutation, RegisterResponseError } from "../generated/graphql";

export const SIGNUP_PATHS = ["/signup", "/register", "/registrarse"];
export const AUTH_PATHS = [
  "/signin",
  "/login",
  "/ingresar",
  "/auth",
  ...SIGNUP_PATHS
];

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

export const Auth: React.FC = observer(() => {
  const history = useHistory();
  const path = history.location.pathname.split("/");
  const [loginFn] = useLoginMutation();
  const [registerFn] = useRegisterMutation();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<null | string>(null);

  const [isSigningUp, setIsSigningUp] = React.useState(isSigningUpFn(path));
  React.useEffect(() => setIsSigningUp(isSigningUpFn(path)), [path]);

  const store = useContext(storeContext);
  const form = formik.useFormik({
    initialValues: { name: "", email: "", password: "", password2: "" },
    validate: () => {
      setError(null);
    },
    onSubmit: async values => {
      setLoading(true);
      const params = { variables: { ...values } };
      try {
        if (isSigningUp) {
          const result = await registerFn(params);
          result.data!.register.user!.
          if( result.data!.register.error  && result.data!.register.error === RegisterResponseError.){

          }
          const data = result.data!.register;
          if (data.error) {
            setError(data.error);
          } else if (data.user) {
            store.setUser(data.user);
          } else {
            throw Error();
          }
        } else {
          const result = await loginFn(params);
          const data = result.data!.login;
          if (data.error) {
            setError(data.error);
          } else if (data.user) {
            store.setUser(data.user);
          } else {
            throw Error();
          }
        }
      } catch {
        setError("Error en el servidor, por favor intenta de nuevo más tarde.");
      }
      setLoading(false);
    },
    validationSchema: isSigningUp ? signUpSquema : logInSquema
  });

  if (store.user !== null) return <Redirect to="/" />;
  return (
    <StyledForm onSubmit={form.handleSubmit}>
      <h1>{isSigningUp ? "Regístrate" : "Ingresa"}</h1>

      {isSigningUp && <TextField label="Nombre" name="name" form={form} />}

      <TextField label="Correo Electrónico" name="email" form={form} />
      <TextField
        label="Contraseña"
        name="password"
        form={form}
        type="password"
      />

      {isSigningUp && (
        <TextField
          label="Contraseña de Verificación"
          name="password2"
          form={form}
          type="password"
        />
      )}

      <div id="button-div">
        <button type="submit" disabled={loading}>
          {isSigningUp ? "Registrarse" : "Ingresar"}
        </button>
      </div>
      <div>{error}</div>
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
    </StyledForm>
  );
});
