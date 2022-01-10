require("dotenv").config();
import express from "express";
import bodyParser from "body-parser";
import Router from "express-promise-router";
import cors from "cors";

import authRouter from "./routes/auth";
import defaultRouter from "./routes/default";

const app = express();
app.use(
  cors({
    origin: "*",
    maxAge: process.env.NODE_ENV === "production" ? 86400 : undefined,
    exposedHeaders: ["access-token", "refresh-token", "expires-at", "content-type", "content-length"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const router = Router();
app.use(router);
app.use("/auth", authRouter);
app.use(defaultRouter);

const port = process.env.PORT || 4000;

// just to test
router.get("/", (req, res, next) => {
  res.json({ ok: true, message: "Server is running, alright!" });
});

// global error handler
router.use((err: any, _: any, res: any, next: any) => {
  if (res.headersSent) return next(err);
  if (err.statusCode) res.status(err.statusCode).send(err.message);
  else {
    console.log(err);
    res.status(500).send("internal server error");
  }
});

// listen
app.listen(port, () => {
  console.log("Server running");
});
