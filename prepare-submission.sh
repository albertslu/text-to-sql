#!/bin/bash

# Create submission directory
mkdir -p submission-albert-lu-text-to-sql

# Copy source code
cp -r src/ submission-albert-lu-text-to-sql/
cp package.json submission-albert-lu-text-to-sql/
cp tsconfig.json submission-albert-lu-text-to-sql/
cp biome.json submission-albert-lu-text-to-sql/
cp world-cities-geoname.csv submission-albert-lu-text-to-sql/

# Copy documentation
cp README.md submission-albert-lu-text-to-sql/
cp ENHANCED_README.md submission-albert-lu-text-to-sql/
cp TECHNICAL_DECISIONS.md submission-albert-lu-text-to-sql/
cp DEMO_SCENARIOS.md submission-albert-lu-text-to-sql/
cp ADVANCED_DEMO_SCRIPT.md submission-albert-lu-text-to-sql/
cp FUTURE_ROADMAP.md submission-albert-lu-text-to-sql/
cp SUBMISSION_README.md submission-albert-lu-text-to-sql/

# Create .env.example
echo "# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Set to development for verbose logging  
NODE_ENV=development" > submission-albert-lu-text-to-sql/.env.example

# Create zip file
zip -r albert-lu-text-to-sql-submission.zip submission-albert-lu-text-to-sql/

# Clean up
rm -rf submission-albert-lu-text-to-sql/

echo "✅ Submission ready: albert-lu-text-to-sql-submission.zip"
echo "📁 Contains: source code, documentation, configuration files"
echo "🚀 Ready to submit!"
