
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DocCheckResult, getDocHealthColor, getDocHealthEmoji } from "@/services/docsService";

interface DocumentationChecklistProps {
  docResults: DocCheckResult[] | null;
  isLoading: boolean;
  repoOwner: string;
  repoName: string;
}

const DocumentationChecklist: React.FC<DocumentationChecklistProps> = ({
  docResults,
  isLoading,
  repoOwner,
  repoName
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentation Health
          </CardTitle>
          <CardDescription>
            FOSS documentation compliance checklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="h-4 w-full skeleton mb-2"></div>
            <div className="h-4 w-3/4 skeleton"></div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-t">
              <div className="h-5 w-5 rounded-full skeleton"></div>
              <div className="flex-1">
                <div className="h-4 w-32 skeleton mb-2"></div>
                <div className="h-3 w-48 skeleton"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!docResults || docResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentation Health
          </CardTitle>
          <CardDescription>
            FOSS documentation compliance checklist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Could not load documentation information
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate documentation score
  const criticalFiles = docResults.filter(r => r.file.importance === "critical");
  const recommendedFiles = docResults.filter(r => r.file.importance === "recommended");
  const optionalFiles = docResults.filter(r => r.file.importance === "optional");

  const criticalCount = criticalFiles.filter(r => r.exists).length;
  const recommendedCount = recommendedFiles.filter(r => r.exists).length;
  const optionalCount = optionalFiles.filter(r => r.exists).length;

  const totalCritical = criticalFiles.length;
  const totalRecommended = recommendedFiles.length;
  const totalOptional = optionalFiles.length;

  // Calculate weighted score (critical: 40%, recommended: 25%, optional: 10%)
  const score = Math.round(
    ((criticalCount / totalCritical) * 40) +
    ((recommendedCount / totalRecommended) * 25) +
    ((optionalCount / totalOptional) * 10)
  );

  const createFileUrl = (fileName: string) => {
    return `https://github.com/${repoOwner}/${repoName}/new/main?filename=${fileName}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentation Health {getDocHealthEmoji(score)}
        </CardTitle>
        <CardDescription>
          FOSS documentation compliance checklist
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Documentation Score</span>
            <Badge className={getDocHealthColor(score)}>{score}%</Badge>
          </div>
          <Progress value={score} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            {criticalCount}/{totalCritical} critical, {recommendedCount}/{totalRecommended} recommended, 
            and {optionalCount}/{totalOptional} optional documents found
          </p>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-semibold mb-1">Critical Documents</h4>
          {criticalFiles.map((result, i) => (
            <DocFileRow key={`critical-${i}`} result={result} repoOwner={repoOwner} repoName={repoName} />
          ))}
        </div>

        <div className="space-y-1 mt-4">
          <h4 className="text-sm font-semibold mb-1">Recommended Documents</h4>
          {recommendedFiles.map((result, i) => (
            <DocFileRow key={`recommended-${i}`} result={result} repoOwner={repoOwner} repoName={repoName} />
          ))}
        </div>

        <div className="space-y-1 mt-4">
          <h4 className="text-sm font-semibold mb-1">Optional Documents</h4>
          {optionalFiles.map((result, i) => (
            <DocFileRow key={`optional-${i}`} result={result} repoOwner={repoOwner} repoName={repoName} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const DocFileRow = ({ result, repoOwner, repoName }: { 
  result: DocCheckResult;
  repoOwner: string;
  repoName: string;
}) => {
  const { file, exists, url } = result;
  
  return (
    <div className="flex items-start gap-3 py-2 border-t border-border">
      <div className="pt-0.5">
        {exists ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertCircle className="h-5 w-5 text-orange-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium">{file.name}</div>
        <div className="text-sm text-muted-foreground">{file.description}</div>
      </div>
      <div>
        {exists && url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm">
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </Button>
          </a>
        ) : (
          <a href={`https://github.com/${repoOwner}/${repoName}/new/main?filename=${file.path}`} 
             target="_blank" 
             rel="noopener noreferrer" 
             className="inline-flex items-center text-sm">
            <Button variant="outline" size="sm" className="gap-1">
              <FileText className="h-3.5 w-3.5" />
              Create
            </Button>
          </a>
        )}
      </div>
    </div>
  );
};

export default DocumentationChecklist;
