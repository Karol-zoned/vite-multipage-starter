import { createClient } from '@supabase/supabase-js'
import '../style.css'

const supabaseUrl = 'https://gdfpwixfrujkoxlejcgo.supabase.co'
const supabaseKey = 'YOUR_SUPABASE_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    
 
    window.location.href = '/'
  } catch (error) {
    console.error('Login error:', error)
    alert('Błąd logowania: ' + error.message)
  }
})
