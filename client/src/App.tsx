import React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { Main } from "./main/Main";

const App: React.FC = () => {
  return (
    <>
      <BrowserRouter>
        <Route exact path="/" component={Main} />
      </BrowserRouter>
    </>
  );
};

export default App;
