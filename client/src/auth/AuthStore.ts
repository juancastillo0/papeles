import { observable, action } from "mobx";

type userProfile = { id: string; name: string; email: string } | null;
export class AuthStore {
  @action.bound reset() {
    this.user = null;
  }

  @observable user: userProfile = null;

  @action.bound setUser(user: userProfile) {
    this.user = user;
  }
}
