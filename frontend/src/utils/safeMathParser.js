/**
 * AI Learning Universe — Safe Mathematical Expression Parser & Evaluator
 * 
 * Strict Security: Never uses eval() or new Function().
 * Uses Recursive Descent parsing into a validated AST and evaluates safely.
 */

// Token Types
const TT = {
  NUMBER: 'NUMBER',
  IDENT: 'IDENT',
  OP: 'OP',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  COMMA: 'COMMA',
};

// Known mathematical constants
const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

// Supported mathematical functions
const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  log: (x) => (x > 0 ? Math.log(x) : NaN),
  ln: (x) => (x > 0 ? Math.log(x) : NaN),
  log10: (x) => (x > 0 ? Math.log10(x) : NaN),
  log2: (x) => (x > 0 ? Math.log2(x) : NaN),
  sqrt: (x) => (x >= 0 ? Math.sqrt(x) : NaN),
  cbrt: Math.cbrt,
  abs: Math.abs,
  sign: Math.sign,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sigmoid: (x) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, x)))),
  relu: (x) => Math.max(0, x),
  max: Math.max,
  min: Math.min,
};

/**
 * Tokenize mathematical expression string
 */
export function tokenize(input) {
  const str = input.trim();
  const tokens = [];
  let i = 0;

  while (i < str.length) {
    const ch = str[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number (e.g. 12, 3.14, .5)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(str[i + 1] || ''))) {
      let numStr = '';
      while (i < str.length && (/[0-9.]/.test(str[i]) || (str[i].toLowerCase() === 'e' && /[0-9+-]/.test(str[i + 1] || '')))) {
        numStr += str[i];
        i++;
      }
      const val = parseFloat(numStr);
      if (Number.isNaN(val)) {
        throw new Error(`Invalid number: "${numStr}"`);
      }
      tokens.push({ type: TT.NUMBER, value: val });
      continue;
    }

    // Identifiers (variable, constant, or function name)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        ident += str[i];
        i++;
      }
      tokens.push({ type: TT.IDENT, value: ident });
      continue;
    }

    // Single character tokens
    if (ch === '(') {
      tokens.push({ type: TT.LPAREN, value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: TT.RPAREN, value: ')' });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: TT.COMMA, value: ',' });
      i++;
      continue;
    }

    // Operators: +, -, *, /, ^, %
    if ('+-*/^%'.includes(ch)) {
      tokens.push({ type: TT.OP, value: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character in equation: "${ch}" at index ${i}`);
  }

  // Insert implicit multiplication tokens (e.g. 2x -> 2 * x, (x)(x) -> (x) * (x), 3(x+1) -> 3 * (x+1))
  const enriched = [];
  for (let j = 0; j < tokens.length; j++) {
    const cur = tokens[j];
    enriched.push(cur);
    if (j < tokens.length - 1) {
      const next = tokens[j + 1];
      const canImplicit =
        (cur.type === TT.NUMBER && (next.type === TT.IDENT || next.type === TT.LPAREN)) ||
        (cur.type === TT.IDENT && next.type === TT.IDENT && !FUNCTIONS[cur.value.toLowerCase()]) ||
        (cur.type === TT.RPAREN && (next.type === TT.LPAREN || next.type === TT.IDENT || next.type === TT.NUMBER)) ||
        (cur.type === TT.IDENT && cur.value.toLowerCase() in CONSTANTS && (next.type === TT.IDENT || next.type === TT.LPAREN));
      if (canImplicit) {
        enriched.push({ type: TT.OP, value: '*' });
      }
    }
  }

  return enriched;
}

/**
 * Recursive Descent Parser producing an AST
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos] || null;
  }

  consume() {
    const t = this.peek();
    this.pos++;
    return t;
  }

  expect(type, val = null) {
    const t = this.consume();
    if (!t || t.type !== type || (val !== null && t.value !== val)) {
      throw new Error(`Syntax error: expected ${val || type}, got ${t ? t.value : 'end of equation'}`);
    }
    return t;
  }

  parse() {
    if (this.tokens.length === 0) {
      throw new Error('Equation is empty');
    }
    const node = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected extra tokens after equation: "${this.tokens[this.pos].value}"`);
    }
    return node;
  }

  parseExpression() {
    return this.parseAddSub();
  }

  parseAddSub() {
    let node = this.parseMulDiv();
    while (this.peek() && this.peek().type === TT.OP && ('+-'.includes(this.peek().value))) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      node = { type: 'Binary', op, left: node, right };
    }
    return node;
  }

  parseMulDiv() {
    let node = this.parseExponent();
    while (this.peek() && this.peek().type === TT.OP && ('*/%'.includes(this.peek().value))) {
      const op = this.consume().value;
      const right = this.parseExponent();
      node = { type: 'Binary', op, left: node, right };
    }
    return node;
  }

  parseExponent() {
    let node = this.parseUnary();
    if (this.peek() && this.peek().type === TT.OP && this.peek().value === '^') {
      const op = this.consume().value;
      const right = this.parseExponent(); // right-associative
      node = { type: 'Binary', op, left: node, right };
    }
    return node;
  }

  parseUnary() {
    if (this.peek() && this.peek().type === TT.OP && ('+-'.includes(this.peek().value))) {
      const op = this.consume().value;
      const argument = this.parseUnary();
      return { type: 'Unary', op, argument };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.peek();
    if (!t) {
      throw new Error('Unexpected end of mathematical expression');
    }

    if (t.type === TT.NUMBER) {
      this.consume();
      return { type: 'Literal', value: t.value };
    }

    if (t.type === TT.IDENT) {
      this.consume();
      const name = t.value;
      const lower = name.toLowerCase();

      // Check if it's a function call e.g. sin(x)
      if (this.peek() && this.peek().type === TT.LPAREN) {
        this.consume(); // eat '('
        const args = [];
        if (!this.peek() || this.peek().type !== TT.RPAREN) {
          args.push(this.parseExpression());
          while (this.peek() && this.peek().type === TT.COMMA) {
            this.consume();
            args.push(this.parseExpression());
          }
        }
        this.expect(TT.RPAREN, ')');
        return { type: 'Call', callee: lower, args };
      }

      // Mathematical constant
      if (lower in CONSTANTS) {
        return { type: 'Literal', value: CONSTANTS[lower] };
      }

      // Variable (e.g. x, m, c, a, b)
      return { type: 'Variable', name };
    }

    if (t.type === TT.LPAREN) {
      this.consume();
      const node = this.parseExpression();
      this.expect(TT.RPAREN, ')');
      return node;
    }

    throw new Error(`Unexpected token: "${t.value}"`);
  }
}

