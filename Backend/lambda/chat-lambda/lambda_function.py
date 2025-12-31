"""
America's Blood Centers Chatbot - Bedrock Implementation
Lambda function for handling chat requests using Bedrock Knowledge Base and Foundation Models
"""

import json
import logging
import os
import re
from typing import Dict, Any, List
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
bedrock_runtime = boto3.client('bedrock-runtime')
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
KNOWLEDGE_BASE_ID = os.environ.get('KNOWLEDGE_BASE_ID')
MODEL_ID = os.environ.get('MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '1000'))
TEMPERATURE = float(os.environ.get('TEMPERATURE', '0.0'))  # Minimum temperature for maximum consistency
CHAT_HISTORY_TABLE = os.environ.get('CHAT_HISTORY_TABLE', 'BloodCentersChatHistory')

# Initialize DynamoDB table
try:
    chat_table = dynamodb.Table(CHAT_HISTORY_TABLE)
except Exception as e:
    logger.warning(f"Could not initialize DynamoDB table {CHAT_HISTORY_TABLE}: {e}")
    chat_table = None

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
        # Get HTTP method and path
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
        path = event.get('path', '') or event.get('requestContext', {}).get('http', {}).get('path', '')

        # Handle preflight OPTIONS request
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'CORS preflight successful'})
            }

        # Handle admin endpoints
        if '/admin/' in path:
            return handle_admin_request(event, headers)
        
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
        session_id = body.get('sessionId', str(uuid.uuid4()))

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
        logger.info(f"FULL USER QUERY: {user_message}")  # Log complete user query

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

        # Log Claude's complete response for debugging
        logger.info(f"CLAUDE RESPONSE LENGTH: {len(response_data['response'])} characters")
        logger.info(f"CLAUDE FULL RESPONSE: {response_data['response']}")

        # Log model response metadata if available
        if response_data.get('model_response'):
            logger.info(f"MODEL METADATA: {json.dumps(response_data['model_response'], indent=2, default=str)}")

        # Step 3: Process response for markdown formatting
        processed_response = process_markdown_response(response_data['response'])

        # Step 4: Add blood center link if asking about donation locations
        sources = add_blood_center_link_if_needed(user_message, sources)

        # Step 5: Save conversation to DynamoDB
        conversation_id = save_conversation(session_id, user_message, processed_response, language, sources)
        
        # Prepare final response
        chat_response = {
            "success": True,
            "message": processed_response,
            "sources": sources,
            "timestamp": datetime.utcnow().isoformat(),
            "conversationId": conversation_id,
            "sessionId": session_id,
            "metadata": {
                "sourceCount": len(sources),
                "responseLength": len(processed_response),
                "model": MODEL_ID,
                "language": language,
                "retrievalResults": len(context_results),
                "hasMarkdown": has_markdown_formatting(processed_response)
            }
        }

        # Log what's actually being sent to frontend
        logger.info(f"FINAL RESPONSE TO FRONTEND: {processed_response}")

        logger.info(f"Response generated successfully with {len(sources)} sources")

        # Final summary log for easy tracking
        logger.info(f"=== CHAT SUMMARY ===")
        logger.info(f"USER: {user_message}")
        logger.info(f"LANGUAGE: {language}")
        logger.info(f"SOURCES COUNT: {len(sources)}")
        logger.info(f"RESPONSE LENGTH: {len(processed_response)} chars")
        logger.info(f"MODEL: {MODEL_ID}")
        logger.info(f"=== END SUMMARY ===")

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

