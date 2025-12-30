import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Typography, Link } from '@mui/material';
import { PRIMARY_MAIN } from '../utilities/constants';

function MarkdownContent({ content, className = '' }) {
  if (!content) return null;
  
  return (
    <Box className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          // Style links
          a: ({ children, href, ...props }) => (
            <Link 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{
                color: PRIMARY_MAIN,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
              {...props}
            >
              {children}
            </Link>
          ),
          
          // Style code blocks
          code: ({ children, ...props }) => (
            <Box
              component="code"
              sx={{
                backgroundColor: '#f5f5f5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                border: '1px solid #e0e0e0',
              }}
              {...props}
            >
              {children}
            </Box>
          ),
          
          // Style unordered lists
          ul: ({ children, ...props }) => (
            <Box
              component="ul"
              sx={{
                paddingLeft: '1.5rem',
                margin: '0.5rem 0',
                '& li': {
                  marginBottom: '0.25rem',
                  lineHeight: 1.6,
                },
              }}
              {...props}
            >
              {children}
            </Box>
          ),
          
          // Style ordered lists
          ol: ({ children, ...props }) => (
            <Box
              component="ol"
              sx={{
                paddingLeft: '1.5rem',
                margin: '0.5rem 0',
                '& li': {
                  marginBottom: '0.25rem',
                  lineHeight: 1.6,
                },
              }}
              {...props}
            >
              {children}
            </Box>
          ),
          
          // Style list items
          li: ({ children, ...props }) => (
            <Typography
              component="li"
              variant="body1"
              sx={{
                lineHeight: 1.6,
                marginBottom: '0.25rem',
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          // Style paragraphs
          p: ({ children, ...props }) => (
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.6,
                marginBottom: '0.75rem',
                '&:last-child': {
                  marginBottom: 0,
                },
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          // Style headings
          h1: ({ children, ...props }) => (
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                marginBottom: '0.75rem',
                marginTop: '1rem',
                color: '#333',
                '&:first-of-type': {
                  marginTop: 0,
                },
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          h2: ({ children, ...props }) => (
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                marginTop: '1rem',
                color: '#333',
                '&:first-of-type': {
                  marginTop: 0,
                },
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          h3: ({ children, ...props }) => (
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                marginTop: '0.75rem',
                color: '#333',
                '&:first-of-type': {
                  marginTop: 0,
                },
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          h4: ({ children, ...props }) => (
            <Typography
              variant="subtitle1"
              component="h4"
              sx={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                marginTop: '0.75rem',
                color: '#333',
                '&:first-of-type': {
                  marginTop: 0,
                },
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          h5: ({ children, ...props }) => (
            <Typography
              variant="subtitle2"
              component="h5"
              sx={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                marginTop: '0.75rem',
                color: '#333',
                '&:first-of-type': {
                  marginTop: 0,
                },
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          h6: ({ children, ...props }) => (
            <Typography
              variant="body1"
              component="h6"
              sx={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                marginTop: '0.75rem',
                color: '#333',
                '&:first-of-type': {
                  marginTop: 0,
                },
              }}
              {...props}
            >
              {children}
            </Typography>
          ),
          
          // Style strong/bold
          strong: ({ children, ...props }) => (
            <Box
              component="strong"
              sx={{
                fontWeight: 'bold',
              }}
              {...props}
            >
              {children}
            </Box>
          ),
          
          // Style emphasis/italic
          em: ({ children, ...props }) => (
            <Box
              component="em"
              sx={{
                fontStyle: 'italic',
              }}
              {...props}
            >
              {children}
            </Box>
          ),
          
          // Style blockquotes
          blockquote: ({ children, ...props }) => (
            <Box
              component="blockquote"
              sx={{
                borderLeft: `4px solid ${PRIMARY_MAIN}`,
                paddingLeft: '1rem',
                margin: '1rem 0',
                backgroundColor: '#f9f9f9',
                padding: '0.75rem 1rem',
                borderRadius: '0 4px 4px 0',
                fontStyle: 'italic',
              }}
              {...props}
            >
              {children}
            </Box>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}

export default MarkdownContent;