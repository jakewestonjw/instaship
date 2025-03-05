import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

export default function Docs() {
  const [apiDocs, setApiDocs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const response = await fetch('/api/docs');
        const data = await response.json();
        setApiDocs(data);
      } catch (error) {
        console.error('Error fetching API docs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocs();
  }, []);

  const curlExample = `curl -X POST \\
  https://your-deployment-platform.vercel.app/api/deploy \\
  -H 'Content-Type: application/json' \\
  -d '{
    "code": "console.log(\\"Hello, world!\\");"
  }'`;

  const pythonExample = `import requests
import json

url = "https://your-deployment-platform.vercel.app/api/deploy"

payload = {
    "code": """
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
    """
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, data=json.dumps(payload), headers=headers)
print(response.json())`;

  const jsExample = `const fetch = require('node-fetch');

const url = 'https://your-deployment-platform.vercel.app/api/deploy';

const code = \`
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(\\\`Server running on port \\\${port}\\\`);
});
\`;

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ code }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Head>
        <title>API Documentation - Code Deployment Platform</title>
        <meta name="description" content="API documentation for the code deployment platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="mb-6">
          <Link href="/">
            <a className="text-blue-600 hover:underline">← Back to Deployment Tool</a>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4">API Documentation</h1>
        <p className="mb-8 text-gray-600">
          Learn how to use our API to deploy code programmatically.
        </p>

        {isLoading ? (
          <div className="flex justify-center my-8">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          apiDocs && (
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-3">{apiDocs.info.title}</h2>
                <p className="text-gray-700">{apiDocs.info.description}</p>
                <p className="text-sm text-gray-500 mt-1">Version: {apiDocs.info.version}</p>
              </section>

              {apiDocs.endpoints.map((endpoint, index) => (
                <section key={index} className="p-6 border rounded-lg bg-gray-50">
                  <div className="flex items-center mb-4">
                    <span className={`px-2 py-1 rounded text-white font-mono text-sm mr-2 ${
                      endpoint.method === 'POST' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="font-mono">{endpoint.path}</span>
                  </div>
                  
                  <p className="mb-4 text-gray-700">{endpoint.description}</p>
                  
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Request Body</h3>
                    <div className="bg-gray-100 p-4 rounded">
                      <p className="font-mono text-sm">
                        Required: {endpoint.requestBody.required ? 'Yes' : 'No'}
                      </p>
                      <pre className="mt-2 bg-gray-800 text-white p-3 rounded overflow-x-auto">
                        {JSON.stringify(endpoint.requestBody.content['application/json'].schema, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Responses</h3>
                    <div className="space-y-2">
                      {Object.entries(endpoint.responses).map(([code, response]) => (
                        <div key={code} className="bg-gray-100 p-4 rounded">
                          <p className="font-mono text-sm mb-1">
                            Status: <span className={`${
                              code.startsWith('2') ? 'text-green-600' : 'text-red-600'
                            }`}>{code}</span>
                          </p>
                          <p className="text-gray-700 mb-2">{response.description}</p>
                          {response.content && response.content['application/json'] && (
                            <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto">
                              {JSON.stringify(response.content['application/json'].schema, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}

              <section className="mt-10">
                <h2 className="text-2xl font-semibold mb-4">Example Usage</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">cURL</h3>
                    <SyntaxHighlighter language="bash" style={vscDarkPlus}>
                      {curlExample}
                    </SyntaxHighlighter>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Python</h3>
                    <SyntaxHighlighter language="python" style={vscDarkPlus}>
                      {pythonExample}
                    </SyntaxHighlighter>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">JavaScript</h3>
                    <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
                      {jsExample}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </section>
            </div>
          )
        )}
      </main>
      
      <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Simple Code Deployment Platform</p>
      </footer>
    </div>
  );
}