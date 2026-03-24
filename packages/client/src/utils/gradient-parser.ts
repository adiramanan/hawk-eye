/**
 * Gradient parser and composer for CSS gradients
 * Handles: linear-gradient, radial-gradient, conic-gradient
 * Plus repeating variants
 */

export type GradientType = 'linear' | 'radial' | 'conic' | 'repeating-linear' | 'repeating-radial' | 'repeating-conic';

export interface ColorStop {
  color: string;
  position?: number; // percentage 0-100, or undefined for auto-positioning
}

export type LinearGradientConfig = {
  type: 'linear' | 'repeating-linear';
  angle?: number; // 0-360 degrees
  stops: ColorStop[];
};

export type RadialGradientConfig = {
  type: 'radial' | 'repeating-radial';
  shape?: 'circle' | 'ellipse';
  positionX?: number; // percentage, defaults to 50
  positionY?: number; // percentage, defaults to 50
  stops: ColorStop[];
};

export type ConicGradientConfig = {
  type: 'conic' | 'repeating-conic';
  rotation?: number; // 0-360 degrees
  positionX?: number; // percentage, defaults to 50
  positionY?: number; // percentage, defaults to 50
  stops: ColorStop[];
};

export type GradientConfig = LinearGradientConfig | RadialGradientConfig | ConicGradientConfig;

const GRADIENT_REGEX = /^(repeating-)?(linear|radial|conic)-gradient\s*\((.*)\)$/i;
const COLOR_STOP_REGEX = /^([^%\s][\w\s,().-]*?)(?:\s+(\d+(?:\.\d+)?%))?$/;

/**
 * Extract color stops from a gradient function's content
 * Handles: "red 0%, blue 100%", "rgba(255,0,0,0.5) 50%", etc.
 */
function parseColorStops(content: string): ColorStop[] {
  const stops: ColorStop[] = [];
  let current = '';
  let parenCount = 0;

  // Split by comma, but respect parentheses (for rgba, etc.)
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(') parenCount++;
    else if (char === ')') parenCount--;
    else if (char === ',' && parenCount === 0) {
      const trimmed = current.trim();
      if (trimmed) {
        const stop = parseColorStop(trimmed);
        if (stop) stops.push(stop);
      }
      current = '';
      continue;
    }
    current += char;
  }

  // Don't forget the last one
  const trimmed = current.trim();
  if (trimmed) {
    const stop = parseColorStop(trimmed);
    if (stop) stops.push(stop);
  }

  return stops;
}

function parseColorStop(stopStr: string): ColorStop | null {
  const match = stopStr.match(COLOR_STOP_REGEX);
  if (!match) return null;

  const color = match[1].trim();
  const positionStr = match[2];
  const position = positionStr ? parseFloat(positionStr) : undefined;

  return { color, position };
}

/**
 * Parse linear-gradient or repeating-linear-gradient
 * linear-gradient(45deg, red 0%, blue 100%)
 * linear-gradient(to right, red, blue)
 */
function parseLinearGradient(content: string): LinearGradientConfig | null {
  const parts = content.split(',').map(p => p.trim());
  if (parts.length < 2) return null;

  let angle: number | undefined = undefined;
  let stopStartIdx = 0;

  // Check first part for angle or direction
  const firstPart = parts[0];
  const angleMatch = firstPart.match(/^(-?\d+(?:\.\d+)?)(deg|rad|turn|grad)?$/);
  const directionMatch = firstPart.match(/^to\s+(left|right|top|bottom|top\s+(left|right)|bottom\s+(left|right))$/i);

  if (angleMatch) {
    const value = parseFloat(angleMatch[1]);
    const unit = angleMatch[2] || 'deg';
    angle = unit === 'deg' ? value : unit === 'rad' ? (value * 180) / Math.PI : unit === 'grad' ? (value * 0.9) : (value * 360);
    stopStartIdx = 1;
  } else if (directionMatch) {
    // Convert direction keywords to degrees
    const dir = firstPart.toLowerCase();
    if (dir === 'to right') angle = 90;
    else if (dir === 'to left') angle = 270;
    else if (dir === 'to bottom') angle = 180;
    else if (dir === 'to top') angle = 0;
    else if (dir.includes('top') && dir.includes('right')) angle = 45;
    else if (dir.includes('top') && dir.includes('left')) angle = 315;
    else if (dir.includes('bottom') && dir.includes('right')) angle = 135;
    else if (dir.includes('bottom') && dir.includes('left')) angle = 225;
    stopStartIdx = 1;
  }

  const stopParts = parts.slice(stopStartIdx);
  const stops = parseColorStops(stopParts.join(','));

  return stops.length > 0 ? { type: 'linear', angle, stops } : null;
}

