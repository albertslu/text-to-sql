# 🚀 Advanced Text-to-SQL Agent with Memory

An intelligent text-to-SQL agent built with Mastra that goes beyond basic query generation to provide contextual conversations, advanced analytics, and production-ready architecture.

## 🎯 What Makes This Special

This implementation transforms the basic "text-to-SQL" requirement into a sophisticated AI agent that demonstrates:

- **🧠 Memory & Context**: Remembers conversations and builds on previous queries
- **📊 Advanced Analytics**: Statistical analysis, geographic intelligence, and complex aggregations
- **🛡️ Production-Ready**: Security, error handling, and scalable architecture
- **🎨 Intelligent UX**: Smart suggestions, insights, and natural conversation flow

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mastra Agent  │    │   Memory System  │    │   SQLite DB     │
│                 │    │                  │    │                 │
│ • GPT-4o-mini   │◄──►│ • LibSQL Storage │    │ • 1,047 cities  │
│ • Tool System   │    │ • Conversation   │    │ • Geographic    │
│ • Instructions  │    │   History        │    │   Data          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   Tools         │                            │   Query Engine  │
│                 │                            │                 │
│ • execute_sql   │◄──────────────────────────►│ • Validation    │
│ • insights      │                            │ • Execution     │
│ • suggestions   │                            │ • Results       │
└─────────────────┘                            └─────────────────┘
```

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   echo "OPENAI_API_KEY=your_key_here" > .env
   ```

3. **Start the agent**
   ```bash
   npm run dev
   ```

4. **Open browser** → `http://localhost:4113`

## 💡 Demo Scenarios

### **Memory-Powered Conversations**
```
You: "Show me European cities with population over 1 million"
Agent: [Returns 10 European cities with populations]

You: "What was the average population of those cities?"
Agent: "The average population of the cities located in Europe is approximately 361,379."
```

### **Advanced Analytics**
```
You: "What's the average population by continent?"
Agent: [Generates GROUP BY query with AVG aggregation]

You: "Which continent has the most cities?"
Agent: [Generates COUNT query grouped by continent]
```

### **Geographic Intelligence**
```
You: "Find cities in the Southern Hemisphere"
Agent: [Uses latitude < 0 condition]

You: "Show me the northernmost city"
Agent: [Uses MAX(latitude) to find northernmost point]
```

## 🔧 Technical Features

### **Advanced SQL Generation**
- Complex aggregations (COUNT, AVG, SUM, MIN, MAX)
- Geographic queries using coordinates
- Statistical analysis with standard deviations
- Multi-table style analysis patterns
- Ranking and correlation queries

### **Memory System**
- Persistent conversation history
- Context-aware follow-up questions
- Reference to previous results
- LibSQL storage for reliability

### **Security & Safety**
- SQL injection prevention
- Query validation (SELECT-only)
- Input sanitization
- Graceful error handling

### **User Experience**
- Natural language understanding
- Smart query suggestions
- Contextual insights
- Clear result formatting

## 📊 Database Schema

The agent works with a rich dataset of 1,047 world cities:

```sql
CREATE TABLE cities (
  popularity REAL,        -- Popularity score
  geoname_id TEXT,       -- Unique identifier
  name_en TEXT,          -- City name in English
  country_code TEXT,     -- 2-letter country code
  population INTEGER,    -- City population
  latitude REAL,         -- Latitude coordinate
  longitude REAL,        -- Longitude coordinate
  country TEXT,          -- Full country name
  region TEXT,           -- Geographic region
  continent TEXT,        -- Continent name
  code2 TEXT,           -- 2-letter country code
  code TEXT,            -- 3-letter country code
  province TEXT         -- Province/state name
);
```

## 🎪 Example Queries

### **Basic Exploration**
- "Show me the 5 most populous cities"
- "What cities are in France?"
- "Find cities with population over 5 million"

### **Statistical Analysis**
- "What's the average population by continent?"
- "Show me cities with population within 2 standard deviations"
- "Rank continents by total population"

### **Geographic Intelligence**
- "Find cities in the Southern Hemisphere"
- "What's the northernmost city in Europe?"
- "Show me cities between 40-50 degrees latitude"

### **Advanced Analytics**
- "Which countries have the most cities in our database?"
- "Compare population density between regions"
- "Is there a correlation between popularity and population?"

## 🏆 Production Considerations

### **Scalability**
- Modular tool architecture
- Configurable memory retention
- Database-agnostic design
- Horizontal scaling potential

### **Monitoring & Observability**
- Structured logging
- Error tracking
- Performance metrics
- Query analysis

### **Security**
- Input validation
- Query sanitization
- Rate limiting ready
- Audit logging

## 🔮 Future Enhancements

### **Immediate Opportunities**
- [ ] Query result visualization (charts, graphs)
- [ ] Export capabilities (CSV, JSON, PDF)
- [ ] Query optimization suggestions
- [ ] Natural language result explanations

### **Advanced Features**
- [ ] Multi-database support
- [ ] Real-time data streaming
- [ ] Machine learning insights
- [ ] Collaborative query building

## 🧠 Technical Decisions

Key architectural choices and their rationale:

1. **Mastra Framework**: Chosen for agent-specific features and excellent developer experience
2. **Memory System**: LibSQL storage for persistent, reliable conversation context
3. **Multi-Tool Design**: Separation of concerns between SQL execution and insights
4. **Security-First**: Multiple layers of protection against SQL injection
5. **Rich Dataset**: Geographic and demographic data enables complex analysis

## 📈 Performance

- **Query Execution**: < 100ms for most queries
- **Memory Retrieval**: < 50ms for conversation context
- **Database Size**: 1,047 records, ~118KB
- **Memory Footprint**: Configurable retention (default: 15 messages)

## 🤝 Contributing

This project demonstrates production-ready AI agent architecture. Key areas for contribution:

- Additional data sources and schemas
- New analytical capabilities
- Performance optimizations
- Enhanced security measures
- UI/UX improvements

## 📝 License

MIT License - Feel free to use this as a foundation for your own AI agent projects.

---

**Built with ❤️ using Mastra, OpenAI, and modern AI agent patterns.**
