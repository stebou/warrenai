import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.string(), z.lazy(() => JsonValueSchema)),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function() }),
    z.record(z.string(), z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','clerkId','email','firstName','lastName','imageUrl','externalId','createdAt']);

export const BotScalarFieldEnumSchema = z.enum(['id','name','description','strategy','aiConfig','status','promptVersion','promptText','source','model','generatedAt','userId','createdAt','updatedAt']);

export const TradingSessionScalarFieldEnumSchema = z.enum(['id','botId','startedAt','endedAt','performance','log']);

export const SubscriptionScalarFieldEnumSchema = z.enum(['id','userId','stripeId','priceId','status','createdAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const BotStatusSchema = z.enum(['ACTIVE','INACTIVE','ARCHIVED','ERROR']);

export type BotStatusType = `${z.infer<typeof BotStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string().uuid(),
  clerkId: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  externalId: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// BOT SCHEMA
/////////////////////////////////////////

export const BotSchema = z.object({
  status: BotStatusSchema,
  id: z.string().cuid(),
  name: z.string(),
  description: z.string(),
  strategy: z.string(),
  aiConfig: JsonValueSchema,
  promptVersion: z.string().nullable(),
  promptText: z.string().nullable(),
  source: z.string().nullable(),
  model: z.string().nullable(),
  generatedAt: z.coerce.date().nullable(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Bot = z.infer<typeof BotSchema>

/////////////////////////////////////////
// TRADING SESSION SCHEMA
/////////////////////////////////////////

export const TradingSessionSchema = z.object({
  id: z.string().uuid(),
  botId: z.string(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
  performance: JsonValueSchema.nullable(),
  log: JsonValueSchema.nullable(),
})

export type TradingSession = z.infer<typeof TradingSessionSchema>

/////////////////////////////////////////
// SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  stripeId: z.string(),
  priceId: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>
