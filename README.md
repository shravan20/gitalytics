# gitalytics
Insights into any GitHub-hosted open source project

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Create a [GitHub Personal Access Token](https://github.com/settings/tokens):
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens
   - Generate a new token with `repo` scope
   - Copy the token
4. Add your GitHub token to `.env`:
   ```
   VITE_GITHUB_TOKEN=your_github_token_here
   ```
5. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
