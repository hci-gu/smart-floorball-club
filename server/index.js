const app = require('express')()
const bodyParser = require('body-parser')
const Writable = require('stream').Writable
const _ = require('highland')

app.use(bodyParser.raw())

app.get('/', (_, res) => {
  console.log('GET /')
  res.send('OK')
})

app.post('/sensor', (req, res) => {
  let data = ''
  req.on('data', (chunk) => {
    data += chunk
  })
  req.on('end', () => {
    const values = data
      .split('\n')
      .filter((val) => val)
      .map((val) => {
        const [x, y, z, t] = val.split(',').map(parseFloat)
        return {
          x,
          y,
          z,
          t,
        }
      })
    console.log(values, values.length)
  })
  res.sendStatus(200)
})

app.listen(1337)
