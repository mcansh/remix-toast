import {
  createCookieSessionStorageFactory,
  createCookieFactory,
  redirect,
  json,
  SessionIdStorageStrategy,
  SessionStorage,
} from "@remix-run/server-runtime";
import { FlashSessionValues, ToastMessage, flashSessionValuesSchema } from "./schema";
import { sign, unsign } from "./crypto";

export type { ToastMessage };

const FLASH_SESSION = "flash";
const createCookie = createCookieFactory({ sign, unsign });

const defaultCookieOptions: SessionIdStorageStrategy["cookie"] = {
  name: "toast-session",
  sameSite: "lax",
  path: "/",
  httpOnly: true,
  secrets: ["s3Cr3t"],
};

const defaultSessionStorage = createCookieSessionStorageFactory(createCookie)({ cookie: defaultCookieOptions });

export function createRemixToast(cookieOptions: SessionIdStorageStrategy["cookie"] = defaultCookieOptions) {
  const cookieOptionsWithDefaults: SessionIdStorageStrategy["cookie"] = {
    ...defaultCookieOptions,
    ...cookieOptions,
  };

  const createCookieSessionStorage = createCookieSessionStorageFactory(createCookie);
  const sessionStorage = createCookieSessionStorage({ cookie: cookieOptionsWithDefaults });

  return {
    jsonWithToast<T>(data: T, toast: ToastMessage, init?: ResponseInit) {
      return jsonWithToast(data, toast, init, sessionStorage);
    },
    jsonWithSuccess<T>(data: T, message: string, init?: ResponseInit) {
      return jsonWithSuccess(data, message, init, sessionStorage);
    },
    jsonWithError<T>(data: T, message: string, init?: ResponseInit) {
      return jsonWithError(data, message, init, sessionStorage);
    },
    jsonWithInfo<T>(data: T, message: string, init?: ResponseInit) {
      return jsonWithInfo(data, message, init, sessionStorage);
    },
    jsonWithWarning<T>(data: T, message: string, init?: ResponseInit) {
      return jsonWithWarning(data, message, init, sessionStorage);
    },
    redirectWithToast(url: string, toast: ToastMessage, init?: ResponseInit) {
      return redirectWithToast(url, toast, init, sessionStorage);
    },
    redirectWithSuccess(url: string, message: string, init?: ResponseInit) {
      return redirectWithSuccess(url, message, init, sessionStorage);
    },
    redirectWithError(url: string, message: string, init?: ResponseInit) {
      return redirectWithError(url, message, init, sessionStorage);
    },
    redirectWithInfo(url: string, message: string, init?: ResponseInit) {
      return redirectWithInfo(url, message, init, sessionStorage);
    },
    redirectWithWarning(url: string, message: string, init?: ResponseInit) {
      return redirectWithWarning(url, message, init, sessionStorage);
    },
    getToast(request: Request) {
      return getToast(request, sessionStorage);
    },
  };
}

function getSessionFromRequest(request: Request, sessionStorage: SessionStorage) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

async function flashMessage(
  flash: FlashSessionValues,
  headers?: ResponseInit["headers"],
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  const session = await sessionStorage.getSession();
  session.flash(FLASH_SESSION, flash);
  const cookie = await sessionStorage.commitSession(session);
  const newHeaders = new Headers(headers);
  newHeaders.append("Set-Cookie", cookie);
  return newHeaders;
}

export async function redirectWithFlash(
  url: string,
  flash: FlashSessionValues,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return redirect(url, {
    ...init,
    headers: await flashMessage(flash, init?.headers, sessionStorage),
  });
}

export async function jsonWithFlash<T>(
  data: T,
  flash: FlashSessionValues,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return json(data, {
    ...init,
    headers: await flashMessage(flash, init?.headers, sessionStorage),
  });
}

/**
 * Helper method used to display a toast notification without redirection
 *
 * @param data Generic object containing the data
 * @param toast Toast message and it's type
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns data with toast cookie set
 */
export function jsonWithToast<T>(
  data: T,
  toast: ToastMessage,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return jsonWithFlash(data, { toast }, init, sessionStorage);
}

/**
 * Helper method used to generate a JSON response object with a success toast message.
 *
 * @param data The data to be included in the response.
 * @param message The message for the success toast notification.
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns a JSON response object with the specified success toast message.
 */
