import { useState } from "react"

function App() {

  const [data, setData] = useState('')
  const handleClick = async () => {
    const res = await fetch('/api')
    const data = await res.json()
    setData(data.message)
  }
  return (
    <>
      <div>
        <h1>
          fetch data from api
        </h1>
        <button onClick={handleClick}>Fetch Data</button>
        <p>{data}</p>
      </div>
    </>
  )
}

export default App
