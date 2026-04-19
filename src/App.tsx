import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import Home from './pages/Home';
import AgentRoom from './pages/AgentRoom';

function AgentRoomWrapper() {
  const { agentId } = useParams();
  return <AgentRoom key={agentId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
        <main className="flex-1 flex flex-col w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agent/:agentId" element={<AgentRoomWrapper />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
