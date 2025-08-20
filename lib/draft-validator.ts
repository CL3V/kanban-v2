import { convertFromRaw, ContentState } from 'draft-js';

/**
 * Validates Draft.js content to prevent XSS attacks
 */
export function validateDraftContent(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  try {
    // Parse the content
    const parsed = JSON.parse(content);
    
    // Check if it has the expected structure
    if (!parsed.blocks || !Array.isArray(parsed.blocks) || !parsed.entityMap) {
      return false;
    }

    // Validate blocks
    for (const block of parsed.blocks) {
      // Check block has required fields
      if (!block.key || !block.text || !block.type) {
        return false;
      }

      // Validate block type
      const allowedBlockTypes = [
        'unstyled', 'header-one', 'header-two', 'header-three', 
        'header-four', 'header-five', 'header-six', 'blockquote',
        'code-block', 'atomic', 'unordered-list-item', 'ordered-list-item'
      ];
      
      if (!allowedBlockTypes.includes(block.type)) {
        return false;
      }

      // Check for suspicious patterns in text
      if (containsSuspiciousPatterns(block.text)) {
        return false;
      }

      // Validate inline styles
      if (block.inlineStyleRanges) {
        for (const style of block.inlineStyleRanges) {
          const allowedStyles = ['BOLD', 'ITALIC', 'UNDERLINE', 'STRIKETHROUGH', 'CODE'];
          if (!allowedStyles.includes(style.style)) {
            return false;
          }
        }
      }
    }

    // Validate entities
    for (const entityKey in parsed.entityMap) {
      const entity = parsed.entityMap[entityKey];
      
      // Only allow LINK entities
      if (entity.type !== 'LINK') {
        return false;
      }

      // Validate link URL
      if (entity.data && entity.data.url) {
        if (!isValidUrl(entity.data.url)) {
          return false;
        }
      }
    }

    // Try to actually convert it to ensure it's valid
    convertFromRaw(parsed);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitizes Draft.js content by removing potentially dangerous elements
 */
export function sanitizeDraftContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  try {
    const parsed = JSON.parse(content);
    
    // Remove any non-LINK entities
    const sanitizedEntityMap: any = {};
    for (const entityKey in parsed.entityMap) {
      const entity = parsed.entityMap[entityKey];
      if (entity.type === 'LINK' && entity.data && entity.data.url && isValidUrl(entity.data.url)) {
        sanitizedEntityMap[entityKey] = entity;
      }
    }
    parsed.entityMap = sanitizedEntityMap;

    // Sanitize blocks
    if (parsed.blocks) {
      parsed.blocks = parsed.blocks.map((block: any) => ({
        ...block,
        text: sanitizeText(block.text),
        // Keep only allowed inline styles
        inlineStyleRanges: block.inlineStyleRanges?.filter((style: any) => 
          ['BOLD', 'ITALIC', 'UNDERLINE', 'STRIKETHROUGH', 'CODE'].includes(style.style)
        ) || []
      }));
    }

    return JSON.stringify(parsed);
  } catch (error) {
    return '';
  }
}

/**
 * Checks for suspicious patterns that might indicate XSS attempts
 */
function containsSuspiciousPatterns(text: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /<\/script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<applet/i,
    /vbscript:/i,
    /data:text\/html/i,
    /<img.*?src.*?=/i,
    /<link.*?href.*?=/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(text));
}

/**
 * Validates URLs to prevent javascript: and data: URLs
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    // If it's not a valid URL, check if it's a relative path
    return /^\/[^\/]/.test(url) || /^[^:\/]+$/.test(url);
  }
}

/**
 * Sanitizes text content
 */
function sanitizeText(text: string): string {
  // Remove any HTML tags
  return text.replace(/<[^>]*>/g, '');
}