def handle_admin_request(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle admin-specific requests
    """
    try:
        path = event.get('path', '') or event.get('requestContext', {}).get('http', {}).get('path', '')
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
        
        # Parse query parameters
        query_params = event.get('queryStringParameters') or {}
        
        if '/admin/conversations' in path and http_method == 'GET':
            return get_conversations(query_params, headers)
        elif '/admin/sync' in path and http_method == 'POST':
            return handle_sync_request(event, headers)
        elif '/admin/status' in path and http_method == 'GET':
            return get_system_status(headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Admin endpoint not found',
                    'success': False
                })
            }
    except Exception as e:
        logger.error(f"Error handling admin request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'success': False,
                'details': str(e) if os.environ.get('DEBUG') == 'true' else None
            })
        }

def get_conversations(query_params: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """
    Get chat conversations with pagination and filtering
    """
    try:
        if not chat_table:
            return {
                'statusCode': 503,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Chat history not available',
                    'success': False
                })
            }
        
        # Parse query parameters
        page = int(query_params.get('page', 1))
        limit = int(query_params.get('limit', 10))
        date_filter = query_params.get('date')
        language_filter = query_params.get('language')
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build scan parameters
        scan_params = {
            'Limit': limit + offset,  # We'll slice later for proper pagination
            'Select': 'ALL_ATTRIBUTES'
        }
        
        # Add filters
        filter_expressions = []
        expression_values = {}
        
        if date_filter:
            filter_expressions.append('begins_with(#date, :date)')
            expression_values[':date'] = date_filter
            scan_params['ExpressionAttributeNames'] = {'#date': 'date'}
        
        if language_filter:
            filter_expressions.append('#lang = :lang')
            expression_values[':lang'] = language_filter
            if 'ExpressionAttributeNames' not in scan_params:
                scan_params['ExpressionAttributeNames'] = {}
            scan_params['ExpressionAttributeNames']['#lang'] = 'language'
        
        if filter_expressions:
            scan_params['FilterExpression'] = ' AND '.join(filter_expressions)
            scan_params['ExpressionAttributeValues'] = expression_values
        
        # Scan the table
        response = chat_table.scan(**scan_params)
        items = response.get('Items', [])
        
        # Sort by timestamp (newest first)
        items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Apply pagination
        paginated_items = items[offset:offset + limit]
        
        # Format conversations for frontend
        conversations = []
        for item in paginated_items:
            conversations.append({
                'id': item.get('conversation_id'),
                'sessionId': item.get('session_id'),
                'message': item.get('question', ''),
                'question': item.get('question', ''),
                'response': item.get('answer', ''),
                'answer': item.get('answer', ''),
                'timestamp': item.get('timestamp'),
                'created_at': item.get('timestamp'),
                'date': item.get('date'),
                'language': item.get('language', 'en'),
                'sources': item.get('sources', [])
            })
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'conversations': conversations,
                'total': len(items),
                'page': page,
                'limit': limit,
                'hasMore': len(items) > offset + limit
            })
        }
        
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Failed to retrieve conversations',
                'success': False,
                'details': str(e) if os.environ.get('DEBUG') == 'true' else None
            })
        }

def handle_sync_request(event: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle data sync requests (existing functionality)
    """
    # This is your existing sync functionality
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': 'Sync request received'
        })
    }

def get_system_status(headers: Dict[str, str]) -> Dict[str, Any]:
    """
    Get system status (existing functionality)
    """
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'model': MODEL_ID,
            'knowledge_base': KNOWLEDGE_BASE_ID
        })
    }

