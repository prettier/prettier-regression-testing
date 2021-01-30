import execa from "execa";

export async function prCheckout(prNumber: string, cwd: string) {
  await execa("gh", ["pr", "checkout", prNumber], { cwd });
}

export async function authLoginWithToken(token: string) {
  await execa("gh", ["auth", "login", "--with-token"], { input: token });
}
