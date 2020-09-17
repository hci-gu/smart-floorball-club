require('dotenv').config()

const app = require('express')()
const bodyParser = require('body-parser')
const db = require('./lib/db')
const io = require('socket.io')

const { SOCKET_PORT, EXPRESS_PORT } = process.env

const socketServer = io.listen(SOCKET_PORT)
app.listen(EXPRESS_PORT)

app.use(bodyParser.raw())

app.get('/', (_, res) => {
  console.log('GET /')
  res.send('OK')
})

app.post('/sensor', (req, res) => {
  console.log('incoming data')
  let data = ''
  req.on('data', (chunk) => {
    console.log('...')
    data += chunk
  })
  req.on('error', (error) => {
    console.log('error', error)
  })
  req.on('close', () => console.log('close'))
  req.on('end', async () => {
    const values = data
      .split('\n')
      .filter((val) => val)
      .map((val) => {
        const [x, y, z, t] = val.split(',').map(parseFloat)
        return {
          x,
          y,
          z,
          t: new Date(t),
        }
      })
    await db.save(values)
    sockets.forEach((socket) => {
      socket.emit('sensor', values)
    })
    console.log('data received and sent on sockets')
  })
  res.sendStatus(200)
})

let sockets = []
socketServer.on('connection', (socket) => {
  console.log('socket connected')
  sockets.push(socket)

  socket.on('disconnect', () => {
    sockets = sockets.filter((s) => s === socket)
  })
})
