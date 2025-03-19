# 📊 Gitalytics

> Powerful analytics and insights for GitHub repositories

Gitalytics is a modern web application that provides comprehensive analytics for any public GitHub repository. Get instant insights into repository health, community engagement, and development activity.

![License](https://img.shields.io/github/license/shravan20/gitalytics)

## ✨ Features

- **Repository Overview**
  - Stars, forks, and watchers count
  - Language statistics
  - License information
  - Topics and tags

- **Community Insights**
  - Active contributors
  - Issue resolution times
  - PR merge rates
  - Community engagement metrics

- **Development Activity**
  - Commit frequency
  - Code additions/deletions
  - Release history
  - Branch activity

- **Documentation Health**
  - Documentation completeness score
  - Essential files check (README, LICENSE, etc.)
  - Contributing guidelines status
  - Issue/PR templates verification

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- GitHub Personal Access Token

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/shravan20/gitalytics.git
   cd gitalytics
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

4. Add your GitHub token:
   - Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - Create a new token with `repo` scope
   - Copy the token to your `.env` file:

     ```
     VITE_GITHUB_TOKEN=your_github_token_here
     ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:8080](http://localhost:8080) in your browser

## 🛠️ Tech Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query
- **Charts**: Recharts
- **Build Tool**: Vite
- **API**: GitHub REST API

## 📖 Usage

1. Enter a GitHub repository name in the format `owner/repository` (e.g., `facebook/react`)
2. View instant analytics including:
   - Repository statistics
   - Community health metrics
   - Development activity
   - Documentation status

### Example Repositories to Try

- `facebook/react`
- `tensorflow/tensorflow`
- `microsoft/vscode`

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Documentation

Key components and their purposes:

- `Dashboard.tsx`: Main analytics dashboard component
- `githubService.ts`: GitHub API integration service
- `docsService.ts`: Documentation analysis service
- `Chart.tsx`: Reusable chart components
- `MetricCard.tsx`: Analytics metric display cards

## 🔑 API Rate Limits

- Without authentication: 60 requests/hour
- With authentication: 5,000 requests/hour
- Use a GitHub token to increase your rate limit

## 🌟 Features Coming Soon

- [ ] Repository comparison
- [ ] Contributor insights
- [ ] Code quality metrics
- [ ] Custom date ranges
- [ ] PDF report export
- [ ] Team collaboration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [GitHub REST API](https://docs.github.com/rest) for providing the data
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Recharts](https://recharts.org/) for the charting library

## 📧 Contact

Shravan - [@shravan20](https://github.com/shravan20)

Project Link: [https://github.com/shravan20/gitalytics](https://github.com/shravan20/gitalytics)

---
Made with ❤️ in FOSS by [Shravan](https://github.com/shravan20)
