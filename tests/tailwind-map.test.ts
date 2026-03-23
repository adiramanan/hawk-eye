import { describe, expect, it } from 'vitest';
import {
  cssToTailwindClass,
  tailwindClassToCss,
} from '../packages/vite-plugin/src/tailwind-map';

describe('tailwind map', () => {
  it('maps spacing utilities and arbitrary spacing values', () => {
    expect(cssToTailwindClass('padding-top', '16px')).toBe('pt-4');
    expect(cssToTailwindClass('padding-right', '1rem')).toBe('pr-4');
    expect(cssToTailwindClass('margin-left', 'auto')).toBe('ml-auto');
    expect(cssToTailwindClass('margin-top', '-8px')).toBe('-mt-2');
    expect(cssToTailwindClass('padding-bottom', '14px')).toBe('pb-3.5');

    expect(tailwindClassToCss('pt-4')).toEqual({
      property: 'padding-top',
      value: '1rem',
    });
    expect(tailwindClassToCss('-mt-2')).toEqual({
      property: 'margin-top',
      value: '-0.5rem',
    });
    expect(tailwindClassToCss('pl-[14px]')).toEqual({
      property: 'padding-left',
      value: '14px',
    });
    expect(tailwindClassToCss('pb-3.5')).toEqual({
      property: 'padding-bottom',
      value: '0.875rem',
    });
    expect(tailwindClassToCss('ml-auto')).toEqual({
      property: 'margin-left',
      value: 'auto',
    });
  });

  it('maps focused color utilities with palette lookup and arbitrary fallback', () => {
    expect(cssToTailwindClass('background-color', '#ffffff')).toBe('bg-white');
    expect(cssToTailwindClass('color', 'rgb(17, 24, 39)')).toBe('text-gray-900');
    expect(cssToTailwindClass('background-color', 'rgba(17, 34, 51, 0.5)')).toBe(
      'bg-[#11223380]'
    );

    expect(tailwindClassToCss('bg-white')).toEqual({
      property: 'background-color',
      value: '#ffffff',
    });
    expect(tailwindClassToCss('text-gray-600')).toEqual({
      property: 'color',
      value: '#4b5563',
    });
    expect(tailwindClassToCss('text-[#112233]')).toEqual({
      property: 'color',
      value: '#112233',
    });
  });

  it('maps typography utilities across size, weight, and alignment', () => {
    expect(cssToTailwindClass('font-size', '18px')).toBe('text-lg');
    expect(cssToTailwindClass('font-size', '15px')).toBe('text-[15px]');
    expect(cssToTailwindClass('font-weight', '600')).toBe('font-semibold');
    expect(cssToTailwindClass('text-align', 'center')).toBe('text-center');

    expect(tailwindClassToCss('text-2xl')).toEqual({
      property: 'font-size',
      value: '1.5rem',
    });
    expect(tailwindClassToCss('font-bold')).toEqual({
      property: 'font-weight',
      value: '700',
    });
    expect(tailwindClassToCss('text-right')).toEqual({
      property: 'text-align',
      value: 'right',
    });
    expect(tailwindClassToCss('text-[14px]')).toEqual({
      property: 'font-size',
      value: '14px',
    });
  });

  it('maps radius and shadow utilities with arbitrary fallback', () => {
    expect(cssToTailwindClass('border-radius', '8px')).toBe('rounded-lg');
    expect(cssToTailwindClass('border-radius', '13px')).toBe('rounded-[13px]');
    expect(
      cssToTailwindClass(
        'box-shadow',
        '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
      )
    ).toBe('shadow-lg');
    expect(cssToTailwindClass('box-shadow', '0 4px 12px rgba(15,23,42,0.18)')).toBe(
      'shadow-[0_4px_12px_rgba(15,23,42,0.18)]'
    );

    expect(tailwindClassToCss('rounded-2xl')).toEqual({
      property: 'border-radius',
      value: '1rem',
    });
    expect(tailwindClassToCss('rounded-full')).toEqual({
      property: 'border-radius',
      value: '9999px',
    });
    expect(tailwindClassToCss('shadow-sm')).toEqual({
      property: 'box-shadow',
      value: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    });
    expect(tailwindClassToCss('shadow-[0_4px_12px_rgba(15,23,42,0.18)]')).toEqual({
      property: 'box-shadow',
      value: '0 4px 12px rgba(15,23,42,0.18)',
    });
  });

  it('roundtrips stable focused utility classes', () => {
    const classes = [
      'pt-4',
      'ml-auto',
      'bg-white',
      'text-gray-900',
      'text-lg',
      'font-semibold',
      'text-center',
      'rounded-xl',
      'shadow-md',
      'text-[#112233]',
      'rounded-[13px]',
    ];

    for (const className of classes) {
      const declaration = tailwindClassToCss(className);

      expect(declaration, className).not.toBeNull();
      expect(cssToTailwindClass(declaration!.property, declaration!.value)).toBe(className);
    }
  });
});
