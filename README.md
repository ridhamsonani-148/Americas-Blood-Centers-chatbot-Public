# America's Blood Centers AI Chatbot

An intelligent chatbot powered by Amazon Bedrock to provide information about blood donation, eligibility criteria, and donation centers.

## 🩸 Features

- **Bilingual Support**: English and Spanish language support
- **Intelligent Q&A**: Powered by Amazon Bedrock and Claude 3 Haiku
- **Dual Data Sources**: 
  - PDF documents with Bedrock Data Automation parser
  - Live website content via Web Crawler
- **Real-time Information**: Daily sync of blood supply status and news
- **Blood Center Locator**: Automatic detection and linking to donation centers
- **Admin Dashboard**: Data sync management and monitoring
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Backend (Amazon Bedrock)
- **Knowledge Base**: OpenSearch Serverless vector database
- **Data Sources**: 
  - S3 for PDFs (Bedrock Data Automation parser)
  - Web Crawler for websites (automatic HTML processing)
- **Models**: Claude 3 Haiku for chat, Titan Embed for embeddings
- **API**: AWS Lambda + API Gateway
- **Deployment**: AWS CDK + automated buildspec

### Frontend (React + AWS Amplify)
- **Framework**: React 18 with modern hooks
- **Styling**: Custom CSS with responsive design
- **Deployment**: AWS Amplify with CI/CD
- **Features**: Real-time chat, language switching, admin controls

## 🚀 Quick Start

### Prerequisites
- AWS Account with Bedrock access
- Node.js 18+
- AWS CLI configured
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-org/Americas-Blood-Centers-chatbot-Public.git
cd Americas-Blood-Centers-chatbot-Public
```

### 2. Deploy Backend
```bash
cd Backend
npm install
cdk bootstrap
cdk deploy AmericasBloodCentersBedrockStack
```

### 3. Deploy Frontend
```bash
cd ../Frontend
npm install
# Update .env with your API Gateway URL
npm run build
# Deploy to Amplify (see DEPLOYMENT.md for details)
```

## 📊 Data Sources

### PDF Documents (S3 Data Source)
- Blood donation statistics and reports
- Eligibility guidelines and criteria  
- Safety protocols and procedures
- Advocacy documents and policy papers
- Educational materials and FAQs

**Processing**: Bedrock Data Automation parser extracts text while preserving document structure.

### Website Content (Web Crawler Data Source)
- Live blood supply status updates
- Current news and announcements
- Donation center information
- Frequently asked questions
- Educational resources

**Processing**: Automatic web crawling with smart content filtering.

## 🔧 Configuration

### Environment Variables
```bash
# Backend
PROJECT_NAME=americas-blood-centers-bedrock
MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
EMBEDDING_MODEL_ID=amazon.titan-embed-text-v1

# Frontend
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/prod
REACT_APP_APP_NAME=America's Blood Centers AI Assistant
```

### Data Source URLs
The system automatically processes content from:
- `https://americasblood.org/for-donors/americas-blood-supply/`
- `https://americasblood.org/for-donors/find-a-blood-center/`
- `https://americasblood.org/news/`
- `https://americasblood.org/newsroom/`
- `https://americasblood.org/one-pagers-faqs/`

## 💰 Cost Optimization

### Bedrock vs Q Business
- **Bedrock**: $8-20/month (usage-based)
- **Q Business**: $20+/month per user (fixed)
- **Savings**: 60-75% cost reduction

### Cost Breakdown
- **Knowledge Base**: ~$2-5/month
- **Claude 3 Haiku**: ~$3-8/month  
- **OpenSearch Serverless**: ~$2-5/month
- **Lambda + API Gateway**: ~$1-2/month

## 🌐 Multilingual Support

### English
- Native Claude 3 support
- Comprehensive blood donation terminology
- Medical and eligibility information

### Spanish  
- AI-powered translation
- Culturally appropriate responses
- Blood center information in Spanish

## 🔒 Security & Compliance

- **Data Privacy**: No personal information stored
- **HIPAA Considerations**: Medical information for reference only
- **Access Control**: IAM-based permissions
- **Encryption**: Data encrypted in transit and at rest

## 📱 Usage Examples

### Basic Questions
```
User: "Who can donate blood?"
Bot: "Most healthy adults aged 16-17 (with parental consent) or 18+ can donate blood. You must weigh at least 110 pounds and be in good health..."

User: "¿Quién puede donar sangre?"
Bot: "La mayoría de los adultos sanos de 16-17 años (con consentimiento parental) o 18+ pueden donar sangre..."
```

### Blood Center Locator
```
User: "Where can I donate blood near me?"
Bot: "You can find donation centers near you at: https://americasblood.org/for-donors/find-a-blood-center/"
```

### Current Information
```
User: "What's the current blood supply status?"
Bot: "Based on the latest information from America's Blood Centers, the national blood supply is currently..."
```

## 🛠️ Development

### Local Development
```bash
# Backend
cd Backend
npm run watch

# Frontend  
cd Frontend
npm start
```

### Testing
```bash
# Test API endpoint
curl -X POST https://your-api-url/prod \
  -H "Content-Type: application/json" \
  -d '{"message":"How often can I donate blood?","language":"en"}'
```

### Admin Functions
- **Data Sync**: Trigger manual data ingestion
- **Status Check**: Monitor Knowledge Base health
- **Analytics**: View usage statistics (if enabled)

## 📚 Documentation

- [Architecture Guide](ARCHITECTURE.md)
- [Deployment Instructions](DEPLOYMENT.md)
- [Data Sources Configuration](DATA_SOURCES.md)
- [API Documentation](API.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in this repository
- Contact the development team
- Check the troubleshooting guide

## 🙏 Acknowledgments

- America's Blood Centers for domain expertise
- AWS Bedrock team for AI capabilities
- Open source community for tools and libraries

---

**Powered by Amazon Bedrock** | **Built for America's Blood Centers** | **Saving Lives Through Technology** 🩸❤️