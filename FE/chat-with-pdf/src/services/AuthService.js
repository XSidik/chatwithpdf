import Cookies from "js-cookie";
import { ApiUrl } from "../utils/env";
import AxiosInstance from "./AxiosInstance";

const saveToken = async (token) => {
  Cookies.set("token", token, {
    expires: 30,
    path: "/",
  });
};

const saveRefreshToken = async (token) => {
  Cookies.set("refreshToken", token, {
    expires: 30,
    path: "/",
  });
};

const saveUser = async (user) => {
  Cookies.set("user", user, {
    expires: 30,
    path: "/",
  });
};

export default class AuthService {
  async doLoginGoogle(form) {
    return AxiosInstance({
      method: "post",
      url: `${ApiUrl}/account/login`,
      data: form,
    }).then(async (res) => {
      let dataRes = res?.data?.data;
      const user = JSON.stringify(dataRes?.user)
      await saveToken(dataRes?.token);
      await saveRefreshToken(dataRes?.refreshToken);
      await saveUser(user);
      return res?.data;

    });
  }

  doLogout() {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    Cookies.remove("user");
  }
}
