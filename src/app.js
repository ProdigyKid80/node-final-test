const express = require("express");
const cors = require("cors");

const { serverPort } = require("./config");

const userRoutes = require("./routes/v1/users");
const wineRoutes = require("./routes/v1/wines");
const collectionRoutes = require("./routes/v1/my-wines");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Sommelier app server");
});

app.use("/v1/users", userRoutes);
app.use("/v1/wines", wineRoutes);
app.use("/v1/my-wines", collectionRoutes);

app.all("*", (req, res) => {
  res.status(404).send({ err: "Page not found" });
});

app.listen(serverPort, () =>
  console.log(`The server is running on port ${serverPort}`)
);
