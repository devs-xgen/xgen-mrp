/**
 * Accessibility Validation Utilities for Billing Components
 * Provides runtime accessibility checks and compliance validation
 */

export interface AccessibilityViolation {
  type: 'error' | 'warning';
  rule: string;
  element: string;
  message: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: string[];
  score: number;
  timestamp: Date;
}

/**
 * Validates ARIA attributes and roles
 */
export function validateAriaAttributes(element: Element): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  
  // Check for required ARIA labels
  const interactiveElements = element.querySelectorAll('button, input, select, textarea, [role="button"], [role="combobox"]');
  
  interactiveElements.forEach((el, index) => {
    const tagName = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    const ariaLabel = el.getAttribute('aria-label');
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    const id = el.id || `element-${index}`;
    
    // Check for accessible name
    if (!ariaLabel && !ariaLabelledBy) {
      const associatedLabel = element.querySelector(`label[for="${el.id}"]`);
      if (!associatedLabel && tagName !== 'button') {
        violations.push({
          type: 'error',
          rule: 'accessible-name',
          element: `${tagName}#${id}`,
          message: 'Interactive element must have an accessible name',
          impact: 'serious',
        });
      }
    }
    
    // Check for proper ARIA roles
    if (role) {
      const validRoles = [
        'button', 'combobox', 'listbox', 'option', 'textbox', 'checkbox',
        'radio', 'tab', 'tabpanel', 'dialog', 'alert', 'status', 'region',
        'navigation', 'main', 'banner', 'contentinfo', 'complementary'
      ];
      
      if (!validRoles.includes(role)) {
        violations.push({
          type: 'warning',
          rule: 'valid-aria-role',
          element: `${tagName}#${id}`,
          message: `Invalid ARIA role: ${role}`,
          impact: 'moderate',
        });
      }
    }
    
    // Check for ARIA expanded on comboboxes
    if (role === 'combobox' && !el.hasAttribute('aria-expanded')) {
      violations.push({
        type: 'error',
        rule: 'aria-expanded-required',
        element: `${tagName}#${id}`,
        message: 'Combobox must have aria-expanded attribute',
        impact: 'serious',
      });
    }
  });
  
  return violations;
}

/**
 * Validates keyboard navigation support
 */
export function validateKeyboardNavigation(element: Element): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  
  // Check for focusable elements without tabindex
  const interactiveElements = element.querySelectorAll('button, input, select, textarea, a[href], [role="button"]');
  
  interactiveElements.forEach((el, index) => {
    const tabIndex = el.getAttribute('tabindex');
    const disabled = el.hasAttribute('disabled');
    const id = el.id || `element-${index}`;
    
    // Check for negative tabindex on non-disabled elements
    if (tabIndex === '-1' && !disabled) {
      violations.push({
        type: 'warning',
        rule: 'keyboard-navigation',
        element: `${el.tagName.toLowerCase()}#${id}`,
        message: 'Interactive element may not be keyboard accessible',
        impact: 'moderate',
      });
    }
    
    // Check for very high positive tabindex
    if (tabIndex && parseInt(tabIndex) > 0 && parseInt(tabIndex) > 10) {
      violations.push({
        type: 'warning',
        rule: 'tabindex-order',
        element: `${el.tagName.toLowerCase()}#${id}`,
        message: 'High positive tabindex may disrupt natural tab order',
        impact: 'minor',
      });
    }
  });
  
  return violations;
}

/**
 * Validates form accessibility
 */
export function validateFormAccessibility(element: Element): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  
  // Check form inputs
  const inputs = element.querySelectorAll('input, select, textarea');
  
  inputs.forEach((input, index) => {
    const id = input.id || `input-${index}`;
    const type = input.getAttribute('type');
    const required = input.hasAttribute('required');
    const ariaRequired = input.getAttribute('aria-required');
    const ariaInvalid = input.getAttribute('aria-invalid');
    const ariaDescribedBy = input.getAttribute('aria-describedby');
    
    // Check for label association
    const label = element.querySelector(`label[for="${input.id}"]`);
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!label && !ariaLabel && !ariaLabelledBy) {
      violations.push({
        type: 'error',
        rule: 'form-label',
        element: `input#${id}`,
        message: 'Form input must have an associated label',
        impact: 'serious',
      });
    }
    
    // Check required field indication
    if (required && !ariaRequired) {
      violations.push({
        type: 'warning',
        rule: 'required-field',
        element: `input#${id}`,
        message: 'Required field should have aria-required="true"',
        impact: 'moderate',
      });
    }
    
    // Check error indication
    if (ariaInvalid === 'true' && !ariaDescribedBy) {
      violations.push({
        type: 'error',
        rule: 'error-description',
        element: `input#${id}`,
        message: 'Invalid field must reference error description with aria-describedby',
        impact: 'serious',
      });
    }
    
    // Check input type accessibility
    if (type === 'number' && !input.hasAttribute('inputmode')) {
      violations.push({
        type: 'warning',
        rule: 'input-mode',
        element: `input#${id}`,
        message: 'Number input should specify inputmode for better mobile experience',
        impact: 'minor',
      });
    }
  });
  
  return violations;
}

