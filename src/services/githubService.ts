import { toast } from "sonner";
import { cacheService } from "./cacheService";

// Types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  license?: {
    name: string;
    spdx_id: string;
    url: string;
  };
  topics?: string[];
  default_branch: string;
}

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface Issue {
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
  }[];
  html_url: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
}

export interface CommitActivity {
  days: number[];
  total: number;
  week: number;
}

export interface CodeFrequency {
  week: number;
  additions: number;
  deletions: number;
}

export interface Release {
  id: number;
  tag_name: string;
  name: string;
  created_at: string;
  published_at: string;
  assets: {
    download_count: number;
  }[];
  html_url: string;
}

// Base GitHub API URL
const GITHUB_API_BASE_URL = "https://api.github.com";

// Get GitHub token from environment variables
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

// Helper function to create fetch options with auth header
const getFetchOptions = () => {
  const options: RequestInit = {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    }
  };

  if (GITHUB_TOKEN) {
    options.headers = {
      ...options.headers,
      'Authorization': `token ${GITHUB_TOKEN}`
    };
  }

  return options;
};

// Helper function to handle API errors
const handleApiError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  
  if (error.response && error.response.status === 403) {
    toast.error("GitHub API rate limit exceeded. Please try again later.");
  } else if (error.response && error.response.status === 404) {
    toast.error("Repository not found. Please check the repository name.");
  } else {
    toast.error(`Error: ${message}`);
  }
  
  return null;
};

// Helper function to fetch with cache and handle 404s
const fetchWithCache = async (url: string, options: RequestInit, cacheKey: string, retries = 2) => {
  // Try to get from cache first, including 404 responses
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    // If we cached a 404, throw it
    if (cachedData.status === 404) {
      throw new Error('404');
    }
    return cachedData;
  }

  // If not in cache, fetch from API with retry logic
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Handle rate limiting
      if (response.status === 403) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const waitTime = resetTime ? parseInt(resetTime) * 1000 - Date.now() : 0;
        if (waitTime > 0 && i < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)));
          continue;
        }
      }

      // Handle 404s - cache them too
      if (response.status === 404) {
        const notFoundData = { status: 404, url };
        await cacheService.set(cacheKey, notFoundData);
        throw new Error('404');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache successful response
      await cacheService.set(cacheKey, data);
      
      return data;
    } catch (error) {
      lastError = error;
      // Don't retry 404s
      if (error.message === '404') {
        throw error;
      }
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

// Batch fetch helper to reduce API calls
const batchFetch = async <T>(
  items: string[],
  fetchFn: (item: string) => Promise<T>,
  batchSize = 3
): Promise<T[]> => {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => fetchFn(item).catch(error => {
        console.error(`Error fetching ${item}:`, error);
        return null;
      }))
    );
    results.push(...batchResults.filter(Boolean));
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting delay
    }
  }
  return results;
};

// Fetch repository info
export const fetchRepository = async (repoFullName: string): Promise<Repository | null> => {
  try {
    const cacheKey = `repo:${repoFullName}`;
    return await fetchWithCache(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}`,
      getFetchOptions(),
      cacheKey
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch repository data");
  }
};

// Fetch all data in parallel with proper error handling
export const fetchAllRepositoryData = async (repoFullName: string) => {
  const fetchTasks = {
    repository: fetchRepository(repoFullName),
    contributors: fetchContributors(repoFullName),
    issues: fetchIssues(repoFullName),
    pullRequests: fetchPullRequests(repoFullName),
    commitActivity: fetchCommitActivity(repoFullName),
    codeFrequency: fetchCodeFrequency(repoFullName),
    releases: fetchReleases(repoFullName)
  };

  const results = await Promise.allSettled(Object.entries(fetchTasks).map(async ([key, promise]) => {
    try {
      return { key, data: await promise };
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      return { key, data: null };
    }
  }));

  return results.reduce((acc, result) => {
    if (result.status === 'fulfilled') {
      acc[result.value.key] = result.value.data;
    } else {
      acc[result.value.key] = null;
    }
    return acc;
  }, {} as Record<string, any>);
};

// Fetch contributors
export const fetchContributors = async (repoFullName: string, limit = 10): Promise<Contributor[] | null> => {
  try {
    const cacheKey = `contributors:${repoFullName}:${limit}`;
    return await fetchWithCache(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/contributors?per_page=${limit}`,
      getFetchOptions(),
      cacheKey
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch contributors");
  }
};

