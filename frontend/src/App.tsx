import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/config/wagmi';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Rounds from "./pages/Rounds";
import CreateRound from "./pages/CreateRound";
import RoundDetail from "./pages/RoundDetail";
import ProjectDetail from "./pages/ProjectDetail";
import MyDonations from "./pages/MyDonations";
import CreateProject from "./pages/CreateProject";
import Documentation from "./pages/Documentation";
import Admin from "./pages/Admin";
import Debug from "./pages/Debug";
import NotFound from "./pages/NotFound";
import { ConfigProvider, theme } from 'antd';

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: '#0052FF',
              colorSuccess: '#00C853',
              borderRadius: 8,
              fontFamily: 'inherit',
            },
          }}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-right" />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/rounds" element={<Rounds />} />
                <Route path="/create-round" element={<CreateRound />} />
                <Route path="/rounds/:roundId" element={<RoundDetail />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/my-donations" element={<MyDonations />} />
                <Route path="/create-project" element={<CreateProject />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/debug" element={<Debug />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ConfigProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
