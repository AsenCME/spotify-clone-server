require("dotenv").config();
import Router from "express-promise-router";
import SpotifyApi from "spotify-web-api-node";
import createHttpError from "http-errors";

const router = Router();

const scopes = [
  "ugc-image-upload",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-private",
  "user-read-email",
  "user-follow-modify",
  "user-follow-read",
  "user-library-modify",
  "user-library-read",
  "streaming",
  "app-remote-control",
  "user-read-playback-position",
  "user-top-read",
  "user-read-recently-played",
  "playlist-modify-private",
  "playlist-read-collaborative",
  "playlist-read-private",
  "playlist-modify-public",
];
const clientId = process.env.SPOTIFY_CLIENT_ID || "";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
const redirectUri = process.env.SPOTIFY_CALLBACK_URL || "";
const state = process.env.SPOTIFY_STATE || "";

router.get("/", async (req, res, next) => {
  const api = new SpotifyApi({ clientId, clientSecret, redirectUri });
  const uri = api.createAuthorizeURL(scopes, state, true);
  res.redirect(uri);
});

router.get("/callback", async (req, res, next) => {
  if (req.query.state !== state) return next(createHttpError(404, "Invalid login state"));
  const api = new SpotifyApi({ clientId, clientSecret, redirectUri });
  api.authorizationCodeGrant(req.query.code as any, (err, spotifyRes) => {
    if (err) return next(createHttpError(401, "Could not authorize you :("));
    const expires_at = spotifyRes.body.expires_in * 1000 + Date.now();
    res.redirect(
      `http://localhost:3000/auth/success?access-token=${spotifyRes.body.access_token}&refresh-token=${spotifyRes.body.refresh_token}&expires-at=${expires_at}`
    );
  });
});

router.get("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.headers["refresh-token"] as string;
    console.log("Refreshing with token", refreshToken);
    const api = new SpotifyApi({ clientId, clientSecret, redirectUri, refreshToken });
    const response = await api.refreshAccessToken();
    res.json({ ok: true, access_token: response.body.access_token, expires_at: response.body.expires_in * 1000 + Date.now() });
  } catch (error) {
    next(createHttpError(400, "Could not refresh the token"));
  }
});

export default router;
