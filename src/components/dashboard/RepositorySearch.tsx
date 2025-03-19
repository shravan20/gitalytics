
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface RepositorySearchProps {
  defaultValue?: string;
}

const RepositorySearch = ({ defaultValue = "" }: RepositorySearchProps) => {
  const [repoInput, setRepoInput] = useState(defaultValue);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!repoInput) {
      toast.error("Please enter a repository name");
      return;
    }
    
    // Check for owner/repo format
    const isValidFormat = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repoInput);
    if (!isValidFormat) {
      toast.error("Please enter a valid repository in the format 'owner/repository'");
      return;
    }
    
    // Redirect to dashboard with repository as query param
    navigate(`/?repo=${encodeURIComponent(repoInput)}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="owner/repository (e.g. facebook/react)"
          className="pl-9"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
        />
      </div>
      <Button type="submit" size="sm">Search</Button>
    </form>
  );
};

export default RepositorySearch;
