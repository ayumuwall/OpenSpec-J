import * as path from 'node:path';
import { z } from 'zod';

function relativePathSchema(fieldName: string) {
  return z
    .string()
    .min(1, { error: `${fieldName} is required` })
    .superRefine((value, ctx) => {
      const segments = value.split(/[\\/]+/u);
      const isDrivePath = /^[A-Za-z]:/u.test(value);
      const isAbsolute =
        path.posix.isAbsolute(value) || path.win32.isAbsolute(value) || isDrivePath;
      const escapes = segments.includes('..');

      if (isAbsolute || escapes || value.includes('\0')) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldName} は許可されたディレクトリ内の相対パスでなければなりません`,
        });
      }
  });
}

// Artifact definition schema
export const ArtifactSchema = z.object({
  id: z.string().min(1, { error: 'Artifact ID は必須です' }),
  generates: relativePathSchema('generates フィールド'),
  description: z.string(),
  template: relativePathSchema('template フィールド'),
  instruction: z.string().optional(),
  requires: z.array(z.string()).default([]),
});

// Apply phase configuration for schema-aware apply instructions
export const ApplyPhaseSchema = z.object({
  // Artifact IDs that must exist before apply is available
  requires: z.array(z.string()).min(1, { error: '必要なアーティファクトを少なくとも 1 つ指定してください' }),
  // Path to file with checkboxes for progress (relative to change dir), or null if no tracking
  tracks: relativePathSchema('apply.tracks').nullable().optional(),
  // Custom guidance for the apply phase
  instruction: z.string().optional(),
});

// Full schema YAML structure
export const SchemaYamlSchema = z.object({
  name: z.string().min(1, { error: 'Schema name は必須です' }),
  version: z.number().int().positive({ error: 'Version は正の整数でなければなりません' }),
  description: z.string().optional(),
  artifacts: z.array(ArtifactSchema).min(1, { error: 'アーティファクトを少なくとも 1 つ指定してください' }),
  // Optional apply phase configuration (for schema-aware apply instructions)
  apply: ApplyPhaseSchema.optional(),
});

// Derived TypeScript types
export type Artifact = z.infer<typeof ArtifactSchema>;
export type ApplyPhase = z.infer<typeof ApplyPhaseSchema>;
export type SchemaYaml = z.infer<typeof SchemaYamlSchema>;

// Runtime state types (not Zod - internal only)

// Slice 1: Simple completion tracking via filesystem
export type CompletedSet = Set<string>;

// Return type for blocked query
export interface BlockedArtifacts {
  [artifactId: string]: string[];
}
