import { action, observable } from "mobx";
import { actionAsync, task } from "mobx-utils";
import { LoginMutationVariables, RegisterMutationVariables } from "../generated/graphql";
import { Store, useStore } from "../services/Store";
import { AuthApi } from "./AuthApi";

export type UserProfile = { id: string; name: string; email: string } | null;

export class AuthStore {
  @observable requestingProfile = true;
  @observable user: UserProfile = null;

  constructor(private store: Store, private api: AuthApi) {
    const user = localStorage.getItem("user");
    if (user) {
      this.user = JSON.parse(user);
    }
    this.requestProfile();
  }

  @actionAsync
  requestProfile = async () => {
    const { data } = await task(this.api.profile({}));
    if (data && data.profile) {
      this.setUser(data.profile);
    } else {
      this.setUser(null);
    }
    this.requestingProfile = false;
  };

  @action.bound setUser(user: UserProfile) {
    this.user = user;
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }

  @action login = async (variables: LoginMutationVariables) => {
    const { data, errors } = await this.api.login(variables);
    if (data) {
      if (data.login.error) {
        return data.login.error;
      } else {
        this.setUser(data.login.user);
        return null;
      }
    } else {
      console.log(errors);
      return "No se pudo realizar la petición, por favor intenta más tarde.";
    }
  };

  @action logout = async () => {
    const { data, errors } = await this.api.logout({});
    if (data) {
      if (data.logout) {
        return data.logout.error;
      } else {
        this.setUser(null);
        return null;
      }
    } else {
      console.log(errors);
      return "No se pudo realizar la petición, por favor intenta más tarde.";
    }
  };

  @action register = async (variables: RegisterMutationVariables) => {
    const { data, errors } = await this.api.register(variables);
    if (data) {
      if (data.register.error) {
        return data.register.error;
      } else {
        this.setUser(data.register.user);
        return null;
      }
    } else {
      console.log(errors);
      return "No se pudo realizar la petición, por favor intenta más tarde.";
    }
  };
}

export function useAuthStore() {
  const store = useStore();
  return store.authStore;
}
