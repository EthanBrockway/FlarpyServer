require("dotenv").config()

const { MongoClient } = require("mongodb")
const Express = require("express")
const BodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const server = Express()

server.use(BodyParser.json())
server.use(BodyParser.urlencoded({ extended: true }))

const uri = "mongodb+srv://Skronkie:Colby6213@cluster0.6eobr.mongodb.net/"
const client = new MongoClient(uri)

var collection

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
server.get("/users/all", authenticateToken, async (request, response, next) => {
  try {
    let result = await collection.find().toArray()

    response.send(result)
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})

server.post("/users/login", async (request, response) => {
  let result = await collection.find().toArray()
  const user = result.find((user) => user.username === request.body.username)
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)

  if (user == null) {
    return response.status(400).send("Cannot find user")
  }
  try {
    if (await bcrypt.compare(request.body.password, user.password)) {
      response.json({ accessToken: accessToken })
    } else {
      response.send("Not Allowed")
    }
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})

server.post("/users", async (request, response, next) => {
  try {
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(request.body.password, salt)
    const user = {
      email: request.body.email,
      username: request.body.username,
      password: hashedPassword,
    }
    // await collection.findOne(
    //   {
    //     username: request.body.username,
    //   },
    //   {
    //     $set: { highscore: request.body.highscore },
    //   }
    // )
    // if (!doesUserExist) {
    await collection.insertOne(user)
    // }
    response.sendStatus(200)
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})
server.delete("/users", async (request, response, next) => {
  try {
    result = await collection.deleteMany()
    response.send(result)
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})
function authenticateToken(request, response, next) {
  const authHeader = request.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  if (token == null) return response.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return response.sendStatus(403)
    request.user = user
    next()
  })
}
server.listen(3000, async () => {
  try {
    await client.connect()
    collection = client.db("Flarpy-Bard").collection("users")
    console.log("Listening on port 3000")
  } catch (e) {
    console.error(e)
  }
})