/**
 * Recursively evaluate an AST node given variable scope
 */
function evaluateNode(node, scope) {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Variable': {
      const v = scope[node.name] ?? scope[node.name.toLowerCase()];
      if (v !== undefined && typeof v === 'number') {
        return v;
      }
      // If variable name is x or X, default to 0 if not supplied
      if (node.name.toLowerCase() === 'x') {
        return 0;
      }
      return NaN;
    }

    case 'Unary': {
      const val = evaluateNode(node.argument, scope);
      if (node.op === '-') return -val;
      if (node.op === '+') return +val;
      return NaN;
    }

    case 'Binary': {
      const left = evaluateNode(node.left, scope);
      const right = evaluateNode(node.right, scope);
      if (Number.isNaN(left) || Number.isNaN(right)) return NaN;

      switch (node.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return Math.abs(right) < 1e-15 ? NaN : left / right;
        case '%':
          return left % right;
        case '^':
          return Math.pow(left, right);
        default:
          return NaN;
      }
    }

    case 'Call': {
      const fn = FUNCTIONS[node.callee];
      if (!fn) {
        return NaN;
      }
      const evalArgs = node.args.map((a) => evaluateNode(a, scope));
      for (const a of evalArgs) {
        if (Number.isNaN(a)) return NaN;
      }
      return fn(...evalArgs);
    }

    default:
      return NaN;
  }
}

/**
 * Clean & normalize raw equation input
 * e.g. "y = 2x + 1" -> "2x + 1"
 * "f(x) = x^2 - 4" -> "x^2 - 4"
 */
export function normalizeEquationString(raw) {
  if (!raw) return '';
  let str = raw.trim();
  // Strip left-hand assignment like "y =", "y=", "f(x) =", "f(x)="
  str = str.replace(/^(y|f\s*\(\s*x\s*\))\s*=\s*/i, '');
  return str.trim();
}

/**
 * Compile an equation string into an executable evaluation function
 * Returns { evaluate: (x, vars) => number, ast, error: null } or { error: string }
 */
