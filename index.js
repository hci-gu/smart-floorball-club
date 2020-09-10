const app = require('express')()

app.get('/', (_, res) => {
  console.log('GET /')
  res.send('OK')
})

app.post('/sensor', (req, res) => {
  // console.log(req)
  req.pipe(process.stdin)
  console.log(req.body)
  res.sendStatus(200)
})

app.listen(1337)