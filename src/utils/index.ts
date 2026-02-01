// 共通ユーティリティ
export { validateChangeName, createChange } from './change-utils.js';
export type { ValidationResult, CreateChangeOptions } from './change-utils.js';

// 変更メタデータのユーティリティ
export {
  readChangeMetadata,
  writeChangeMetadata,
  resolveSchemaForChange,
  validateSchemaName,
  ChangeMetadataError,
} from './change-metadata.js';

// ファイルシステムのユーティリティ
export { FileSystemUtils, removeMarkerBlock } from './file-system.js';

// コマンド参照のユーティリティ
export { transformToHyphenCommands } from './command-references.js';
