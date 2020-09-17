import React, { useState, useEffect } from 'react'
import P5Wrapper from 'react-p5-wrapper'
import socketIOClient from 'socket.io-client'
import SensorGraph from './components/SensorGraph'

const ENDPOINT = 'http://localhost:1338'

const sketch = (p) => {
  let canvas

  p.preload = () => { }

  p.setup = () => {
    canvas = p.createCanvas(500, 500)
  }

  p.draw = () => {
    p.background(100)
  }
}

function App() {
  const [sensorDataPoints, setSensorDataPoints] = useState([])

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT)
    socket.on('connection', (data) => {
      console.log('connected')
    })
    socket.emit('init')
    socket.on('sensor', (data) => {
      setSensorDataPoints(sensorDataPoints => [...sensorDataPoints, ...data.map(d => ({
        ...d,
        timestamp: new Date(d.t).getTime(),
      }))])
    })
  }, [])

  return (
    <div>
      <pre>{sensorDataPoints.length}</pre>
      <P5Wrapper sketch={sketch}></P5Wrapper>
      {sensorDataPoints && <SensorGraph data={sensorDataPoints} />}
    </div>
  )
}

export default App
