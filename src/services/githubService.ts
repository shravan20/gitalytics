import { toast } from "sonner";

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

// Fetch repository info
export const fetchRepository = async (repoFullName: string): Promise<Repository | null> => {
  try {
    const response = await fetch(`${GITHUB_API_BASE_URL}/repos/${repoFullName}`, getFetchOptions());
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch repository data");
  }
};

// Fetch contributors
export const fetchContributors = async (repoFullName: string, limit = 10): Promise<Contributor[] | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/contributors?per_page=${limit}`,
      getFetchOptions()
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch contributors");
  }
};

// Fetch issues
export const fetchIssues = async (repoFullName: string, state = "all", limit = 100): Promise<Issue[] | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/issues?state=${state}&per_page=${limit}`,
      getFetchOptions()
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch issues");
  }
};

// Fetch pull requests
export const fetchPullRequests = async (repoFullName: string, state = "all", limit = 100): Promise<PullRequest[] | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/pulls?state=${state}&per_page=${limit}`,
      getFetchOptions()
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch pull requests");
  }
};

// Fetch commit activity
export const fetchCommitActivity = async (repoFullName: string): Promise<CommitActivity[] | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/stats/commit_activity`,
      getFetchOptions()
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch commit activity");
  }
};

// Fetch code frequency
export const fetchCodeFrequency = async (repoFullName: string): Promise<CodeFrequency[] | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/stats/code_frequency`,
      getFetchOptions()
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const rawData = await response.json();
    return rawData.map((item: number[]) => ({
      week: item[0],
      additions: item[1],
      deletions: Math.abs(item[2]),
    }));
  } catch (error) {
    return handleApiError(error, "Failed to fetch code frequency");
  }
};

// Fetch releases
export const fetchReleases = async (repoFullName: string, limit = 10): Promise<Release[] | null> => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${repoFullName}/releases?per_page=${limit}`,
      getFetchOptions()
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
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
