"use client"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, 
  UNDO_COMMAND, REDO_COMMAND 
} from "lexical";
import { $createHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getSelection, $isRangeSelection } from "lexical";

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  // Helper to change block types (Normal, H1, H2, List)
  const formatHeading = (headingSize) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  return (
    <div className="flex items-center gap-2 p-1 border-b bg-white overflow-x-auto shadow-sm">
      {/* History */}
      <button onClick={() => editor.dispatchCommand(UNDO_COMMAND)} className="p-2 hover:bg-gray-100 rounded">⟲</button>
      <button onClick={() => editor.dispatchCommand(REDO_COMMAND)} className="p-2 hover:bg-gray-100 rounded">⟳</button>
      <div className="w-px h-6 bg-gray-200" />

      {/* Block Type Dropdown (e.g., Bulleted List) */}
      <select 
        onChange={(e) => formatHeading(e.target.value)}
        className="text-sm border-none bg-transparent hover:bg-gray-100 p-1 rounded outline-none"
      >
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="bullet">Bulleted List</option>
      </select>

      <div className="w-px h-6 bg-gray-200" />

      {/* Font Family & Size */}
      <span className="text-sm px-2 text-gray-500">Arial</span>
      <div className="flex items-center border rounded px-1">
        <button className="px-1">-</button>
        <input type="text" value="15" className="w-8 text-center text-sm border-none outline-none" readOnly />
        <button className="px-1">+</button>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Basic Formatting */}
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} className="p-2 hover:bg-gray-100 font-bold rounded">B</button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} className="p-2 hover:bg-gray-100 italic rounded">I</button>
      <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} className="p-2 hover:bg-gray-100 underline rounded">U</button>
      <button className="p-2 hover:bg-gray-100 rounded">🔗</button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Alignment */}
      <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} className="p-2 hover:bg-gray-100 rounded">Align Left</button>
    </div>
  );
}