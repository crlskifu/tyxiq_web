import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function WelcomeCard() {
  return (
    <motion.div 
      className="accent-border bg-card bg-opacity-70 glass p-8 rounded-xl max-w-lg w-full text-center shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      // Adding floating animation
      style={{ animation: "float 6s ease-in-out infinite" }}
    >
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6">
        Welcome to <span className="gradient-text">Tyxiq.web</span>
      </h1>
      <p className="text-lg text-gray-300 mb-8">
        Explore our digital universe with dynamic experiences and innovative solutions.
      </p>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
        <Button 
          className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
          style={{ background: "var(--accent-gradient)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)" }}
        >
          Explore Now
        </Button>
        <Button 
          variant="outline" 
          className="px-6 py-3 rounded-lg font-medium border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-all duration-300"
        >
          Learn More
        </Button>
      </div>
    </motion.div>
  );
}
