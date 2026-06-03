import { z } from 'zod';

const KebabIdentifierSchema = (label: string): z.ZodString =>
  z.string().superRefine((value, ctx) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) {
      ctx.addIssue({
        code: 'custom',
        message: `${label} は小文字・数字・単一ハイフン区切りの kebab-case でなければなりません`,
      });
    }
  });

export const InitiativeLinkSchema = z.object({
  store: KebabIdentifierSchema('Context store id'),
  id: KebabIdentifierSchema('Initiative id'),
}).strict();

export type InitiativeLink = z.infer<typeof InitiativeLinkSchema>;

// Per-change metadata schema. The schema field is validated against available
// workflow schemas when metadata is read or written.
export const ChangeMetadataSchema = z.object({
  schema: z.string().min(1, { message: 'schema は必須です' }),
  created: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'created は YYYY-MM-DD 形式でなければなりません',
    })
    .optional(),
  goal: z.string().min(1).optional(),
  affected_areas: z.array(z.string().min(1)).optional(),
  initiative: InitiativeLinkSchema.optional(),
});

export type ChangeMetadata = z.infer<typeof ChangeMetadataSchema>;
