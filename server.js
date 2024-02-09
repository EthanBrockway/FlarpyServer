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

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(/^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/)
}

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
server.get("/users", async (request, response, next) => {
  try {
    let result = await collection
      .find(
        {},
        {
          projection: {
            username: 1,
            highscore: 1,
            _id: 0,
            currentSelectedSkin: 0,
          },
        }
      )
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
server.get("/users/:username", async (request, response, next) => {
  try {
    let result = await collection.findOne({
      username: request.params.username,
    })
    console.log(result)
    response.send(result)
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})

server.post("/users/login", async (request, response) => {
  const result = await collection.find().toArray()
  const user = result.find((user) => user.username === request.body.username)
  if (user == null) {
    return response.status(401).send("not a valid username")
  }
  try {
    if (await bcrypt.compare(request.body.password, user.password)) {
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
      response.json({ accessToken: accessToken })
    } else {
      response.status(401).send("Not Allowed")
    }
  } catch (e) {
    response.status(500).send({ message: e.message })
  }
})

server.post("/users", authenticateAPI, async (request, response, next) => {
  try {
    if (validateEmail(request.body.email)) {
      const salt = await bcrypt.genSalt()
      const hashedPassword = await bcrypt.hash(request.body.password, salt)
      const user = {
        email: request.body.email,
        username: request.body.username,
        password: hashedPassword,
        highscore: request.body.highscore,
        currentSelectedSkin: request.body.currentSelectedSkin,
      }

      const doesUserExist = await collection.findOneAndUpdate(
        { username: request.body.username },
        { $set: user }
      )
      if (!doesUserExist) {
        collection.insertOne(user)
      }
      response.sendStatus(200)
    } else {
      response.status(400).send({ message: "Not a valid email address" })
    }
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
function authenticateAPI(request, response, next) {
  let apiKey = request.headers["apikey"]

  if (apiKey === process.env.API_KEY) {
    next()
  } else {
    return response.sendStatus(403)
  }
}
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
