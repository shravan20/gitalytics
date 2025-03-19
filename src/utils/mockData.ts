import { Repository, Contributor, Issue, PullRequest, CommitActivity, CodeFrequency, Release } from "@/services/githubService";

// Mock repository data
export const mockRepository: Repository = {
  id: 123456789,
  name: "react",
  full_name: "facebook/react",
  html_url: "https://github.com/facebook/react",
  description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
  created_at: "2013-05-24T16:15:54Z",
  updated_at: "2023-09-15T10:45:32Z",
  pushed_at: "2023-09-16T08:23:12Z",
  stargazers_count: 203487,
  watchers_count: 203487,
  forks_count: 41982,
  open_issues_count: 1256,
  language: "JavaScript",
  topics: ["javascript", "ui", "library", "react", "frontend", "declarative"],
  license: {
    name: "MIT License",
    spdx_id: "MIT",
    url: "https://api.github.com/licenses/mit"
  },
  owner: {
    login: "facebook",
    avatar_url: "https://avatars.githubusercontent.com/u/69631?v=4",
    html_url: "https://github.com/facebook"
  },
  default_branch: "main"
};

// Mock contributors data
export const mockContributors: Contributor[] = Array.from({ length: 15 }, (_, i) => ({
  login: `contributor${i + 1}`,
  avatar_url: `https://randomuser.me/api/portraits/${i % 2 ? 'men' : 'women'}/${i + 1}.jpg`,
  html_url: `https://github.com/contributor${i + 1}`,
  contributions: Math.floor(Math.random() * 1000) + 50
})).sort((a, b) => b.contributions - a.contributions);

// Mock issues data
export const mockIssues: Issue[] = Array.from({ length: 30 }, (_, i) => {
  const isOpen = Math.random() > 0.6;
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90));
  
  const updatedDate = new Date(createdDate);
  updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 7) + 1);
  
  const closedDate = isOpen ? null : new Date(updatedDate);
  if (closedDate) {
    closedDate.setDate(closedDate.getDate() + Math.floor(Math.random() * 7) + 1);
  }
  
  return {
    id: 200000 + i,
    node_id: `I_kwDOA${i}`,
    number: 1000 + i,
    title: `Issue ${i+1}: ${['Fix', 'Improve', 'Update', 'Add', 'Remove'][Math.floor(Math.random() * 5)]} ${['performance', 'documentation', 'tests', 'feature', 'bug'][Math.floor(Math.random() * 5)]}`,
    user: {
      login: `user${Math.floor(Math.random() * 20) + 1}`,
      avatar_url: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${(i % 10) + 1}.jpg`,
      html_url: `https://github.com/user${Math.floor(Math.random() * 20) + 1}`
    },
    state: isOpen ? "open" : "closed",
    created_at: createdDate.toISOString(),
    updated_at: updatedDate.toISOString(),
    closed_at: closedDate ? closedDate.toISOString() : null,
    html_url: `https://github.com/facebook/react/issues/${1000 + i}`,
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    labels: Array.from({ length: Math.floor(Math.random() * 3) }, (_, j) => ({
      name: ['bug', 'documentation', 'enhancement', 'good first issue', 'help wanted'][Math.floor(Math.random() * 5)],
      color: ['fc2929', '0e8a16', '1d76db', '5319e7', 'fbca04'][Math.floor(Math.random() * 5)]
    }))
  };
});

// Mock pull requests data
export const mockPullRequests: PullRequest[] = Array.from({ length: 25 }, (_, i) => {
  const state = Math.random() > 0.3 ? "closed" : "open";
  const merged = state === "closed" && Math.random() > 0.2;
  
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60));
  
  const updatedDate = new Date(createdDate);
  updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 5) + 1);
  
  let closedDate = null;
  let mergedDate = null;
  
  if (state === "closed") {
    closedDate = new Date(updatedDate);
    closedDate.setDate(closedDate.getDate() + Math.floor(Math.random() * 5) + 1);
    
    if (merged) {
      mergedDate = new Date(closedDate);
    }
  }
  
  return {
    id: 500000 + i,
    node_id: `PR_kwDOA${i}`,
    number: 2000 + i,
    title: `PR ${i+1}: ${['Implement', 'Fix', 'Refactor', 'Optimize', 'Add'][Math.floor(Math.random() * 5)]} ${['component', 'feature', 'bug', 'performance', 'documentation'][Math.floor(Math.random() * 5)]}`,
    user: {
      login: `user${Math.floor(Math.random() * 20) + 1}`,
      avatar_url: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${(i % 10) + 1}.jpg`,
      html_url: `https://github.com/user${Math.floor(Math.random() * 20) + 1}`
    },
    state,
    created_at: createdDate.toISOString(),
    updated_at: updatedDate.toISOString(),
    closed_at: closedDate ? closedDate.toISOString() : null,
    merged_at: mergedDate ? mergedDate.toISOString() : null,
    html_url: `https://github.com/facebook/react/pull/${2000 + i}`
  };
});

