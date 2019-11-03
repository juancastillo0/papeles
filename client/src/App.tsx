import React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { Main } from "./main/Main";
import { Auth, AUTH_PATHS } from "./auth/Auth";
import { NavBar } from "./components/NavBar";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NavBar />
      <Route exact path="/" component={Main} />
      <Route exact path={AUTH_PATHS} component={Auth} />
    </BrowserRouter>
  );
};

export default App;
