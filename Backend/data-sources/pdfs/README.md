# PDF Documents

This folder contains PDF documents that will be processed by Bedrock's Data Automation parser.

## Structure
- Place all PDF files directly in this folder
- The S3 data source will automatically detect and process them
- Bedrock Data Automation will extract text, preserving structure and formatting

## Supported Files
- PDF documents (.pdf)
- Blood donation statistics
- Eligibility guidelines
- Safety protocols
- Educational materials

## Processing
- Files are uploaded to S3 bucket under `pdfs/` prefix
- Bedrock Data Automation parser extracts text content
- Content is chunked into 300-token segments with 20% overlap
- Embedded using Amazon Titan Embed Text model
- Stored in OpenSearch Serverless vector database

## Adding New PDFs
1. Place PDF files in this folder
2. Deploy or trigger ingestion job
3. Files will be automatically processed and made searchable