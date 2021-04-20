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
const userColourMap = new Map();
let userColours = ["Aqua", "Brown", "Coral", "DarkGreen", "DarkMagenta"];

let turn = 0;
let submissionId = 0;
let timer;

let submissions = [];
let currentSubmission = { text: "" };

const startGame = () => {
  // Kick off first turn and start the timer
  io.emit("nextTurn", currentUsers[turn]);
  if (!timer) {
    timer = setInterval(nextTurn, submissionTimeLimit);
  }
};

const nextTurn = () => {
  // Add the user's assigned colour and a submissionId to the submission
  currentSubmission.colour = userColourMap.get(currentUsers[turn]);
  currentSubmission.submissionId = submissionId;

  // Add current submission to the array of prior submissions
  submissions.push(currentSubmission);

  // Reset the currentSubmission value to be blank and increment ID for the next user
  currentSubmission = { text: "" };
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

    // Assign the user a unique colour from what's still available
    userColourMap.set(client.id, userColours.pop());
  } else {
    client.emit("error", "Max users reached");
    client.disconnect();
    return;
  }

  // Assume that a single user is the start of the game
  if (currentUsers.length === 1) {
    startGame();
  }

  client.on("disconnect", () => {
    // Remove the user from the list of current users
    const index = currentUsers.indexOf(client.id);
    if (index > -1) {
      currentUsers.splice(index, 1);
    }

    // If we have no users left in our array, reset everything
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
