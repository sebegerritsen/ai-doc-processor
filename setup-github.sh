#!/bin/bash

echo "🚀 Setting up AI Document Processor for GitHub"
echo "=============================================="

# Initialize git repository
echo "📁 Initializing git repository..."
git init

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: AI Document Processor with JSON parsing and Bearer auth

Features included:
- PDF document processing with OpenAI/Anthropic
- Bearer token authentication
- JSON parsing of AI responses
- Multiline prompt support
- Comprehensive logging and security
- Docker support
- Complete test suites"

echo ""
echo "✅ Git repository initialized successfully!"
echo ""
echo "🔗 Next steps to push to GitHub:"
echo "1. Create a new repository on GitHub"
echo "2. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/ai-doc-processor.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "📋 Repository contents:"
echo "- ✅ Complete API with authentication"
echo "- ✅ JSON parsing feature"
echo "- ✅ Comprehensive documentation"
echo "- ✅ Test suites"
echo "- ✅ Docker configuration"
echo "- ✅ Environment templates"
echo ""
echo "🔐 Security note:"
echo "- .env file is excluded from git"
echo "- Use .env.example as template"
echo "- Generate new API tokens for production"
echo ""
echo "�� Ready for GitHub!" 