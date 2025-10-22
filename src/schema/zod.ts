export type ZodIssue = { path: string; message: string };
export class ZodError extends Error {
  constructor(public issues: ZodIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
  }
}

type Refinement<T> = (value: T) => boolean | string;

type Schema<T> = {
  parse(value: unknown, path?: string): T;
  refine(refinement: Refinement<T>, message?: string): Schema<T>;
};

class BaseSchema<T> implements Schema<T> {
  protected refinements: Array<{ fn: Refinement<T>; message?: string }> = [];
  constructor(private readonly parser: (value: unknown, path: string) => T) {}
  parse(value: unknown, path = ''): T {
    const parsed = this.parser(value, path);
    for (const refinement of this.refinements) {
      const result = refinement.fn(parsed);
      if (result === false) {
        throw new ZodError([{ path, message: refinement.message ?? 'Invalid value' }]);
      }
      if (typeof result === 'string') {
        throw new ZodError([{ path, message: result }]);
      }
    }
    return parsed;
  }
  refine(refinement: Refinement<T>, message?: string): Schema<T> {
    this.refinements.push({ fn: refinement, message });
    return this;
  }
}

export const z = {
  string() {
    return new BaseSchema<string>((value, path) => {
      if (typeof value !== 'string') {
        throw new ZodError([{ path, message: 'Expected string' }]);
      }
      return value;
    });
  },
  number() {
    return new BaseSchema<number>((value, path) => {
      if (typeof value !== 'number') {
        throw new ZodError([{ path, message: 'Expected number' }]);
      }
      return value;
    });
  },
  boolean() {
    return new BaseSchema<boolean>((value, path) => {
      if (typeof value !== 'boolean') {
        throw new ZodError([{ path, message: 'Expected boolean' }]);
      }
      return value;
    });
  },
  literal<T extends string | number | boolean>(expected: T) {
    return new BaseSchema<T>((value, path) => {
      if (value !== expected) {
        throw new ZodError([{ path, message: `Expected literal ${expected}` }]);
      }
      return expected;
    });
  },
  array<T>(schema: Schema<T>) {
    return new BaseSchema<T[]>((value, path) => {
      if (!Array.isArray(value)) {
        throw new ZodError([{ path, message: 'Expected array' }]);
      }
      return value.map((item, index) => schema.parse(item, `${path}[${index}]`));
    });
  },
  object<T extends Record<string, Schema<any>>>(shape: T) {
    type Output = { [K in keyof T]: T[K] extends Schema<infer R> ? R : never };
    return new BaseSchema<Output>((value, path) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ZodError([{ path, message: 'Expected object' }]);
      }
      const result: any = {};
      for (const key of Object.keys(shape) as Array<keyof T>) {
        const schema = shape[key];
        const childPath = path ? `${path}.${String(key)}` : String(key);
        result[key] = (schema as Schema<any>).parse((value as any)[key], childPath);
      }
      return result as Output;
    });
  },
  enum<T extends string>(values: readonly T[]) {
    return new BaseSchema<T>((value, path) => {
      if (typeof value !== 'string' || !values.includes(value as T)) {
        throw new ZodError([{ path, message: `Expected one of ${values.join(', ')}` }]);
      }
      return value as T;
    });
  },
  record(schema: Schema<any>) {
    return new BaseSchema<Record<string, any>>((value, path) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ZodError([{ path, message: 'Expected record' }]);
      }
      const result: Record<string, any> = {};
      for (const key of Object.keys(value as any)) {
        result[key] = schema.parse((value as any)[key], `${path}.${key}`);
      }
      return result;
    });
  },
  optional<T>(schema: Schema<T>) {
    return new BaseSchema<T | undefined>((value, path) => {
      if (value === undefined) return undefined;
      return schema.parse(value, path);
    });
  },
};

export type infer<T extends Schema<any>> = T extends Schema<infer R> ? R : never;
