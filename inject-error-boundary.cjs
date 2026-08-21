const fs = require('fs');
let code = fs.readFileSync('src/pages/ChatPage.tsx', 'utf8');

if (!code.includes('class ErrorBoundary extends React.Component')) {
  const boundaryCode = `
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("CHAT PAGE ERROR:", error, info);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', backgroundColor: '#fee' }}>
          <h2>Something went wrong in ChatPage.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.info && this.state.info.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ChatPageWrapper(props: any) {
  return <ErrorBoundary><ChatPage {...props} /></ErrorBoundary>;
}
`;

  // Change default export
  code = code.replace('export default function ChatPage(', 'function ChatPage(');
  code = code + '\n\n' + boundaryCode;
  fs.writeFileSync('src/pages/ChatPage.tsx', code);
  console.log("Added Error Boundary to ChatPage!");
}
