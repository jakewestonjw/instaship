// pages/api/deploy.js
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

// Convert callback-based functions to Promise-based
const execPromise = promisify(exec);
const mkdirPromise = promisify(fs.mkdir);
const writeFilePromise = promisify(fs.writeFile);
const rmPromise = promisify(fs.rm);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'No code provided' });
    }

    // Detect language
    const language = detectLanguage(code);
    
    // Create a unique deployment ID
    const deploymentId = uuidv4().substring(0, 8);
    
    // Deploy the code
    const deploymentResult = await deployCode(code, language, deploymentId);
    
    return res.status(200).json({ 
      liveUrl: deploymentResult.url,
      language: language,
      deploymentId: deploymentId
    });
  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({ message: `Deployment failed: ${error.message}` });
  }
}

function detectLanguage(code) {
  // Python patterns
  const pythonPatterns = [
    'def ', 
    'import ', 
    'from ', 
    'print(', 
    'class ', 
    'if __name__', 
    'elif ',
    '    ', // Python uses 4-space indentation
    '.py'
  ];
  
  // JavaScript patterns
  const jsPatterns = [
    'const ', 
    'let ', 
    'var ', 
    'function ', 
    '=>', 
    'console.log', 
    'require(', 
    'import ',
    'export ',
    '.js'
  ];
  
  let pythonScore = 0;
  let jsScore = 0;
  
  pythonPatterns.forEach(pattern => {
    if (code.includes(pattern)) pythonScore++;
  });
  
  jsPatterns.forEach(pattern => {
    if (code.includes(pattern)) jsScore++;
  });
  
  // Web framework detection
  if (code.includes('flask') || code.includes('Flask') || code.includes('django')) {
    pythonScore += 2;
  }
  
  if (code.includes('express') || code.includes('Express') || code.includes('React')) {
    jsScore += 2;
  }
  
  return pythonScore > jsScore ? 'Python' : 'JavaScript';
}

