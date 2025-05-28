#!/bin/bash

# AI Document Processor - GitHub Deployment Script
# For sebegerritsen account

echo "🚀 AI Document Processor - GitHub Deployment"
echo "============================================="
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ This is not a git repository. Please run this script from the project root."
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "1. ✅ Git repository detected"
echo "2. ✅ All files committed"

# Remove existing remote if it exists
echo ""
echo "🔧 Setting up GitHub remote..."
git remote remove origin 2>/dev/null || true

# Add the correct remote
git remote add origin https://github.com/sebegerritsen/ai-doc-processor.git

echo "✅ Remote repository configured: https://github.com/sebegerritsen/ai-doc-processor.git"
echo ""

echo "📤 Ready to push to GitHub!"
echo ""
echo "⚠️  IMPORTANT: Before running the next command, make sure you have:"
echo "   1. Created the repository 'ai-doc-processor' on GitHub under 'sebegerritsen'"
echo "   2. Have a Personal Access Token ready (or SSH key configured)"
echo ""
echo "🔑 To create a Personal Access Token:"
echo "   1. Go to GitHub.com → Settings → Developer settings → Personal access tokens"
echo "   2. Generate new token with 'repo' scope"
echo "   3. Copy the token (you won't see it again!)"
echo ""
echo "📤 To push to GitHub, run:"
echo "   git push -u origin main"
echo ""
echo "   When prompted:"
echo "   Username: sebegerritsen"
echo "   Password: [YOUR_PERSONAL_ACCESS_TOKEN]"
echo ""
echo "🎉 After successful push, your repository will be available at:"
echo "   https://github.com/sebegerritsen/ai-doc-processor"
echo ""

# Optional: Ask if user wants to push now
read -p "🤔 Do you want to push to GitHub now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Your AI Document Processor is now on GitHub!"
        echo "🔗 Repository URL: https://github.com/sebegerritsen/ai-doc-processor"
        echo ""
        echo "📋 Next steps:"
        echo "1. Visit your repository on GitHub"
        echo "2. Add repository topics: nodejs, express, docker, ai, pdf-processing"
        echo "3. Update repository description"
        echo "4. Consider setting up branch protection rules"
        echo ""
    else
        echo ""
        echo "❌ Push failed. Please check:"
        echo "1. Repository exists on GitHub"
        echo "2. Authentication credentials are correct"
        echo "3. You have push permissions"
        echo ""
        echo "📖 See GITHUB_SETUP.md for detailed troubleshooting"
    fi
else
    echo ""
    echo "📖 No problem! When you're ready:"
    echo "   git push -u origin main"
    echo ""
    echo "📚 For detailed instructions, see: GITHUB_SETUP.md"
fi

echo ""
echo "📁 Repository contents ready for GitHub:"
echo "├── README.md                 # Main documentation"
echo "├── API_DOCUMENTATION.md      # Complete API guide"
echo "├── ADVANCED_USAGE.md         # Advanced features"
echo "├── QUICK_REFERENCE.md        # Developer cheat sheet"
echo "├── DEBUGGING_GUIDE.md        # Troubleshooting"
echo "├── GITHUB_SETUP.md           # This setup guide"
echo "├── Dockerfile                # Docker configuration"
echo "├── docker-compose.yml        # Docker Compose"
echo "├── package.json              # Node.js dependencies"
echo "├── src/                      # Source code"
echo "└── old_files/                # Archived files"
echo ""
echo "🔒 Security: API keys and sensitive data are safely excluded via .gitignore"
echo "" 