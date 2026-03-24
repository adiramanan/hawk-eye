/**
 * Property Schema System
 *
 * Type-safe property validation and transformation.
 * Ensures all CSS property values are validated before use.
 */

import type { EditablePropertyId } from '../types';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  value?: string;
}

/**
 * Property schema definition
 */
export interface PropertySchema {
  id: EditablePropertyId;
  cssProperty: string;
  label: string;
  validator: (value: string) => ValidationResult;
  transform?: (value: string) => string;
  allowedValues?: string[];
  description?: string;
}

/**
 * Common validators
 */
export const validators = {
  /**
   * Validate numeric pixel value
   */
  pixels: (value: string): ValidationResult => {
    const trimmed = value.trim();
    if (!trimmed) return { valid: false, error: 'Value cannot be empty' };
    if (!/^\d+px$/.test(trimmed)) {
      return { valid: false, error: 'Expected format: "123px"' };
    }
    return { valid: true, value: trimmed };
  },

  /**
   * Validate color value (hex or rgb)
   */
  color: (value: string): ValidationResult => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return { valid: false, error: 'Color cannot be empty' };

    // Hex color
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/.test(trimmed)) {
      return { valid: true, value: trimmed };
    }

    // RGB/RGBA
    if (/^rgba?\(/.test(trimmed)) {
      return { valid: true, value: trimmed };
    }

    return { valid: false, error: 'Invalid color format' };
  },

  /**
   * Validate CSS keyword
   */
  keyword: (allowed: string[]) => (value: string): ValidationResult => {
    const trimmed = value.trim().toLowerCase();
    if (allowed.includes(trimmed)) {
      return { valid: true, value: trimmed };
    }
    return { valid: false, error: `Must be one of: ${allowed.join(', ')}` };
  },

  /**
   * Allow any non-empty value
   */
  any: (value: string): ValidationResult => {
    const trimmed = value.trim();
    if (!trimmed) return { valid: false, error: 'Value cannot be empty' };
    return { valid: true, value: trimmed };
  },
};

/**
 * Schema registry
 */
export class PropertySchemaRegistry {
  private schemas = new Map<EditablePropertyId, PropertySchema>();

  register(schema: PropertySchema) {
    this.schemas.set(schema.id, schema);
  }

  get(id: EditablePropertyId): PropertySchema | undefined {
    return this.schemas.get(id);
  }

  validate(id: EditablePropertyId, value: string): ValidationResult {
    const schema = this.schemas.get(id);
    if (!schema) {
      return { valid: false, error: `No schema found for property: ${id}` };
    }
    return schema.validator(value);
  }

  transform(id: EditablePropertyId, value: string): string {
    const schema = this.schemas.get(id);
    return schema?.transform ? schema.transform(value) : value;
  }

  getAll(): PropertySchema[] {
    return Array.from(this.schemas.values());
  }
}

/**
 * Global schema registry
 */
export const propertySchemaRegistry = new PropertySchemaRegistry();

/**
 * Initialize default schemas
 */
export function initializeDefaultSchemas() {
  // Padding/margin properties
  propertySchemaRegistry.register({
    id: 'padding' as EditablePropertyId,
    cssProperty: 'padding',
    label: 'Padding',
    validator: validators.pixels,
    description: 'Inner spacing around element content',
  });

  propertySchemaRegistry.register({
    id: 'margin' as EditablePropertyId,
    cssProperty: 'margin',
    label: 'Margin',
    validator: validators.pixels,
    description: 'Outer spacing around element',
  });

  // Color properties
  propertySchemaRegistry.register({
    id: 'color' as EditablePropertyId,
    cssProperty: 'color',
    label: 'Text Color',
    validator: validators.color,
    description: 'Text color value',
  });

  propertySchemaRegistry.register({
    id: 'backgroundColor' as EditablePropertyId,
    cssProperty: 'background-color',
    label: 'Background Color',
    validator: validators.color,
    description: 'Background color value',
  });

  // Display properties
  propertySchemaRegistry.register({
    id: 'display' as EditablePropertyId,
    cssProperty: 'display',
    label: 'Display',
    validator: validators.keyword(['block', 'inline', 'inline-block', 'flex', 'grid', 'none']),
    allowedValues: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'],
    description: 'Element display mode',
  });
}
