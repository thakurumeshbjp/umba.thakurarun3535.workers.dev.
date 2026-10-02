// ==========================================
// GITHUB API INTEGRATION FOR UMBA AGENT
// ==========================================

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_USER_AGENT = 'Umba-SaaS-Agent';

function githubHeaders(env, includeJson = false) {
  const token = env?.GITHUB_TOKEN || env?.githubToken || env?.token;
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': GITHUB_USER_AGENT,
    ...(includeJson ? { 'Content-Type': 'application/json' } : {})
  };
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

async function readGitHubError(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  return data.message || `HTTP ${response.status}`;
}

// 1. Create a new GitHub Repository
export async function githubCreateRepo(repoName, description, env) {
  const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
    method: 'POST',
    headers: githubHeaders(env, true),
    body: JSON.stringify({
      name: repoName,
      description: description || 'Created autonomously by Umba Agent',
      private: false
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub Repo Creation Failed: ${await readGitHubError(response)}`);
  }

  const data = await response.json();
  return { success: true, repoUrl: data.html_url, fullName: data.full_name };
}

// 2. Create or update a file in a GitHub repository
export async function githubCreateFile(repoFullName, filePath, fileContent, env) {
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  const endpoint = `${GITHUB_API_URL}/repos/${repoFullName}/contents/${encodedPath}`;

  let sha;
  const existingResponse = await fetch(endpoint, {
    method: 'GET',
    headers: githubHeaders(env)
  });

  if (existingResponse.ok) {
    const existingFile = await existingResponse.json();
    sha = existingFile.sha;
  } else if (existingResponse.status !== 404) {
    throw new Error(`GitHub File Lookup Failed (${filePath}): ${await readGitHubError(existingResponse)}`);
  }

  const body = {
    message: `Umba Agent: ${sha ? 'Update' : 'Add'} ${filePath}`,
    content: encodeBase64(fileContent),
    ...(sha ? { sha } : {})
  };

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: githubHeaders(env, true),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`GitHub File Creation Failed (${filePath}): ${await readGitHubError(response)}`);
  }

  return { success: true, path: filePath };
}

// 3. Commit multiple files sequentially through the Contents API
export async function githubCommitMultipleFiles(repoFullName, files, env) {
  const results = [];

  for (const file of files || []) {
    const result = await githubCreateFile(repoFullName, file.path, file.content, env);
    results.push(result);
  }

  return { success: true, committedFiles: results.length, files: results };
}

// Placeholder operations for other providers used by the agent.
export async function cloudflareCreateWorker(workerName, env) {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN in env');
  }

  return {
    success: true,
    workerName,
    note: 'Cloudflare worker creation hook. Add your actual API call here.'
  };
}

export async function cloudflareDeployWorker(workerName, env) {
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN in env');
  }

  return {
    success: true,
    workerName,
    note: 'Cloudflare deployment hook. Add your actual deploy call here.'
  };
}

export async function supabaseCreateProject(projectName, env) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in env');
  }

  return {
    success: true,
    projectName,
    note: 'Supabase project hook. Add your actual Supabase API call here.'
  };
}

// Main dispatcher for all supported plan operations
export async function executeOperation(op, env) {
  const action = op?.type;
  const params = op?.params || op?.arguments || {};

  switch (action) {
    case 'github_create_repo':
      return await githubCreateRepo(params.name, params.description, env);

    case 'github_create_file':
      return await githubCreateFile(params.repo, params.path, params.content, env);

    case 'github_commit_multiple_files':
      return await githubCommitMultipleFiles(params.repo, params.files, env);

    case 'cloudflare_create_worker':
      return await cloudflareCreateWorker(params.name || params.workerName, env);

    case 'cloudflare_deploy_worker':
      return await cloudflareDeployWorker(params.name || params.workerName, env);

    case 'supabase_create_project':
      return await supabaseCreateProject(params.name || params.projectName, env);

    default:
      return {
        success: false,
        type: action,
        message: `Unsupported operation type: ${action}`
      };
  }
}

// Backward-compatible plan executor for the original GitHub-only flow
export async function executePlan(plan, env) {
  const startTime = Date.now();
  const executionLogs = [];
  let createdRepoUrl = '';

  const ops = plan?.operations || plan?.steps || [];

  for (const op of ops) {
    try {
      const result = await executeOperation(op, env);

      if (op?.type === 'github_create_repo') {
        createdRepoUrl = result.repoUrl || createdRepoUrl;
        executionLogs.push(`✅ Created GitHub Repo: ${result.repoUrl || 'unknown'}`);
      } else if (op?.type === 'github_create_file') {
        executionLogs.push(`✅ Created File: ${op.params?.path || op.arguments?.path}`);
      } else if (op?.type === 'github_commit_multiple_files') {
        executionLogs.push(`✅ Committed ${result.committedFiles || 0} GitHub files`);
      } else if (result?.success === false) {
        executionLogs.push(`⚠️ ${result.message}`);
      } else {
        executionLogs.push(`✅ Executed ${op?.type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      executionLogs.push(`❌ Error in ${op?.type}: ${message}`);
    }
  }

  return {
    time: `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`,
    repoUrl: createdRepoUrl,
    logs: executionLogs
  };
}

// Generic orchestrator for any agent plan format.
export async function executeAgentPlan(plan, env) {
  return await executePlan(plan, env);
}

export default {
  githubCreateRepo,
  githubCreateFile,
  githubCommitMultipleFiles,
  cloudflareCreateWorker,
  cloudflareDeployWorker,
  supabaseCreateProject,
  executeOperation,
  executePlan,
  executeAgentPlan
};