/**
 * Parse radial-gradient or repeating-radial-gradient
 * radial-gradient(circle, red 0%, blue 100%)
 * radial-gradient(ellipse at 50% 50%, red, blue)
 */
function parseRadialGradient(content: string): RadialGradientConfig | null {
  const parts = content.split(',').map(p => p.trim());
  if (parts.length < 2) return null;

  let shape: 'circle' | 'ellipse' | undefined = undefined;
  let positionX: number | undefined = undefined;
  let positionY: number | undefined = undefined;
  let stopStartIdx = 0;

  const firstPart = parts[0];
  const shapeMatch = firstPart.match(/^(circle|ellipse)(?:\s+at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%)?$/i);

  if (shapeMatch) {
    shape = shapeMatch[1].toLowerCase() as 'circle' | 'ellipse';
    if (shapeMatch[2] && shapeMatch[3]) {
      positionX = parseFloat(shapeMatch[2]);
      positionY = parseFloat(shapeMatch[3]);
    }
    stopStartIdx = 1;
  } else {
    // Check for just "at X% Y%"
    const atMatch = firstPart.match(/^at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/i);
    if (atMatch) {
      positionX = parseFloat(atMatch[1]);
      positionY = parseFloat(atMatch[2]);
      stopStartIdx = 1;
    }
  }

  const stopParts = parts.slice(stopStartIdx);
  const stops = parseColorStops(stopParts.join(','));

  return stops.length > 0 ? { type: 'radial', shape, positionX, positionY, stops } : null;
}

/**
 * Parse conic-gradient or repeating-conic-gradient
 * conic-gradient(from 45deg at 50% 50%, red 0deg, blue 360deg)
 */
function parseConicGradient(content: string): ConicGradientConfig | null {
  const parts = content.split(',').map(p => p.trim());
  if (parts.length < 2) return null;

  let rotation: number | undefined = undefined;
  let positionX: number | undefined = undefined;
  let positionY: number | undefined = undefined;
  let stopStartIdx = 0;

  const firstPart = parts[0];
  const fromAtMatch = firstPart.match(/^from\s+(-?\d+(?:\.\d+)?)(deg|rad)?\s+at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/i);
  const fromMatch = firstPart.match(/^from\s+(-?\d+(?:\.\d+)?)(deg|rad)?$/i);
  const atMatch = firstPart.match(/^at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/i);

  if (fromAtMatch) {
    rotation = parseFloat(fromAtMatch[1]);
    if (fromAtMatch[2] && fromAtMatch[2].toLowerCase() === 'rad') {
      rotation = (rotation * 180) / Math.PI;
    }
    positionX = parseFloat(fromAtMatch[3]);
    positionY = parseFloat(fromAtMatch[4]);
    stopStartIdx = 1;
  } else if (fromMatch) {
    rotation = parseFloat(fromMatch[1]);
    if (fromMatch[2] && fromMatch[2].toLowerCase() === 'rad') {
      rotation = (rotation * 180) / Math.PI;
    }
    stopStartIdx = 1;
  } else if (atMatch) {
    positionX = parseFloat(atMatch[1]);
    positionY = parseFloat(atMatch[2]);
    stopStartIdx = 1;
  }

  const stopParts = parts.slice(stopStartIdx);
  const stops = parseColorStops(stopParts.join(','));

  return stops.length > 0 ? { type: 'conic', rotation, positionX, positionY, stops } : null;
}

