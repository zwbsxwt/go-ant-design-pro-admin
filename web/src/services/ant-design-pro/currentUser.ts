// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** Get current signed-in user GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{ data?: API.CurrentUser }>("/api/currentUser", {
    method: "GET",
    ...(options || {}),
  });
}