/**
 * Validates live regions and dynamic content
 */
export function validateLiveRegions(element: Element): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  
  // Check for proper live region attributes
  const liveRegions = element.querySelectorAll('[aria-live], [role="alert"], [role="status"]');
  
  liveRegions.forEach((region, index) => {
    const ariaLive = region.getAttribute('aria-live');
    const role = region.getAttribute('role');
    const id = region.id || `live-region-${index}`;
    
    // Check for appropriate aria-live values
    if (ariaLive && !['polite', 'assertive', 'off'].includes(ariaLive)) {
      violations.push({
        type: 'error',
        rule: 'valid-aria-live',
        element: `${region.tagName.toLowerCase()}#${id}`,
        message: `Invalid aria-live value: ${ariaLive}`,
        impact: 'serious',
      });
    }
    
    // Check for role consistency
    if (role === 'alert' && ariaLive !== 'assertive') {
      violations.push({
        type: 'warning',
        rule: 'alert-consistency',
        element: `${region.tagName.toLowerCase()}#${id}`,
        message: 'Alert role should have aria-live="assertive"',
        impact: 'moderate',
      });
    }
    
    if (role === 'status' && ariaLive !== 'polite') {
      violations.push({
        type: 'warning',
        rule: 'status-consistency',
        element: `${region.tagName.toLowerCase()}#${id}`,
        message: 'Status role should have aria-live="polite"',
        impact: 'moderate',
      });
    }
  });
  
  return violations;
}

/**
 * Validates color contrast and visual accessibility
 */
export function validateVisualAccessibility(element: Element): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  
  // Check for text alternatives
  const images = element.querySelectorAll('img, svg');
  
  images.forEach((img, index) => {
    const alt = img.getAttribute('alt');
    const ariaLabel = img.getAttribute('aria-label');
    const ariaLabelledBy = img.getAttribute('aria-labelledby');
    const ariaHidden = img.getAttribute('aria-hidden');
    const role = img.getAttribute('role');
    const id = img.id || `image-${index}`;
    
    // Check for text alternatives (unless decorative)
    if (!alt && !ariaLabel && !ariaLabelledBy && ariaHidden !== 'true' && role !== 'presentation') {
      violations.push({
        type: 'error',
        rule: 'image-alt',
        element: `${img.tagName.toLowerCase()}#${id}`,
        message: 'Image must have alternative text or be marked as decorative',
        impact: 'serious',
      });
    }
  });
  
  // Check for focus indicators
  const focusableElements = element.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
  
  focusableElements.forEach((el, index) => {
    const computedStyle = window.getComputedStyle(el, ':focus-visible');
    const outline = computedStyle.outline;
    const outlineWidth = computedStyle.outlineWidth;
    const id = el.id || `focusable-${index}`;
    
    // Check for visible focus indicator
    if (outline === 'none' || outlineWidth === '0px') {
      violations.push({
        type: 'warning',
        rule: 'focus-indicator',
        element: `${el.tagName.toLowerCase()}#${id}`,
        message: 'Focusable element should have a visible focus indicator',
        impact: 'moderate',
      });
    }
  });
  
  return violations;
}

/**
 * Validates responsive design accessibility
 */
export function validateResponsiveAccessibility(element: Element): AccessibilityViolation[] {
  const violations: AccessibilityViolation[] = [];
  
  // Check for minimum touch target sizes on touch devices
  if ('ontouchstart' in window) {
    const touchTargets = element.querySelectorAll('button, input[type="button"], input[type="submit"], a[href], [role="button"]');
    
    touchTargets.forEach((target, index) => {
      const rect = target.getBoundingClientRect();
      const id = target.id || `touch-target-${index}`;
      
      if (rect.width < 44 || rect.height < 44) {
        violations.push({
          type: 'warning',
          rule: 'touch-target-size',
          element: `${target.tagName.toLowerCase()}#${id}`,
          message: 'Touch target should be at least 44x44 pixels',
          impact: 'moderate',
        });
      }
    });
  }
  
  // Check for viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    violations.push({
      type: 'error',
      rule: 'viewport-meta',
      element: 'document',
      message: 'Document should have a viewport meta tag for responsive design',
      impact: 'serious',
    });
  }
  
  return violations;
}