/**
 * Parse a CSS gradient string
 * @param cssString e.g. "linear-gradient(45deg, red 0%, blue 100%)"
 * @returns GradientConfig or null if parsing fails
 */
export function parseGradient(cssString: string): GradientConfig | null {
  const trimmed = cssString.trim();
  const match = trimmed.match(GRADIENT_REGEX);

  if (!match) return null;

  const isRepeating = !!match[1];
  const gradType = match[2].toLowerCase();
  const content = match[3];

  if (gradType === 'linear') {
    const parsed = parseLinearGradient(content);
    if (!parsed) return null;
    return { ...parsed, type: isRepeating ? 'repeating-linear' : 'linear' };
  }

  if (gradType === 'radial') {
    const parsed = parseRadialGradient(content);
    if (!parsed) return null;
    return { ...parsed, type: isRepeating ? 'repeating-radial' : 'radial' };
  }

  if (gradType === 'conic') {
    const parsed = parseConicGradient(content);
    if (!parsed) return null;
    return { ...parsed, type: isRepeating ? 'repeating-conic' : 'conic' };
  }

  return null;
}

/**
 * Compose a GradientConfig back into a CSS gradient string
 */
export function composeGradient(config: GradientConfig): string {
  const { type, stops } = config;

  if (type === 'linear' || type === 'repeating-linear') {
    const prefix = type === 'repeating-linear' ? 'repeating-linear-gradient' : 'linear-gradient';
    const angleStr = config.angle !== undefined ? `${config.angle}deg` : '0deg';
    const stopsStr = stops.map(s => (s.position !== undefined ? `${s.color} ${s.position}%` : s.color)).join(', ');
    return `${prefix}(${angleStr}, ${stopsStr})`;
  }

  if (type === 'radial' || type === 'repeating-radial') {
    const prefix = type === 'repeating-radial' ? 'repeating-radial-gradient' : 'radial-gradient';
    let shapeStr = config.shape || 'ellipse';
    const posX = config.positionX ?? 50;
    const posY = config.positionY ?? 50;
    if (posX !== 50 || posY !== 50) {
      shapeStr += ` at ${posX}% ${posY}%`;
    }
    const stopsStr = stops.map(s => (s.position !== undefined ? `${s.color} ${s.position}%` : s.color)).join(', ');
    return `${prefix}(${shapeStr}, ${stopsStr})`;
  }

  if (type === 'conic' || type === 'repeating-conic') {
    const prefix = type === 'repeating-conic' ? 'repeating-conic-gradient' : 'conic-gradient';
    let configStr = '';
    const rotation = config.rotation ?? 0;
    const posX = config.positionX ?? 50;
    const posY = config.positionY ?? 50;

    if (rotation !== 0 || posX !== 50 || posY !== 50) {
      if (rotation !== 0) configStr += `from ${rotation}deg `;
      if (posX !== 50 || posY !== 50) configStr += `at ${posX}% ${posY}%`;
    }

    const stopsStr = stops.map(s => (s.position !== undefined ? `${s.color} ${s.position}%` : s.color)).join(', ');
    return `${prefix}(${configStr}${configStr ? ', ' : ''}${stopsStr})`;
  }

  return '';
}

/**
 * Detect gradient type from a CSS string
 */
export function detectGradientType(cssString: string): GradientType | null {
  const trimmed = cssString.trim().toLowerCase();

  if (trimmed.startsWith('repeating-linear-gradient')) return 'repeating-linear';
  if (trimmed.startsWith('repeating-radial-gradient')) return 'repeating-radial';
  if (trimmed.startsWith('repeating-conic-gradient')) return 'repeating-conic';
  if (trimmed.startsWith('linear-gradient')) return 'linear';
  if (trimmed.startsWith('radial-gradient')) return 'radial';
  if (trimmed.startsWith('conic-gradient')) return 'conic';

  return null;
}
