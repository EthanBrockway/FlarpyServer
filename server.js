const { MongoClient } = require("mongodb")
const Express = require("express")
const BodyParser = require("body-parser")

const server = Express()

server.use(BodyParser.json())
server.use(BodyParser.urlencoded({ extended: true }))

const uri = "mongodb+srv://Skronkie:Colby6213@cluster0.6eobr.mongodb.net/"
const client = new MongoClient(uri)

var collection

server.post("/users", async (request, response, next) => {
  try {
    console.log(request.body)
    const doesUserExist = await collection.findOneAndUpdate(
      {
        username: request.body.username,
      },
      {
        $set: { highscore: request.body.highscore },
      }
    )
    if (!doesUserExist) {
      await collection.insertOne(request.body)
    }
    response.sendStatus(200)
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})
server.get("/users", async (request, response, next) => {
  try {
    let result = await collection
      .find({}, { projection: { username: 1, highscore: 1, _id: 0 } })
      .sort({ highscore: -1 })
      .toArray()
    response.send(result)
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})
server.get("/users/:username", async (request, response, next) => {
  try {
    let result = await collection.findOne({ username: request.params.username })

    response.send(result)
  } catch (e) {
    respond.status(500).send({ message: e.message })
  }
})
server.delete("/users/:username", async (request, response, next) => {
  try {
    result = await collection.deleteMany({ username: request.params.username })
    response.send(result)
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})
server.listen("3000", async () => {
  try {
    await client.connect()
    collection = client.db("Flarpy-Bard").collection("users")
    console.log("Listening on port 3000!")
  } catch (e) {
    console.error(e)
  }
})
