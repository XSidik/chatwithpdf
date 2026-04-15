import AxiosInstance from "./AxiosInstance";
import { ApiUrl } from "../utils/env";
import { getHeader } from "@/utils/Helper";

export default class FileService {
  async uploadFile(formData) {
    return AxiosInstance({
      method: "post",
      url: `${ApiUrl}/file/upload`,
      data: formData,
      headers: getHeader("multipart"),
    }).then((res) => res.data);
  }

  async getFileHistory(page = 1, pageSize = 10) {
    return AxiosInstance({
      method: "get",
      url: `${ApiUrl}/file/history?page=${page}&pageSize=${pageSize}`,
      headers: getHeader(),
    }).then((res) => res.data);
  }
}
