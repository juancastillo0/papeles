import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { ApolloProvider } from "@apollo/react-hooks";
import { split } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faTrashAlt,
  faDownload,
  faUpload,
  faTimes,
  faChevronCircleRight,
  faChevronCircleLeft,
  faShareAlt,
  faSave,
  faPlus,
  faPencilAlt,
  faEraser,
  faArrowsAlt,
  faVectorSquare,
  faCheck,
  faSearch
} from "@fortawesome/free-solid-svg-icons";
import { ThemeProvider, DefaultTheme } from "styled-components";
library.add(
  faTrashAlt,
  faDownload,
  faUpload,
  faTimes,
  faChevronCircleRight,
  faChevronCircleLeft,
  faShareAlt,
  faSave,
  faPlus,
  faPencilAlt,
  faEraser,
  faArrowsAlt,
  faVectorSquare,
  faCheck,
  faSearch
);

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include"
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: {
    reconnect: true
  }
});

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({ link, cache: new InMemoryCache() });

export const theme: DefaultTheme = {
  borderRadius: "7px",
  colors: {
    auxLight: "rgb(235, 235, 235)",
    auxLighter: "rgb(250, 250, 250)",

    primary: "#f4f9fc",
    primaryLight: "#ffffff",
    primaryDark: "#c1c6c9",

    secondary: "#006064",
    secondaryLight: "#428e92",
    secondaryDark: "#00363a"
  },
  breakpoint: {
    xs: "576px",
    sm: "768px",
    md: "992px",
    lg: "1200px"
  }
};

function setThemeVars(theme: any, prefix: string = "") {
  for (let [key, value] of Object.entries(theme)) {
    if (typeof value === "string") {
      document.documentElement.style.setProperty(
        `--${prefix ? prefix + "-" : ""}${key}`,
        value
      );
    } else {
      setThemeVars(value, prefix ? `${prefix}-${key}` : key);
    }
  }
}
setThemeVars(theme, "");

ReactDOM.render(
  <ApolloProvider client={client}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </ApolloProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
