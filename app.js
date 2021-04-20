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
//const userColours = ["Aqua", "Brown", "Coral", "DarkGreen", "DarkMagenta"];

const submissions = [];
let currentSubmission = "";

const nextTurn = () => {
  // Add current submission to the array of prior submissions
  submissions.push(currentSubmission);
  currentSubmission = "";

  // Emit next turn and updated submissions
  io.emit("nextTurn", currentUsers[0]);
  io.emit("submissions", submissions);
};

io.on("connection", (client) => {
  // Allow new users to join until the configured max number has been reached
  if (currentUsers.length < maxUsers) {
    currentUsers.push(client.id);
    //console.log(currentUsers);
  } else {
    client.emit("error", "Max users reached");
    client.disconnect();
    return;
  }

  client.on("disconnect", () => {
    // Remove the user from the list of current users
    const index = currentUsers.indexOf(client.id);
    if (index > -1) {
      currentUsers.splice(index, 1);
    }
  });

  client.on("newText", (data) => {
    // Broadcast current text to everyone except the sender
    client.broadcast.emit("currentSubmission", data);
    currentSubmission = data;
    console.log(currentSubmission);
  });
});

server.listen(port, () => {
  console.log(`story-time api running at http://localhost:${port}/`);
});
