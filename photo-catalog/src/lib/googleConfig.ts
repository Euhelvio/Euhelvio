// OAuth client IDs and browser API keys are meant to be embedded in
// client-side code (Google's own docs say so) — unlike a client secret,
// they identify the app, not authenticate it. Access still requires the
// user's own Google sign-in and consent.
export const GOOGLE_CLIENT_ID =
  "253774780637-dn8jkq376h38i7f57otuupmlohuj9qfv.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "AIzaSyCozC69K9CfFoEGjDgUugm30WwchwQjlps";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
