import React, { useState, useEffect } from 'react'
import P5Wrapper from 'react-p5-wrapper'
import socketIOClient from 'socket.io-client'
const ENDPOINT = 'http://localhost:1338'

const sketch = (p) => {
  let canvas

  p.preload = () => {}

  p.setup = () => {
    canvas = p.createCanvas(500, 500)
  }

  p.draw = () => {
    p.background(100)
  }
}

function App() {
  const [sensorDataPoints, setSensorDataPoints] = useState({
    values: [],
  })

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT)
    socket.on('connection', (data) => {
      console.log('connected')
    })
    socket.emit('init')
    socket.on('sensor', (data) => setSensorDataPoints(data))
  }, [])

  return (
    <div>
      <pre>{JSON.stringify(sensorDataPoints, null, 2)}</pre>
      <P5Wrapper sketch={sketch}></P5Wrapper>
    </div>
  )
}

export default App
