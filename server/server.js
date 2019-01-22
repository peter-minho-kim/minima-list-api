const express = require('express')
const bodyParser = require('body-parser')
const { ObjectID } = require('mongodb')

const { mongoose } = require('./db/mongoose')
const { Card } = require('./models/card')
const { User } = require('./models/user')

const app = express()
const port = process.env.PORT || 8080

app.use(bodyParser.json())

app.post('/cards', (req, res) => {
  const card = new Card({
    text: req.body.text
  })

  card.save().then((doc) => {
    res.send(doc)
  }, (err) => {
    res.status(400).send(err)
  })
})

app.get('/cards', (req, res) => {
  Card.find().then((cards) => {
    res.send({ cards })
  }, (err) => {
    res.status(400).send(err)
  })
})

app.get('/cards/:id', (req, res) => {
  const id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Card.findById(id).then((card) => {
    if (!card) {
      return res.status(404).send()
    }

    res.send({ card })
  }, (err) => {
    res.status(400).send(err)
  })
})

app.listen(port, () => {
  console.log(`The magic happens on port ${port}`)
})

module.exports = { app }