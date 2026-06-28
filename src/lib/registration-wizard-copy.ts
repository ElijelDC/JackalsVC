export type RegisterStep = "vly" | "photo" | "pending" | "email" | "verify" | "password";

export const REGISTER_STEP_HINTS: Record<RegisterStep, string> = {
  vly: "Step 1 of 5 · VLY number",
  photo: "Step 2 of 5 · Photo upload",
  pending: "Step 2 of 5 · Awaiting approval",
  email: "Step 3 of 5 · Email",
  verify: "Step 4 of 5 · Confirm email",
  password: "Step 5 of 5 · Password",
};

export const REGISTER_STEP_DESCRIPTIONS: Record<RegisterStep, string> = {
  vly: "Enter the VLY number listed on your club roster to begin.",
  photo:
    "Upload a clear photo of your VLY membership card and the email where we should notify you.",
  pending:
    "Your photo is with an admin for review. We'll email you when you can continue.",
  email:
    "We'll send a verification code to the email on your registration — no need to enter it again if you already provided one.",
  verify: "Enter the 6-digit code we sent to your email.",
  password: "Choose a password to finish creating your account.",
};
