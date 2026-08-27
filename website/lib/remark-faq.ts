// FAQページの `##` 質問セクションをFumadocsのAccordion要素へ変換する。
// remarkGfmAlertやremarkFileStepsと同じmdxJsxFlowElement挿入方式を使い、
// GitHubでは通常の見出し、サイトでは折りたたみ可能なFAQとして表示する。
//
// `faq` という名前のファイル（同期後のcontent/docs/faq.md）だけに適用し、
// ほかのページの見出しは維持する。既存の `#heading-anchor` が同じ質問を開くよう、
// 各AccordionへGitHub形式のslug IDを付ける。getLLMText（lib/source.ts）は
// Accordionを `##` 見出しへ戻す。

interface Node {
  type: string;
  depth?: number;
  value?: string;
  children?: Node[];
  [key: string]: unknown;
}

function toText(node: Node): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  return (node.children ?? []).map(toText).join('');
}

// 同期済みの見出しアンカーと同じ、プレーンテキスト用github-slugger形式に合わせる。
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

function accordion(title: string, children: Node[]): Node {
  return {
    type: 'mdxJsxFlowElement',
    name: 'Accordion',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'title', value: title },
      { type: 'mdxJsxAttribute', name: 'id', value: slugify(title) },
    ],
    children,
  };
}

export function remarkFaq() {
  return (tree: Node, file: { stem?: string | null }) => {
    if (file.stem !== 'faq' || !tree.children) return;

    const first = tree.children.findIndex(
      (child) => child.type === 'heading' && child.depth === 2,
    );
    if (first === -1) return;

    const accordions: Node[] = [];
    let title: string | undefined;
    let body: Node[] = [];
    for (const child of tree.children.slice(first)) {
      if (child.type === 'heading' && child.depth === 2) {
        if (title !== undefined) accordions.push(accordion(title, body));
        title = toText(child);
        body = [];
      } else {
        body.push(child);
      }
    }
    if (title !== undefined) accordions.push(accordion(title, body));

    tree.children = [
      ...tree.children.slice(0, first),
      { type: 'mdxJsxFlowElement', name: 'Accordions', attributes: [], children: accordions },
    ];
  };
}
