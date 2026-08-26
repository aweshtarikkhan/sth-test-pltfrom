const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes('class ErrorBoundary extends React.Component')) {
  const boundary = `
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("APP CRASH:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>CRITICAL APP CRASH</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
`;
  
  code = code.replace("import App from './App.tsx'", boundary + "\nimport App from './App.tsx'");
  code = code.replace("<App />", "<ErrorBoundary><App /></ErrorBoundary>");
  
  fs.writeFileSync('src/main.tsx', code);
  console.log("Injected Error Boundary in main.tsx");
}
