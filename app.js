require("dotenv").config();
require("console-stamp")(console);
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 4000;

io.on("connection", (client) => {
  console.log("a user connected");
  client.on("event", (data) => {
    /* … */
  });
  client.on("disconnect", () => {
    console.log("so long!");
    /* … */
  });
});

server.listen(port, () => {
  console.log(`story-time api running at http://localhost:${port}/`);
});
