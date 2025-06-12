import { createClient } from '@supabase/supabase-js'
import './style.css'

const supabaseUrl = 'https://gdfpwixfrujkoxlejcgo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZnB3aXhmcnVqa294bGVqY2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NTY0NjMsImV4cCI6MjA2MzMzMjQ2M30.btatLN5ciqWbERzsaDvk6yyTI2eJJY1wjTUDFsmA00Q'
const supabase = createClient(supabaseUrl, supabaseKey)

let currentUser = null

async function initApp() {
  await checkAuth()
  setupRouting()
  await loadContent()
}

async function checkAuth() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) console.error('Auth error:', error)
  currentUser = user
console.log('Current user:', currentUser) 
  updateAuthUI()
}

function updateAuthUI() {
  const authSection = document.getElementById('auth-section')
  if (!authSection) return

  if (currentUser) {
    authSection.innerHTML = `
      <span class="text-gray-700 text-sm sm:text-base mb-2 sm:mb-0 sm:mr-4">
        Witaj, ${currentUser.email}
      </span>
      <button onclick="logout()" 
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition w-full sm:w-auto">
        Wyloguj
      </button>
    `
    authSection.className = 'flex flex-col sm:flex-row items-center'
  } else {
    authSection.innerHTML = `
      <a href="/login/" 
         class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition block text-center w-full sm:inline-block sm:w-auto">
        Zaloguj
      </a>
    `
    authSection.className = 'flex'
  }
}


function setupRouting() {
  window.onpopstate = () => loadContent()
  document.addEventListener('click', async (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault()
      history.pushState(null, '', e.target.href)
      await loadContent()
    }
  })
}

async function loadContent() {
  const path = window.location.pathname
  const contentDiv = document.getElementById('content')
  
  if (path.includes('/login')) {
    window.location.href = '/login/'
    return
  }

  const { data: article, error } = await supabase
    .from('article')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error('Error loading article:', error)

  contentDiv.innerHTML = `
    <section class="mb-8">
      ${currentUser ? `
        <button onclick="openAddArticleModal()" 
                class="mb-10 mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
          + Dodaj artykuł
        </button>
      ` : ''}
      <div id="articles-list" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"></div>
    </section>
  `

  const articlesList = document.getElementById('articles-list')
  article?.forEach(article => {
    const articleEl = document.createElement('article')
    articleEl.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition'
    articleEl.innerHTML = `
      <div class="p-6">
        <h2 class="text-xl font-bold mb-2">${article.title}</h2>
        <h3 class="text-gray-600 mb-3">${article.subtitle}</h3>
        <div class="flex justify-between text-sm text-gray-500 mb-4">
          <span>${article.author || 'Anonim'}</span>
          <span>${new Date(article.created_at).toLocaleDateString()}</span>
        </div>
        <p class="text-gray-700">${article.content}</p>
      </div>
      ${currentUser ? `
      <div class="bg-gray-50 px-6 py-3 flex justify-end space-x-2 mb-2">
        <button onclick="openEditArticleModal('${article.id}')" 
                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          Edytuj
        </button>
        <button onclick="deleteArticle('${article.id}')" 
                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">
          Usuń
        </button>
      </div>
      ` : ''}
    `
    articlesList.appendChild(articleEl)
  })
}

// modal
window.openAddArticleModal = () => {
  document.getElementById('modal-title').textContent = 'Dodaj nowy artykuł'
  document.getElementById('article-form').reset()
  document.getElementById('article-id').value = ''
  document.getElementById('modal').classList.remove('hidden')
}

window.openEditArticleModal = async (id) => {
  const { data: article, error } = await supabase
    .from('article')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error loading article:', error)
    return
  }

  document.getElementById('modal-title').textContent = 'Edytuj artykuł'
  document.getElementById('article-id').value = id
  document.getElementById('title').value = article.title
  document.getElementById('subtitle').value = article.subtitle || ''
  document.getElementById('author').value = article.author
  document.getElementById('article-content').value = article.content
  document.getElementById('modal').classList.remove('hidden')
}

window.closeModal = () => {
  document.getElementById('modal').classList.add('hidden')
}

document.getElementById('article-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const id = document.getElementById('article-id').value
  const isNew = !id

  const contentInput = document.getElementById('article-content') 

  if (!contentInput) {
    console.error('Nie znaleziono pola content!')
    return
  }

  const contentValue = contentInput.value.trim()
  if (!contentValue) {
    alert('Treść nie może być pusta!')
    return
  }

  const articleData = {
    title: document.getElementById('title').value,
    subtitle: document.getElementById('subtitle').value,
    author: document.getElementById('author').value,
    content: contentValue,
    created_at: new Date().toISOString()
  }


  if (isNew && currentUser) {
    articleData.user_id = currentUser.id 
  }

  try {
    if (!isNew) {
      const { error } = await supabase
        .from('article')
        .update(articleData)
        .eq('id', id)
      
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('article')
        .insert(articleData)
      
      if (error) throw error
    }

    closeModal()
    await loadContent()
  } catch (error) {
    console.error('Error saving article:', error)
    alert('Wystąpił błąd podczas zapisywania artykułu')
  }
})

// usun
window.deleteArticle = async (id) => {
  if (!confirm('Czy na pewno chcesz usunąć ten artykuł?')) return
  
  try {
    const { error } = await supabase
      .from('article')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    await loadContent()
  } catch (error) {
    console.error('Error deleting article:', error)
    alert('Wystąpił błąd podczas usuwania artykułu')
  }
}

// wyloguj
window.logout = async () => {
  try {
    await supabase.auth.signOut()
    currentUser = null
    updateAuthUI()
    await loadContent()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

document.addEventListener('DOMContentLoaded', initApp)