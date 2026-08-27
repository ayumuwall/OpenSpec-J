// `file-steps` フェンスを対話型の<FileSteps>ステッパーへ変換する。
// remarkMdxMermaidやremarkGfmAlertと同じmdxJsxFlowElement挿入方式を使う。
// フェンス本文はGitHubでも読める形式を維持する。`## ` 行は手順の開始、`> ` 行は説明、
// 残りの行は2文字のガター（追加は `+ `、削除は `- `、変更なしは `  `）を持つ
// diff形式のファイルツリーとして扱う。

interface Node {
  type: string;
  lang?: string | null;
  value?: string;
  children?: Node[];
  [key: string]: unknown;
}

function transform(node: Node): void {
  if (!node.children) return;

  node.children.forEach((child, index) => {
    transform(child);
    if (child.type !== 'code' || child.lang !== 'file-steps') return;

    node.children![index] = {
      type: 'mdxJsxFlowElement',
      name: 'FileSteps',
      attributes: [
        { type: 'mdxJsxAttribute', name: 'content', value: child.value ?? '' },
      ],
      children: [],
    };
  });
}

export function remarkFileSteps() {
  return (tree: Node) => {
    transform(tree);
  };
}
