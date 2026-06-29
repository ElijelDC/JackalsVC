export type RegisterStep = "vly" | "photo" | "pending" | "email" | "password";

export const REGISTER_STEP_HINTS: Record<RegisterStep, string> = {
  vly: "Step 1 of 4 · VLY number",
  photo: "Step 2 of 4 · Photo upload",
  pending: "Step 2 of 4 · Awaiting approval",
  email: "Step 3 of 4 · Verify email",
  password: "Step 4 of 4 · Password",
};

export const REGISTER_STEP_DESCRIPTIONS: Record<RegisterStep, string> = {
  vly: "Enter the VLY number listed on your club roster to begin.",
  photo:
    "Upload a clear photo of your VLY membership card and the email where we should notify you.",
  pending:
    "Your photo is with an admin for review. We'll email you when you can continue.",
  email:
    "Confirm your email with a 6-digit code. If you already gave us an email for photo approval, we'll use that one.",
  password: "Choose a password to finish creating your account.",
};