export function compileEquation(rawString) {
  const normalized = normalizeEquationString(rawString);
  if (!normalized) {
    return {
      evaluate: () => NaN,
      ast: null,
      error: 'Please enter a mathematical expression (e.g. 2*x + 1 or x^2 - 4)',
    };
  }

  try {
    const tokens = tokenize(normalized);
    const parser = new Parser(tokens);
    const ast = parser.parse();

    return {
      evaluate: (x, variables = {}) => {
        const scope = { ...variables, x, X: x };
        return evaluateNode(ast, scope);
      },
      ast,
      error: null,
    };
  } catch (err) {
    return {
      evaluate: () => NaN,
      ast: null,
      error: err.message || 'Invalid mathematical expression',
    };
  }
}

/**
 * Generate points (x, y) for an equation across a range [xMin, xMax]
 */
export function generatePlotPoints(compiledFn, xMin = -10, xMax = 10, count = 200, variables = {}) {
  const points = [];
  const step = (xMax - xMin) / Math.max(1, count - 1);
  for (let i = 0; i < count; i++) {
    const x = xMin + i * step;
    const y = compiledFn(x, variables);
    if (!Number.isNaN(y) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * Predefined educational function presets
 */
export const EQUATION_PRESETS = [
  {
    id: 'linear',
    name: 'Linear Function',
    latex: 'y = mx + c',
    equation: 'm * x + c',
    defaultParams: { m: 2, c: 1 },
    description: 'Constant rate of change with slope m and vertical offset c.',
    category: 'Algebra',
  },
  {
    id: 'quadratic',
    name: 'Quadratic Parabola',
    latex: 'y = ax² + bx + c',
    equation: 'a * x^2 + b * x + c',
    defaultParams: { a: 1, b: 0, c: -4 },
    description: 'U-shaped parabolic curve with vertex at -b/(2a) and curvature a.',
    category: 'Algebra',
  },
  {
    id: 'polynomial',
    name: 'Cubic Polynomial',
    latex: 'y = x³ - 3x + 1',
    equation: 'x^3 - 3*x + 1',
    defaultParams: {},
    description: 'Third-degree polynomial showing local extrema and inflection.',
    category: 'Calculus',
  },
  {
    id: 'exponential',
    name: 'Exponential Growth / Decay',
    latex: 'y = a · e^(bx)',
    equation: 'a * exp(b * x)',
    defaultParams: { a: 1, b: 0.5 },
    description: 'Proportional growth rate; fundamental in population models and loss landscapes.',
    category: 'Calculus',
  },
  {
    id: 'logarithmic',
    name: 'Logarithmic Function',
    latex: 'y = a · ln(x) + c',
    equation: 'a * ln(x) + c',
    defaultParams: { a: 2, c: 0 },
    description: 'Inverse of exponential; models diminishing returns and information entropy.',
    category: 'Calculus',
  },
  {
    id: 'trigonometric',
    name: 'Sine Wave',
    latex: 'y = A · sin(ωx + φ)',
    equation: 'A * sin(w * x + phi)',
    defaultParams: { A: 2, w: 1, phi: 0 },
    description: 'Periodic harmonic oscillation with amplitude A and frequency w.',
    category: 'Trigonometry',
  },
  {
    id: 'sigmoid',
    name: 'Logistic Sigmoid (ML Activation)',
    latex: 'y = 1 / (1 + e^(-kx))',
    equation: '1 / (1 + exp(-k * x))',
    defaultParams: { k: 1 },
    description: 'S-shaped smooth squashing function mapping real values to (0, 1) probability.',
    category: 'Machine Learning',
  },
  {
    id: 'gaussian',
    name: 'Gaussian / Normal Bell Curve',
    latex: 'y = exp(-x² / 2σ²)',
    equation: 'exp(-(x - mu)^2 / (2 * sigma^2))',
    defaultParams: { mu: 0, sigma: 1 },
    description: 'Symmetric probability density bell curve centered at mu with dispersion sigma.',
    category: 'Statistics',
  },
  {
    id: 'relu',
    name: 'Rectified Linear Unit (ReLU)',
    latex: 'y = max(0, x)',
    equation: 'relu(x)',
    defaultParams: {},
    description: 'Standard modern deep learning activation function preventing vanishing gradients.',
    category: 'Deep Learning',
  },
  {
    id: 'absolute',
    name: 'Absolute Value (L1 Loss)',
    latex: 'y = |x - c|',
    equation: 'abs(x - c)',
    defaultParams: { c: 0 },
    description: 'V-shaped function with sharp minimum; basis of Mean Absolute Error (MAE).',
    category: 'Algebra',
  },
];
