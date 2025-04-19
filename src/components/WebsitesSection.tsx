
import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WebsitesSection = () => {
  const websites = [
    {
      title: "What to Watch?",
      description: "Discover your next favorite movies and TV shows with personalized recommendations.",
      url: "https://preview--whattowatch.lovable.app/",
      color: "from-purple-500 to-indigo-500"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gaming-dark">
      <div className="container mx-auto">
        <div className="text-left mb-8">
          <h2 className="text-2xl font-bold text-white">My Other Websites</h2>
          <p className="text-muted-foreground">Check out my other cool projects</p>
        </div>

        <div className="flex justify-center">
          {websites.map((site) => (
            <motion.div 
              key={site.url}
              className="bg-secondary/20 rounded-xl overflow-hidden cursor-pointer max-w-md w-full"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${site.color} flex items-center justify-center mb-4`}>
                  <ExternalLink className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                  {site.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{site.description}</p>
                
                <Button 
                  variant="ghost" 
                  className="mt-2 text-white hover:bg-white/10"
                  onClick={() => window.open(site.url, '_blank')}
                >
                  Visit Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WebsitesSection;
