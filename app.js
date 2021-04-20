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
const maxUsers = process.env.MAX_USERS;
const submissionTimeLimit = process.env.SUBMISSION_TIMER_MS;

const currentUsers = [];
let userColours = ["Aqua", "Brown", "Coral", "DarkGreen", "DarkMagenta"];
const userColourMap = new Map();
let turn = 0;
let submissionId = 0;
let timer;

let submissions = [];
let currentSubmission = "";

const startGame = () => {
  io.emit("nextTurn", currentUsers[turn]);
  if (!timer) {
    timer = setInterval(nextTurn, submissionTimeLimit);
  }
};

const nextTurn = () => {
  // Add current submission to the array of prior submissions
  currentSubmission.colour = userColourMap.get(currentUsers[turn]);
  currentSubmission.submissionId = submissionId;
  submissions.push(currentSubmission);

  currentSubmission = "";
  submissionId++;

  // Increment turn. If no user exists at this index, start again at 0
  turn++;

  if (typeof currentUsers[turn] === "undefined") {
    turn = 0;
  }

  // Emit next turn and updated submissions
  io.emit("nextTurn", currentUsers[turn]);
  io.emit("submissions", submissions);
};

io.on("connection", (client) => {
  // Allow new users to join until the configured max number has been reached
  if (currentUsers.length < maxUsers) {
    currentUsers.push(client.id);
    userColourMap.set(client.id, userColours.pop());
  } else {
    client.emit("error", "Max users reached");
    client.disconnect();
    return;
  }

  if (currentUsers.length === 1) {
    startGame();
  }

  client.on("disconnect", () => {
    // Remove the user from the list of current users
    const index = currentUsers.indexOf(client.id);
    if (index > -1) {
      currentUsers.splice(index, 1);
    }

    if (currentUsers.length === 0) {
      submissions = [];
      clearInterval(timer);
      timer = null;
      turn = 0;
      userColours = ["Aqua", "Brown", "Coral", "DarkGreen", "DarkMagenta"];
    }
  });

  client.on("newText", (data) => {
    // Broadcast current text to everyone except the sender
    client.broadcast.emit("currentSubmission", data);
    currentSubmission = data;
  });
});

server.listen(port, () => {
  console.log(`story-time api running at http://localhost:${port}/`);
});
