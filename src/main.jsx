import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import PublicUploadPage from './components/PublicUploadPage.jsx'
import './index.css'

// If URL contains ?upload=<doc_request_id>, show public upload page
// This runs BEFORE any auth check so clients don't need to log in
const uploadRequestId = new URLSearchParams(window.location.search).get('upload')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {uploadRequestId
      ? <PublicUploadPage requestId={uploadRequestId} />
      : <App />
    }
  </React.StrictMode>
)
