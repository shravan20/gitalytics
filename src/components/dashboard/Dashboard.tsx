import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Repository,
  PullRequest,
  Issue,
  Contributor,
  CommitActivity,
  CodeFrequency,
  Release,
  fetchRepository,
  fetchContributors,
  fetchIssues,
  fetchPullRequests,
  fetchCommitActivity,
  fetchCodeFrequency,
  fetchReleases,
  calculateIssueResolutionTime,
  calculatePRMergeTime,
  formatDuration,
  formatDate,
} from "@/services/githubService";
import {
  DocCheckResult,
  checkDocumentationFiles,
} from "@/services/docsService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import RepositorySearch from "./RepositorySearch";
import MetricCard from "./MetricCard";
import Chart from "./Chart";
import DocumentationChecklist from "./DocumentationChecklist";
import { getMockData } from "@/utils/mockData";
import { CacheManager } from "@/components/CacheManager";
import { useNavigate } from "react-router-dom";

import {
  Star,
  GitFork,
  AlertCircle,
  GitPullRequest,
  GitCommit,
  Users,
  Code,
  Tag,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Database,
  FileText,
  Heart,
  Github,
} from "lucide-react";

const Footer = () => (
  <footer className="w-full border-t border-border mt-8">
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-center gap-3 text-sm">
        <span className="text-muted-foreground">Made with</span>
        <Heart className="h-4 w-4 text-red-500 animate-pulse" fill="currentColor" />
        <span className="text-muted-foreground">in</span>
        <a 
          href="https://github.com/shravan20/gitalytics" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Github className="h-4 w-4 text-primary" />
          <span className="text-primary font-medium">FOSS</span>
        </a>
      </div>
    </div>
  </footer>
);

