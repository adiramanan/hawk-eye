#!/usr/bin/env node

/**
 * Hawk-Eye Token Audit Script
 *
 * Scans CSS, SCSS, and relevant TypeScript files for hardcoded design values
 * that should be replaced with design system tokens.
 *
 * Usage:
 *   npm run token-audit
 *   npm run token-audit -- --fix (future: auto-fix violations)
 *
 * Exit codes:
 *   0 = No violations found
 *   1 = Violations found (errors)
 *   2 = Script error
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  patterns: {
    css: ['packages/**/*.css', 'demo/**/*.css'],
    scss: ['packages/**/*.scss', 'demo/**/*.scss'],
    ts: ['packages/**/*.tsx', 'packages/**/*.ts', 'demo/**/*.tsx', 'demo/**/*.ts'],
  },
  ignore: [
    'node_modules/**',
    'build/**',
    '.next/**',
    '**/tokens.css', // Ignore the token definition file
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/tailwind-map.ts', // CSS-to-Tailwind mapping utility — hardcoded values are intentional
    '**/editable-properties.ts', // Property metadata with default/constraint values
    'demo/dist/**', // Build artifacts
    'demo/src/DesignLab.tsx', // Demo page with mock data color values
    'demo/src/design-lab-mock.ts', // Mock data helpers
    '**/design-lab-mock.ts', // Demo mock data — values represent inspected CSS, not our styles
  ],
};

// Token definitions for suggestions
const TOKENS = {
  colors: {
    '#0d87f7': '--color-accent',
    '#0f6df1': '--color-accent-hover',
    '#1246ab': '--color-accent-active',
    '#f59e0b': '--color-warning',
    '#ef4444': '--color-error',
    '#22c55e': '--color-success',
    '#fcfcfc': '--color-text-primary',
    '#bcbcbc': '--color-text-secondary',
    '#666': '--color-text-tertiary',
    '#3b3b3b': '--color-input-bg',
    '#484848': '--color-input-hover',
    '#595959': '--color-border',
  },
  spacing: {
    '4px': '--spacing-xs',
    '6px': '--spacing-sm',
    '8px': '--spacing-base',
    '12px': '--spacing-md',
    '16px': '--spacing-lg',
    '24px': '--spacing-xl',
    '32px': '--spacing-2xl',
    '48px': '--spacing-3xl',
  },
  fontSizes: {
    '11px': '--font-size-xs',
    '12px': '--font-size-sm',
    '16px': '--font-size-base',
    '17px': '--font-size-lg',
  },
  fontWeights: {
    '500': '--font-weight-base',
    '600': '--font-weight-strong',
    '700': '--font-weight-bold',
  },
  borderRadius: {
    '3px': '--radius-xs',
    '4px': '--radius-sm',
    '8px': '--radius-md',
    '20px': '--radius-lg',
    '999px': '--radius-full',
  },
  durations: {
    '140ms': '--duration-fast',
    '180ms': '--duration-base',
    '220ms': '--duration-slow',
    '280ms': '--duration-slower',
    '780ms': '--duration-slowest',
  },
};


