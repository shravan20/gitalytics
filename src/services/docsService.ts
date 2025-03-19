import { toast } from "sonner";
import { cacheService } from "./cacheService";

// Documentation file types to check for
export interface DocFile {
  name: string;
  description: string;
  importance: "critical" | "recommended" | "optional";
  path: string; // GitHub API path to check
  alternativePaths?: string[]; // Alternative paths to check
}

export interface DocCheckResult {
  file: DocFile;
  exists: boolean;
  url?: string;
}

// Documentation files to check
export const documentationFiles: DocFile[] = [
  {
    name: "README",
    description: "Project overview, installation instructions, and basic usage",
    importance: "critical",
    path: "README.md",
    alternativePaths: ["README", "README.txt", "Readme.md"]
  },
  {
    name: "License",
    description: "License terms under which the software is distributed",
    importance: "critical",
    path: "LICENSE",
    alternativePaths: ["LICENSE.md", "LICENSE.txt", "COPYING"]
  },
  {
    name: "Contributing Guide",
    description: "Instructions for potential contributors",
    importance: "recommended",
    path: "CONTRIBUTING.md",
    alternativePaths: ["CONTRIBUTING", "CONTRIBUTE.md", "docs/CONTRIBUTING.md"]
  },
  {
    name: "Code of Conduct",
    description: "Expected behavior for project participants",
    importance: "recommended",
    path: "CODE_OF_CONDUCT.md",
    alternativePaths: ["CODE-OF-CONDUCT.md", "docs/CODE_OF_CONDUCT.md"]
  },
  {
    name: "Issue Templates",
    description: "Templates for reporting issues",
    importance: "recommended",
    path: ".github/ISSUE_TEMPLATE",
    alternativePaths: [".github/ISSUE_TEMPLATE.md", "docs/ISSUE_TEMPLATE.md"]
  },
  {
    name: "Pull Request Template",
    description: "Template for submitting pull requests",
    importance: "recommended",
    path: ".github/PULL_REQUEST_TEMPLATE.md",
    alternativePaths: [".github/PULL_REQUEST_TEMPLATE", "docs/PULL_REQUEST_TEMPLATE.md"]
  },
  {
    name: "Security Policy",
    description: "Instructions for reporting vulnerabilities",
    importance: "recommended",
    path: "SECURITY.md",
    alternativePaths: [".github/SECURITY.md", "docs/SECURITY.md"]
  },
  {
    name: "Changelog",
    description: "History of changes to the project",
    importance: "optional",
    path: "CHANGELOG.md",
    alternativePaths: ["CHANGELOG", "CHANGES.md", "HISTORY.md"]
  },
  {
    name: "Support",
    description: "How to get support for the project",
    importance: "optional",
    path: "SUPPORT.md",
    alternativePaths: [".github/SUPPORT.md", "docs/SUPPORT.md"]
  },
  {
    name: "Governance",
    description: "Project governance structure",
    importance: "optional",
    path: "GOVERNANCE.md",
    alternativePaths: ["docs/GOVERNANCE.md", "governance/README.md"]
  }
];

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

// Helper function to fetch with cache and handle 404s
const fetchDocFile = async (baseUrl: string, path: string): Promise<any> => {
  const cacheKey = `doc:${baseUrl}/${path}`;
  
  // Try to get from cache first, including 404 responses
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    // If we cached a 404, return null
    if (cachedData.status === 404) {
      return null;
    }
    return cachedData;
  }

  try {
    const response = await fetch(`${baseUrl}/${path}`, getFetchOptions());
    
    // Handle 404s - cache them too
    if (response.status === 404) {
      await cacheService.set(cacheKey, { status: 404, path });
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    await cacheService.set(cacheKey, data);
    return data;
  } catch (error) {
    if (error.message.includes('404')) {
      await cacheService.set(cacheKey, { status: 404, path });
    }
    return null;
  }
};

// Fetch documentation file status
export const checkDocumentationFiles = async (repoFullName: string): Promise<DocCheckResult[] | null> => {
  try {
    const baseUrl = `https://api.github.com/repos/${repoFullName}/contents`;
    const results: DocCheckResult[] = [];
    
    // Handle rate limiting by batching requests
    const batchedFiles = documentationFiles.reduce((batches, file, index) => {
      const batchIndex = Math.floor(index / 3); // Check 3 files at a time
      batches[batchIndex] = (batches[batchIndex] || []).concat(file);
      return batches;
    }, [] as DocFile[][]);
    
    for (const batch of batchedFiles) {
      const batchPromises = batch.map(async (file) => {
        const allPaths = [file.path, ...(file.alternativePaths || [])];
        
        // Try all possible paths for this documentation file
        for (const path of allPaths) {
          const data = await fetchDocFile(baseUrl, path);
          if (data) {
            return {
              file,
              exists: true,
              url: data.html_url || `https://github.com/${repoFullName}/blob/main/${path}`
            };
          }
        }
        
        // If we get here, the file wasn't found at any of the paths
        return {
          file,
          exists: false
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (batchedFiles.indexOf(batch) < batchedFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  } catch (error) {
    console.error("Failed to check documentation files:", error);
    toast.error("Failed to check documentation files");
    return null;
  }
};

// Add utility function to check if docs are cached
export const areDocsCached = async (repoFullName: string): Promise<boolean> => {
  const baseUrl = `https://api.github.com/repos/${repoFullName}/contents`;
  const mainFiles = ['README.md', 'LICENSE']; // Check main files as indicators
  
  for (const file of mainFiles) {
    const cacheKey = `doc:${baseUrl}/${file}`;
    const cachedData = await cacheService.get(cacheKey);
    if (!cachedData) {
      return false;
    }
  }
  
  return true;
};

// Add function to clear docs cache
export const clearDocsCache = async (repoFullName: string): Promise<void> => {
  const baseUrl = `https://api.github.com/repos/${repoFullName}/contents`;
  
  for (const file of documentationFiles) {
    const allPaths = [file.path, ...(file.alternativePaths || [])];
    for (const path of allPaths) {
      const cacheKey = `doc:${baseUrl}/${path}`;
      await cacheService.delete(cacheKey);
    }
  }
};

// Calculate documentation health score (0-100)
export const calculateDocScore = (results: DocCheckResult[]): number => {
  if (!results || results.length === 0) return 0;

  const weights = {
    critical: 40,
    recommended: 25,
    optional: 10
  };

  const totalPossibleScore = results.reduce(
    (sum, result) => sum + weights[result.file.importance],
    0
  );

  const actualScore = results.reduce(
    (sum, result) => sum + (result.exists ? weights[result.file.importance] : 0),
    0
  );

  return Math.round((actualScore / totalPossibleScore) * 100);
};

// Get color based on documentation health score
export const getDocHealthColor = (score: number): string => {
  if (score >= 80) return "bg-green-500 text-white";
  if (score >= 60) return "bg-yellow-500 text-white";
  if (score >= 40) return "bg-orange-500 text-white";
  return "bg-red-500 text-white";
};

// Get emoji based on documentation health score
export const getDocHealthEmoji = (score: number): string => {
  if (score >= 80) return "🟢"; // Excellent
  if (score >= 60) return "🟡"; // Good
  if (score >= 40) return "🟠"; // Needs improvement
  return "🔴"; // Poor
};
