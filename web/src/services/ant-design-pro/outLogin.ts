// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** Sign out POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<{ success?: boolean }>("/api/login/outLogin", {
    method: "POST",
    ...(options || {}),
  });
}
