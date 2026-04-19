import { useState, useMemo } from 'react';
import { agentCategories, type Agent } from '../data/agents';
import { ChevronRight, Sparkles, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQR, setSelectedQR] = useState<Agent | null>(null);

  const filteredCategories = useMemo(() => {
    return agentCategories.map(category => {
      // If a specific category is selected, hide the others
      if (selectedCategory !== 'all' && category.id !== selectedCategory) {
        return { ...category, agents: [] };
      }
      
      // Filter agents by search query
      const query = searchQuery.toLowerCase().trim();
      const matchingAgents = category.agents.filter(agent => 
        agent.name.toLowerCase().includes(query) || 
        agent.specialty.toLowerCase().includes(query)
      );

      return { ...category, agents: matchingAgents };
    }).filter(category => category.agents.length > 0);
  }, [searchQuery, selectedCategory]);

  const currentCategory = useMemo(() => {
    if (selectedCategory === 'all') return agentCategories[0]; // Transition to first category color when 'all' is active
    return agentCategories.find(c => c.id === selectedCategory);
  }, [selectedCategory]);

  return (
    <div 
      className="w-full min-h-screen flex flex-col transition-colors duration-[2000ms] ease-in-out"
      style={{ 
        backgroundColor: currentCategory ? `${currentCategory.color}` : '#f9fafb'
      }}
    >
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12 pb-4 w-full">
        <div className="mb-6 md:mb-8 max-w-2xl flex items-center gap-4">
          <img 
            src="https://c5d6cokf0svjw8ex.public.blob.vercel-storage.com/fflogo.png" 
            alt="Logo" 
            className="w-12 h-12 md:w-16 md:h-16 object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            AI Agents
          </h1>
        </div>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search agents by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-gray-900 placeholder:text-gray-400 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Category Filters */}
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0 flex items-center gap-2 ${
                selectedCategory === 'all' 
                  ? 'bg-gray-900 text-white shadow-lg shadow-black/10' 
                  : 'bg-white/60 backdrop-blur-md text-gray-700 border border-gray-200/50 hover:bg-white hover:text-gray-900 transition-all'
              }`}
            >
              <span>🌟</span>
              All Categories
            </button>
            {agentCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex-shrink-0 flex items-center gap-2 ${
                  selectedCategory === cat.id 
                    ? 'bg-gray-900 text-white shadow-lg shadow-black/10' 
                    : 'bg-white/60 backdrop-blur-md text-gray-700 border border-gray-200/50 hover:bg-white hover:text-gray-900 transition-all'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {filteredCategories.length === 0 ? (
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 border-dashed">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                We couldn't find any agents matching your current search or category filter.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-6 inline-flex items-center justify-center px-6 py-2.5 bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors rounded-full"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredCategories.map((category, index) => {
              const nextCategory = filteredCategories[index + 1];
              const nextColor = nextCategory ? nextCategory.color : category.color;

              return (
                <section 
                  key={category.id} 
                  className="relative pt-4 pb-16 md:pt-6 md:pb-24 lg:pb-32 scroll-mt-6 transition-all duration-[2000ms] ease-in-out overflow-hidden"
                >
                  {/* Section Background Gradient */}
                  <div 
                    className={`absolute inset-0 z-0 pointer-events-none opacity-100 ${(index === 0 || selectedCategory !== 'all') ? '' : 'mix-blend-multiply'}`}
                    style={{ 
                      background: `linear-gradient(to bottom, ${category.color}, ${nextColor})`
                    }}
                  />
                  
                  <div className="max-w-7xl mx-auto px-4 relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center shrink-0">
                      <span className="text-5xl leading-none">{category.emoji}</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                      {category.name}
                    </h2>
                    <div 
                      className="ml-3 h-px flex-1 rounded-full opacity-30" 
                      style={{ background: `linear-gradient(to right, ${category.borderColor}, transparent)` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {category.agents.map((agent, i) => (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="h-full"
                      >
                        <button 
                          onClick={() => setSelectedQR(agent)}
                          style={{ 
                            background: `linear-gradient(to bottom, #ffffff, ${category.color}40) padding-box, 
                                         linear-gradient(to bottom, #ffffff, #ffffff40) border-box`,
                            border: '1px solid transparent'
                          }}
                          className="text-left w-full group flex h-full rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-300 transform hover:-translate-y-1 relative items-start gap-4"
                        >
                          <div className="shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                            <span className="text-5xl">{agent.emoji}</span>
                          </div>
                          
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-black transition-colors truncate">
                                {agent.name}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-700/80 leading-relaxed line-clamp-3">
                              {agent.specialty}
                            </p>
                            
                            <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors">
                              <span>Access Agent</span>
                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative border border-gray-100"
            >
              <button 
                onClick={() => setSelectedQR(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center mb-6 mx-auto">
                <span className="text-6xl">{selectedQR.emoji}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                Access {selectedQR.name}
              </h3>
              
              <p className="text-gray-500 text-center mb-8 leading-relaxed text-sm">
                Scan the QR code on your card to access this agent securely via its unique ID.
              </p>

              <button
                onClick={() => setSelectedQR(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
