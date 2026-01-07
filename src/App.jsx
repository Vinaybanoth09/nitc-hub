import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Listings from './Listings' // <--- Add this import

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="App">
      {!session ? (
        <Auth />
      ) : (
        <div>
          <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f4f4f4' }}>
            <span>Logged in as: {session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()}>Logout</button>
          </nav>
          
          <Listings /> {/* <--- Show the marketplace here */}
        </div>
      )}
    </div>
  )
}

export default App