async function deployCode(code, language, deploymentId) {
  // In development mode, we'll simulate deployment
  if (process.env.NODE_ENV === 'development' && process.env.SIMULATE_DEPLOYMENT === 'true') {
    // Wait for 3 seconds to simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Return a simulated deployment URL
    return {
      url: `https://${language.toLowerCase()}-app-${deploymentId}.fly.dev`,
      id: deploymentId
    };
  }
  
  // For real deployment, we'll create the necessary files and deploy to Fly.io
  
  // 1. Create a temporary directory for the deployment
  const tempDir = path.join(process.cwd(), 'tmp', `deployment-${deploymentId}`);
  
  try {
    // Create the temporary directory
    await mkdirPromise(tempDir, { recursive: true });
    
    // 2. Create necessary files based on the language
    if (language === 'Python') {
      await createPythonFiles(tempDir, code, deploymentId);
    } else {
      await createJavaScriptFiles(tempDir, code, deploymentId);
    }
    
    // 3. Deploy to Fly.io
    // Note: In a production environment, you'd want to handle this more securely
    // and maybe use a queue for deployments
    
    console.log(`Deploying ${language} app to Fly.io...`);
    
    // Initialize Fly app
    await execPromise(`cd ${tempDir} && fly launch --name app-${deploymentId} --region dfw --no-deploy --yes`);
    
    // Deploy the app
    await execPromise(`cd ${tempDir} && fly deploy`);
    
    console.log(`Deployment successful: app-${deploymentId}`);
    
    // Return the deployment URL
    return {
      url: `https://app-${deploymentId}.fly.dev`,
      id: deploymentId
    };
  } catch (error) {
    console.error('Deployment error:', error);
    throw error;
  } finally {
    // Clean up the temporary directory
    // In a production environment, you might want to keep this for logs/debugging
    try {
      await rmPromise(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to clean up temporary directory:', cleanupError);
    }
  }
}

async function createPythonFiles(directory, code, deploymentId) {
  // 1. Write the user's code to main.py
  await writeFilePromise(path.join(directory, 'main.py'), code);
  
  // 2. Check if the code already has a Flask/web app
  const hasFlask = code.includes('from flask import') || code.includes('import flask');
  
  // 3. If it doesn't have Flask, create a wrapper app.py to expose the code via a web API
  if (!hasFlask) {
    await writeFilePromise(path.join(directory, 'app.py'), `
from flask import Flask, jsonify
import main

app = Flask(__name__)

@app.route('/')
def index():
    # Attempt to find functions in the user's code that can be called
    result = {}
    for name in dir(main):
        if not name.startswith('__') and callable(getattr(main, name)):
            try:
                result[name] = str(getattr(main, name)())
            except:
                result[name] = "Function available (call with parameters)"
    
    if not result:
        # If no callable functions, attempt to extract variables
        for name in dir(main):
            if not name.startswith('__') and not callable(getattr(main, name)):
                result[name] = str(getattr(main, name))
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
`);
  }
  
  // 4. Create requirements.txt
  const requirements = ['flask', 'gunicorn'];
  
  // Add commonly used libraries if they appear in the code
  if (code.includes('pandas') || code.includes('DataFrame')) {
    requirements.push('pandas');
  }
  
  if (code.includes('numpy') || code.includes('np.')) {
    requirements.push('numpy');
  }
  
  if (code.includes('matplotlib') || code.includes('pyplot')) {
    requirements.push('matplotlib');
  }
  
  await writeFilePromise(path.join(directory, 'requirements.txt'), requirements.join('\n'));
  
  // 5. Create a Dockerfile
  await writeFilePromise(path.join(directory, 'Dockerfile'), `
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app"]
`);
  
  // 6. Create fly.toml configuration
  await writeFilePromise(path.join(directory, 'fly.toml'), `
app = "app-${deploymentId}"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true

[[services.ports]]
  port = 80
  handlers = ["http"]

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]
`);
}

async function createJavaScriptFiles(directory, code, deploymentId) {
  // 1. Write the user's code to index.js
  await writeFilePromise(path.join(directory, 'index.js'), code);
  
  // 2. Check if the code already has Express/web server
  const hasExpress = code.includes('express') || code.includes('http.createServer');
  
  // 3. If it doesn't have Express, create a wrapper server.js to expose the code via a web API
  if (!hasExpress) {
    await writeFilePromise(path.join(directory, 'server.js'), `
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Import user code
let userCode = {};
try {
  userCode = require('./index.js');
} catch (e) {
  console.error('Error loading user code:', e);
}

app.get('/', (req, res) => {
  const result = {};
  
  // Attempt to extract exported functions and properties
  for (const key in userCode) {
    if (typeof userCode[key] === 'function') {
      try {
        result[key] = userCode[key]().toString();
      } catch (e) {
        result[key] = "Function available (call with parameters)";
      }
    } else {
      result[key] = JSON.stringify(userCode[key]);
    }
  }
  
  if (Object.keys(result).length === 0) {
    result.message = "Code deployed successfully, but no exports found.";
  }
  
  res.json(result);
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
`);
  }
  
  // 4. Create package.json
  const packageJson = {
    name: `app-${deploymentId}`,
    version: '1.0.0',
    main: hasExpress ? 'index.js' : 'server.js',
    scripts: {
      start: `node ${hasExpress ? 'index.js' : 'server.js'}`
    },
    dependencies: {
      express: '^4.18.2'
    }
  };
  
  // Add common packages if they appear in the code
  if (code.includes('axios') || code.includes('fetch(')) {
    packageJson.dependencies.axios = '^1.3.4';
  }
  
  if (code.includes('mongoose') || code.includes('mongodb')) {
    packageJson.dependencies.mongoose = '^7.0.3';
  }
  
  await writeFilePromise(
    path.join(directory, 'package.json'), 
    JSON.stringify(packageJson, null, 2)
  );
  
  // 5. Create a Dockerfile
  await writeFilePromise(path.join(directory, 'Dockerfile'), `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
`);
  
  // 6. Create fly.toml configuration
  await writeFilePromise(path.join(directory, 'fly.toml'), `
app = "app-${deploymentId}"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true

[[services.ports]]
  port = 80
  handlers = ["http"]

[[services.ports]]
  port = 443
  handlers = ["tls", "http"]
`);
}