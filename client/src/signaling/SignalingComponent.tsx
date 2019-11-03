import React from "react";
import { observer } from "mobx-react-lite";
import { useSignalsSubscription } from "../generated/graphql";
import { storeContext } from "../services/Store";

type Props = {};

export const SignalingComponent: React.FC<Props> = observer(() => {
  const store = React.useContext(storeContext);
  const { data } = useSignalsSubscription();

  React.useEffect(() => {
    if (data) {
      store.handleSignal(data.signals);
    }
  }, [data]);

  return <div style={{ display: "none" }} />;
});
