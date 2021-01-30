import execa from "execa";

export function prCheckout(prNumber: string, cwd: string) {
  return execa("gh", ["pr", "checkout", prNumber], { cwd });
}

export function authLoginWithToken(token: string) {
  return execa("gh", ["auth", "login", "--with-token"], { input: token });
}
