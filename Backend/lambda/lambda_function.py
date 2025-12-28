"""
America's Blood Centers Chatbot - Bedrock Implementation
Lambda function for handling chat requests using Bedrock Knowledge Base and Foundation Models
"""

import json
import logging
import os
from typing import Dict, Any, List
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime')
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
s3_client = boto3.client('s3')

# Environment variables
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID')
MODEL_ID = os.environ.get('MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '1000'))
TEMPERATURE = float(os.environ.get('TEMPERATURE', '0.0'))  # Minimum temperature for maximum consistency

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for Bedrock-based chat
    """
    
    # Set response headers for CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
    }
    
    try:
        # Get HTTP method
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
        
        # Handle preflight OPTIONS request
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'CORS preflight successful'})
            }
        
        # Handle health check (GET requests)
        if http_method == 'GET':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'status': 'healthy',
                    'service': 'America\'s Blood Centers Bedrock Chatbot',
                    'timestamp': datetime.utcnow().isoformat(),
                    'model': MODEL_ID,
                    'knowledge_base': KNOWLEDGE_BASE_ID
                })
            }
        
        # Handle chat requests (POST)
        if http_method != 'POST':
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Method not allowed. Use POST for chat requests or GET for health checks.',
                    'success': False
                })
            }
        
        # Parse request body
        if 'body' in event:
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            raise ValueError("Request body is missing")
        
        # Extract parameters
        user_message = body.get('message', '').strip()
        language = body.get('language', 'en')
        
        if not user_message:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Message is required',
                    'success': False
                })
            }
        
        logger.info(f"Processing chat request: {user_message[:100]}... (language: {language})")
        
        # Step 1: Retrieve relevant context from Knowledge Base
        logger.info(f"Retrieving context for query: {user_message}...")
        
        retrieve_response = bedrock_agent_runtime.retrieve(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            retrievalQuery={'text': user_message},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': 50,  # Increased to 50 for more comprehensive results
                    'overrideSearchType': 'SEMANTIC'  # Use semantic search only
                }
            }
        )
        
        context_results = retrieve_response.get('retrievalResults', [])
        logger.info(f"Retrieved {len(context_results)} context results (max 50)")
        
        # Debug: Log the structure of context results
        if context_results:
            logger.info(f"Sample context result structure: {json.dumps(context_results[0], indent=2, default=str)}")
        
        # Extract sources from context results
        sources = extract_sources(context_results)
        logger.info(f"Extracted {len(sources)} sources from context results")
        
        # Debug: Log each context result structure
        for i, result in enumerate(context_results[:5]):  # Log first 5 results
            logger.info(f"Context result {i+1}: location={result.get('location', {})}")
            logger.info(f"Context result {i+1}: metadata keys={list(result.get('metadata', {}).keys())}")
            if result.get('metadata', {}).get('x-amz-bedrock-kb-source-uri'):
                logger.info(f"Context result {i+1}: source-uri={result['metadata']['x-amz-bedrock-kb-source-uri']}")
        
        if len(sources) == 0 and len(context_results) > 0:
            logger.warning(f"No sources extracted despite having {len(context_results)} context results!")
            logger.warning(f"Sample result structure: {json.dumps(context_results[0], indent=2, default=str)}")
        
        # Step 2: Generate response using Bedrock LLM
        response_data = generate_response(user_message, context_results, language)
        
        # Step 3: Add blood center link if asking about donation locations
        sources = add_blood_center_link_if_needed(user_message, sources)
        
        # Prepare final response
        chat_response = {
            "success": True,
            "message": response_data['response'],
            "sources": sources,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": {
                "sourceCount": len(sources),
                "responseLength": len(response_data['response']),
                "model": MODEL_ID,
                "language": language,
                "retrievalResults": len(context_results)
            }
        }
        
        logger.info(f"Response generated successfully with {len(sources)} sources")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(chat_response)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'success': False,
                'details': str(e) if os.environ.get('DEBUG') == 'true' else None
            })
        }

def generate_presigned_url(s3_uri: str) -> str:
    """
    Generate a presigned URL for S3 objects to make them accessible to users
    """
    try:
        # Parse S3 URI (s3://bucket-name/key)
        if not s3_uri.startswith('s3://'):
            return s3_uri  # Return as-is if not an S3 URI
        
        # Remove s3:// prefix and split bucket and key
        s3_path = s3_uri[5:]  # Remove 's3://'
        bucket_name = s3_path.split('/')[0]
        object_key = '/'.join(s3_path.split('/')[1:])
        
        # Generate presigned URL (valid for 1 hour)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': object_key},
            ExpiresIn=3600  # 1 hour
        )
        
        logger.info(f"Generated presigned URL for {object_key}")
        return presigned_url
        
    except Exception as e:
        logger.error(f"Error generating presigned URL for {s3_uri}: {str(e)}")
        return s3_uri  # Return original URI if generation fails


def generate_response(user_message: str, context_results: List[Dict[str, Any]], language: str) -> Dict[str, Any]:
    """
    Generate response using Bedrock Foundation Model with retrieved context
    """
    try:
        # Build context from retrieval results
        context_text = build_context_text(context_results)
        
        # Create prompt based on language
        prompt = create_prompt(user_message, context_text, language)
        
        logger.info(f"Generating response using model: {MODEL_ID}")
        
        # Prepare request body based on model type
        if 'claude' in MODEL_ID.lower():
            request_body = {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "anthropic_version": "bedrock-2023-05-31"
            }
        else:
            # For other models (Llama, etc.)
            request_body = {
                "prompt": prompt,
                "max_gen_len": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "top_p": 0.9
            }
        
        # Invoke the model
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=json.dumps(request_body),
            contentType='application/json',
            accept='application/json'
        )
        
        # Parse response based on model type
        response_body = json.loads(response['body'].read())
        
        if 'claude' in MODEL_ID.lower():
            generated_text = response_body['content'][0]['text']
        else:
            generated_text = response_body.get('generation', response_body.get('outputs', [{}])[0].get('text', ''))
        
        logger.info(f"Response generated successfully: {len(generated_text)} characters")
        
        return {
            'response': generated_text,
            'model_response': response_body
        }
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return {
            'response': get_fallback_response(language),
            'model_response': None
        }

def build_context_text(context_results: List[Dict[str, Any]]) -> str:
    """
    Build context text from retrieval results
    """
    if not context_results:
        return "No specific context available."
    
    context_parts = []
    for i, result in enumerate(context_results, 1):
        content = result.get('content', {}).get('text', '')
        if content:
            context_parts.append(f"Context {i}: {content}")
    
    return "\n\n".join(context_parts)

def create_prompt(user_message: str, context: str, language: str) -> str:
    """
    Create appropriate prompt based on language and context
    """
    if language == 'es':
        return f"""Eres un asistente experto en donación de sangre para America's Blood Centers. Responde en español basándote en el contexto proporcionado.

Contexto:
{context}

Pregunta del usuario: {user_message}

Instrucciones:
- Responde SOLO en español
- Usa la información del contexto proporcionado
- Si la pregunta es sobre ubicaciones de donación, menciona el localizador de centros de sangre
- Sé preciso y útil
- Si no tienes información suficiente en el contexto, dilo claramente

Respuesta:"""
    else:
        return f"""You are an expert blood donation assistant for America's Blood Centers. Answer based on the provided context.

Context:
{context}

User question: {user_message}

Instructions:
- Answer based on the provided context
- If asked about donation locations, mention the blood center locator
- Be accurate and helpful
- If you don't have sufficient information in the context, say so clearly
- Focus on blood donation, eligibility, and America's Blood Centers information

Answer:"""

def extract_sources(context_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract source information from context results with enhanced URL handling
    """
    sources = []
    
    for result in context_results:
        location = result.get('location', {})
        metadata = result.get('metadata', {})
        
        # Extract source information from different possible locations
        source_url = None
        source_title = None
        
        # Try different ways to get the source URL
        if 's3Location' in location:
            # S3 document source
            s3_uri = location['s3Location'].get('uri', '')
            if s3_uri:
                source_url = s3_uri
                # Extract filename for title
                if 'pdfs/' in s3_uri:
                    filename = s3_uri.split('/')[-1]
                    # Keep original filename (don't convert to title case)
                    source_title = filename.replace('.pdf', '')
                else:
                    filename = s3_uri.split('/')[-1] if '/' in s3_uri else s3_uri
                    source_title = filename.replace('.pdf', '')
        
        elif 'webLocation' in location:
            # Web crawler source
            source_url = location['webLocation'].get('url', '')
            source_title = metadata.get('title', metadata.get('source', 'Web Page'))
        
        # Fallback: check metadata for source information
        if not source_url:
            # Try various metadata fields
            source_url = (metadata.get('x-amz-bedrock-kb-source-uri') or 
                         metadata.get('source') or 
                         metadata.get('uri') or 
                         metadata.get('url', ''))
            
            if source_url and 's3://' in source_url:
                filename = source_url.split('/')[-1] if '/' in source_url else source_url
                # Keep original filename for PDFs (don't convert to title case)
                source_title = filename.replace('.pdf', '')
            else:
                source_title = metadata.get('title', metadata.get('source', 'Document'))
        
        # Add source if we found a URL
        if source_url:
            # Determine source type
            is_document = any(ext in source_url.lower() for ext in ['.pdf', '.docx', '.txt']) or 's3://' in source_url
            
            # Generate presigned URL for S3 documents
            accessible_url = source_url
            if source_url.startswith('s3://'):
                accessible_url = generate_presigned_url(source_url)
                logger.info(f"Converted S3 URI to presigned URL: {source_url} -> {accessible_url[:100]}...")
            
            sources.append({
                "title": source_title or f"Source {len(sources) + 1}",
                "url": accessible_url,  # Use presigned URL for accessibility
                "uri": source_url,  # Keep original URI for reference
                "type": "DOCUMENT" if is_document else "WEB",
                "score": result.get('score', 0)
            })
            
            logger.info(f"Extracted source: {source_title} - {accessible_url[:100]}...")
    
    # Remove duplicates and sort by score
    unique_sources = []
    seen_urls = set()
    
    for source in sorted(sources, key=lambda x: x.get('score', 0), reverse=True):
        if source['uri'] not in seen_urls:  # Use original URI for deduplication
            unique_sources.append(source)
            seen_urls.add(source['uri'])
    
    logger.info(f"Final sources count: {len(unique_sources)}")
    return unique_sources

def add_blood_center_link_if_needed(user_message: str, sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Add blood center locator link if user is asking about donation locations
    """
    blood_center_keywords = [
        'where can i donate', 'where to donate', 'find blood center',
        'blood center near', 'donation location', 'donate near me',
        'donde puedo donar', 'dónde puedo donar', 'centro de sangre',
        'find a center', 'locate blood center', 'donation site'
    ]
    
    is_location_question = any(keyword in user_message.lower() for keyword in blood_center_keywords)
    blood_center_url = "https://americasblood.org/for-donors/find-a-blood-center/"
    
    # Check if blood center link already exists
    has_blood_center_link = any(source.get('url') == blood_center_url for source in sources)
    
    if is_location_question and not has_blood_center_link:
        sources.insert(0, {
            "title": "Blood Center Locator - Find a Donation Location Near You",
            "url": blood_center_url,
            "type": "WEB",
            "score": 1.0
        })
        logger.info("Added blood center locator link for location question")
    
    return sources

def get_fallback_response(language: str) -> str:
    """
    Get fallback response when model fails
    """
    if language == 'es':
        return "Lo siento, tengo problemas para responder en este momento. Por favor, inténtalo de nuevo más tarde o contacta directamente a America's Blood Centers."
    else:
        return "I'm sorry, I'm having trouble responding right now. Please try again later or contact America's Blood Centers directly."