// Fetch issues
export const fetchIssues = async (repoFullName: string, state = "all", limit = 100): Promise<Issue[] | null> => {
  try {
    const cacheKey = `issues:${repoFullName}:${state}:${limit}`;
    return await fetchWithCache(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/issues?state=${state}&per_page=${limit}`,
      getFetchOptions(),
      cacheKey
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch issues");
  }
};

// Fetch pull requests
export const fetchPullRequests = async (repoFullName: string, state = "all", limit = 100): Promise<PullRequest[] | null> => {
  try {
    const cacheKey = `pulls:${repoFullName}:${state}:${limit}`;
    return await fetchWithCache(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/pulls?state=${state}&per_page=${limit}`,
      getFetchOptions(),
      cacheKey
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch pull requests");
  }
};

// Fetch commit activity
export const fetchCommitActivity = async (repoFullName: string): Promise<CommitActivity[] | null> => {
  try {
    const cacheKey = `commit-activity:${repoFullName}`;
    return await fetchWithCache(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/stats/commit_activity`,
      getFetchOptions(),
      cacheKey
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch commit activity");
  }
};

// Fetch code frequency
export const fetchCodeFrequency = async (repoFullName: string): Promise<CodeFrequency[] | null> => {
  try {
    const cacheKey = `code-frequency:${repoFullName}`;
    return await fetchWithCache(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/stats/code_frequency`,
      getFetchOptions(),
      cacheKey
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch code frequency");
  }
};

// Fetch releases
export const fetchReleases = async (repoFullName: string, limit = 10): Promise<Release[] | null> => {
  try {
    const cacheKey = `releases:${repoFullName}:${limit}`;
    return await fetchWithCache(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/releases?per_page=${limit}`,
      getFetchOptions(),
      cacheKey
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch releases");
  }
};

// Calculate average issue resolution time
export const calculateIssueResolutionTime = (issues: Issue[]): number | null => {
  const closedIssues = issues.filter(issue => issue.closed_at !== null);
  
  if (closedIssues.length === 0) {
    return null;
  }
  
  const totalResolutionTime = closedIssues.reduce((total, issue) => {
    const createdAt = new Date(issue.created_at).getTime();
    const closedAt = new Date(issue.closed_at as string).getTime();
    return total + (closedAt - createdAt);
  }, 0);
  
  // Return average in milliseconds
  return totalResolutionTime / closedIssues.length;
};

// Calculate average PR merge time
export const calculatePRMergeTime = (prs: PullRequest[]): number | null => {
  const mergedPRs = prs.filter(pr => pr.merged_at !== null);
  
  if (mergedPRs.length === 0) {
    return null;
  }
  
  const totalMergeTime = mergedPRs.reduce((total, pr) => {
    const createdAt = new Date(pr.created_at).getTime();
    const mergedAt = new Date(pr.merged_at as string).getTime();
    return total + (mergedAt - createdAt);
  }, 0);
  
  // Return average in milliseconds
  return totalMergeTime / mergedPRs.length;
};

// Format milliseconds to human-readable duration
export const formatDuration = (ms: number): string => {
  if (ms === null) return "N/A";
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  } else {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
};

// Format date to human-readable
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Add utility function for prefetching
export const prefetchRepository = async (repoFullName: string) => {
  try {
    const repo = await fetchRepository(repoFullName);
    if (repo) {
      // Prefetch other data in the background
      fetchAllRepositoryData(repoFullName).catch(() => {});
    }
    return repo;
  } catch (error) {
    console.error('Error prefetching repository:', error);
    return null;
  }
};

// Add function to check if data is cached
export const isDataCached = async (repoFullName: string): Promise<boolean> => {
  const cacheKey = `repo:${repoFullName}`;
  const cachedData = await cacheService.get(cacheKey);
  return cachedData !== null;
};
