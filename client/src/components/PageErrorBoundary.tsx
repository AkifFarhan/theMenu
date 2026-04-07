import { Component, type ReactNode } from 'react';
import { Alert, Button } from 'react-bootstrap';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: unknown): PageErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unexpected page error';
    return {
      hasError: true,
      errorMessage: message,
    };
  }

  componentDidCatch(error: unknown): void {
    console.error('PageErrorBoundary caught error:', error);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-shell">
          <Alert variant="danger" className="mt-3">
            <Alert.Heading>Recipes page crashed</Alert.Heading>
            <p className="mb-2">{this.state.errorMessage}</p>
            <Button variant="outline-danger" size="sm" onClick={this.handleReload}>
              Reload Page
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
