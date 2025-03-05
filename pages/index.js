// pages/index.js - Updated to work with authentication
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export default function Home() {
  const { data: session, status } = useSession();
  const [code, setCode] = useState('');
  const [deployStatus, setDeployStatus] = useState('idle'); // idle, deploying, success, error
  const [liveUrl, setLiveUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [editorFocused, setEditorFocused] = useState(false);

  // Function to detect language as user types
  const detectLanguage = (codeText) => {
    const pythonPatterns = ['def ', 'import ', 'print(', '    ', 'if __name__'];
    const jsPatterns = ['const ', 'let ', 'function', '=>', 'console.log'];
    
    let pythonScore = 0;
    let jsScore = 0;
    
    pythonPatterns.forEach(pattern => {
      if (codeText.includes(pattern)) pythonScore++;
    });
    
    jsPatterns.forEach(pattern => {
      if (codeText.includes(pattern)) jsScore++;
    });
    
    if (pythonScore > jsScore) return 'Python';
    if (jsScore > pythonScore) return 'JavaScript';
    return '';
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    // Only attempt to detect language if there's enough code
    if (newCode.length > 10) {
      setDetectedLanguage(detectLanguage(newCode));
    } else {
      setDetectedLanguage('');
    }
  };

  const handleDeploy = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter some code to deploy');
      setDeployStatus('error');
      return;
    }

    try {
      setDeployStatus('deploying');
      setErrorMessage('');
      
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Deployment failed');
      }

      setLiveUrl(data.liveUrl);
      setDetectedLanguage(data.language || detectedLanguage);
      setDeployStatus('success');
    } catch (error) {
      setErrorMessage(error.message || 'Deployment failed');
      setDeployStatus('error');
    }
  };

  const loadExample = (language) => {
    if (language === 'JavaScript') {
      setCode(`// Simple Express.js web server
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Hello from your deployed JavaScript app!');
});

app.get('/api', (req, res) => {
  res.json({
    message: 'This is a sample API endpoint',
    timestamp: new Date()
  });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`);
      setDetectedLanguage('JavaScript');
    } else if (language === 'Python') {
      setCode(`# Simple Flask web application
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello from your deployed Python app!'

@app.route('/api')
def api():
    return jsonify({
        'message': 'This is a sample API endpoint',
        'language': 'Python'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)`);
      setDetectedLanguage('Python');
    } else if (language === 'Node API') {
      setCode(`// RESTful API with Express.js
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Middleware to parse JSON
app.use(express.json());

// Sample data
const users = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 },
];

// Get all users
app.get('/users', (req, res) => {
  res.json(users);
});

// Get user by ID
app.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

app.listen(port, () => {
  console.log(\`API server running on port \${port}\`);
});`);
      setDetectedLanguage('JavaScript');
    } else if (language === 'Python Data') {
      setCode(`# Data analysis with Python
import pandas as pd
import numpy as np
from flask import Flask, jsonify

app = Flask(__name__)

# Generate sample data
def generate_data():
    np.random.seed(42)
    dates = pd.date_range('20230101', periods=10)
    df = pd.DataFrame(np.random.randn(10, 4), index=dates, columns=['A', 'B', 'C', 'D'])
    return df

@app.route('/')
def home():
    return 'Python Data Analysis API'

@app.route('/data')
def get_data():
    df = generate_data()
    data = {
        'summary': df.describe().to_dict(),
        'correlation': df.corr().to_dict(),
        'sample': df.head(3).to_dict()
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)`);
      setDetectedLanguage('Python');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Code Deployment Platform</title>
        <meta name="description" content="Deploy your code with a single click" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <a className="text-xl font-bold text-blue-600">CodeDeploy</a>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/">
                  <a className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Home
                  </a>
                </Link>
                {session && (
                  <Link href="/dashboard">
                    <a className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      Dashboard
                    </a>
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {status === 'loading' ? (
                <div className="h-4 w-4 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
              ) : session ? (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">
                    {session.user.name || session.user.email}
                  </span>
                  <Link href="/dashboard">
                    <a className="text-sm mr-4 text-blue-600 hover:text-blue-500">
                      Dashboard
                    </a>
                  </Link>
                  <Link href="/api/auth/signout">
                    <a className="text-sm text-gray-500 hover:text-gray-700">
                      Sign out
                    </a>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center">
                  <Link href="/auth/signin">
                    <a className="text-sm font-medium text-blue-600 hover:text-blue-500 mr-4">
                      Sign in
                    </a>
                  </Link>
                  <Link href="/auth/signup">
                    <a className="text-sm font-medium text-gray-500 hover:text-gray-700">
                      Sign up
                    </a>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Code Deployment Platform</h1>
            <p className="mt-2 text-gray-600">Write code, click deploy, get a live URL</p>
          </div>
        </header>
        
        <main className="mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  onClick={() => loadExample('JavaScript')}
                  className="px-3 py-1 text-sm bg-yellow-200 hover:bg-yellow-300 rounded"
                >
                  Load JS Example
                </button>
                <button
                  onClick={() => loadExample('Python')}
                  className="px-3 py-1 text-sm bg-blue-200 hover:bg-blue-300 rounded"
                >
                  Load Python Example
                </button>
                <button
                  onClick={() => loadExample('Node API')}
                  className="px-3 py-1 text-sm bg-green-200 hover:bg-green-300 rounded"
                >
                  Node.js API
                </button>
                <button
                  onClick={() => loadExample('Python Data')}
                  className="px-3 py-1 text-sm bg-purple-200 hover:bg-purple-300 rounded"
                >
                  Python Data Analysis
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="code" className="font-medium">
                    Your Code ({detectedLanguage || 'Python or JavaScript'})
                  </label>
                  {detectedLanguage && (
                    <span className={`px-2 py-1 text-xs rounded ${
                      detectedLanguage === 'JavaScript' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {detectedLanguage} Detected
                    </span>
                  )}
                </div>
                
                <div className="relative border border-gray-300 rounded-md overflow-hidden">
                  {!editorFocused && (
                    <div className="absolute right-2 top-2 z-10 text-xs text-gray-500">
                      Tip: Press Tab for indentation
                    </div>
                  )}
                  
                  {/* Editor with syntax highlighting */}
                  <div className="relative">
                    <textarea
                      id="code"
                      className="w-full h-80 p-4 font-mono text-sm bg-transparent absolute top-0 left-0 z-10 text-transparent caret-gray-900 resize-none"
                      value={code}
                      onChange={handleCodeChange}
                      onFocus={() => setEditorFocused(true)}
                      onBlur={() => setEditorFocused(false)}
                      spellCheck="false"
                      placeholder="// Enter your code here..."
                      style={{ caretColor: '#333' }}
                    />
                    <div className="w-full h-80 overflow-auto">
                      <SyntaxHighlighter
                        language={detectedLanguage?.toLowerCase() || 'javascript'}
                        style={vscDarkPlus}
                        wrapLines={true}
                        className="h-full"
                      >
                        {code || '// Enter your code here...'}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeploy}
                disabled={deployStatus === 'deploying'}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  deployStatus === 'deploying'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {deployStatus === 'deploying' ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deploying...
                  </span>
                ) : 'Deploy Code'}
              </button>

              {deployStatus === 'error' && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  <p>{errorMessage}</p>
                  {!session && errorMessage.includes('Authentication') && (
                    <p className="mt-2">
                      Please{' '}
                      <Link href="/auth/signin">
                        <a className="text-blue-600 underline">sign in</a>
                      </Link>{' '}
                      or{' '}
                      <Link href="/auth/signup">
                        <a className="text-blue-600 underline">sign up</a>
                      </Link>{' '}
                      to deploy code.
                    </p>
                  )}
                </div>
              )}

              {deployStatus === 'success' && (
                <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                  <p className="font-medium mb-2">🎉 Deployment successful!</p>
                  <p className="mb-1">
                    Language: <span className="font-medium">{detectedLanguage}</span>
                  </p>
                  <p>
                    Your app is live at:{' '}
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {liveUrl}
                    </a>
                  </p>
                  {session && (
                    <p className="mt-2">
                      View all your deployments on your{' '}
                      <Link href="/dashboard">
                        <a className="text-blue-600 underline">dashboard</a>
                      </Link>.
                    </p>
                  )}
                </div>
              )}
              
              {!session && deployStatus !== 'error' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
                  <p>
                    <span className="font-medium">Pro tip:</span>{' '}
                    <Link href="/auth/signup">
                      <a className="text-blue-600 underline">Sign up</a>
                    </Link>{' '}
                    or{' '}
                    <Link href="/auth/signin">
                      <a className="text-blue-600 underline">sign in</a>
                    </Link>{' '}
                    to track all your deployments and manage them from your dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">Code Deployment Platform</p>
            <div className="flex justify-center space-x-4">
              <Link href="/docs">
                <a className="text-blue-500 hover:underline">API Documentation</a>
              </Link>
              <a href="https://github.com/yourusername/code-deployer" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                GitHub Repository
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}