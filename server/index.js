require('dotenv').config()

const fs = require('fs')
const http2 = require('http2')
const db = require('./lib/db')
const io = require('socket.io')

const { SOCKET_PORT, EXPRESS_PORT } = process.env

const socketServer = io.listen(SOCKET_PORT)

let sockets = []
socketServer.on('connection', (socket) => {
  console.log('socket connected')
  sockets.push(socket)

  socket.on('disconnect', () => {
    sockets = sockets.filter((s) => s === socket)
  })
})

const server = http2.createSecureServer({
  key: fs.readFileSync('./keys/private.pem'),
  cert: fs.readFileSync('./keys/cert.pem'),
})

server.on('stream', (stream) => {
  console.log('stream', stream.id)
  stream.respond({ ':status': 200 })

  let data = ''
  stream.on('data', (chunk) => {
    console.log('chunk', chunk)
    data += chunk
  })
  stream.on('end', () => {
    console.log('Got request:', data)
    stream.end()
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
    sockets.forEach((socket) => {
      socket.emit('sensor', values)
    })
  })
  stream.end('OK')
})

server.listen(4000)