/**
 * Comprehensive accessibility validation
 */
export function validateAccessibility(element: Element): AccessibilityReport {
  const allViolations: AccessibilityViolation[] = [
    ...validateAriaAttributes(element),
    ...validateKeyboardNavigation(element),
    ...validateFormAccessibility(element),
    ...validateLiveRegions(element),
    ...validateVisualAccessibility(element),
    ...validateResponsiveAccessibility(element),
  ];
  
  const passes: string[] = [];
  const rulesCovered = new Set(allViolations.map(v => v.rule));
  
  // Add passes for rules that didn't generate violations
  const allRules = [
    'accessible-name', 'valid-aria-role', 'aria-expanded-required',
    'keyboard-navigation', 'tabindex-order', 'form-label', 'required-field',
    'error-description', 'input-mode', 'valid-aria-live', 'alert-consistency',
    'status-consistency', 'image-alt', 'focus-indicator', 'touch-target-size',
    'viewport-meta'
  ];
  
  allRules.forEach(rule => {
    if (!rulesCovered.has(rule)) {
      passes.push(rule);
    }
  });
  
  // Calculate accessibility score
  const totalRules = allRules.length;
  const passedRules = passes.length;
  const score = Math.round((passedRules / totalRules) * 100);
  
  return {
    violations: allViolations,
    passes,
    score,
    timestamp: new Date(),
  };
}

/**
 * Format accessibility report for display
 */
export function formatAccessibilityReport(report: AccessibilityReport): string {
  const { violations, passes, score, timestamp } = report;
  
  let output = `Accessibility Report - ${timestamp.toLocaleString()}\n`;
  output += `Score: ${score}/100\n\n`;
  
  if (violations.length > 0) {
    output += `Violations (${violations.length}):\n`;
    violations.forEach((violation, index) => {
      output += `${index + 1}. [${violation.impact.toUpperCase()}] ${violation.rule}\n`;
      output += `   Element: ${violation.element}\n`;
      output += `   Message: ${violation.message}\n\n`;
    });
  }
  
  if (passes.length > 0) {
    output += `Passed Rules (${passes.length}):\n`;
    passes.forEach(rule => {
      output += `✓ ${rule}\n`;
    });
  }
  
  return output;
}

/**
 * Auto-fix common accessibility issues
 */
export function autoFixAccessibilityIssues(element: Element): number {
  let fixedCount = 0;
  
  // Auto-fix missing alt attributes on decorative images
  const decorativeImages = element.querySelectorAll('img:not([alt]):not([aria-label]):not([aria-labelledby])');
  decorativeImages.forEach(img => {
    // If image is likely decorative (small, in UI components), add empty alt
    const rect = img.getBoundingClientRect();
    if (rect.width <= 24 && rect.height <= 24) {
      img.setAttribute('alt', '');
      img.setAttribute('aria-hidden', 'true');
      fixedCount++;
    }
  });
  
  // Auto-fix missing aria-expanded on comboboxes
  const comboboxes = element.querySelectorAll('[role="combobox"]:not([aria-expanded])');
  comboboxes.forEach(combobox => {
    combobox.setAttribute('aria-expanded', 'false');
    fixedCount++;
  });
  
  // Auto-fix missing aria-required on required inputs
  const requiredInputs = element.querySelectorAll('input[required]:not([aria-required])');
  requiredInputs.forEach(input => {
    input.setAttribute('aria-required', 'true');
    fixedCount++;
  });
  
  return fixedCount;
}

/**
 * Monitor accessibility in development
 */
export function monitorAccessibility(element: Element, options: { 
  interval?: number; 
  autoFix?: boolean; 
  onViolation?: (violation: AccessibilityViolation) => void;
} = {}): () => void {
  const { interval = 5000, autoFix = false, onViolation } = options;
  
  const check = () => {
    const report = validateAccessibility(element);
    
    if (autoFix) {
      autoFixAccessibilityIssues(element);
    }
    
    report.violations.forEach(violation => {
      if (onViolation) {
        onViolation(violation);
      } else {
        console.warn(`Accessibility violation: ${violation.message}`, violation);
      }
    });
  };
  
  // Initial check
  check();
  
  // Set up periodic monitoring
  const intervalId = setInterval(check, interval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
}