def save_conversation(session_id: str, question: str, answer: str, language: str, sources: List[Dict[str, Any]]) -> str:
    """
    Save conversation to DynamoDB
    """
    try:
        if not chat_table:
            logger.warning("Chat table not available, skipping conversation save")
            return str(uuid.uuid4())
        
        conversation_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        date = datetime.utcnow().strftime('%Y-%m-%d')
        
        # Clean sources for DynamoDB storage (remove uri, score fields that cause JSON errors)
        cleaned_sources = []
        for source in sources:
            cleaned_source = {
                "title": source.get("title", ""),
                "url": source.get("url", ""),
                "type": source.get("type", "WEB")
            }
            cleaned_sources.append(cleaned_source)
        
        item = {
            'conversation_id': conversation_id,
            'session_id': session_id,
            'timestamp': timestamp,
            'date': date,
            'question': question,
            'answer': answer,
            'language': language,
            'sources': cleaned_sources,  # Use cleaned sources for DynamoDB
            'ttl': int((datetime.utcnow() + timedelta(days=90)).timestamp())  # Auto-delete after 90 days
        }
        
        chat_table.put_item(Item=item)
        logger.info(f"Saved conversation {conversation_id} to DynamoDB")
        return conversation_id
        
    except Exception as e:
        logger.error(f"Error saving conversation: {str(e)}")
        return str(uuid.uuid4())  # Return a UUID even if save fails

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

        # Log the context being used
        logger.info(f"CONTEXT LENGTH: {len(context_text)} characters")
        logger.info(f"CONTEXT TEXT: {context_text[:1000]}...")  # First 1000 chars of context

        # Create prompt based on language
        prompt = create_prompt(user_message, context_text, language)

        # Log the complete prompt sent to Claude
        logger.info(f"PROMPT SENT TO CLAUDE: {prompt}")

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
- Usa formato markdown cuando sea apropiado (listas, texto en negrita, etc.)
- Organiza la información de manera clara y fácil de leer

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
- Use markdown formatting when appropriate (lists, bold text, etc.)
- Organize information clearly and make it easy to read

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

    # Enhanced deduplication logic - prefer public URLs over S3 presigned URLs
    unique_sources = []
    seen_documents = {}

    for source in sorted(sources, key=lambda x: x.get('score', 0), reverse=True):
        # Create a unique key for the document (filename-based)
        doc_key = None

        # Extract filename for deduplication key
        if 's3://' in source['uri'] or 'amazonaws.com' in source['url']:
            # S3 document - extract filename
            if 's3://' in source['uri']:
                doc_key = source['uri'].split('/')[-1].lower()
            else:
                doc_key = source['url'].split('/')[-1].split('?')[0].lower()  # Remove query params
        else:
            # Web URL - extract filename from URL
            try:
                from urllib.parse import urlparse
                parsed = urlparse(source['url'])
                doc_key = parsed.path.split('/')[-1].lower()
                if not doc_key or doc_key == '':
                    # If no filename, use the full path
                    doc_key = f"{parsed.netloc}{parsed.path}".lower()
            except:
                doc_key = source['url'].lower()

        if doc_key and doc_key not in seen_documents:
            unique_sources.append(source)
            seen_documents[doc_key] = source
            logger.info(f"Added unique source: {source['title']} (key: {doc_key})")
        elif doc_key and doc_key in seen_documents:
            existing_source = seen_documents[doc_key]

            # Prefer public web URLs over S3 presigned URLs
            is_current_public = not ('amazonaws.com' in source['url'] or 's3://' in source['uri'])
            is_existing_s3 = 'amazonaws.com' in existing_source['url'] or 's3://' in existing_source['uri']

            if is_current_public and is_existing_s3:
                # Replace S3 URL with public URL
                for i, us in enumerate(unique_sources):
                    if us == existing_source:
                        unique_sources[i] = source
                        seen_documents[doc_key] = source
                        logger.info(f"Replaced S3 URL with public URL: {source['title']} (key: {doc_key})")
                        break
            else:
                logger.info(f"Skipped duplicate source: {source['title']} (key: {doc_key})")
        else:
            logger.info(f"Skipped source with no valid key: {source['title']}")

    logger.info(f"Final sources count: {len(unique_sources)} (reduced from {len(sources)})")
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
            "uri": blood_center_url,  # Keep uri for consistency
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

def process_markdown_response(response: str) -> str:
    """
    Process the response to ensure proper markdown formatting for the frontend
    """
    if not response:
        return response

    # Clean up any existing markdown formatting issues
    processed = response.strip()

    # Ensure proper line breaks for lists
    processed = re.sub(r'\n(\d+\.)', r'\n\n\1', processed)  # Numbered lists
    processed = re.sub(r'\n(\*|\-)', r'\n\n\1', processed)  # Bullet lists

    # Ensure proper spacing around headers
    processed = re.sub(r'\n(#{1,6}\s)', r'\n\n\1', processed)

    # Clean up multiple consecutive newlines (max 2)
    processed = re.sub(r'\n{3,}', '\n\n', processed)

    # Ensure bold text is properly formatted
    processed = re.sub(r'\*\*([^*]+)\*\*', r'**\1**', processed)

    return processed.strip()

def has_markdown_formatting(text: str) -> bool:
    """
    Check if the text contains markdown formatting
    """
    if not text:
        return False

    markdown_patterns = [
        r'\*\*[^*]+\*\*',  # Bold text
        r'\*[^*]+\*',      # Italic text
        r'^#{1,6}\s',      # Headers
        r'^\d+\.\s',       # Numbered lists
        r'^[\*\-]\s',      # Bullet lists
        r'\[([^\]]+)\]\(([^)]+)\)',  # Links
    ]

    for pattern in markdown_patterns:
        if re.search(pattern, text, re.MULTILINE):
            return True