const Dashboard = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [repoFullName, setRepoFullName] = useState<string | null>(null);
  const navigate = useNavigate();

  const [repository, setRepository] = useState<Repository | null>(null);
  const [contributors, setContributors] = useState<Contributor[] | null>(null);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [pullRequests, setPullRequests] = useState<PullRequest[] | null>(null);
  const [commitActivity, setCommitActivity] = useState<CommitActivity[] | null>(null);
  const [codeFrequency, setCodeFrequency] = useState<CodeFrequency[] | null>(null);
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [docResults, setDocResults] = useState<DocCheckResult[] | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const repoParam = searchParams.get("repo");

    if (repoParam) {
      setRepoFullName(repoParam);

      if (!useMockData) {
        setRepository(null);
        setContributors(null);
        setIssues(null);
        setPullRequests(null);
        setCommitActivity(null);
        setCodeFrequency(null);
        setReleases(null);
        setDocResults(null);
      }
    }
  }, [searchParams, useMockData]);

  useEffect(() => {
    if (!repoFullName || useMockData) return;

    fetchData(repoFullName);
  }, [repoFullName]);

  const fetchData = async (repo: string) => {
    setIsLoading(true);

    const repoData = await fetchRepository(repo);
    if (repoData) {
      setRepository(repoData);

      const [
        contributorsData,
        issuesData,
        pullRequestsData,
        commitActivityData,
        codeFrequencyData,
        releasesData,
        docResultsData,
      ] = await Promise.all([
        fetchContributors(repo),
        fetchIssues(repo),
        fetchPullRequests(repo),
        fetchCommitActivity(repo),
        fetchCodeFrequency(repo),
        fetchReleases(repo),
        checkDocumentationFiles(repo),
      ]);

      setContributors(contributorsData);
      setIssues(issuesData);
      setPullRequests(pullRequestsData);
      setCommitActivity(commitActivityData);
      setCodeFrequency(codeFrequencyData);
      setReleases(releasesData);
      setDocResults(docResultsData);
    }

    setIsLoading(false);
  };

  const handleSearch = (repo: string) => {
    if (repo !== repoFullName) {
      setIsLoading(true);
    }
  };

  const getLatestCommitCount = () => {
    if (!Array.isArray(commitActivity) || commitActivity.length === 0) {
      return "0";
    }
    const latestWeek = commitActivity[commitActivity.length - 1];
    return latestWeek?.total?.toLocaleString() || "0";
  };

  const commitActivityChartData = Array.isArray(commitActivity)
    ? commitActivity.map(week => ({
        week: new Date(week.week * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        commits: week.total
      }))
    : [];

  const codeFrequencyChartData = Array.isArray(codeFrequency)
    ? codeFrequency.map(week => ({
        week: new Date(week.week * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        additions: week.additions,
        deletions: week.deletions
      }))
    : [];

  const issuesChartData = Array.isArray(issues)
    ? [
        { name: "Open", value: issues.filter((issue) => issue.state === "open").length },
        { name: "Closed", value: issues.filter((issue) => issue.state === "closed").length },
      ]
    : [];

  const pullRequestsChartData = Array.isArray(pullRequests)
    ? [
        { name: "Open", value: pullRequests.filter((pr) => pr.state === "open").length },
        { name: "Merged", value: pullRequests.filter((pr) => pr.merged_at !== null).length },
        { name: "Closed (Unmerged)", value: pullRequests.filter((pr) => pr.state === "closed" && pr.merged_at === null).length },
      ]
    : [];

  const issueResolutionTime = issues ? calculateIssueResolutionTime(issues) : null;
  const prMergeTime = pullRequests ? calculatePRMergeTime(pullRequests) : null;

  const getStateColor = (state: string, merged_at?: string | null) => {
    if (state === "open") return "bg-github-green";
    if (merged_at) return "bg-github-purple";
    return "bg-github-gray";
  };

  const MockDataToggle = () => (
    <div className="flex items-center gap-2 mb-6">
      <Switch
        id="mock-data"
        checked={useMockData}
        onCheckedChange={setUseMockData}
      />
      <label htmlFor="mock-data" className="cursor-pointer flex items-center gap-1">
        <Database className="h-4 w-4" />
        <span>Use mock data for preview</span>
      </label>
    </div>
  );

  const [repoOwner, repoName] = repoFullName ? repoFullName.split('/') : ['', ''];

  const handleCacheCleared = () => {
    if (repoFullName) {
      fetchData(repoFullName);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  if (!repoFullName) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
          <div className="flex justify-between items-center mb-8">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleLogoClick}
            >
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage 
                  src="/favicon.ico" 
                  alt="Gitalytics Logo"
                  className="p-1"
                  style={{ 
                    imageRendering: 'pixelated',
                    objectFit: 'contain'
                  }}
                />
                <AvatarFallback>GA</AvatarFallback>
              </Avatar>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
                Gitalytics
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="text-center mb-12">
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get comprehensive insights into any GitHub-hosted open source project.
              Enter a repository name below to start analyzing its health, community engagement,
              and overall impact.
            </p>
            <div className="max-w-xl mx-auto mb-6">
              <RepositorySearch onSearch={handleSearch} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chart2 className="h-5 w-5 text-primary" />
                  Comprehensive Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View 15+ metrics including stars, forks, issue resolution times, PR merge rates,
                  contributor growth, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Real-Time Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All data is fetched in real-time from GitHub APIs, ensuring you always
                  have the most up-to-date information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  Open Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This dashboard is completely open source. You can contribute, customize
                  it for your needs, or deploy your own instance.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 text-center text-muted-foreground text-sm">
            <p>
              Try with popular repositories like{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = "/?repo=facebook/react"}>
                facebook/react
              </Button>
              {", "}
              <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = "/?repo=tensorflow/tensorflow"}>
                tensorflow/tensorflow
              </Button>
              {", or "}
              <Button variant="link" className="p-0 h-auto" onClick={() => window.location.href = "/?repo=microsoft/vscode"}>
                microsoft/vscode
              </Button>
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
        <div className="flex items-center justify-between mb-6">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleLogoClick}
          >
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage 
                src="/favicon.ico" 
                alt="Gitalytics Logo"
                className="p-1"
                style={{ 
                  imageRendering: 'pixelated',
                  objectFit: 'contain'
                }}
              />
              <AvatarFallback>GA</AvatarFallback>
            </Avatar>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Gitalytics
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[400px]">
              <RepositorySearch
                defaultValue={repoFullName}
                onSearch={handleSearch}
              />
            </div>
            <CacheManager onCacheCleared={handleCacheCleared} />
            <ThemeToggle />
          </div>
        </div>

        <MockDataToggle />

        {repository ? (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={repository.owner.avatar_url} alt={repository.owner.login} />
                <AvatarFallback>{repository.owner.login.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-xl">
                    <a
                      href={repository.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:underline"
                    >
                      {repository.full_name}
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </CardTitle>
                  <div className="flex gap-2">
                    {repository.language && (
                      <Badge variant="outline">{repository.language}</Badge>
                    )}
                    {repository.license && (
                      <Badge variant="secondary">{repository.license.name}</Badge>
                    )}
                  </div>
                </div>
                {repository.description && (
                  <CardDescription className="mt-1 text-sm">
                    {repository.description}
                  </CardDescription>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  {repository.topics?.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created: {formatDate(repository.created_at)}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last updated: {formatDate(repository.updated_at)}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last push: {formatDate(repository.pushed_at)}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <a
                href={repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary"
              >
                View on GitHub
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </CardFooter>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <div className="h-8 w-48 skeleton"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full skeleton mb-2"></div>
              <div className="h-4 w-3/4 skeleton"></div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Stars"
            value={repository?.stargazers_count?.toLocaleString() || "0"}
            description="Repository stars"
            icon={<Star className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Forks"
            value={repository?.forks_count?.toLocaleString() || "0"}
            description="Repository forks"
            icon={<GitFork className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Issues"
            value={repository?.open_issues_count?.toLocaleString() || "0"}
            description="Open issues"
            icon={<AlertCircle className="h-4 w-4" />}
            isLoading={isLoading}
          />
          <MetricCard
            title="Weekly Commits"
            value={getLatestCommitCount()}
            description="Commits in the last week"
            icon={<GitCommit className="h-4 w-4" />}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Chart
            title="Commit Activity"
            description="Weekly commits over time"
            data={commitActivityChartData}
            type="multi"
            xKey="week"
            yKeys={[{ key: "commits", name: "Commits", color: "hsl(var(--primary))" }]}
            isLoading={isLoading}
          />
          <Chart
            title="Code Frequency"
            description="Weekly code additions and deletions"
            data={codeFrequencyChartData}
            type="multi"
            xKey="week"
            yKeys={[
              { key: "additions", name: "Additions", color: "hsl(var(--github-green))" },
              { key: "deletions", name: "Deletions", color: "hsl(var(--github-red))" },
            ]}
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Chart
            title="Issues"
            description="Open vs. closed issues"
            data={issuesChartData}
            type="multi"
            xKey="name"
            yKeys={[
              { key: "value", name: "Count", color: "hsl(var(--primary))" },
            ]}
            isLoading={isLoading}
          />
          <Chart
            title="Pull Requests"
            description="Open, merged, and closed PRs"
            data={pullRequestsChartData}
            type="multi"
            xKey="name"
            yKeys={[
              { key: "value", name: "Count", color: "hsl(var(--primary))" },
            ]}
            isLoading={isLoading}
          />
        </div>

        <Tabs defaultValue="contributors" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
            <TabsTrigger value="issues">Recent Issues</TabsTrigger>
            <TabsTrigger value="pulls">Recent PRs</TabsTrigger>
            <TabsTrigger value="releases">Releases</TabsTrigger>
          </TabsList>

          <TabsContent value="contributors">
            <Card>
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
                <CardDescription>
                  Most active contributors by commit count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3">
                      <div className="h-10 w-10 rounded-full skeleton"></div>
                      <div className="flex-1">
                        <div className="h-4 w-32 skeleton mb-2"></div>
                        <div className="h-3 w-24 skeleton"></div>
                      </div>
                    </div>
                  ))
                ) : contributors && contributors.length > 0 ? (
                  <div className="space-y-4">
                    {contributors.slice(0, 10).map((contributor, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                          <AvatarFallback>{contributor.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{contributor.login}</div>
                          <div className="text-sm text-muted-foreground">
                            {contributor.contributions.toLocaleString()} contributions
                          </div>
                        </div>
                        <a
                          href={contributor.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No contributors data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>Recent Issues</CardTitle>
                <CardDescription>
                  Latest reported issues and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="py-3">
                      <div className="h-5 w-full skeleton mb-2"></div>
                      <div className="h-4 w-1/2 skeleton"></div>
                    </div>
                  ))
                ) : issues && issues.length > 0 ? (
                  <div className="space-y-4">
                    {issues.slice(0, 10).map((issue, index) => (
                      <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <a
                            href={issue.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex-1"
                          >
                            {issue.title}
                          </a>
                          <div className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full mr-2 ${issue.state === "open" ? "bg-github-green" : "bg-github-gray"
                                }`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {issue.state}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>#{issue.number}</span>
                          <span>opened by {issue.user.login}</span>
                          <span>on {formatDate(issue.created_at)}</span>
                        </div>
                        {issue.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {issue.labels.map((label, labelIndex) => (
                              <Badge key={labelIndex} variant="outline" className="text-xs">
                                {label.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No issues data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pulls">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pull Requests</CardTitle>
                <CardDescription>
                  Latest pull requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="py-3">
                      <div className="h-5 w-full skeleton mb-2"></div>
                      <div className="h-4 w-1/2 skeleton"></div>
                    </div>
                  ))
                ) : pullRequests && pullRequests.length > 0 ? (
                  <div className="space-y-4">
                    {pullRequests.slice(0, 10).map((pr, index) => (
                      <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex-1"
                          >
                            {pr.title}
                          </a>
                          <div className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full mr-2 ${getStateColor(pr.state, pr.merged_at)}`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {pr.merged_at ? "merged" : pr.state}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>#{pr.number}</span>
                          <span>opened by {pr.user.login}</span>
                          <span>on {formatDate(pr.created_at)}</span>
                          {pr.merged_at && <span>merged on {formatDate(pr.merged_at)}</span>}
                          {pr.closed_at && !pr.merged_at && <span>closed on {formatDate(pr.closed_at)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pull requests data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="releases">
            <Card>
              <CardHeader>
                <CardTitle>Releases</CardTitle>
                <CardDescription>
                  Version history and release notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="mb-6">
                      <div className="h-6 w-24 skeleton mb-2"></div>
                      <div className="h-4 w-full skeleton mb-2"></div>
                      <div className="h-4 w-3/4 skeleton"></div>
                    </div>
                  ))
                ) : releases && releases.length > 0 ? (
                  <div className="space-y-6">
                    {releases.map((release, index) => (
                      <div key={index} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">
                            {release.name || release.tag_name}
                          </h3>
                          <Badge variant="outline">{release.tag_name}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Released on {formatDate(release.published_at || release.created_at)}
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <a
                            href={release.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary flex items-center"
                          >
                            View on GitHub
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No releases available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

const Chart2 = Star;
const LineChart = GitCommit;
const Code2 = Code;

export default Dashboard;
