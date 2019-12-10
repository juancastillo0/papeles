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
  faSave
} from "@fortawesome/free-solid-svg-icons";
import { DeletePaperPathsDocument, DeletePaperPathsMutation } from "./generated/graphql";
library.add(
  faTrashAlt,
  faDownload,
  faUpload,
  faTimes,
  faChevronCircleRight,
  faChevronCircleLeft,
  faShareAlt,
  faSave
);

// Create an http link:
const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
  credentials: "include"
});

// Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: {
    reconnect: true
  }
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
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

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