export function jsonWithSuccess<T>(
  data: T,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return jsonWithToast(data, { message, type: "success" }, init, sessionStorage);
}

/**
 * Helper method used to generate a JSON response object with an error toast message.
 *
 * @param data The data to be included in the response.
 * @param message The message for the error toast notification.
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns a JSON response object with the specified error toast message.
 */
export function jsonWithError<T>(
  data: T,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return jsonWithToast(data, { message, type: "error" }, init, sessionStorage);
}

/**
 * Helper method used to generate a JSON response object with an info toast message.
 *
 * @param data The data to be included in the response.
 * @param message The message for the info toast notification.
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns a JSON response object with the specified info toast message.
 */
export function jsonWithInfo<T>(
  data: T,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return jsonWithToast(data, { message, type: "info" }, init, sessionStorage);
}

/**
 * Helper method used to generate a JSON response object with a warning toast message.
 *
 * @param data The data to be included in the response.
 * @param message The message for the warning toast notification.
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns a JSON response object with the specified warning toast message.
 */
export function jsonWithWarning<T>(
  data: T,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return jsonWithToast(data, { message, type: "warning" }, init, sessionStorage);
}

/**
 * Helper method used to redirect the user to a new page with a toast notification
 *
 * If thrown it needs to be awaited
 * @param url Redirect URL
 * @param toast Toast message and it's type
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns redirect response with toast cookie set
 */
export function redirectWithToast(
  url: string,
  toast: ToastMessage,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return redirectWithFlash(url, { toast }, init, sessionStorage);
}
/**
 * Helper method used to redirect the user to a new page with an error toast notification
 *
 * If this method is thrown it needs to be awaited, otherwise it can just be returned
 * @param redirectUrl Redirect url
 * @param message Message to be shown as info
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns redirect response with toast cookie set
 */
export function redirectWithError(
  redirectUrl: string,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return redirectWithToast(redirectUrl, { message: `${message}`, type: "error" }, init, sessionStorage);
}

/**
 * Helper method used to redirect the user to a new page with a success toast notification
 *
 * If this method is thrown it needs to be awaited, otherwise it can just be returned
 * @param redirectUrl Redirect url
 * @param message Message to be shown as info
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns redirect response with toast cookie set
 */
export function redirectWithSuccess(
  redirectUrl: string,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return redirectWithToast(redirectUrl, { message: `${message}`, type: "success" }, init, sessionStorage);
}

/**
 * Helper method used to redirect the user to a new page with a warning toast notification
 *
 * If this method is thrown it needs to be awaited, otherwise it can just be returned
 * @param redirectUrl Redirect url
 * @param message Message to be shown as info
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns redirect response with toast cookie set
 */
export function redirectWithWarning(
  redirectUrl: string,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return redirectWithToast(redirectUrl, { message: `${message}`, type: "warning" }, init, sessionStorage);
}

/**
 * Helper method used to redirect the user to a new page with a info toast notification
 *
 * If this method is thrown it needs to be awaited, otherwise it can just be returned
 * @param redirectUrl Redirect url
 * @param message Message to be shown as info
 * @param init Additional response options (status code, additional headers etc)
 * @returns Returns redirect response with toast cookie set
 */
export function redirectWithInfo(
  redirectUrl: string,
  message: string,
  init?: ResponseInit,
  sessionStorage: SessionStorage = defaultSessionStorage,
) {
  return redirectWithToast(redirectUrl, { message: `${message}`, type: "info" }, init, sessionStorage);
}

/**
 * Helper method used to get the toast data from the current request and purge the flash storage from the session
 * @param request Current request
 * @returns Returns the the toast notification if exists, undefined otherwise and the headers needed to purge it from the session
 */
export async function getToast(
  request: Request,
  sessionStorage: SessionStorage = defaultSessionStorage,
): Promise<{ toast: ToastMessage | undefined; headers: Headers }> {
  const session = await getSessionFromRequest(request, sessionStorage);
  const result = flashSessionValuesSchema.safeParse(session.get(FLASH_SESSION));
  const flash = result.success ? result.data : undefined;
  const headers = new Headers({ "Set-Cookie": await sessionStorage.commitSession(session) });
  const toast = flash?.toast;
  return { toast, headers };
}
