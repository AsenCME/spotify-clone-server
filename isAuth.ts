import { Request, Response, NextFunction } from "express";
import SpotifyApi from "spotify-web-api-node";
import createHttpError from "http-errors";

declare module "express" {
  interface Request {
    spotifyApi: SpotifyApi;
  }
}

const clientId = process.env.SPOTIFY_CLIENT_ID || "";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
const redirectUri = process.env.SPOTIFY_CALLBACK_URL || "";

export default async function isAuth(req: Request, res: Response, next: NextFunction) {
  // get stuff from headers
  const accessToken = req.headers["access-token"] as string;
  const refreshToken = req.headers["refresh-token"] as string;
  const expiresAt = Number(req.headers["expires-at"]) || 0;

  res.setHeader("access-token", accessToken);
  res.setHeader("expires-at", expiresAt);

  if (!accessToken || !refreshToken) return next(createHttpError(401, "Invalid or missing access/refresh token."));
  if (Date.now() > expiresAt) {
    try {
      const refreshToken = req.headers["refresh-token"] as string;
      const api = new SpotifyApi({ clientId, clientSecret, redirectUri, refreshToken });
      const response = await api.refreshAccessToken();
      console.log("[isAuth] Refreshing access token");
      console.log("[isAuth] old token -", accessToken, "\r\nnew token -", response.body.access_token);
      res.setHeader("access-token", response.body.access_token);
      res.setHeader("expires-at", response.body.expires_in * 1000 + Date.now());
    } catch (error) {
      next(createHttpError(400, "Token expired and could not be refreshed"));
    }
  }

  // use api later
  req.spotifyApi = new SpotifyApi({
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    redirectUri,
  });

  // next
  next();
}
