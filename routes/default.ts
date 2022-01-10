import Router from "express-promise-router";
import createHttpError from "http-errors";

import isAuth from "../isAuth";
import getApi from "../utils/getApi";

const router = Router();

// me
router.get("/me", isAuth, async (req, res, next) => {
  const api = getApi(req);
  const me = await api.getMe();
  const user = {
    id: me.body.id,
    url: me.body.external_urls.spotify,
    display_name: me.body.display_name,
    email: me.body.email,
    followers: me.body.followers.total,
    product: me.body.product,
    image: me.body.images[0].url,
    country: me.body.country,
  };
  res.json(user);
});

router.get("/recents", isAuth, async (req, res, next) => {
  const api = getApi(req);
  const tracks = await api.getMyRecentlyPlayedTracks({ limit: 50 });
  res.json(
    tracks.body.items.map((x) => ({
      artists: x.track.artists.map((y) => ({
        id: y.id,
        name: y.name,
        href: y.href,
        url: y.external_urls.spotify,
      })),
      duration: x.track.duration_ms,
      url: x.track.external_urls.spotify,
      explicit: x.track.explicit,
      href: x.track.href,
      id: x.track.id,
      name: x.track.name,
      preview: x.track.preview_url,
    }))
  );
});

router.get("/top-artists/:time_range?", isAuth, async (req, res, next) => {
  try {
    const api = getApi(req);
    const time_range = req.params.time_range || ("short_term" as any);
    const response = await api.getMyTopArtists({ limit: 50, time_range });
    const artists = response.body.items.map((x) => ({
      image: x.images[0].url,
      followers: x.followers.total,
      genres: x.genres,
      id: x.id,
      name: x.name,
      popularity: x.popularity,
      url: x.external_urls.spotify,
    }));
    res.json(artists);
  } catch (error) {
    next(createHttpError(400, "Something went wrong"));
  }
});

router.get("/available-genres", isAuth, async (req, res, next) => {
  try {
    const api = getApi(req);
    const genres = await api.getAvailableGenreSeeds();
    res.json(genres.body.genres);
  } catch (error) {
    next(createHttpError(400, "Something went wrong"));
  }
});

router.post("/artist-radio/:id", isAuth, async (req, res, next) => {
  try {
    const api = getApi(req);
    const artistId = req.params.id as string;
    const genres = req.body.genres as string[];
    const myCountry = req.body.country as string;
    const artistTracks = (await api.getArtistTopTracks(artistId, myCountry)).body.tracks;

    const tracks = await api.getRecommendations({
      seed_artists: artistId,
      seed_genres: genres,
      seed_tracks: artistTracks[0].id,
      limit: 100,
    });
    res.json(
      tracks.body.tracks.map((x) => ({
        id: x.id,
        href: x.href,
        name: x.name,
        explicit: x.explicit,
        preview: x.preview_url,
        duration: x.duration_ms,
        url: x.external_urls.spotify,
        artists: x.artists.map((y) => ({ id: y.id, name: y.name, href: y.href, url: y.external_urls.spotify })),
      }))
    );
  } catch (error) {
    console.log(error);
    next(createHttpError(400, "Something went wrong"));
  }
});

router.post("/play", isAuth, async (req, res, next) => {
  try {
    const api = getApi(req);
    api.play({ device_id: req.body.deviceId, uris: req.body.uris, context_uri: req.body.context || undefined });
    res.json({ ok: true });
  } catch (error) {
    next(createHttpError(400, "Something went wrong"));
  }
});

// router.post("/", isAuth, async (req, res, next) => {
//   try {
//     const api = getApi(req);
//     res.json({ ok: true });
//   } catch (error) {
//     next(createHttpError(400, "Something went wrong"));
//   }
// });

export default router;
