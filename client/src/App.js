import React, { useState, useEffect } from 'react'
import P5Wrapper from 'react-p5-wrapper'
import socketIOClient from 'socket.io-client'
const ENDPOINT = 'http://localhost:1338'

const sketch = (p) => {
  let canvas
  let sensorDataPoints = Array.from({ length: 100 }).map((_) => ({
    x: 0,
    y: 0,
    z: 0,
  }))
  const valuesLength = 100
  const width = 500
  const height = 500

  p.preload = () => {}

  p.setup = () => {
    canvas = p.createCanvas(width, height)
  }

  p.myCustomRedrawAccordingToNewPropsHandler = (props) => {
    if (props.sensorDataPoints && props.sensorDataPoints.length > 0) {
      sensorDataPoints = props.sensorDataPoints
    }
  }

  const drawLine = (type) => {
    p.noFill()
    p.beginShape()
    for (let x = 0; x < valuesLength; x++) {
      if (sensorDataPoints[x]) {
        p.vertex(
          x * (width / valuesLength),
          height / 2 + (sensorDataPoints[x][type] * height) / 2
        )
      }
    }
    p.endShape()
  }

  p.draw = () => {
    p.background(50)
    p.stroke(255, 0, 0)
    drawLine('x')
    p.stroke(0, 255, 0)
    drawLine('y')
    p.stroke(0, 0, 255)
    drawLine('z')
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
      {/* <pre>{JSON.stringify(sensorDataPoints, null, 2)}</pre> */}
      <P5Wrapper
        sketch={sketch}
        sensorDataPoints={sensorDataPoints}
      ></P5Wrapper>
    </div>
  )
}

export default App
