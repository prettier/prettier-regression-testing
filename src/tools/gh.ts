import spawn from "nano-spawn";

export async function prCheckout(prNumber: string, cwd: string): Promise<void> {
  await spawn("gh", ["pr", "checkout", prNumber], { cwd });
}

export async function authLoginWithToken(token: string): Promise<void> {
  await spawn('echo', [token]).pipe("gh", ["auth", "login", "--with-token"])
}
