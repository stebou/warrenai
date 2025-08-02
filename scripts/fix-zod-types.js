const fs = require('fs');
const path = require('path');

const zodIndexPath = path.join(__dirname, '../prisma/prisma/zod/index.ts');

try {
  let content = fs.readFileSync(zodIndexPath, 'utf8');
  
  // Replace with working type annotations
  content = content.replace(
    /export const JsonValueSchema: z\.ZodType<Prisma\.JsonValue> = /g,
    'export const JsonValueSchema: z.ZodType<any> = '
  );

  content = content.replace(
    /export const InputJsonValueSchema: z\.ZodType<Prisma\.InputJsonValue> = /g,
    'export const InputJsonValueSchema: z.ZodType<any> = '
  );

  // Replace the removed type annotations that were removed before
  content = content.replace(
    /export const JsonValueSchema = /g,
    'export const JsonValueSchema: z.ZodType<any> = '
  );

  content = content.replace(
    /export const InputJsonValueSchema = /g,
    'export const InputJsonValueSchema: z.ZodType<any> = '
  );

  // Fix the record/array lazy references to prevent circular issues
  content = content.replace(
    /z\.record\(z\.lazy\(\(\) => JsonValueSchema\.optional\(\)\)\)/g,
    'z.record(z.string(), z.lazy(() => JsonValueSchema))'
  );

  content = content.replace(
    /z\.record\(z\.lazy\(\(\) => JsonValueSchema\)\)/g,
    'z.record(z.string(), z.lazy(() => JsonValueSchema))'
  );

  // Fix InputJsonValueSchema records
  content = content.replace(
    /z\.record\(z\.lazy\(\(\) => z\.union\(\[InputJsonValueSchema, z\.literal\(null\)\]\)\)\)/g,
    'z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)])))'
  );

  content = content.replace(
    /z\.function\(z\.tuple\(\[\]\), z\.any\(\)\)/g,
    'z.function()'
  );

  fs.writeFileSync(zodIndexPath, content);
  console.log('✅ Zod JsonValue types fixed successfully');
} catch (error) {
  console.error('❌ Error fixing Zod types:', error.message);
  process.exit(1);
}