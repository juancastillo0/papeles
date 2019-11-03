import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  useProfileQuery,
  useLoginMutation,
  useLogoutMutation
} from "../generated/graphql";
import { storeContext } from "../services/Store";
import { SignalingComponent } from "../signaling/SignalingComponent";

const StyledDiv = styled.div`
  justify-content: space-between;
  border-bottom: 1px solid var(--aux-color);
  background: var(--aux-color);

  #right-options {
    display: flex;
    flex-direction: row;
  }
  .nav-item {
    padding: 0.5em 0.7em 0.7em;
  }
  a {
    color: black;
    font-size: 1.2em;
    font-weight: bold;
    :visited {
      color: black;
    }
    :hover {
      filter: brightness(90%);
    }
    text-decoration: none;
  }
`;
type Props = {};

const NavItem: React.FC<{ to: string; [key: string]: any }> = ({
  to,
  children,
  ...rest
}) => {
  return (
    <div className="nav-item">
      <Link to={to} {...rest}>
        {children}
      </Link>
    </div>
  );
};

export const NavBar: React.FC<Props> = observer(() => {
  const store = useContext(storeContext);
  const [logoutFn] = useLogoutMutation();
  const { loading, data, error } = useProfileQuery();

  React.useEffect(() => {
    if (!loading) {
      if (error || !data) {
        store.setUser(null);
      } else {
        store.setUser(data.profile);
      }
    }
  }, [loading, data, error]);

  return (
    <StyledDiv className="row">
      <NavItem to="/">Papeles</NavItem>
      <div id="right-options">
        {store.user ? (
          <button
            type="button"
            onClick={async () => {
              const res = await logoutFn();
              if (!res.errors) {
                store.setUser(null);
              }
            }}
          >
            Cerrar Sesión
          </button>
        ) : (
          <>
            <NavItem to="/register">Registrarse</NavItem>
            <NavItem to="/login">Ingresar</NavItem>
          </>
        )}
      </div>
      {store.user !== null && <SignalingComponent />}
    </StyledDiv>
  );
});
