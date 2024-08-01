import { useRef, useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import './App.css';

function App() {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const [userCount, setUserCount] = useState(1);
  const [username, setUsername] = useState('User');

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    // Define the custom theme after Monaco Editor is loaded
    monaco.editor.defineTheme('multicolorTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'd4d4d4' }, // Default
        { token: 'keyword', foreground: 'c586c0' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955' },
        { token: 'variable', foreground: '9cdcfe' },
        { token: 'type', foreground: '4ec9b0' }
      ],
      colors: {
        'editor.background': '#1e1e1e', // Background color
        'editorLineNumber.foreground': '#858585', // Line numbers
        'editorCursor.foreground': '#d4d4d4', // Cursor color
      }
    });

    // Apply the custom theme
    editor.updateOptions({ theme: 'multicolorTheme' });

    // Create a Yjs document
    const doc = new Y.Doc();
    
    // Connect to the WebRTC provider with a room name
    const provider = new WebrtcProvider("test-room", doc);
    providerRef.current = provider;

    // Initialize awareness states with the username
    const awareness = provider.awareness;
    awareness.setLocalStateField('user', { name: username });
    
    // Update awareness states on username change
    const updateUsername = (name) => {
      setUsername(name);
      awareness.setLocalStateField('user', { name });
    };

    // Get a shared text type from the document
    const type = doc.getText("monaco");
    
    // Bind the Monaco Editor model to the Yjs text type for collaborative editing
    bindingRef.current = new MonacoBinding(type, editor.getModel(), new Set([editor]), awareness);

    // Update user count and usernames on awareness change
    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values());
      const userStates = states.map(state => state.user ? state.user.name : 'Unknown');
      setUserCount(userStates.length);
      document.getElementById('usernames').innerText = userStates.join(', ');
    });

    console.log(awareness);
  }

  useEffect(() => {
    return () => {
      // Clean up the WebRTC provider and Yjs document when the component is unmounted
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="editor-container">
      <div className="status-bar">
        <span>Connected Users: {userCount}</span>
        <span id="usernames"></span>
      </div>
      <div className="username-input">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => handleEditorDidMount(editorRef.current, monaco)}
          placeholder="Enter your username"
        />
      </div>
      <Editor
        height="calc(100vh - 60px)" // Adjusted height to account for the status bar and username input
        width="100vw"
        theme="multicolorTheme" // Ensure the theme is applied
        onMount={handleEditorDidMount}
      />
    </div>
  );
}

export default App;
