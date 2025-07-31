import React from "react"
import TemplateCard from "./TemplateCard"
import { PROJECT_TEMPLATES } from "@/modules/home/contants"

interface Props {
  onTemplateSelect: (prompt: string) => void
}

const TemplateGrid: React.FC<Props> = ({ onTemplateSelect }) => (
  <div className="w-full max-w-7xl mx-auto space-y-8 px-4">
    {/* Template Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {PROJECT_TEMPLATES.map((template, idx) => (
        <div
          key={template.title}
          style={{ animationDelay: `${idx * 0.1}s` }}
          className="group flex flex-col items-stretch h-full transform transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2 animate-fade-in-up"
        >
          <div className="relative h-full">
            {/* Glow effect for hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-400/30 dark:via-purple-400/30 dark:to-pink-400/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            
            {/* Card container with enhanced styling */}
            <div className="relative h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/10 dark:group-hover:shadow-blue-400/20 transition-all duration-300">
              <TemplateCard {...template} onSelect={onTemplateSelect} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default TemplateGrid