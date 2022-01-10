import SpotifyWebApi from "spotify-web-api-node";

declare namespace Express {
  export interface Request {
    spotifyApi?: SpotifyWebApi;
  }
}