class TokenAudit {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.filesScanned = 0;
    this.valuesFound = 0;
  }

  /**
   * Find all files matching patterns
   */
  getFilesToScan() {
    const files = new Set();
    const extensions = ['.css', '.scss', '.ts', '.tsx'];

    const walkDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        entries.forEach((entry) => {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(CONFIG.rootDir, fullPath);

          // Skip ignored paths
          if (CONFIG.ignore.some((pattern) => {
            // Handle **/filename patterns (match anywhere in tree)
            if (pattern.startsWith('**/')) {
              const suffix = pattern.slice(3);
              if (suffix.startsWith('*.')) {
                // Wildcard extension match (e.g., **/*.test.ts)
                return entry.name.endsWith(suffix.slice(1));
              }
              // Exact filename match (e.g., **/tokens.css)
              return entry.name === suffix;
            }
            // Handle dir/** patterns (match prefix)
            return relativePath.startsWith(pattern.replace('/**', ''));
          })) {
            return;
          }

          if (entry.isDirectory()) {
            walkDir(fullPath);
          } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
            files.add(fullPath);
          }
        });
      } catch (err) {
        // Skip directories we can't read
      }
    };

    walkDir(CONFIG.rootDir);
    return Array.from(files);
  }

  /**
   * Scan a single file for violations
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      this.filesScanned++;

      lines.forEach((line, lineNum) => {
        this.scanLine(line, lineNum + 1, filePath);
      });
    } catch (err) {
      console.error(`Error scanning ${filePath}: ${err.message}`);
    }
  }

  /**
   * Check whether a match at a given index is inside a var() fallback
   * e.g. var(--color-bg, #1a1a1a) — the #1a1a1a is a fallback and should not be flagged
   */
  isInsideVarFallback(line, matchIndex) {
    // Walk backwards from matchIndex looking for `var(` with a comma before us
    let i = matchIndex - 1;
    let parenDepth = 0;

    while (i >= 0) {
      const ch = line[i];
      if (ch === ')') parenDepth++;
      else if (ch === '(') {
        if (parenDepth > 0) {
          parenDepth--;
        } else {
          // Check if this paren is preceded by "var"
          const before = line.slice(Math.max(0, i - 3), i);
          if (before === 'var') {
            // We're inside a var() — check if there's a comma between ( and matchIndex
            const segment = line.slice(i + 1, matchIndex);
            return segment.includes(',');
          }
          return false;
        }
      }
      i--;
    }
    return false;
  }

  /**
   * Scan a single line for violations
   */
  scanLine(line, lineNum, filePath) {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      return;
    }

    // Skip CSS custom property definitions (any line defining a --custom-property)
    if (/^--[\w-]+\s*:/.test(line.trim())) {
      return;
    }

    // Check for hardcoded colors
    const colorMatches = [...line.matchAll(/#[0-9a-f]{3,6}/gi)];
    colorMatches.forEach((match) => {
      // Skip if inside a var() fallback
      if (this.isInsideVarFallback(line, match.index)) return;

      const color = match[0].toLowerCase();
      const token = this.getTokenSuggestion('colors', color);

      if (token) {
        this.addViolation(filePath, lineNum, color, token, 'color');
      } else if (!line.includes('--ds-') && !line.includes('--color-')) {
        this.addWarning(filePath, lineNum, color, 'Unknown color value');
      }
    });

    // Check for hardcoded spacing — only flag in spacing-related CSS properties
    const spacingPropertyPattern = /(?:padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(?:-(?:top|right|bottom|left|inline|block))?\s*:\s*([^;]+)/gi;
    const spacingPropMatches = [...line.matchAll(spacingPropertyPattern)];
    spacingPropMatches.forEach((propMatch) => {
      const valueStr = propMatch[1];
      const valueOffset = propMatch.index + propMatch[0].indexOf(valueStr);

      const pxMatches = [...valueStr.matchAll(/(\d+)px\b/g)];
      pxMatches.forEach((pxMatch) => {
        const absIndex = valueOffset + pxMatch.index;
        if (this.isInsideVarFallback(line, absIndex)) return;
        if (valueStr.includes('var(--')) return;

        const value = pxMatch[0];
        const token = this.getTokenSuggestion('spacing', value);
        if (token) {
          this.addViolation(filePath, lineNum, value, token, 'spacing');
        }
      });
    });

    // Check for hardcoded font sizes
    const fontSizeMatches = [...line.matchAll(/font-size\s*:\s*(\d+px)/gi)];
    fontSizeMatches.forEach((match) => {
      if (this.isInsideVarFallback(line, match.index)) return;

      const value = match[1];
      const token = this.getTokenSuggestion('fontSizes', value);

      if (token) {
        this.addViolation(filePath, lineNum, `font-size: ${value}`, token, 'typography');
      }
    });

    // Check for hardcoded font weights
    const fontWeightMatches = [...line.matchAll(/font-weight\s*:\s*(500|600|700)\b/gi)];
    fontWeightMatches.forEach((match) => {
      if (this.isInsideVarFallback(line, match.index)) return;

      const value = match[1];
      const token = this.getTokenSuggestion('fontWeights', value);

      if (token) {
        this.addViolation(filePath, lineNum, `font-weight: ${value}`, token, 'typography');
      }
    });

    // Check for hardcoded border radius
    const radiusMatches = [...line.matchAll(/border-radius\s*:\s*(\d+px|999px)/gi)];
    radiusMatches.forEach((match) => {
      if (this.isInsideVarFallback(line, match.index)) return;

      const value = match[1];
      const token = this.getTokenSuggestion('borderRadius', value);

      if (token) {
        this.addViolation(filePath, lineNum, `border-radius: ${value}`, token, 'border-radius');
      }
    });
  }

  /**
   * Get token suggestion for a value
   */
  getTokenSuggestion(category, value) {
    const normalized = value.toLowerCase().trim();
    return TOKENS[category]?.[normalized];
  }

  /**
   * Add a violation (error)
   */
  addViolation(filePath, lineNum, value, suggestion, category) {
    this.violations.push({
      file: path.relative(CONFIG.rootDir, filePath),
      line: lineNum,
      value,
      suggestion,
      category,
      severity: 'error',
    });
    this.valuesFound++;
  }

  /**
   * Add a warning
   */
  addWarning(filePath, lineNum, value, message) {
    this.warnings.push({
      file: path.relative(CONFIG.rootDir, filePath),
      line: lineNum,
      value,
      message,
      severity: 'warning',
    });
  }

  /**
   * Print results
   */
  printResults() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔍 HAWK-EYE TOKEN AUDIT');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📊 Summary:`);
    console.log(`   Files scanned: ${this.filesScanned}`);
    console.log(`   Violations found: ${this.violations.length}`);
    console.log(`   Warnings: ${this.warnings.length}\n`);

    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('✅ No violations found! Design system is compliant.\n');
      return 0;
    }

    if (this.violations.length > 0) {
      console.log('❌ ERRORS (Hardcoded values that should be replaced):\n');
      this.violations.forEach((v, idx) => {
        console.log(`${idx + 1}. ${v.file}:${v.line}`);
        console.log(`   Found: ${v.value}`);
        console.log(`   Replace with: var(${v.suggestion})`);
        console.log(`   Category: ${v.category}\n`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS (Values that might need review):\n');
      this.warnings.slice(0, 10).forEach((w, idx) => {
        console.log(`${idx + 1}. ${w.file}:${w.line}`);
        console.log(`   Value: ${w.value}`);
        console.log(`   Note: ${w.message}\n`);
      });
      if (this.warnings.length > 10) {
        console.log(`... and ${this.warnings.length - 10} more warnings\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📖 For more info, see specs/tokens/token-reference.md');
    console.log('═══════════════════════════════════════════════════════════\n');

    return this.violations.length > 0 ? 1 : 0;
  }

  /**
   * Run the audit
   */
  run() {
    console.log('Starting token audit...\n');

    const files = this.getFilesToScan();
    console.log(`Found ${files.length} files to scan...\n`);

    files.forEach((file) => {
      this.scanFile(file);
    });

    const exitCode = this.printResults();
    process.exit(exitCode);
  }
}

// Run the audit
try {
  const audit = new TokenAudit();
  audit.run();
} catch (err) {
  console.error('❌ Audit failed:', err.message);
  process.exit(2);
}
