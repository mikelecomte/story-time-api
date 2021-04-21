const MongoClient = require("mongodb").MongoClient;

const persistMessage = async (message) => {
  // Discard blank messages
  if (!message.text) {
    return;
  }

  let client;

  try {
    client = await MongoClient.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const database = client.db("storyTime");
    const messages = database.collection("messages");

    // Create a document to be inserted
    const result = await messages.insertOne(message);

    console.log(
      `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`
    );
  } catch (error) {
    console.log(error);
  } finally {
    if (client) await client.close();
  }
};

module.exports = {
  persistMessage,
};