// Mock commit activity data (weekly commits for the last 52 weeks)
export const mockCommitActivity: CommitActivity[] = Array.from({ length: 52 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (52 - i) * 7);
  
  return {
    week: Math.floor(date.getTime() / 1000),
    total: Math.floor(Math.random() * 120) + 10,
    days: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20))
  };
});

// Mock code frequency data (additions/deletions per week)
export const mockCodeFrequency: CodeFrequency[] = Array.from({ length: 52 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (52 - i) * 7);
  
  return {
    week: Math.floor(date.getTime() / 1000),
    additions: Math.floor(Math.random() * 10000) + 500,
    deletions: -1 * (Math.floor(Math.random() * 5000) + 300)
  };
});

// Mock releases data
export const mockReleases: Release[] = Array.from({ length: 10 }, (_, i) => {
  const date = new Date();
  date.setMonth(date.getMonth() - i);
  
  const majorVersion = 18;
  const minorVersion = 10 - i;
  
  return {
    id: 700000 + i,
    tag_name: `v${majorVersion}.${minorVersion}.${Math.floor(Math.random() * 5)}`,
    name: `React ${majorVersion}.${minorVersion}`,
    created_at: date.toISOString(),
    published_at: date.toISOString(),
    html_url: `https://github.com/facebook/react/releases/tag/v${majorVersion}.${minorVersion}.0`,
    assets: [] // Adding the required assets property
  };
});

// Add mock documentation results type to the interface
export interface MockData {
  repository: Repository;
  contributors: Contributor[];
  issues: Issue[];
  pullRequests: PullRequest[];
  commitActivity: CommitActivity[];
  codeFrequency: CodeFrequency[];
  releases: Release[];
  docResults?: {
    file: {
      name: string;
      description: string;
      importance: "critical" | "recommended" | "optional";
      path: string;
    };
    exists: boolean;
    url?: string;
  }[];
}

export const getMockData = (): MockData => {
  return {
    repository: mockRepository,
    contributors: mockContributors,
    issues: mockIssues,
    pullRequests: mockPullRequests,
    commitActivity: mockCommitActivity,
    codeFrequency: mockCodeFrequency,
    releases: mockReleases,
    // Mock documentation results
    docResults: [
      { file: { name: "README", description: "Project overview", importance: "critical", path: "README.md" }, exists: true, url: "https://github.com/facebook/react/blob/main/README.md" },
      { file: { name: "License", description: "License terms", importance: "critical", path: "LICENSE" }, exists: true, url: "https://github.com/facebook/react/blob/main/LICENSE" },
      { file: { name: "Contributing Guide", description: "Instructions for contributors", importance: "recommended", path: "CONTRIBUTING.md" }, exists: true, url: "https://github.com/facebook/react/blob/main/CONTRIBUTING.md" },
      { file: { name: "Code of Conduct", description: "Expected behavior", importance: "recommended", path: "CODE_OF_CONDUCT.md" }, exists: true, url: "https://github.com/facebook/react/blob/main/CODE_OF_CONDUCT.md" },
      { file: { name: "Issue Templates", description: "Templates for issues", importance: "recommended", path: ".github/ISSUE_TEMPLATE" }, exists: true, url: "https://github.com/facebook/react/blob/main/.github/ISSUE_TEMPLATE" },
      { file: { name: "Pull Request Template", description: "Template for PRs", importance: "recommended", path: ".github/PULL_REQUEST_TEMPLATE.md" }, exists: true, url: "https://github.com/facebook/react/blob/main/.github/PULL_REQUEST_TEMPLATE.md" },
      { file: { name: "Security Policy", description: "Security reporting", importance: "recommended", path: "SECURITY.md" }, exists: false },
      { file: { name: "Changelog", description: "History of changes", importance: "optional", path: "CHANGELOG.md" }, exists: true, url: "https://github.com/facebook/react/blob/main/CHANGELOG.md" },
      { file: { name: "Support", description: "How to get support", importance: "optional", path: "SUPPORT.md" }, exists: false },
      { file: { name: "Governance", description: "Project governance", importance: "optional", path: "GOVERNANCE.md" }, exists: false }
    ]
  };
};
