#!/bin/bash
# JEE Tribe DSB Challenge - Deploy to GitHub + Vercel
# Run this script from inside the jee-tribe-dsb-challenge folder

echo "🚀 Deploying JEE Tribe DSB Challenge..."

# Step 1: Initialize git (if not already)
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
  git branch -m main
fi

# Step 2: Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
  echo "node_modules/
dist/
.env
.fuse_hidden*" > .gitignore
fi

# Step 3: Add and commit
echo "📝 Staging and committing files..."
git add -A
git commit -m "Initial commit: JEE Tribe DSB Challenge"

# Step 4: Add remote and push
echo "🔗 Pushing to GitHub..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/ClatTribe/jee-tribe-dsb-challenge.git
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo "📋 Next steps:"
echo "   1. Go to https://vercel.com/new"
echo "   2. Import the 'ClatTribe/jee-tribe-dsb-challenge' repo"
echo "   3. Set environment variable: GEMINI_API_KEY = your_api_key"
echo "   4. Click Deploy!"
echo ""
echo "Done! 🎉"
