import React from "react";
import { BrowserRouter, Route, useLocation } from "react-router-dom";
import { Main } from "./main/Main";
import { Auth, AUTH_PATHS } from "./auth/Auth";
import { NavBar } from "./components/NavBar";
import { Modal } from "./components/Modal";
import { storeContext, Store } from "./services/Store";
import { createIndexedDB } from "./services/IndexedDB";
import { client } from ".";

const Routes = () => {
  const location = useLocation();
  const rootElem = document.getElementById("root")!;
  React.useEffect(() => {
    if (location.pathname === "/") {
      rootElem.style.height = "100%";
    } else {
      rootElem.style.height = null;
    }
  });
  return (
    <>
      <Route exact path="/" component={Main} />
      <Route exact path={AUTH_PATHS} component={Auth} />
    </>
  );
};

const App: React.FC = () => {
  const [store, setStore] = React.useState<Store | null>(null);
  React.useEffect(() => {
    if (!store) {
      createIndexedDB().then(async db => {
        const papers = await db.fetchPapers();
        const _store = new Store(db, client, papers);
        (window as any).store = _store;
        setStore(_store);
      });
    } else if (store.resetStore) {
      setStore(null);
    }
  }, [store, store ? store.resetStore : false]);

  if (!store) {
    return <div></div>;
  }

  return (
    <storeContext.Provider value={store}>
      <BrowserRouter>
        <NavBar />
        <Routes />
        <Modal />
      </BrowserRouter>
    </storeContext.Provider>
  );
};

export default App;
