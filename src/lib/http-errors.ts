/**
 * Turns HTTP status codes into short, actionable copy for end users.
 */
export function describeHttpError(status: number, context?: string): string {
  const action = context?.replace(/\.$/, "").toLowerCase();

  switch (status) {
    case 400:
      return action
        ? `Couldn't ${action} because some details were invalid. Check the form and try again.`
        : "Some details were invalid. Check the form and try again.";
    case 401:
      return "You're not signed in. Sign in again and try again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return action
        ? `Couldn't ${action} because this item was not found. Refresh the page and try again.`
        : "That item was not found. Refresh the page and try again.";
    case 409:
      return action
        ? `Couldn't ${action} because it was already handled. Refresh the page to see the latest status.`
        : "This was already handled. Refresh the page to see the latest status.";
    case 413:
      return "That file is too large. Choose a smaller image and try again.";
    case 422:
      return action
        ? `Couldn't ${action} with the information provided. Check the details and try again.`
        : "The information provided wasn't accepted. Check the details and try again.";
    case 429:
      return "Too many requests. Wait a moment and try again.";
    case 500:
      return action
        ? `Couldn't ${action} because something went wrong on the server. Wait a moment and try again.`
        : "Something went wrong on the server. Wait a moment and try again.";
    case 502:
      return action
        ? `Couldn't ${action} because the server didn't respond in time. Refresh the page to check whether it went through, then try again.`
        : "The server didn't respond in time. Refresh the page to check whether your last action went through, then try again.";
    case 503:
      return "The site is temporarily unavailable. Try again in a minute.";
    case 504:
      return action
        ? `Couldn't ${action} because the request timed out. Refresh the page to check whether it went through before trying again.`
        : "The request timed out. Refresh the page to check whether your last action went through before trying again.";
    default:
      if (status >= 500) {
        return action
          ? `Couldn't ${action} because of a server problem. Try again shortly.`
          : "Something went wrong on the server. Try again shortly.";
      }
      return action
        ? `Couldn't ${action}. Please try again.`
        : "Something went wrong. Please try again.";
  }
}

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Check your internet connection and try again.";
