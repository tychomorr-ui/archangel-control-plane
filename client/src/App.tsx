import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ArchangelLayout from "./components/ArchangelLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { EcosystemGraphPage } from "./pages/EcosystemGraphPage";
import { AlertsPage, AuditPage, CommandCenterPage, IntentWorkflowPage, NodeDetailPage, RegistryPage, TopologyPage } from "./pages/ArchangelPages";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function ConsoleRoute({ children }: { children: React.ReactNode }) {
  return <ArchangelLayout>{children}</ArchangelLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <ConsoleRoute><Home /></ConsoleRoute>}</Route>
      <Route path="/nodes/:nodeId">{() => <ConsoleRoute><NodeDetailPage /></ConsoleRoute>}</Route>
      <Route path="/topology">{() => <ConsoleRoute><TopologyPage /></ConsoleRoute>}</Route>
      <Route path="/ecosystem">{() => <ConsoleRoute><EcosystemGraphPage /></ConsoleRoute>}</Route>
      <Route path="/command-center">{() => <ConsoleRoute><CommandCenterPage /></ConsoleRoute>}</Route>
      <Route path="/intents">{() => <ConsoleRoute><IntentWorkflowPage /></ConsoleRoute>}</Route>
      <Route path="/audit">{() => <ConsoleRoute><AuditPage /></ConsoleRoute>}</Route>
      <Route path="/alerts">{() => <ConsoleRoute><AlertsPage /></ConsoleRoute>}</Route>
      <Route path="/registry">{() => <ConsoleRoute><RegistryPage /></ConsoleRoute>}</Route>
      <Route>{() => <ConsoleRoute><NotFound /></ConsoleRoute>}</Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
