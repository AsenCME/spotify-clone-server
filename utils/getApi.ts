import SpotifyApi from "spotify-web-api-node";
export default function getApi(req: any) {
  // @ts-ignore
  return req.spotifyApi as SpotifyApi;
}
