"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  EditorState,
  convertToRaw,
  convertFromRaw,
  ContentState,
} from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter description...",
  readOnly = false,
  className = "",
}) => {
  const [mounted, setMounted] = useState(false);
  const [Editor, setEditor] = useState<any>(null);
  const editorRef = useRef<any>(null);
  // Track the last value we emitted to avoid echo updates resetting cursor
  const lastEmittedValueRef = useRef<string | null>(null);

  // Initialize editor state with proper value handling
  const initialEditorState = useMemo(() => {
    try {
      if (value && value.trim()) {
        // Try to parse as Draft.js raw state first
        try {
          const rawState = JSON.parse(value);
          const contentState = convertFromRaw(rawState);
          return EditorState.createWithContent(contentState);
        } catch {
          // If not valid JSON, treat as plain text
          const contentState = ContentState.createFromText(value);
          return EditorState.createWithContent(contentState);
        }
      }
      return EditorState.createEmpty();
    } catch (error) {
      console.error("Error initializing editor state:", error);
      return EditorState.createEmpty();
    }
  }, []);

  const [editorState, setEditorState] = useState(initialEditorState);

  // Dynamic import to avoid SSR issues
  useEffect(() => {
    const loadEditor = async () => {
      try {
        const { Editor: DraftEditor } = await import("react-draft-wysiwyg");
        setEditor(() => DraftEditor);
        setMounted(true);
      } catch (error) {
        console.error("Failed to load editor:", error);
      }
    };

    loadEditor();
  }, []);

  // Update editor state when value changes externally
  useEffect(() => {
    if (!mounted) return;

    try {
      // If the incoming value equals the last emitted value, it's an echo of our own
      // change—skip to prevent selection reset/cursor jump on backspace.
      if (value === lastEmittedValueRef.current) {
        return;
      }

      if (value && value.trim()) {
        // Try to parse as Draft.js raw state first
        try {
          const rawState = JSON.parse(value);
          const contentState = convertFromRaw(rawState);
          const newEditorState = EditorState.createWithContent(contentState);
          // Move selection to end to keep caret intuitive on external set
          setEditorState(EditorState.moveSelectionToEnd(newEditorState));
          lastEmittedValueRef.current = value;
        } catch {
          // If not valid JSON, treat as plain text
          const contentState = ContentState.createFromText(value);
          const newEditorState = EditorState.createWithContent(contentState);
          setEditorState(EditorState.moveSelectionToEnd(newEditorState));
          lastEmittedValueRef.current = value;
        }
      } else if (!value) {
        setEditorState(EditorState.createEmpty());
        lastEmittedValueRef.current = "";
      }
    } catch (error) {
      console.error("Error updating editor state:", error);
    }
  }, [value, mounted]);

  const handleEditorStateChange = useCallback(
    (newEditorState: EditorState) => {
      if (!mounted) return;

      setEditorState(newEditorState);

      try {
        const contentState = newEditorState.getCurrentContent();
        const rawState = convertToRaw(contentState);
        // Store as JSON string for compatibility
        const nextValue = JSON.stringify(rawState);
        // Only emit when value actually changes to avoid prop echo loops
        if (nextValue !== lastEmittedValueRef.current) {
          lastEmittedValueRef.current = nextValue;
          onChange(nextValue);
        }
      } catch (error) {
        console.error("Error handling editor state change:", error);
      }
    },
    [onChange, mounted]
  );

  // Don't render editor until fully loaded
  if (!mounted || !Editor) {
    return (
      <div
        className={`min-h-[120px] border border-secondary-300 rounded-md p-3 bg-white ${className}`}
      >
        <div className="text-secondary-500">{placeholder}</div>
        <div className="mt-2 text-xs text-secondary-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div
      className={`border border-secondary-300 rounded-md bg-white ${className}`}
    >
      <Editor
        ref={editorRef}
        editorState={editorState}
        onEditorStateChange={handleEditorStateChange}
        placeholder={placeholder}
        readOnly={readOnly}
        toolbar={{
          options: [
            "inline",
            "blockType",
            "list",
            "textAlign",
            "link",
            "history",
          ],
          inline: {
            inDropdown: false,
            options: ["bold", "italic", "underline", "strikethrough"],
          },
          blockType: {
            inDropdown: true,
            options: ["Normal", "H1", "H2", "H3", "Blockquote"],
          },
          list: {
            inDropdown: false,
            options: ["unordered", "ordered"],
          },
          textAlign: {
            inDropdown: true,
            options: ["left", "center", "right"],
          },
          link: {
            inDropdown: false,
            options: ["link"],
          },
          history: {
            inDropdown: false,
            options: ["undo", "redo"],
          },
        }}
        editorClassName="px-3 py-2 min-h-[100px] max-h-[300px] overflow-y-auto"
        toolbarClassName={readOnly ? "hidden" : "border-b border-secondary-200"}
        wrapperClassName="w-full"
        editorStyle={{
          minHeight: "100px",
          padding: "12px",
        }}
      />
    </div>
  );
};

// Utility function to convert Draft.js content to plain text for display
export const getPlainTextFromDraftState = (
  draftStateString: string
): string => {
  if (!draftStateString || !draftStateString.trim()) return "";

  try {
    const rawState = JSON.parse(draftStateString);
    const contentState = convertFromRaw(rawState);
    return contentState.getPlainText();
  } catch {
    // Fallback: treat as plain text
    return draftStateString;
  }
};

// Utility function to check if content is empty
export const isDraftStateEmpty = (draftStateString: string): boolean => {
  const plainText = getPlainTextFromDraftState(draftStateString);
  return !plainText || plainText.trim().length === 0;
};
