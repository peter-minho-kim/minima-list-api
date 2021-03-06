require('./config/config')

const express = require('express')
const bodyParser = require('body-parser')
const { ObjectID } = require('mongodb')
const _ = require('lodash')

const { mongoose } = require('./db/mongoose')
const { Card } = require('./models/card')
const { User } = require('./models/user')
const { authenticate } = require('./middleware/authenticate')

const app = express()
const port = process.env.PORT || 8080

app.use(bodyParser.json())

app.post('/cards', authenticate, (req, res) => {
  const card = new Card({
    text: req.body.text,
    _creator: req.user._id
  })

  card.save().then((doc) => {
    res.send(doc)
  }, (err) => {
    res.status(400).send(err)
  })
})

app.get('/cards', authenticate, (req, res) => {
  Card.find({
    _creator: req.user._id
  }).then((cards) => {
    res.send({ cards })
  }, (err) => {
    res.status(400).send(err)
  })
})

app.get('/cards/:id', authenticate, (req, res) => {
  const id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Card.findOne({
    _id: id,
    _creator: req.user._id
  }).then((card) => {
    if (!card) {
      return res.status(404).send()
    }

    res.send({ card })
  }, (err) => {
    res.status(400).send(err)
  })
})

app.delete('/cards/:id', authenticate, (req, res) => {
  const id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  Card.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((card) => {
    if (!card) {
      return res.status(404).send()
    }

    res.send({ card })
  }).catch((err) => {
    res.status(400).send()
  })
})

app.patch('/cards/:id', authenticate, (req, res) => {
  const id = req.params.id
  const body = _.pick(req.body, ['text', 'completed'])

  if (!ObjectID.isValid(id)) {
    return res.status(404).send()
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime()
  } else {
    body.completed = false
    body.completedAt = null
  }

  Card.findOneAndUpdate({ _id: id, _creator: req.user._id }, { $set: body }, { new: true }).then((card) => {
    if (!card) {
      return res.status(404).send()
    }

    res.send({ card })
  }).catch((err) => {
    res.status(400).send()
  })
})

app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password'])
  const user = new User(body)

  user.save().then(() => {
    return user.generateAuthToken()
  }).then((token) => {
    res.header('x-auth', token).send(user)
  }).catch((err) => {
    res.status(400).send(err)
  })
})

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user)
})

app.post('/users/login', (req, res) => {
  const body = _.pick(req.body, ['email', 'password'])

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user)
    })
  }).catch((err) => {
    res.status(400).send()
  })
})

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.status(200).send()
  }, () => {
    res.status(400).send()
  })
})

app.listen(port, () => {
  console.log(`The magic happens on port ${port}`)
})

module.exports = { app }