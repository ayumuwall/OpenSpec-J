import { Command, Option } from 'commander';
import { COMMAND_REGISTRY } from '../../core/completions/command-registry.js';
import { COMMON_FLAGS } from '../../core/completions/shared-flags.js';
import type { DoctorOptions } from '../../commands/doctor.js';

export function registerDoctorCommand(program: Command): void {
  const description =
    COMMAND_REGISTRY.find((entry) => entry.name === 'doctor')?.description ??
    '対象の OpenSpec ルートと参照先の状態を診断';

  program
    .command('doctor')
    .description(description)
    .option('--store <id>', COMMON_FLAGS.store.description)
    .addOption(
      new Option('--store-path <path>', '削除済みです。ストアを登録し、--store を使用してください').hideHelp()
    )
    .option('--json', 'JSON として出力')
    .action(async (options: DoctorOptions) => {
      const { doctorCommand } = await import('../../commands/doctor.js');
      await doctorCommand(options);
    });
}
