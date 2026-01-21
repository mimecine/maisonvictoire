// remark-image-path-fix.js
import { visit } from 'unist-util-visit';

export default function remarkImagePathFix() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url && node.url.startsWith('/src/')) {
        node.url = node.url.replace('/src/', '@src/');
      }
    });
  };
}