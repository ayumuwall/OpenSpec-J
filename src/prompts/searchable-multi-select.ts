import chalk from 'chalk';

interface Choice {
  name: string;
  value: string;
  description?: string;
  configured?: boolean;
  detected?: boolean;
  configuredLabel?: string;
  preSelected?: boolean;
}

interface Config {
  message: string;
  choices: Choice[];
  pageSize?: number;
  validate?: (selected: string[]) => boolean | string;
}

/**
 * 検索可能な複数選択プロンプトを作成する。
 * pre-commit フックのハングを避けるため動的 import を使う（#367）。
 */
async function createSearchableMultiSelect(): Promise<
  (config: Config) => Promise<string[]>
> {
  const {
    createPrompt,
    useState,
    useKeypress,
    useMemo,
    usePrefix,
    isEnterKey,
    isBackspaceKey,
    isUpKey,
    isDownKey,
  } = await import('@inquirer/core');

  return createPrompt((config: Config, done: (value: string[]) => void): string => {
    const { message, choices, pageSize = 15, validate } = config;

    const [searchText, setSearchText] = useState('');
    const [selectedValues, setSelectedValues] = useState<string[]>(
      () => choices.filter(c => c.preSelected).map(c => c.value)
    );
    const [cursor, setCursor] = useState(0);
    const [status, setStatus] = useState<'idle' | 'done'>('idle');
    const [error, setError] = useState<string | null>(null);

    const prefix = usePrefix({ status });

    // 検索語で選択肢を絞り込む
    const filteredChoices = useMemo(() => {
      if (!searchText.trim()) return choices;
      const term = searchText.toLowerCase();
      return choices.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.value.toLowerCase().includes(term)
      );
    }, [searchText, choices]);

    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
    const choiceMap = useMemo(
      () => new Map(choices.map((c) => [c.value, c])),
      [choices]
    );

    useKeypress((key) => {
      if (status === 'done') return;

      // Enter で確定
      if (isEnterKey(key)) {
        if (validate) {
          const result = validate(selectedValues);
          if (result !== true) {
            setError(typeof result === 'string' ? result : '無効です');
            return;
          }
        }
        setStatus('done');
        done(selectedValues);
        return;
      }

      // Space でトグル選択
      if (key.name === 'space') {
        const choice = filteredChoices[cursor];
        if (choice) {
          if (selectedSet.has(choice.value)) {
            setSelectedValues(selectedValues.filter(v => v !== choice.value));
          } else {
            setSelectedValues([...selectedValues, choice.value]);
          }
        }
        return;
      }

      // Backspace で削除または検索文字の削除
      if (isBackspaceKey(key)) {
        if (searchText === '' && selectedValues.length > 0) {
          setSelectedValues(selectedValues.slice(0, -1));
        } else {
          setSearchText(searchText.slice(0, -1));
          setCursor(0);
        }
        return;
      }

      // 移動
      if (isUpKey(key)) {
        setCursor(Math.max(0, cursor - 1));
        return;
      }
      if (isDownKey(key)) {
        setCursor(Math.min(filteredChoices.length - 1, cursor + 1));
        return;
      }

      // 文字入力（表示可能文字）
      if (key.name && key.name.length === 1 && !key.ctrl) {
        setSearchText(searchText + key.name);
        setCursor(0);
      }
    });

    // 確定状態の表示
    if (status === 'done') {
      const names = selectedValues
        .map((v) => choiceMap.get(v)?.name ?? v)
        .join(', ');
      return `${prefix} ${chalk.bold(message)} ${chalk.cyan(names || '(なし)')}`;
    }

    // 操作中の表示
    const lines: string[] = [];
    lines.push(`${prefix} ${chalk.bold(message)}`);

    // 選択済みチップ
    const chips =
      selectedValues.length > 0
        ? selectedValues
            .map((v) => chalk.bgCyan.black(` ${choiceMap.get(v)?.name} `))
            .join(' ')
        : chalk.dim('(未選択)');
    lines.push(`  選択中: ${chips}`);

    // 検索ボックス
    lines.push(
      `  検索: ${chalk.yellow('[')}${searchText || chalk.dim('入力して絞り込み')}${chalk.yellow(']')}`
    );

    // 操作説明
    lines.push(
      `  ${chalk.cyan('↑↓')} 移動 • ${chalk.cyan('Space')} 選択 • ${chalk.cyan('Backspace')} 削除 • ${chalk.cyan('Enter')} 確定`
    );

    // リスト
    if (filteredChoices.length === 0) {
      lines.push(chalk.yellow('  一致なし'));
    } else {
      // Calculate pagination
      const startIndex = Math.max(
        0,
        Math.min(cursor - Math.floor(pageSize / 2), filteredChoices.length - pageSize)
      );
      const endIndex = Math.min(startIndex + pageSize, filteredChoices.length);
      const visibleChoices = filteredChoices.slice(startIndex, endIndex);

      for (let i = 0; i < visibleChoices.length; i++) {
        const item = visibleChoices[i];
        const actualIndex = startIndex + i;
        const isActive = actualIndex === cursor;
        const selected = selectedSet.has(item.value);
        const icon = selected ? chalk.green('◉') : chalk.dim('○');
        const arrow = isActive ? chalk.cyan('›') : ' ';
        const name = isActive ? chalk.cyan(item.name) : item.name;
        const isRefresh = selected && item.configured;
        const statusLabel = !selected
          ? item.configured
            ? ' (configured)'
            : item.detected
              ? ' (detected)'
              : ''
          : '';
        const suffix = selected
          ? chalk.dim(isRefresh ? ' (更新)' : ' (選択済み)')
          : chalk.dim(statusLabel);
        lines.push(`  ${arrow} ${icon} ${name}${suffix}`);
      }

      // 必要ならページネーションを表示
      if (filteredChoices.length > pageSize) {
        const currentPage = Math.floor(cursor / pageSize) + 1;
        const totalPages = Math.ceil(filteredChoices.length / pageSize);
        lines.push(chalk.dim(`  (${currentPage}/${totalPages})`));
      }
    }

    if (error) lines.push(chalk.red(`  ${error}`));
    return lines.join('\n');
  });
}

/**
 * 検索ボックス付きの複数選択プロンプト。
 * 選択中の表示と直感的なキーボード操作を備える。
 *
 * - 入力して絞り込み
 * - ↑↓ で移動
 * - Space でハイライト項目を選択/解除
 * - Backspace で最後の選択を削除（または検索文字を削除）
 * - Enter で確定
 */
export async function searchableMultiSelect(config: Config): Promise<string[]> {
  const prompt = await createSearchableMultiSelect();
  return prompt(config);
}

export default searchableMultiSelect;
