import React from 'react'

const range = ds => [Math.min(...ds), Math.max(...ds)]

export default ({ data }) => {
  data = data.map(d => ({
    ...d,
    a: Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z),
  }))
  const [mint, maxt] = range(data.map(({ timestamp }) => timestamp))
  const [mina, maxa] = range(data.map(({ a }) => a))
  const WIDTH = 1000, HEIGHT = 200
  const xPos = t => (t - mint) * WIDTH / (maxt - mint)
  const yPos = v => (v - mina) * HEIGHT / (maxa - mina)
  return <div style={{ position: 'relative', height: HEIGHT, width: WIDTH }}>
    {data.map(({
      x, y, z, a, timestamp
    }) => <div style={{ position: 'absolute', left: xPos(timestamp), top: yPos(a), width: 2, height: 2, background: '#000' }}></div>)}
  </div>
}
