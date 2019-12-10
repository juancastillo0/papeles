import { observer } from "mobx-react-lite";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { AUTH_PATHS, SIGNUP_PATHS } from "../auth/Auth";
import { useLogoutMutation, useProfileQuery } from "../generated/graphql";
import { useStores } from "../services/Store";
import { SignalingComponent } from "../signaling/SignalingComponent";

const NavItem = styled(Link)<{ active?: boolean }>`
  display: flex;
  padding: 0.6em 0.7em;
  border-bottom: 2px solid
    ${p => (p.active ? p.theme.colors.secondary : "transparent")};
  :hover {
    font-weight: bolder;
    cursor: pointer;
  }
  :focus {
    font-weight: bolder;
    outline: none;
  }
  color: black;
  font-size: 1.1em;
  margin: auto;
  :visited {
    color: black;
  }
  text-decoration: none;

  @media (max-width: ${p => p.theme.breakpoint.sm}) {
    padding: 0.5em 0.6em;
  }
`;

const StyledDiv = styled.div`
  justify-content: space-between;
  box-shadow: 0 0 4px 1px var(--aux-color);
  background: var(--secondary-color);
  z-index: 2;
  width: 100%;

  #right-options {
    display: flex;
    flex-direction: row;
  }
  > ${NavItem}:first-of-type {
    margin-left: 0;
    font-size: 1.2em;
  }

  @media (min-width: ${p => p.theme.breakpoint.sm}) {
    > ${NavItem}:first-of-type {
      margin-left: 0.7em;
    }
    #right-options {
      margin-right: 0.8em;
    }
  }
`;
type Props = {};

export const NavBar: React.FC<Props> = observer(() => {
  const { authStore } = useStores();
  const [logoutFn] = useLogoutMutation();
  const { loading, data, error } = useProfileQuery();

  const location = useLocation();
  let activePage: "main" | "signup" | "login" = "main";
  if (SIGNUP_PATHS.includes(location.pathname)) {
    activePage = "signup";
  } else if (AUTH_PATHS.includes(location.pathname)) {
    activePage = "login";
  }
  
  React.useEffect(() => {
    if (!loading) {
      if (error || !data) {
        authStore.setUser(null);
      } else {
        authStore.setUser(data.profile);
      }
    }
  }, [authStore, loading, data, error]);

  return (
    <StyledDiv className="row">
      <NavItem to="/" active={activePage == "main"}>
        Papeles
      </NavItem>
      <div id="right-options">
        {authStore.user ? (
          <button
            type="button"
            onClick={async () => {
              const res = await logoutFn();
              if (!res.errors) {
                authStore.setUser(null);
              }
            }}
          >
            Cerrar Sesión
          </button>
        ) : (
          <>
            <NavItem to="/register" active={activePage == "signup"}>
              Registrarse
            </NavItem>
            <NavItem to="/login" active={activePage == "login"}>
              Ingresar
            </NavItem>
          </>
        )}
      </div>
      {authStore.user !== null && <SignalingComponent />}
    </StyledDiv>
  );
});
