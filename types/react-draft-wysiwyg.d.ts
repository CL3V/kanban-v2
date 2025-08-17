declare module "react-draft-wysiwyg" {
  import { EditorState } from "draft-js";
  import React from "react";

  export interface EditorProps {
    editorState?: EditorState;
    onEditorStateChange?: (editorState: EditorState) => void;
    placeholder?: string;
    readOnly?: boolean;
    toolbar?: any;
    editorClassName?: string;
    toolbarClassName?: string;
    wrapperClassName?: string;
    [key: string]: any;
  }

  export class Editor extends React.Component<EditorProps> {}
}
